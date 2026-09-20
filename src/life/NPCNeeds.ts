/**
 * NPCNeeds - Phase 10 NPC Life Simulation
 * Manages NPC needs: energy, hunger, social, happiness, health
 * Needs decay over time and are restored by activities
 */

import { NeedType, getNeedProperties, getAllNeedTypes } from './NeedType';
import { ScheduleActivityType } from '../schedule/ScheduleActivityType';
import { DayPhase } from '../time/TimeManager';

export interface NeedsData {
  energy: number;
  hunger: number;
  social: number;
  happiness: number;
  health: number;
}

export class NPCNeeds {
  private needs: Map<NeedType, number> = new Map();
  private readonly npcId: string;

  // Stats for debug
  private totalDecay: number = 0;
  private totalRestore: number = 0;
  private criticalTimes: Map<NeedType, number> = new Map();
  private lastActivity: ScheduleActivityType | null = null;

  constructor(npcId: string, initialNeeds?: Partial<NeedsData>) {
    this.npcId = npcId;

    // Initialize with defaults or provided values
    this.needs.set(NeedType.ENERGY, initialNeeds?.energy ?? 80 + Math.random() * 20);
    this.needs.set(NeedType.HUNGER, initialNeeds?.hunger ?? 70 + Math.random() * 20);
    this.needs.set(NeedType.SOCIAL, initialNeeds?.social ?? 60 + Math.random() * 30);
    this.needs.set(NeedType.HAPPINESS, initialNeeds?.happiness ?? 70 + Math.random() * 20);
    this.needs.set(NeedType.HEALTH, initialNeeds?.health ?? 90 + Math.random() * 10);

    for (const type of getAllNeedTypes()) {
      this.criticalTimes.set(type, 0);
    }

    console.log(`[NPCNeeds] ${npcId} initialized:`, this.getDebugString());
  }

  update(
    deltaTime: number,
    currentActivity: ScheduleActivityType | null,
    isDaytime: boolean,
    timeScale: number,
    isInside: boolean
  ): void {
    this.lastActivity = currentActivity;

    // Calculate game hours passed this frame
    // deltaTime is real seconds, timeScale converts to game seconds
    const gameSeconds = deltaTime * timeScale;
    const gameHours = gameSeconds / 3600;

    // Update each need
    for (const needType of getAllNeedTypes()) {
      let decay = 0;
      let restore = 0;

      const props = getNeedProperties(needType);
      const currentValue = this.needs.get(needType) ?? 50;

      // Base decay based on time
      switch (needType) {
        case NeedType.ENERGY:
          // Energy decays when awake, restores when sleeping
          if (currentActivity === ScheduleActivityType.SLEEP) {
            restore = props.restoreRate * deltaTime;
          } else if (currentActivity === ScheduleActivityType.INSIDE || currentActivity === ScheduleActivityType.HOME) {
            // Slow restore at home
            restore = props.restoreRate * 0.3 * deltaTime;
            decay = props.decayRate * 0.2 * gameHours; // slow decay at home
          } else {
            // Decay faster when working
            const multiplier = this.getEnergyDecayMultiplier(currentActivity);
            decay = props.decayRate * multiplier * gameHours;
          }
          break;

        case NeedType.HUNGER:
          // Hunger always decays, faster during work
          if (currentActivity === ScheduleActivityType.EAT) {
            restore = props.restoreRate * deltaTime;
          } else {
            const multiplier = currentActivity === ScheduleActivityType.WORK || 
                              currentActivity === ScheduleActivityType.FARM ? 1.5 : 1.0;
            decay = props.decayRate * multiplier * gameHours;
          }
          break;

        case NeedType.SOCIAL:
          // Social decays when alone, restores when socializing
          if (currentActivity === ScheduleActivityType.SOCIAL) {
            restore = props.restoreRate * deltaTime;
          } else if (currentActivity === ScheduleActivityType.PLAY) {
            restore = props.restoreRate * 0.5 * deltaTime;
            decay = props.decayRate * 0.5 * gameHours;
          } else {
            decay = props.decayRate * gameHours;
            // Faster decay if inside alone at night
            if (isInside && !isDaytime) {
              decay *= 1.5;
            }
          }
          break;

        case NeedType.HAPPINESS:
          // Happiness affected by other needs and activities
          const lowNeeds = this.getLowNeedsCount();
          if (lowNeeds > 0) {
            decay = (props.decayRate + lowNeeds * 0.5) * gameHours;
          }

          // Restore based on activity
          if (currentActivity === ScheduleActivityType.PLAY) {
            restore = props.restoreRate * 1.5 * deltaTime;
          } else if (currentActivity === ScheduleActivityType.SOCIAL) {
            restore = props.restoreRate * deltaTime;
          } else if (currentActivity === ScheduleActivityType.HOME || 
                     currentActivity === ScheduleActivityType.INSIDE) {
            restore = props.restoreRate * 0.3 * deltaTime;
          } else if (currentActivity === ScheduleActivityType.EAT) {
            restore = props.restoreRate * 0.5 * deltaTime;
          }

          // Work can reduce happiness if energy low
          if ((currentActivity === ScheduleActivityType.WORK || 
               currentActivity === ScheduleActivityType.FARM ||
               currentActivity === ScheduleActivityType.SHOP) &&
              (this.needs.get(NeedType.ENERGY) ?? 100) < 30) {
            decay += 2 * gameHours;
          }
          break;

        case NeedType.HEALTH:
          // Health decays if other needs critical, restores if all good
          const criticalCount = this.getCriticalNeeds().length;
          if (criticalCount >= 2) {
            decay = (props.decayRate + criticalCount) * gameHours;
          } else if (criticalCount === 0 && 
                     (this.needs.get(NeedType.ENERGY) ?? 0) > 70 &&
                     (this.needs.get(NeedType.HUNGER) ?? 0) > 70) {
            restore = props.restoreRate * 0.5 * deltaTime;
          }
          break;
      }

      // Apply decay and restore
      let newValue = currentValue - decay + restore;
      newValue = Math.max(0, Math.min(100, newValue));

      this.needs.set(needType, newValue);

      this.totalDecay += decay;
      this.totalRestore += restore;

      // Track critical time
      if (newValue < props.criticalThreshold) {
        this.criticalTimes.set(needType, (this.criticalTimes.get(needType) ?? 0) + gameSeconds);
      }
    }
  }

