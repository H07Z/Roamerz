/**
 * LifeManager - Phase 10 NPC Life Simulation
 * Manages all NPCs life: needs, inventory, jobs, interactions
 */

import { NPC } from '../npc/NPC';
import { NPCNeeds } from './NPCNeeds';
import { NPCInventory, ItemType } from './NPCInventory';
import { Job } from './Job';
import { JobType, getJobTypeFromRole } from './JobType';
import { NeedType } from './NeedType';
import { TimeManager } from '../time/TimeManager';
import { BuildingManager } from '../building/BuildingManager';

export interface LifeData {
  npcId: string;
  needs: NPCNeeds;
  inventory: NPCInventory;
  job: Job;
}

export class LifeManager {
  private lifeData: Map<string, LifeData> = new Map();
  private buildingManager: BuildingManager | null = null;
  private timeManager: TimeManager | null = null;

  // Interaction tracking
  private interactions: number = 0;
  private lastInteractionCheck: number = 0;
  private interactionCooldown: number = 2; // seconds

  // Work location cache
  private workLocations: Map<string, { tileX: number; tileY: number }> = new Map();

  constructor() {}

  initialize(
    npcs: NPC[],
    buildingManager: BuildingManager,
    timeManager: TimeManager
  ): void {
    console.log('[LifeManager] Initializing Phase 10 - Life Simulation...');
    this.lifeData.clear();
    this.buildingManager = buildingManager;
    this.timeManager = timeManager;
    this.workLocations.clear();

    // Define work locations
    this.workLocations.set('farm', { tileX: 15, tileY: 31 });
    this.workLocations.set('square', { tileX: 25, tileY: 20 });

    for (const npc of npcs) {
      const npcId = npc.id;
      const role = npc.role;
      const jobType = getJobTypeFromRole(role);

      const needs = new NPCNeeds(npcId);
      const inventory = new NPCInventory(npcId);
      inventory.initializeForJob(jobType);
      const job = new Job(npcId, role, jobType);

      this.lifeData.set(npcId, {
        npcId,
        needs,
        inventory,
        job
      });

      // Link to NPC if NPC has methods (we'll add via direct property)
      (npc as any).needs = needs;
      (npc as any).inventory = inventory;
      (npc as any).job = job;

      console.log(`[LifeManager] ${npcId} ${role} -> ${jobType} | ${needs.getDebugString()} | ${inventory.getDebugString()}`);
    }

    console.log(`[LifeManager] Created ${this.lifeData.size} life data entries`);
  }

  update(
    deltaTime: number,
    npcs: NPC[],
    timeManager: TimeManager
  ): void {
    this.timeManager = timeManager;
    const currentMinutes = timeManager.getMinutesSinceMidnight();
    const isDaytime = timeManager.getTimeData().isDaytime;
    const timeScale = timeManager.getTimeScale();
    const dayPhase = timeManager.getPhase();

    // Update each NPC's life
    for (const npc of npcs) {
      const data = this.lifeData.get(npc.id);
      if (!data) continue;

      const currentActivity = npc.getCurrentActivity();
      const isInside = npc.state === 'INSIDE' as any || npc.state === 'SLEEPING' as any;

      // Update needs
      data.needs.update(deltaTime, currentActivity, isDaytime, timeScale, isInside);

      // Update job and handle production
      const isAtWork = this.isNPCAtWorkLocation(npc);
      const jobResult = data.job.update(deltaTime, currentActivity, isAtWork, timeScale);

      if (jobResult.produced) {
        data.inventory.addItem(jobResult.produced, 1);
        // console.log(`[LifeManager] ${npc.id} produced ${jobResult.produced}`);
      }

      if (jobResult.coins > 0) {
        data.inventory.addItem(ItemType.COIN, jobResult.coins);
      }

      // Handle needs-based overrides
      this.handleNeedsOverrides(npc, data, currentMinutes);

      // Handle eating
      if (currentActivity === 'EAT' as any) {
        this.handleEating(npc, data, deltaTime);
      }
    }

    // Handle interactions between NPCs
    this.lastInteractionCheck += deltaTime;
    if (this.lastInteractionCheck >= this.interactionCooldown) {
      this.lastInteractionCheck = 0;
      this.handleInteractions(npcs);
    }
  }

