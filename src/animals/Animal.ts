/**
 * Animal - Phase 16.1 Animals / Livestock System
 * Data-driven animal definitions, states, data
 */

export enum AnimalState {
  IDLE = 'IDLE',
  WANDERING = 'WANDERING',
  EATING = 'EATING',
  SLEEPING = 'SLEEPING',
  PRODUCING = 'PRODUCING',
  HAPPY = 'HAPPY',
  HUNGRY = 'HUNGRY',
  SICK = 'SICK'
}

export enum AnimalType {
  CHICKEN = 'CHICKEN',
  COW = 'COW',
  SHEEP = 'SHEEP',
  PIG = 'PIG'
}

export interface AnimalDefinition {
  id: string; // e.g. chicken
  type: AnimalType;
  name: string;
  icon: string;
  color: string;
  description: string;
  produceItemId: string; // e.g. egg
  produceIntervalSeconds: number; // time to produce
  produceMin: number;
  produceMax: number;
  produceChance: number; // 0-1
  feedItems: string[]; // allowed feed item ids
  feedValue: number; // hunger restored per feed
  happinessOnFeed: number;
  happinessOnPet: number;
  hungerDecayPerDay: number; // 0-100 per day
  happinessDecayPerDay: number;
  minHungerForProduce: number; // 0-100
  minHappinessForProduce: number;
  wanderRadius: number; // tiles
  wanderIntervalSeconds: number;
  speed: number; // tiles per second? pixels per second
  maxHunger: number;
  maxHappiness: number;
  maxHealth: number;
  tags?: string[];
}

export interface AnimalData {
  id: string; // unique e.g. animal_10_20_village_01_0
  type: string; // animal definition id
  x: number; // tile x
  y: number; // tile y
  pixelX: number; // pixel x for smooth movement
  pixelY: number;
  mapId: string;
  state: AnimalState;
  hunger: number; // 0-100
  happiness: number; // 0-100
  health: number; // 0-100
  ageDays: number;
  lastFedAt: number; // totalSeconds
  lastProduceAt: number;
  lastWanderAt: number;
  lastUpdateAt: number;
  produceReady: boolean;
  homeX: number;
  homeY: number;
  targetX: number | null;
  targetY: number | null;
  produceCount: number;
  petCount: number;
  feedCount: number;
  isMoving: boolean;
  version: number;
}

export interface AnimalSaveData {
  animals: Record<string, AnimalData>;
  totalCreated: number;
  totalCollected: number;
  totalFed: number;
  totalPetted: number;
  version: number;
}

export function createEmptyAnimalData(
  id: string,
  type: string,
  x: number,
  y: number,
  mapId: string,
  totalSeconds: number,
  pixelX?: number,
  pixelY?: number
): AnimalData {
  return {
    id,
    type,
    x,
    y,
    pixelX: pixelX ?? x * 32 + 16,
    pixelY: pixelY ?? y * 32 + 16,
    mapId,
    state: AnimalState.IDLE,
    hunger: 80,
    happiness: 70,
    health: 100,
    ageDays: 0,
    lastFedAt: totalSeconds,
    lastProduceAt: totalSeconds,
    lastWanderAt: totalSeconds,
    lastUpdateAt: totalSeconds,
    produceReady: false,
    homeX: x,
    homeY: y,
    targetX: null,
    targetY: null,
    produceCount: 0,
    petCount: 0,
    feedCount: 0,
    isMoving: false,
    version: 1
  };
}

export function getAnimalStateFromNeeds(hunger: number, happiness: number, produceReady: boolean, isMoving: boolean): AnimalState {
  if (produceReady) return AnimalState.PRODUCING;
  if (hunger < 20) return AnimalState.HUNGRY;
  if (happiness > 80) return AnimalState.HAPPY;
  if (isMoving) return AnimalState.WANDERING;
  return AnimalState.IDLE;
}
