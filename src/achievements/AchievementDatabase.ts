/**
 * AchievementDatabase - Phase 18.1 Achievements System
 * Data-driven registry of achievement definitions (singleton, like QuestDatabase).
 * 12 achievements across farming, animals, crafting, cooking, exploration, social, economy, quests, general.
 */

import { AchievementDefinition, AchievementCategory, AchievementStat } from './Achievement';
import { ItemDatabase } from '../inventory/ItemDatabase';

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ---- FARMING ----
  {
    id: 'ach_green_thumb',
    name: 'Green Thumb',
    icon: '🌱',
    description: 'Harvest your first crop.',
    category: AchievementCategory.FARMING,
    stat: AchievementStat.CROPS_HARVESTED,
    target: 1,
    rewards: { money: 10 },
    tier: 1
  },
  {
    id: 'ach_farmer',
    name: 'Farmer',
    icon: '🌾',
    description: 'Harvest 10 crops.',
    category: AchievementCategory.FARMING,
    stat: AchievementStat.CROPS_HARVESTED,
    target: 10,
    rewards: { money: 50, items: [{ itemId: 'wheat_seed', quantity: 5 }] },
    tier: 2
  },

  // ---- ANIMALS ----
  {
    id: 'ach_animal_friend',
    name: 'Animal Friend',
    icon: '🐔',
    description: 'Collect 5 animal products (eggs, milk, wool, truffles).',
    category: AchievementCategory.ANIMALS,
    stat: AchievementStat.ANIMAL_PRODUCE_COLLECTED,
    target: 5,
    rewards: { money: 25, items: [{ itemId: 'hay', quantity: 3 }] },
    tier: 1
  },
  {
    id: 'ach_caretaker',
    name: 'Caretaker',
    icon: '💚',
    description: 'Feed or pet animals 10 times.',
    category: AchievementCategory.ANIMALS,
    stat: AchievementStat.ANIMAL_CARE,
    target: 10,
    rewards: { money: 20 },
    tier: 1
  },

  // ---- CRAFTING ----
  {
    id: 'ach_apprentice_crafter',
    name: 'Apprentice Crafter',
    icon: '🔨',
    description: 'Craft 5 items at the crafting menu.',
    category: AchievementCategory.CRAFTING,
    stat: AchievementStat.ITEMS_CRAFTED,
    target: 5,
    rewards: { money: 30, items: [{ itemId: 'wood', quantity: 5 }] },
    tier: 1
  },

  // ---- COOKING ----
  {
    id: 'ach_home_cook',
    name: 'Home Cook',
    icon: '🍳',
    description: 'Cook 3 meals.',
    category: AchievementCategory.COOKING,
    stat: AchievementStat.ITEMS_COOKED,
    target: 3,
    rewards: { money: 30, items: [{ itemId: 'bread', quantity: 2 }] },
    tier: 1
  },

  // ---- EXPLORATION ----
  {
    id: 'ach_wanderer',
    name: 'Wanderer',
    icon: '🗺️',
    description: 'Visit all 3 maps (Village, Forest, Lake).',
    category: AchievementCategory.EXPLORATION,
    stat: AchievementStat.MAPS_VISITED,
    target: 3,
    rewards: { money: 40 },
    tier: 2
  },

  // ---- SOCIAL ----
  {
    id: 'ach_friendly_face',
    name: 'Friendly Face',
    icon: '💬',
    description: 'Talk to 3 different villagers.',
    category: AchievementCategory.SOCIAL,
    stat: AchievementStat.NPCS_TALKED,
    target: 3,
    rewards: { money: 20, items: [{ itemId: 'apple', quantity: 3 }] },
    tier: 1
  },

  // ---- ECONOMY ----
  {
    id: 'ach_merchant',
    name: 'Merchant',
    icon: '💰',
    description: 'Complete 5 shop transactions (buy or sell).',
    category: AchievementCategory.ECONOMY,
    stat: AchievementStat.TRANSACTIONS,
    target: 5,
    rewards: { money: 50 },
    tier: 1
  },

  // ---- QUESTS ----
  {
    id: 'ach_quest_taker',
    name: 'Quest Taker',
    icon: '📜',
    description: 'Complete your first quest.',
    category: AchievementCategory.QUESTS,
    stat: AchievementStat.QUESTS_COMPLETED,
    target: 1,
    rewards: { money: 25 },
    tier: 1
  },
  {
    id: 'ach_quest_master',
    name: 'Quest Master',
    icon: '🏆',
    description: 'Complete 3 quests.',
    category: AchievementCategory.QUESTS,
    stat: AchievementStat.QUESTS_COMPLETED,
    target: 3,
    rewards: { money: 100, items: [{ itemId: 'gem', quantity: 1 }] },
    tier: 3
  },

  // ---- GENERAL ----
  {
    id: 'ach_well_off',
    name: 'Well Off',
    icon: '💎',
    description: 'Hold $500 at once.',
    category: AchievementCategory.GENERAL,
    stat: AchievementStat.MAX_MONEY,
    target: 500,
    rewards: { items: [{ itemId: 'coin', quantity: 20 }] },
    tier: 2
  }
];

