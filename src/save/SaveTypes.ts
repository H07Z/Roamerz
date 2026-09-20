/**
 * SaveTypes - Phase 13 Save, Load & World Persistence
 * Defines versioned save file structure with forward compatibility
 * Supports future: farming, animals, weather, crafting, combat, dungeons, events, relationships, etc.
 */

export const SAVE_VERSION = 15; // Phase 15 - Farming System
export const SAVE_GAME_VERSION = '0.15.0';
export const MAX_SAVE_SLOTS = 5;
export const STORAGE_KEY_PREFIX = 'roamerz_save_';
export const STORAGE_META_KEY = 'roamerz_save_meta';
export const AUTO_SAVE_SLOT = 0;

// --- Generic helpers ---
export type SaveFlagValue = boolean | string | number | null;

export interface ItemSaveData {
  id: string; // item id e.g. "apple", "wood", or ItemType for NPC
  quantity: number;
  metadata?: Record<string, any>; // future: durability, enchant, etc.
}

export interface InventorySaveData {
  items: ItemSaveData[]; // legacy Phase 13 format (itemId -> id)
  slots?: { itemId: string; quantity: number; metadata?: Record<string, any> }[]; // Phase14 new format
  capacity: number;
  coins: number; // money placeholder
  version: number;
  totalValue?: number;
  // future
  equipment?: Record<string, string | null>; // slot -> itemId
  quickSlots?: (string | null)[];
}

export interface PlayerProgressionSaveData {
  level: number;
  xp: number;
  skillPoints: number;
  unlockedSkills: string[];
  // future expansion
  attributes?: Record<string, number>;
  titles?: string[];
  reputation?: Record<string, number>;
}

export interface PlayerStatsSaveData {
  totalDistance: number;
  playTimeSeconds: number;
  mapsDiscovered: number;
  npcsMet: string[];
  interactions: number;
}

export interface PlayerSaveData {
  // Position
  x: number;
  y: number;
  mapId: string; // current area
  direction: string;
  state: string;

  // Core stats - placeholder for future combat
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  money: number; // also in inventory.coins for redundancy

  // Inventory (Phase 14 ready)
  inventory: InventorySaveData;

  // Progression (Phase 33 ready)
  progression: PlayerProgressionSaveData;
  stats: PlayerStatsSaveData;

  // Quest (Phase 17 ready)
  questProgress: Record<string, any>; // questId -> progress data
  completedQuests: string[];
  activeQuests: string[];

  // Relationships (Phase 19 ready)
  relationships: Record<string, number>; // npcId -> value
  relationshipStages: Record<string, string>; // npcId -> stage

  // Flags
  flags: Record<string, SaveFlagValue>;
  importantFlags: Record<string, SaveFlagValue>;

  // Future placeholders
  farming?: Record<string, any>;
  crafting?: Record<string, any>;
  equipment?: Record<string, any>;
  combat?: Record<string, any>;
}

export interface TimeSaveData {
  day: number;
  hour: number;
  minute: number;
  second: number;
  totalSeconds: number;
  timeScale: number;
  isPaused: boolean;
  // future
  season?: string;
  year?: number;
}

export interface ExplorationMapSaveData {
  mapId: string;
  width: number;
  height: number;
  discoveredCount: number;
  totalTiles: number;
  // Store as compressed string of 0/1 or boolean array for simplicity
  // For save file size, we store as string of 0/1 (2000 chars per map)
  exploredData: string; // e.g. "0101..." length width*height, 1=explored
  // future: could store visible separately but visible is transient, not saved
}

export interface ExplorationSaveData {
  visionRadius: number;
  mapTransitions: number;
  totalDiscovered: number;
  totalTiles: number;
  maps: Record<string, ExplorationMapSaveData>; // mapId -> data
  version: number;
}

export interface NPCNeedsSaveData {
  energy: number;
  hunger: number;
  social: number;
  happiness: number;
  health: number;
  overall: number;
}

export interface NPCInventorySaveData {
  items: { type: string; count: number }[];
  totalValue: number;
  version: number;
}

export interface NPCJobSaveData {
  type: string;
  workDone: number;
  itemsProduced: number;
  coinsEarned: number;
  progress: number;
}

