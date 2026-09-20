/**
 * JobType - Phase 10 NPC Life Simulation
 * Defines jobs and their properties
 */

export enum JobType {
  FARMER = 'FARMER',
  SHOPKEEPER = 'SHOPKEEPER',
  BLACKSMITH = 'BLACKSMITH',
  VILLAGER = 'VILLAGER',
  CHILD = 'CHILD',
  NONE = 'NONE'
}

export interface JobProperties {
  type: JobType;
  name: string;
  icon: string;
  color: string;
  workActivity: string; // ScheduleActivityType that is work for this job
  produces: string[]; // ItemTypes produced
  workLocationType: 'farm' | 'building' | 'square' | 'any';
  workHours: { start: number; end: number }; // When they work
  incomePerHour: number; // Coins per hour worked
  energyCostPerHour: number; // Energy cost
  happinessChangePerHour: number; // Happiness change when working
  description: string;
}

const JOB_PROPERTIES: Record<JobType, JobProperties> = {
  [JobType.FARMER]: {
    type: JobType.FARMER,
    name: 'Farmer',
    icon: '🌾',
    color: '#8bc34a',
    workActivity: 'FARM',
    produces: ['CROP', 'FOOD'],
    workLocationType: 'farm',
    workHours: { start: 6, end: 17 },
    incomePerHour: 3,
    energyCostPerHour: 8,
    happinessChangePerHour: 1,
    description: 'Grows crops at farm'
  },
  [JobType.SHOPKEEPER]: {
    type: JobType.SHOPKEEPER,
    name: 'Shopkeeper',
    icon: '🏪',
    color: '#ff9800',
    workActivity: 'SHOP',
    produces: ['COIN'],
    workLocationType: 'building',
    workHours: { start: 8, end: 18 },
    incomePerHour: 8,
    energyCostPerHour: 5,
    happinessChangePerHour: 2,
    description: 'Sells goods at shop'
  },
  [JobType.BLACKSMITH]: {
    type: JobType.BLACKSMITH,
    name: 'Blacksmith',
    icon: '🔨',
    color: '#795548',
    workActivity: 'WORK',
    produces: ['TOOL', 'COIN'],
    workLocationType: 'building',
    workHours: { start: 7, end: 18 },
    incomePerHour: 6,
    energyCostPerHour: 10,
    happinessChangePerHour: 0,
    description: 'Forges tools at forge'
  },
  [JobType.VILLAGER]: {
    type: JobType.VILLAGER,
    name: 'Villager',
    icon: '👨',
    color: '#03a9f4',
    workActivity: 'WORK',
    produces: ['WOOD', 'COIN'],
    workLocationType: 'any',
    workHours: { start: 10, end: 15 },
    incomePerHour: 2,
    energyCostPerHour: 6,
    happinessChangePerHour: 1,
    description: 'Helps around village'
  },
  [JobType.CHILD]: {
    type: JobType.CHILD,
    name: 'Child',
    icon: '🧒',
    color: '#e91e63',
    workActivity: 'PLAY',
    produces: ['FLOWER'],
    workLocationType: 'square',
    workHours: { start: 8, end: 17 },
    incomePerHour: 0,
    energyCostPerHour: 7,
    happinessChangePerHour: 3,
    description: 'Plays and learns'
  },
  [JobType.NONE]: {
    type: JobType.NONE,
    name: 'Unemployed',
    icon: '❓',
    color: '#9e9e9e',
    workActivity: 'WANDER',
    produces: [],
    workLocationType: 'any',
    workHours: { start: 9, end: 17 },
    incomePerHour: 0,
    energyCostPerHour: 3,
    happinessChangePerHour: 0,
    description: 'No job'
  }
};

export function getJobProperties(type: JobType): JobProperties {
  return JOB_PROPERTIES[type];
}

export function getJobTypeFromRole(role: string): JobType {
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes('farmer')) return JobType.FARMER;
  if (lowerRole.includes('shop')) return JobType.SHOPKEEPER;
  if (lowerRole.includes('blacksmith')) return JobType.BLACKSMITH;
  if (lowerRole.includes('villager')) return JobType.VILLAGER;
  if (lowerRole.includes('child')) return JobType.CHILD;
  return JobType.NONE;
}
