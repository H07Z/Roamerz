/**
 * Job - Phase 10 NPC Life Simulation
 * Manages job work and production
 */

import { JobType, getJobProperties, getJobTypeFromRole } from './JobType';
import { ItemType } from './NPCInventory';
import { ScheduleActivityType } from '../schedule/ScheduleActivityType';

export interface JobData {
  type: JobType;
  workDone: number; // total hours worked
  itemsProduced: number;
  coinsEarned: number;
  lastWorkTime: number; // game minutes
}

export class Job {
  public readonly type: JobType;
  public readonly npcId: string;
  public readonly role: string;

  private workDone: number = 0; // hours
  private itemsProduced: number = 0;
  private coinsEarned: number = 0;
  private lastWorkTime: number = -1;
  private workProgress: number = 0; // 0-1 progress to next production
  private productionTimer: number = 0; // seconds of work accumulated

  private readonly productionInterval: number = 10; // seconds of work to produce item
  private readonly coinInterval: number = 5; // seconds of work to earn coins

  constructor(npcId: string, role: string, jobType?: JobType) {
    this.npcId = npcId;
    this.role = role;
    this.type = jobType ?? getJobTypeFromRole(role);
    
    console.log(`[Job] ${npcId} (${role}) job ${this.type}`);
  }

  update(
    deltaTime: number,
    currentActivity: ScheduleActivityType | null,
    isAtWorkLocation: boolean,
    timeScale: number
  ): { produced: ItemType | null; coins: number; worked: boolean } {
    const props = getJobProperties(this.type);
    let produced: ItemType | null = null;
    let coins = 0;
    let worked = false;

    // Check if currently doing work activity that matches job
    const isWorking = this.isWorkActivity(currentActivity) && isAtWorkLocation;

    if (!isWorking) {
      this.workProgress = 0;
      return { produced: null, coins: 0, worked: false };
    }

    // Accumulate work time (real seconds * timeScale = game seconds, but we use real for production pacing)
    // Use deltaTime directly for production so it feels consistent regardless of timeScale
    this.productionTimer += deltaTime;
    this.workProgress += deltaTime / this.productionInterval;
    this.workDone += (deltaTime * timeScale) / 3600; // game hours
    worked = true;

    // Check for item production
    if (this.productionTimer >= this.productionInterval) {
      this.productionTimer = 0;
      produced = this.getProducedItem();
      if (produced) {
        this.itemsProduced++;
      }
    }

    // Check for coin earning
    // Earn coins every coinInterval of work
    const coinProgress = this.productionTimer % this.coinInterval;
    // Simpler: earn based on workDone
    if (Math.floor(this.workDone * 10) % Math.floor(props.incomePerHour * 2) === 0) {
      // Occasional coin earning handled by LifeManager
    }

    // Coins earned based on time
    // Every 5 seconds of work, earn some coins
    if (this.productionTimer < deltaTime) { // just produced
      const hoursWorked = this.productionInterval / 3600 * (timeScale > 0 ? timeScale : 1);
      // Actually use fixed coin earning per production cycle
      coins = Math.floor(props.incomePerHour * (this.productionInterval / 3600) * (timeScale / 60));
      // At 60x, 10 sec real = 10 min game = 1/6 hour, income 3/h = 0.5 coins per cycle
      // Make it at least 1 coin per cycle for feedback
      if (coins < 1 && props.incomePerHour > 0) coins = 1;
      if (props.incomePerHour === 0) coins = 0;
      
      this.coinsEarned += coins;
    }

    return { produced, coins, worked };
  }

  private isWorkActivity(activity: ScheduleActivityType | null): boolean {
    if (!activity) return false;
    const props = getJobProperties(this.type);
    
    // Map activity to job work
    switch (this.type) {
      case JobType.FARMER:
        return activity === ScheduleActivityType.FARM;
      case JobType.SHOPKEEPER:
        return activity === ScheduleActivityType.SHOP;
      case JobType.BLACKSMITH:
        return activity === ScheduleActivityType.WORK;
      case JobType.VILLAGER:
        return activity === ScheduleActivityType.WORK || activity === ScheduleActivityType.FARM;
      case JobType.CHILD:
        return activity === ScheduleActivityType.PLAY;
      default:
        return activity === ScheduleActivityType.WORK;
    }
  }

  private getProducedItem(): ItemType | null {
    const props = getJobProperties(this.type);
    if (props.produces.length === 0) return null;

    // Randomly pick from produces
    const randomIndex = Math.floor(Math.random() * props.produces.length);
    const itemStr = props.produces[randomIndex];
    
    // Convert string to ItemType
    switch (itemStr) {
      case 'CROP': return ItemType.CROP;
      case 'FOOD': return ItemType.FOOD;
      case 'COIN': return ItemType.COIN;
      case 'TOOL': return ItemType.TOOL;
      case 'WOOD': return ItemType.WOOD;
      case 'STONE': return ItemType.STONE;
      case 'FLOWER': return ItemType.FLOWER;
      case 'BREAD': return ItemType.BREAD;
      default: return null;
    }
  }

  getWorkDone(): number {
    return this.workDone;
  }

  getItemsProduced(): number {
    return this.itemsProduced;
  }

  getCoinsEarned(): number {
    return this.coinsEarned;
  }

  getWorkProgress(): number {
    return Math.min(1, this.workProgress);
  }

  getData(): JobData {
    return {
      type: this.type,
      workDone: this.workDone,
      itemsProduced: this.itemsProduced,
      coinsEarned: this.coinsEarned,
      lastWorkTime: this.lastWorkTime
    };
  }

  getDebugString(): string {
    const props = getJobProperties(this.type);
    return `${props.icon} ${props.name} Work:${this.workDone.toFixed(1)}h Prod:${this.itemsProduced} Coins:${this.coinsEarned}`;
  }
}