export interface NPCMemoryEntrySaveData {
  type: string; // e.g. "HELPED", "QUEST_COMPLETED", "GIFT", "INSULT"
  importance: number; // 0-100
  timestamp: number; // game totalSeconds or real timestamp
  source: string; // player or npcId or eventId
  data?: Record<string, any>;
  expiresAt?: number; // optional expiration game day
}

export interface NPCSaveData {
  id: string;
  name: string;
  role: string;

  // Position
  x: number;
  y: number;
  mapId: string;
  direction: string;
  state: string;

  // Schedule
  currentActivity: string | null;
  scheduleEnabled: boolean;
  lastScheduleMinutes: number;
  homeId?: string;

  // Stats
  stats: {
    homeVisits: number;
    scheduleChanges: number;
    socialInteractions: number;
    itemsProduced: number;
    totalDistance: number;
    requests: number;
    found: number;
    failed: number;
  };

  // Life
  needs: NPCNeedsSaveData;
  inventory: NPCInventorySaveData;
  job: NPCJobSaveData;

  // Relationships (Phase 19, 32 ready)
  relationships: Record<string, number>; // player and other NPCs
  relationshipStages: Record<string, string>;

  // Memory (Phase 20 ready)
  memory: NPCMemoryEntrySaveData[];

  // Quest-related
  questState: Record<string, any>;
  flags: Record<string, SaveFlagValue>;

  // Future
  farming?: Record<string, any>;
  dialogueHistory?: string[]; // last dialogue nodes
}

export interface WorldSaveData {
  currentMapId: string;
  playerMapId: string;
  allMaps: { id: string; name: string; width: number; height: number }[];

  // Time
  time: TimeSaveData;

  // Exploration
  exploration: ExplorationSaveData;

  // World state
  flags: Record<string, SaveFlagValue>;
  openedLocations: string[]; // mapIds or location ids that are opened
  closedLocations: string[]; // future
  collectedObjects: string[]; // ids of collected items
  changedObjects: Record<string, any>; // objectId -> changed data
  questRelatedChanges: Record<string, any>;
  eventStates: Record<string, any>; // eventId -> state

  // Farming System Phase15
  farming?: {
    plots: Record<string, any>; // plotId -> FarmPlotData
    totalPlotsCreated: number;
    totalHarvested: number;
    totalPlanted: number;
    version: number;
  };
  animals?: {
    animals: Record<string, any>;
    version: number;
  };
  weather?: {
    current: string;
    intensity: number;
    nextChange: number;
    version: number;
  };
  economy?: {
    shopInventories: Record<string, any>;
    prices: Record<string, number>;
    transactionHistory: any[];
    version: number;
  };
  dungeons?: Record<string, any>;
  events?: Record<string, any>;
  seasons?: Record<string, any>;
}

export interface QuestSaveData {
  quests: Record<string, {
    status: string; // AVAILABLE, ACTIVE, COMPLETED, FAILED, LOCKED
    progress: Record<string, any>;
    objectivesCompleted: string[];
    startedAt?: number;
    completedAt?: number;
  }>;
  version: number;
}

export interface MetaSaveData {
  playTimeSeconds: number;
  saveCount: number;
  lastSaved: number; // real timestamp
  createdAt: number;
  gameVersion: string;
  saveVersion: number;
  slotId: number;
  playerName: string;
  preview: {
    day: number;
    time: string;
    mapId: string;
    mapName: string;
    explorationPercent: number;
    money: number;
    health: number;
  };
}

export interface SaveFile {
  // Header
  version: number; // SAVE_VERSION
  gameVersion: string;
  timestamp: number; // real Date.now()
  slotId: number;
  checksum?: string; // simple checksum for corruption detection (optional)

  // Core
  player: PlayerSaveData;
  world: WorldSaveData;
  npcs: Record<string, NPCSaveData>; // npcId -> data
  quests: QuestSaveData;

  // Meta
  meta: MetaSaveData;

  // Future extension container - any new top-level system can be added here
  // with versioning, without breaking old saves
  future: Record<string, any>;

