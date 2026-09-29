/**
 * Achievement.ts - Phase 18.1 Achievements System
 * Data-driven achievement definitions, progress, rewards, persistence types.
 *
 * Design: each achievement watches ONE tracked stat (counter, unique-set size, or max value)
 * and unlocks automatically when the stat reaches `target`. Rewards are granted on unlock.
 * The AchievementSystem never reads other systems directly - Game.ts feeds it via record* hooks
 * (same pattern as the Quest System) so modules stay independent.
 */

export enum AchievementCategory {
  FARMING = 'FARMING',
  ANIMALS = 'ANIMALS',
  CRAFTING = 'CRAFTING',
  COOKING = 'COOKING',
  EXPLORATION = 'EXPLORATION',
  SOCIAL = 'SOCIAL',
  ECONOMY = 'ECONOMY',
  QUESTS = 'QUESTS',
  GENERAL = 'GENERAL'
}

/** Tracked stat keys. Counters unless noted (unique = set size, max = highest value seen). */
export const AchievementStat = {
  CROPS_HARVESTED: 'crops_harvested',
  CROPS_PLANTED: 'crops_planted',
  ANIMAL_PRODUCE_COLLECTED: 'animal_produce_collected',
  ANIMAL_CARE: 'animal_care',                 // feed + pet actions
  ITEMS_CRAFTED: 'items_crafted',
  ITEMS_COOKED: 'items_cooked',
  MAPS_VISITED: 'maps_visited',               // unique
  NPCS_TALKED: 'npcs_talked',                 // unique
  DIALOGUES: 'dialogues',
  ITEMS_BOUGHT: 'items_bought',
  ITEMS_SOLD: 'items_sold',
  TRANSACTIONS: 'transactions',
  MONEY_EARNED: 'money_earned',
  QUESTS_COMPLETED: 'quests_completed',
  MAX_MONEY: 'max_money',                     // max
  DAYS_PLAYED: 'days_played'                  // max (current day number)
} as const;

export type AchievementStatKey = typeof AchievementStat[keyof typeof AchievementStat];

export interface AchievementReward {
  money?: number;
  items?: { itemId: string; quantity: number }[];
}

export interface AchievementDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: AchievementCategory;
  stat: AchievementStatKey;   // which tracked stat drives progress
  target: number;             // unlock when stat >= target
  rewards?: AchievementReward;
  hidden?: boolean;           // hide name/description until unlocked
  tier?: number;              // 1 = bronze, 2 = silver, 3 = gold (display only)
}

export interface AchievementInstance {
  definition: AchievementDefinition;
  progress: number;           // last known stat value (clamped to target for display)
  unlocked: boolean;
  unlockedAt?: number;        // game totalSeconds when unlocked
}

export interface AchievementProgress {
  current: number;
  target: number;
  percent: number;            // 0-100
}

export interface AchievementInstanceSaveData {
  progress: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface AchievementSystemSaveData {
  achievements: Record<string, AchievementInstanceSaveData>;
  stats: Record<string, number>;
  uniques: Record<string, string[]>;  // unique-set stats (maps visited, npcs talked)
  totalUnlocked: number;
  version: number;
}

export function createDefaultAchievementSystemSaveData(): AchievementSystemSaveData {
  return {
    achievements: {},
    stats: {},
    uniques: {},
    totalUnlocked: 0,
    version: 1
  };
}

export const ACHIEVEMENT_CATEGORY_ORDER: AchievementCategory[] = [
  AchievementCategory.FARMING,
  AchievementCategory.ANIMALS,
  AchievementCategory.CRAFTING,
  AchievementCategory.COOKING,
  AchievementCategory.EXPLORATION,
  AchievementCategory.SOCIAL,
  AchievementCategory.ECONOMY,
  AchievementCategory.QUESTS,
  AchievementCategory.GENERAL
];

export const ACHIEVEMENT_CATEGORY_ICONS: Record<AchievementCategory, string> = {
  [AchievementCategory.FARMING]: '🌾',
  [AchievementCategory.ANIMALS]: '🐔',
  [AchievementCategory.CRAFTING]: '🔨',
  [AchievementCategory.COOKING]: '🍳',
  [AchievementCategory.EXPLORATION]: '🗺️',
  [AchievementCategory.SOCIAL]: '💬',
  [AchievementCategory.ECONOMY]: '💰',
  [AchievementCategory.QUESTS]: '📜',
  [AchievementCategory.GENERAL]: '⭐'
};