  private isNPCAtWorkLocation(npc: NPC): boolean {
    const dest = npc.getDestinationTile();
    const tilePos = npc.getTilePosition();

    // If NPC is at destination and destination is work-like, consider at work
    // Simplified: if state is WORKING/FARMING/SHOPPING/PLAYING and near target, at work
    const workStates = ['WORKING', 'FARMING', 'SHOPPING', 'PLAYING', 'SOCIALIZING', 'EATING'];
    if (!workStates.includes(npc.state)) {
      // Also check if at work tile
      const workLocation = (npc as any).workLocation;
      if (workLocation) {
        const dx = tilePos.x - workLocation.tileX;
        const dy = tilePos.y - workLocation.tileY;
        return Math.sqrt(dx*dx + dy*dy) <= 2;
      }
      return false;
    }

    // If in work state, check distance to destination
    if (dest) {
      const dx = tilePos.x - dest.x;
      const dy = tilePos.y - dest.y;
      return Math.sqrt(dx*dx + dy*dy) <= 2;
    }

    // If no dest but in work state, assume at work if not pathfinding
    return npc.state !== 'FOLLOWING_PATH' && npc.state !== 'GOING_HOME' && npc.state !== 'PATHFINDING';
  }

  private handleNeedsOverrides(npc: NPC, data: LifeData, currentMinutes: number): void {
    // If needs critical, potentially override schedule
    // Only override if not already handling critical need and schedule enabled
    if (!npc.isScheduleEnabled()) return;

    const criticalNeeds = data.needs.getCriticalNeeds();
    if (criticalNeeds.length === 0) return;

    // Check lowest need
    const lowest = data.needs.getLowestNeed();
    if (!lowest) return;

    // Only override if extremely low and not already in restorative activity
    const currentActivity = npc.getCurrentActivity();
    
    if (lowest.type === NeedType.HUNGER && lowest.value < 15) {
      if (currentActivity !== 'EAT' as any) {
        // Force eat if has food, otherwise go to square (food source)
        if (data.inventory.hasItem(ItemType.FOOD) || data.inventory.hasItem(ItemType.BREAD)) {
          // Will eat via inventory when at eat activity, but need to trigger eat activity
          // For now, just boost hunger if has food and is at home or square
          if (npc.state === 'AT_HOME' || npc.state === 'INSIDE' || this.isAtSquare(npc)) {
            if (data.inventory.useFood()) {
              data.needs.modifyNeed(NeedType.HUNGER, 40);
              data.needs.modifyNeed(NeedType.HAPPINESS, 5);
              console.log(`[LifeManager] ${npc.id} ate food due to critical hunger ${lowest.value.toFixed(0)}`);
            }
          }
        }
      }
    }

    if (lowest.type === NeedType.ENERGY && lowest.value < 10) {
      if (currentActivity !== 'SLEEP' as any && currentActivity !== 'HOME' as any && currentActivity !== 'INSIDE' as any) {
        // If extremely tired, go home if possible
        if (npc.getHomeBuilding() && npc.state !== 'GOING_HOME' && npc.state !== 'SLEEPING') {
          // Only override if not already going home and it's late or very tired
          const hour = Math.floor(currentMinutes / 60);
          if (hour >= 20 || hour <= 5 || lowest.value < 5) {
            console.log(`[LifeManager] ${npc.id} critical energy ${lowest.value.toFixed(0)}, going home`);
            npc.goHome();
          }
        }
      }
    }
  }