export class AchievementDatabase {
  private static instance: AchievementDatabase | null = null;
  private achievements: Map<string, AchievementDefinition> = new Map();

  private constructor() {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      this.achievements.set(def.id, def);
    }
    console.log(`[AchievementDatabase] Loaded ${this.achievements.size} achievements`);
  }

  static getInstance(): AchievementDatabase {
    if (!AchievementDatabase.instance) {
      AchievementDatabase.instance = new AchievementDatabase();
    }
    return AchievementDatabase.instance;
  }

  getAchievement(id: string): AchievementDefinition | undefined {
    return this.achievements.get(id);
  }

  getAllAchievements(): AchievementDefinition[] {
    return Array.from(this.achievements.values());
  }

  getByCategory(category: AchievementCategory): AchievementDefinition[] {
    return this.getAllAchievements().filter(a => a.category === category);
  }

  getByStat(stat: string): AchievementDefinition[] {
    return this.getAllAchievements().filter(a => a.stat === stat);
  }

  getCount(): number {
    return this.achievements.size;
  }

  hasAchievement(id: string): boolean {
    return this.achievements.has(id);
  }

  // Data-driven extensibility
  registerAchievement(def: AchievementDefinition): boolean {
    if (this.achievements.has(def.id)) {
      console.warn(`[AchievementDatabase] Achievement ${def.id} already exists`);
      return false;
    }
    this.achievements.set(def.id, def);
    return true;
  }

  unregisterAchievement(id: string): boolean {
    return this.achievements.delete(id);
  }

  validate(itemDatabase?: ItemDatabase): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const itemDb = itemDatabase ?? ItemDatabase.getInstance();
    const validStats = new Set<string>(Object.values(AchievementStat));

    for (const def of this.achievements.values()) {
      if (!def.id) errors.push(`Achievement missing id: ${JSON.stringify(def)}`);
      if (!def.name) errors.push(`Achievement ${def.id} missing name`);
      if (!def.icon) errors.push(`Achievement ${def.id} missing icon`);
      if (!def.description) errors.push(`Achievement ${def.id} missing description`);
      if (!def.category) errors.push(`Achievement ${def.id} missing category`);
      if (!validStats.has(def.stat)) errors.push(`Achievement ${def.id} unknown stat ${def.stat}`);
      if (typeof def.target !== 'number' || def.target <= 0) errors.push(`Achievement ${def.id} invalid target ${def.target}`);
      if (def.rewards?.items) {
        for (const item of def.rewards.items) {
          if (!itemDb.hasItem(item.itemId)) errors.push(`Achievement ${def.id} reward item ${item.itemId} not in ItemDatabase`);
          if (item.quantity <= 0) errors.push(`Achievement ${def.id} reward item ${item.itemId} invalid quantity ${item.quantity}`);
        }
      }
      if (def.rewards?.money !== undefined && def.rewards.money < 0) errors.push(`Achievement ${def.id} negative money reward`);
    }

    return { valid: errors.length === 0, errors };
  }

  getDebugString(): string {
    return this.getAllAchievements().map(a => `${a.icon}${a.id}(${a.stat}>=${a.target})`).join(', ');
  }
}
