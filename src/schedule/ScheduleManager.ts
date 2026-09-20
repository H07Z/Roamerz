/**
 * ScheduleManager - Phase 9 Time & NPC Schedules
 * Manages all NPC schedules, creates default schedules per role
 */

import { Schedule } from './Schedule';
import { ScheduleEntryData } from './ScheduleEntry';
import { ScheduleActivityType } from './ScheduleActivityType';

export class ScheduleManager {
  private schedules: Map<string, Schedule> = new Map();

  constructor() {}

  initialize(): void {
    console.log('[ScheduleManager] Initializing Phase 9 - Time & Schedules...');
    this.schedules.clear();

    // Create schedules for each NPC
    // NPC001 Farmer Joe - works at farm
    this.createFarmerSchedule('NPC001');

    // NPC002 Shopkeeper - works at shop
    this.createShopkeeperSchedule('NPC002');

    // NPC003 Blacksmith - works at forge
    this.createBlacksmithSchedule('NPC003');

    // NPC004 Villager - general wandering and social
    this.createVillagerSchedule('NPC004');

    // NPC005 Child - plays, goes to school/playground
    this.createChildSchedule('NPC005');

    console.log(`[ScheduleManager] Created ${this.schedules.size} schedules`);
    for (const [npcId, schedule] of this.schedules.entries()) {
      console.log(`[ScheduleManager] ${npcId}: ${schedule.getEntryCount()} entries, full coverage: ${schedule.isFullDayCoverage()}, gaps: ${schedule.getGaps().length}`);
    }
  }

  private createFarmerSchedule(npcId: string): void {
    const entries: ScheduleEntryData[] = [
      // Night: sleep at home
      {
        startHour: 0, startMinute: 0,
        endHour: 5, endMinute: 0,
        activity: ScheduleActivityType.SLEEP,
        destination: { type: 'home', buildingId: 'HOUSE001' },
        description: 'Sleeping at home'
      },
      {
        startHour: 5, startMinute: 0,
        endHour: 6, endMinute: 0,
        activity: ScheduleActivityType.HOME,
        destination: { type: 'home', buildingId: 'HOUSE001' },
        description: 'Waking up at home'
      },
      // Morning: work at farm
      {
        startHour: 6, startMinute: 0,
        endHour: 12, endMinute: 0,
        activity: ScheduleActivityType.FARM,
        destination: { type: 'farm' },
        description: 'Farming at fields'
      },
      // Midday: eat at square
      {
        startHour: 12, startMinute: 0,
        endHour: 13, endMinute: 0,
        activity: ScheduleActivityType.EAT,
        destination: { type: 'square' },
        description: 'Lunch at square'
      },
      // Afternoon: farm work
      {
        startHour: 13, startMinute: 0,
        endHour: 17, endMinute: 0,
        activity: ScheduleActivityType.FARM,
        destination: { type: 'farm' },
        description: 'Afternoon farming'
      },
      // Evening: social at square, then home
      {
        startHour: 17, startMinute: 0,
        endHour: 19, endMinute: 0,
        activity: ScheduleActivityType.SOCIAL,
        destination: { type: 'square' },
        description: 'Evening social at square'
      },
      {
        startHour: 19, startMinute: 0,
        endHour: 20, endMinute: 0,
        activity: ScheduleActivityType.HOME,
        destination: { type: 'home', buildingId: 'HOUSE001' },
        description: 'Evening at home'
      },
      // Night: inside
      {
        startHour: 20, startMinute: 0,
        endHour: 24, endMinute: 0,
        activity: ScheduleActivityType.INSIDE,
        destination: { type: 'home', buildingId: 'HOUSE001' },
        description: 'Night inside home'
      }
    ];

    this.schedules.set(npcId, new Schedule(npcId, entries));
  }