  private handleEating(npc: NPC, data: LifeData, deltaTime: number): void {
    // Eating activity restores hunger via needs system, but also consume inventory
    // Every 2 seconds of eating, consume 1 food if available and boost extra
    const eatTimer = (npc as any).activityTimer ?? 0;
    
    // Use food every 2 seconds of eating
    if (Math.floor(eatTimer) % 2 === 0 && eatTimer > 0.1) {
      // Only consume once per 2 second interval - track last consumption
      const lastEat = (npc as any).lastEatTime ?? -10;
      if (eatTimer - lastEat >= 2) {
        (npc as any).lastEatTime = eatTimer;
        if (data.inventory.useFood()) {
          data.needs.modifyNeed(NeedType.HUNGER, 10); // extra boost
          data.needs.modifyNeed(NeedType.HAPPINESS, 3);
          // console.log(`[LifeManager] ${npc.id} consumed food while eating`);
        }
      }
    }
  }

  private isAtSquare(npc: NPC): boolean {
    const tilePos = npc.getTilePosition();
    const dx = tilePos.x - 25;
    const dy = tilePos.y - 20;
    return Math.sqrt(dx*dx + dy*dy) <= 3;
  }

  private handleInteractions(npcs: NPC[]): void {
    // Check NPCs near each other for social interactions
    for (let i = 0; i < npcs.length; i++) {
      for (let j = i + 1; j < npcs.length; j++) {
        const npcA = npcs[i];
        const npcB = npcs[j];
        
        const posA = npcA.getPosition();
        const posB = npcB.getPosition();
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // If within 50 pixels (about 1.5 tiles) and both socializing or at square
        if (dist < 50) {
          const bothSocial = npcA.state === 'SOCIALIZING' as any || npcB.state === 'SOCIALIZING' as any;
          const atSquare = this.isAtSquare(npcA) && this.isAtSquare(npcB);
          
          if (bothSocial || atSquare) {
            // Social interaction
            const dataA = this.lifeData.get(npcA.id);
            const dataB = this.lifeData.get(npcB.id);
            
            if (dataA && dataB) {
              // Both gain social and happiness
              const amount = 2 + Math.random() * 3;
              dataA.needs.restoreSocial(amount);
              dataB.needs.restoreSocial(amount);
              
              this.interactions++;
              
              // Occasionally exchange items or gift
              if (Math.random() < 0.1) {
                // Gift flower if has one
                if (dataA.inventory.hasItem(ItemType.FLOWER)) {
                  dataA.inventory.removeItem(ItemType.FLOWER, 1);
                  dataB.inventory.addItem(ItemType.FLOWER, 1);
                } else if (dataB.inventory.hasItem(ItemType.FLOWER)) {
                  dataB.inventory.removeItem(ItemType.FLOWER, 1);
                  dataA.inventory.addItem(ItemType.FLOWER, 1);
                }
              }
              
              // console.log(`[LifeManager] Interaction ${npcA.id} <-> ${npcB.id} dist ${dist.toFixed(0)}`);
            }
          }
        }
      }
    }
  }

  getLifeData(npcId: string): LifeData | undefined {
    return this.lifeData.get(npcId);
  }

  getAllLifeData(): LifeData[] {
    return Array.from(this.lifeData.values());
  }

  getCount(): number {
    return this.lifeData.size;
  }

  getInteractions(): number {
    return this.interactions;
  }

  getNeedsForNPC(npcId: string): NPCNeeds | undefined {
    return this.lifeData.get(npcId)?.needs;
  }

  getInventoryForNPC(npcId: string): NPCInventory | undefined {
    return this.lifeData.get(npcId)?.inventory;
  }

  getJobForNPC(npcId: string): Job | undefined {
    return this.lifeData.get(npcId)?.job;
  }

  // For testing
  getAverageWellbeing(): number {
    let total = 0;
    let count = 0;
    for (const data of this.lifeData.values()) {
      total += data.needs.getOverallWellbeing();
      count++;
    }
    return count > 0 ? total / count : 0;
  }

  getCriticalCount(): number {
    let count = 0;
    for (const data of this.lifeData.values()) {
      if (data.needs.isAnyCritical()) count++;
    }
    return count;
  }
}