  private getEnergyDecayMultiplier(activity: ScheduleActivityType | null): number {
    if (!activity) return 1.0;
    switch (activity) {
      case ScheduleActivityType.FARM:
      case ScheduleActivityType.WORK:
        return 1.5;
      case ScheduleActivityType.SHOP:
        return 1.2;
      case ScheduleActivityType.PLAY:
        return 1.3;
      case ScheduleActivityType.WANDER:
      case ScheduleActivityType.PATROL:
        return 1.1;
      case ScheduleActivityType.SOCIAL:
        return 0.8;
      case ScheduleActivityType.EAT:
        return 0.5;
      case ScheduleActivityType.HOME:
      case ScheduleActivityType.INSIDE:
        return 0.3;
      case ScheduleActivityType.SLEEP:
        return 0;
      default:
        return 1.0;
    }
  }

  private getLowNeedsCount(): number {
    let count = 0;
    for (const type of [NeedType.ENERGY, NeedType.HUNGER, NeedType.SOCIAL]) {
      const value = this.needs.get(type) ?? 100;
      if (value < 40) count++;
    }
    return count;
  }

  getCriticalNeeds(): NeedType[] {
    const critical: NeedType[] = [];
    for (const [type, value] of this.needs.entries()) {
      const props = getNeedProperties(type);
      if (value < props.criticalThreshold) {
        critical.push(type);
      }
    }
    return critical;
  }

  getLowestNeed(): { type: NeedType; value: number } | null {
    let lowest: { type: NeedType; value: number } | null = null;
    for (const [type, value] of this.needs.entries()) {
      if (!lowest || value < lowest.value) {
        lowest = { type, value };
      }
    }
    return lowest;
  }

  getNeed(type: NeedType): number {
    return this.needs.get(type) ?? 0;
  }

  setNeed(type: NeedType, value: number): void {
    this.needs.set(type, Math.max(0, Math.min(100, value)));
  }

  modifyNeed(type: NeedType, delta: number): void {
    const current = this.needs.get(type) ?? 0;
    this.setNeed(type, current + delta);
  }

  getAllNeeds(): Map<NeedType, number> {
    return new Map(this.needs);
  }

  getNeedsData(): NeedsData {
    return {
      energy: this.needs.get(NeedType.ENERGY) ?? 0,
      hunger: this.needs.get(NeedType.HUNGER) ?? 0,
      social: this.needs.get(NeedType.SOCIAL) ?? 0,
      happiness: this.needs.get(NeedType.HAPPINESS) ?? 0,
      health: this.needs.get(NeedType.HEALTH) ?? 0
    };
  }

  isCritical(type: NeedType): boolean {
    const value = this.needs.get(type) ?? 100;
    const props = getNeedProperties(type);
    return value < props.criticalThreshold;
  }

  isAnyCritical(): boolean {
    return this.getCriticalNeeds().length > 0;
  }

  getOverallWellbeing(): number {
    let total = 0;
    let count = 0;
    for (const value of this.needs.values()) {
      total += value;
      count++;
    }
    return count > 0 ? total / count : 0;
  }

  // For interactions
  restoreSocial(amount: number): void {
    this.modifyNeed(NeedType.SOCIAL, amount);
    this.modifyNeed(NeedType.HAPPINESS, amount * 0.5);
  }

  restoreFromInteraction(otherNeed: NeedType, amount: number): void {
    this.modifyNeed(otherNeed, amount);
  }

  getDebugString(): string {
    const data = this.getNeedsData();
    return `E:${data.energy.toFixed(0)} H:${data.hunger.toFixed(0)} S:${data.social.toFixed(0)} Hap:${data.happiness.toFixed(0)} Health:${data.health.toFixed(0)}`;
  }

  getStats(): {
    decay: number;
    restore: number;
    criticalTimes: Record<string, number>;
    overall: number;
    lowest: { type: string; value: number } | null;
  } {
    const criticalTimes: Record<string, number> = {};
    for (const [type, time] of this.criticalTimes.entries()) {
      criticalTimes[type] = time;
    }

    const lowest = this.getLowestNeed();

    return {
      decay: this.totalDecay,
      restore: this.totalRestore,
      criticalTimes,
      overall: this.getOverallWellbeing(),
      lowest: lowest ? { type: lowest.type, value: lowest.value } : null
    };
  }
}