  private createShopkeeperSchedule(npcId: string): void {
    const entries: ScheduleEntryData[] = [
      {
        startHour: 0, startMinute: 0,
        endHour: 6, endMinute: 0,
        activity: ScheduleActivityType.SLEEP,
        destination: { type: 'home', buildingId: 'HOUSE002' },
        description: 'Sleeping at home'
      },
      {
        startHour: 6, startMinute: 0,
        endHour: 8, endMinute: 0,
        activity: ScheduleActivityType.HOME,
        destination: { type: 'home', buildingId: 'HOUSE002' },
        description: 'Morning at home'
      },
      {
        startHour: 8, startMinute: 0,
        endHour: 12, endMinute: 0,
        activity: ScheduleActivityType.SHOP,
        destination: { type: 'building', buildingId: 'HOUSE002' },
        description: 'Working at shop'
      },
      {
        startHour: 12, startMinute: 0,
        endHour: 13, endMinute: 0,
        activity: ScheduleActivityType.EAT,
        destination: { type: 'square' },
        description: 'Lunch'
      },
      {
        startHour: 13, startMinute: 0,
        endHour: 18, endMinute: 0,
        activity: ScheduleActivityType.SHOP,
        destination: { type: 'building', buildingId: 'HOUSE002' },
        description: 'Afternoon shop work'
      },
      {
        startHour: 18, startMinute: 0,
        endHour: 19, endMinute: 0,
        activity: ScheduleActivityType.SOCIAL,
        destination: { type: 'square' },
        description: 'Evening social'
      },
      {
        startHour: 19, startMinute: 0,
        endHour: 20, endMinute: 0,
        activity: ScheduleActivityType.HOME,
        destination: { type: 'home', buildingId: 'HOUSE002' },
        description: 'Evening at home'
      },
      {
        startHour: 20, startMinute: 0,
        endHour: 24, endMinute: 0,
        activity: ScheduleActivityType.SLEEP,
        destination: { type: 'home', buildingId: 'HOUSE002' },
        description: 'Night sleep'
      }
    ];

    this.schedules.set(npcId, new Schedule(npcId, entries));
  }

  private createBlacksmithSchedule(npcId: string): void {
    const entries: ScheduleEntryData[] = [
      {
        startHour: 0, startMinute: 0,
        endHour: 5, endMinute: 30,
        activity: ScheduleActivityType.SLEEP,
        destination: { type: 'home', buildingId: 'HOUSE003' },
        description: 'Sleeping'
      },
      {
        startHour: 5, startMinute: 30,
        endHour: 7, endMinute: 0,
        activity: ScheduleActivityType.HOME,
        destination: { type: 'home', buildingId: 'HOUSE003' },
        description: 'Morning prep'
      },
      {
        startHour: 7, startMinute: 0,
        endHour: 12, endMinute: 0,
        activity: ScheduleActivityType.WORK,
        destination: { type: 'building', buildingId: 'HOUSE003' },
        description: 'Blacksmith work'
      },
      {
        startHour: 12, startMinute: 0,
        endHour: 13, endMinute: 0,
        activity: ScheduleActivityType.EAT,
        destination: { type: 'square' },
        description: 'Lunch'
      },
      {
        startHour: 13, startMinute: 0,
        endHour: 18, endMinute: 0,
        activity: ScheduleActivityType.WORK,
        destination: { type: 'building', buildingId: 'HOUSE003' },
        description: 'Afternoon forge'
      },
      {
        startHour: 18, startMinute: 0,
        endHour: 19, endMinute: 30,
        activity: ScheduleActivityType.SOCIAL,
        destination: { type: 'square' },
        description: 'Evening at square'
      },
      {
        startHour: 19, startMinute: 30,
        endHour: 20, endMinute: 30,
        activity: ScheduleActivityType.HOME,
        destination: { type: 'home', buildingId: 'HOUSE003' },
        description: 'Evening at home'
      },
      {
        startHour: 20, startMinute: 30,
        endHour: 24, endMinute: 0,
        activity: ScheduleActivityType.INSIDE,
        destination: { type: 'home', buildingId: 'HOUSE003' },
        description: 'Night inside'
      }
    ];

    this.schedules.set(npcId, new Schedule(npcId, entries));
  }