  // Migration history
  migrations?: string[];
}

export interface SaveSlotInfo {
  slotId: number;
  exists: boolean;
  timestamp?: number;
  gameVersion?: string;
  saveVersion?: number;
  preview?: MetaSaveData['preview'];
  meta?: MetaSaveData;
  corrupted?: boolean;
  error?: string;
  sizeBytes?: number;
}

export interface SaveValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  migrated: boolean;
  version: number;
  originalVersion?: number;
}

// Default values for new save
export function createDefaultPlayerSaveData(): PlayerSaveData {
  return {
    x: 25 * 32 + 16,
    y: 20 * 32 + 16,
    mapId: 'village_01',
    direction: 'down',
    state: 'IDLE',
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    money: 50,
    inventory: {
      items: [],
      capacity: 20,
      coins: 50,
      version: 1,
      equipment: {},
      quickSlots: [null, null, null, null]
    },
    progression: {
      level: 1,
      xp: 0,
      skillPoints: 0,
      unlockedSkills: [],
      attributes: {
        strength: 10,
        agility: 10,
        intelligence: 10
      },
      titles: [],
      reputation: {}
    },
    stats: {
      totalDistance: 0,
      playTimeSeconds: 0,
      mapsDiscovered: 1,
      npcsMet: [],
      interactions: 0
    },
    questProgress: {},
    completedQuests: [],
    activeQuests: [],
    relationships: {},
    relationshipStages: {},
    flags: {},
    importantFlags: {},
    farming: {},
    crafting: {},
    equipment: {},
    combat: {}
  };
}

export function createDefaultTimeSaveData(): TimeSaveData {
  return {
    day: 1,
    hour: 6,
    minute: 0,
    second: 0,
    totalSeconds: 0,
    timeScale: 60,
    isPaused: false,
    season: 'SPRING',
    year: 1
  };
}

export function createDefaultExplorationSaveData(): ExplorationSaveData {
  return {
    visionRadius: 8,
    mapTransitions: 0,
    totalDiscovered: 0,
    totalTiles: 0,
    maps: {},
    version: 1
  };
}

export function createDefaultWorldSaveData(): WorldSaveData {
  return {
    currentMapId: 'village_01',
    playerMapId: 'village_01',
    allMaps: [],
    time: createDefaultTimeSaveData(),
    exploration: createDefaultExplorationSaveData(),
    flags: {},
    openedLocations: ['village_01'],
    closedLocations: [],
    collectedObjects: [],
    changedObjects: {},
    questRelatedChanges: {},
    eventStates: {},
    farming: { plots: {}, totalPlotsCreated: 0, totalHarvested: 0, totalPlanted: 0, version: 2 },
    animals: { animals: {}, version: 1 },
    weather: { current: 'SUNNY', intensity: 0, nextChange: 0, version: 1 },
    economy: { shopInventories: {}, prices: {}, transactionHistory: [], version: 1 },
    dungeons: {},
    events: {},
    seasons: {}
  };
}

export function createDefaultQuestSaveData(): QuestSaveData {
  return {
    quests: {},
    version: 1
  };
}

export function createDefaultMetaSaveData(slotId: number): MetaSaveData {
  return {
    playTimeSeconds: 0,
    saveCount: 0,
    lastSaved: Date.now(),
    createdAt: Date.now(),
    gameVersion: SAVE_GAME_VERSION,
    saveVersion: SAVE_VERSION,
    slotId,
    playerName: 'Adventurer',
    preview: {
      day: 1,
      time: '06:00:00',
      mapId: 'village_01',
      mapName: 'Village',
      explorationPercent: 0,
      money: 50,
      health: 100
    }
  };
}

export function createDefaultSaveFile(slotId: number = 0): SaveFile {
  return {
    version: SAVE_VERSION,
    gameVersion: SAVE_GAME_VERSION,
    timestamp: Date.now(),
    slotId,
    player: createDefaultPlayerSaveData(),
    world: createDefaultWorldSaveData(),
    npcs: {},
    quests: createDefaultQuestSaveData(),
    meta: createDefaultMetaSaveData(slotId),
    future: {},
    migrations: []
  };
}
