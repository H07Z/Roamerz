/**
 * Quest.ts - Phase 17 Quest System
 * Data-driven quest definitions, objectives, rewards, persistence
 */

export enum QuestStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum QuestObjectiveType {
  COLLECT_ITEM = 'COLLECT_ITEM',
  TALK_NPC = 'TALK_NPC',
  VISIT_MAP = 'VISIT_MAP',
  HARVEST_CROP = 'HARVEST_CROP',
  COLLECT_ANIMAL_PRODUCE = 'COLLECT_ANIMAL_PRODUCE',
  CRAFT_ITEM = 'CRAFT_ITEM',
  COOK_ITEM = 'COOK_ITEM',
  EARN_MONEY = 'EARN_MONEY',
  BUY_ITEM = 'BUY_ITEM',
  SELL_ITEM = 'SELL_ITEM'
}

export interface QuestObjective {
  id: string;
  type: QuestObjectiveType;
  targetId: string; // itemId, npcId, mapId, cropId, etc.
  description: string;
  requiredAmount: number;
  currentAmount: number;
  completed: boolean;
  optional?: boolean;
}

export interface QuestReward {
  money?: number;
  items?: { itemId: string; quantity: number }[];
  xp?: number;
}

export interface QuestDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: QuestStatus; // default status when created
  objectives: Omit<QuestObjective, 'currentAmount' | 'completed'>[]; // definition without progress
  rewards: QuestReward;
  prerequisites?: string[]; // quest ids that must be completed first
  giverNpcId?: string;
  giverBuildingId?: string;
  repeatable?: boolean;
  tags?: string[];
  mapId?: string;
  x?: number;
  y?: number;
}

export interface QuestObjectiveSaveData {
  id: string;
  currentAmount: number;
  completed: boolean;
}

export interface QuestInstanceSaveData {
  id: string;
  status: QuestStatus;
  objectives: QuestObjectiveSaveData[];
  startedAt?: number;
  completedAt?: number;
  version: number;
}

export interface QuestSystemSaveData {
  quests: Record<string, QuestInstanceSaveData>;
  totalStarted: number;
  totalCompleted: number;
  totalFailed: number;
  version: number;
}

export function createDefaultQuestSystemSaveData(): QuestSystemSaveData {
  return {
    quests: {},
    totalStarted: 0,
    totalCompleted: 0,
    totalFailed: 0,
    version: 1
  };
}

export function createDefaultQuestObjectiveSaveData(obj: QuestObjective): QuestObjectiveSaveData {
  return {
    id: obj.id,
    currentAmount: obj.currentAmount,
    completed: obj.completed
  };
}