  private createVillagerSchedule(npcId: string): void {
    const entries: ScheduleEntryData[] = [
      {
        startHour: 0, startMinute: 0,
        endHour: 6, endMinute: 30,
        activity: ScheduleActivityType.SLEEP,
        destination: { type: 'home', buildingId: 'HOUSE004' },
        description: 'Sleeping'
      },
      {
        startHour: 6, startMinute: 30,
        endHour: 8, endMinute: 0,
        activity: ScheduleActivityType.HOME,
        destination: { type: 'home', buildingId: 'HOUSE004' },
        description: 'Morning at home'
      },
      {
        startHour: 8, startMinute: 0,
        endHour: 10, endMinute: 0,
        activity: ScheduleActivityType.WANDER,
        destination: { type: 'square' },
        description: 'Morning wander'
      },
      {
        startHour: 10, startMinute: 0,
        endHour: 12, endMinute: 0,
        activity: ScheduleActivityType.WORK,
        destination: { type: 'farm' },
        description: 'Helping at farm'
      },
      {
        startHour: 12, startMinute: 0,
        endHour: 13, endMinute: 0,
        activity: ScheduleActivityType.EAT,
        destination: { type: 'square' },
        description: 'Lunch'
      },
      {
        startHour: 13, startMinute: 0,
        endHour: 15, endMinute: 0,
        activity: ScheduleActivityType.SOCIAL,
        destination: { type: 'square' },
        description: 'Afternoon social'
      },
      {
        startHour: 15, startMinute: 0,
        endHour: 18, endMinute: 0,
        activity: ScheduleActivityType.WANDER,
        destination: { type: 'square' },
        description: 'Afternoon wander'
      },
      {
        startHour: 18, startMinute: 0,
        endHour: 19, endMinute: 0,
        activity: ScheduleActivityType.HOME,
        destination: { type: 'home', buildingId: 'HOUSE004' },
        description: 'Evening home'
      },
      {
        startHour: 19, startMinute: 0,
        endHour: 24, endMinute: 0,
        activity: ScheduleActivityType.SLEEP,
        destination: { type: 'home', buildingId: 'HOUSE004' },
        description: 'Night sleep'
      }
    ];

    this.schedules.set(npcId, new Schedule(npcId, entries));
  }

  private createChildSchedule(npcId: string): void {
    const entries: ScheduleEntryData[] = [
      {
        startHour: 0, startMinute: 0,
        endHour: 7, endMinute: 0,
        activity: ScheduleActivityType.SLEEP,
        destination: { type: 'home', buildingId: 'HOUSE005' },
        description: 'Sleeping'
      },
      {
        startHour: 7, startMinute: 0,
        endHour: 8, endMinute: 0,
        activity: ScheduleActivityType.HOME,
        destination: { type: 'home', buildingId: 'HOUSE005' },
        description: 'Morning at home'
      },
      {
        startHour: 8, startMinute: 0,
        endHour: 12, endMinute: 0,
        activity: ScheduleActivityType.PLAY,
        destination: { type: 'square' },
        description: 'Morning play at square'
      },
      {
        startHour: 12, startMinute: 0,
        endHour: 13, endMinute: 0,
        activity: ScheduleActivityType.EAT,
        destination: { type: 'home', buildingId: 'HOUSE005' },
        description: 'Lunch at home'
      },
      {
        startHour: 13, startMinute: 0,
        endHour: 17, endMinute: 0,
        activity: ScheduleActivityType.PLAY,
        destination: { type: 'square' },
        description: 'Afternoon play'
      },
      {
        startHour: 17, startMinute: 0,
        endHour: 18, endMinute: 30,
        activity: ScheduleActivityType.WANDER,
        destination: { type: 'square' },
        description: 'Evening wander'
      },
      {
        startHour: 18, startMinute: 30,
        endHour: 19, endMinute: 30,
        activity: ScheduleActivityType.HOME,
        destination: { type: 'home', buildingId: 'HOUSE005' },
        description: 'Evening home'
      },
      {
        startHour: 19, startMinute: 30,
        endHour: 24, endMinute: 0,
        activity: ScheduleActivityType.SLEEP,
        destination: { type: 'home', buildingId: 'HOUSE005' },
        description: 'Night sleep'
      }
    ];

    this.schedules.set(npcId, new Schedule(npcId, entries));
  }

  getSchedule(npcId: string): Schedule | undefined {
    return this.schedules.get(npcId);
  }

  getAllSchedules(): Schedule[] {
    return Array.from(this.schedules.values());
  }

  getCount(): number {
    return this.schedules.size;
  }

  // For testing
  getCurrentActivityForNPC(npcId: string, minutesSinceMidnight: number) {
    const schedule = this.schedules.get(npcId);
    if (!schedule) return null;
    return schedule.getCurrentEntry(minutesSinceMidnight);
  }
}
