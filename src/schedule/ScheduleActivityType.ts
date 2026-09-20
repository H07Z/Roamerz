/**
 * ScheduleActivityType - Phase 9 Time & NPC Schedules
 * Types of activities NPCs can do based on time
 */

export enum ScheduleActivityType {
  SLEEP = 'SLEEP',           // Sleeping inside home
  HOME = 'HOME',             // At home, idle
  WORK = 'WORK',             // Working at workplace
  EAT = 'EAT',               // Eating at home or square
  WANDER = 'WANDER',         // Wandering around village
  PATROL = 'PATROL',         // Patrolling (A↔B)
  SHOP = 'SHOP',             // Shopping / at shop
  FARM = 'FARM',             // Farming at farm
  SOCIAL = 'SOCIAL',         // Socializing at square
  PLAY = 'PLAY',             // Playing (child)
  INSIDE = 'INSIDE'          // Inside building
}

export interface ActivityProperties {
  type: ScheduleActivityType;
  name: string;
  icon: string;
  color: string;
  description: string;
  isInside: boolean;
  priority: number; // Higher = more important, won't be interrupted easily
}

export const ACTIVITY_PROPERTIES: Record<ScheduleActivityType, ActivityProperties> = {
  [ScheduleActivityType.SLEEP]: {
    type: ScheduleActivityType.SLEEP,
    name: 'Sleep',
    icon: '💤',
    color: '#8888ff',
    description: 'Sleeping inside home',
    isInside: true,
    priority: 10
  },
  [ScheduleActivityType.HOME]: {
    type: ScheduleActivityType.HOME,
    name: 'Home',
    icon: '⌂',
    color: '#ffaa55',
    description: 'At home relaxing',
    isInside: false,
    priority: 5
  },
  [ScheduleActivityType.WORK]: {
    type: ScheduleActivityType.WORK,
    name: 'Work',
    icon: '⚒',
    color: '#ff5555',
    description: 'Working at workplace',
    isInside: false,
    priority: 8
  },
  [ScheduleActivityType.EAT]: {
    type: ScheduleActivityType.EAT,
    name: 'Eat',
    icon: '🍞',
    color: '#55ff55',
    description: 'Eating meal',
    isInside: false,
    priority: 7
  },
  [ScheduleActivityType.WANDER]: {
    type: ScheduleActivityType.WANDER,
    name: 'Wander',
    icon: '🚶',
    color: '#55aaff',
    description: 'Wandering around',
    isInside: false,
    priority: 2
  },
  [ScheduleActivityType.PATROL]: {
    type: ScheduleActivityType.PATROL,
    name: 'Patrol',
    icon: '↔',
    color: '#aaff55',
    description: 'Patrolling between points',
    isInside: false,
    priority: 3
  },
  [ScheduleActivityType.SHOP]: {
    type: ScheduleActivityType.SHOP,
    name: 'Shop',
    icon: '🛒',
    color: '#ffaa00',
    description: 'At shop working or shopping',
    isInside: false,
    priority: 6
  },
  [ScheduleActivityType.FARM]: {
    type: ScheduleActivityType.FARM,
    name: 'Farm',
    icon: '🌾',
    color: '#88aa33',
    description: 'Farming at fields',
    isInside: false,
    priority: 8
  },
  [ScheduleActivityType.SOCIAL]: {
    type: ScheduleActivityType.SOCIAL,
    name: 'Social',
    icon: '💬',
    color: '#ff55ff',
    description: 'Socializing at square',
    isInside: false,
    priority: 4
  },
  [ScheduleActivityType.PLAY]: {
    type: ScheduleActivityType.PLAY,
    name: 'Play',
    icon: '⚽',
    color: '#ffaa55',
    description: 'Playing around village',
    isInside: false,
    priority: 2
  },
  [ScheduleActivityType.INSIDE]: {
    type: ScheduleActivityType.INSIDE,
    name: 'Inside',
    icon: '🏠',
    color: '#aaaaaa',
    description: 'Inside building',
    isInside: true,
    priority: 9
  }
};

export function getActivityProperties(type: ScheduleActivityType): ActivityProperties {
  return ACTIVITY_PROPERTIES[type];
}
