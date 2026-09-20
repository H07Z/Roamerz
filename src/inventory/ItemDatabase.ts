/**
 * ItemDatabase - Phase 14 Inventory System
 * Data-driven item database, reusable, extensible
 * All items defined as data, not hard-coded logic
 */

import { ItemDefinition, ItemCategory, ItemRarity, ItemType } from './Item';

export const ITEM_DATABASE: Record<string, ItemDefinition> = {
  // Food - stackable
  [ItemType.APPLE]: {
    id: ItemType.APPLE,
    name: 'Apple',
    type: ItemType.APPLE,
    category: ItemCategory.FOOD,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 20,
    value: 5,
    icon: '🍎',
    color: '#4caf50',
    description: 'A juicy apple. Restores a little health and stamina.',
    weight: 0.2,
    effects: { health: 5, stamina: 10, hunger: 15 },
    tags: ['edible', 'food', 'sellable', 'gatherable']
  },
  [ItemType.BREAD]: {
    id: ItemType.BREAD,
    name: 'Bread',
    type: ItemType.BREAD,
    category: ItemCategory.FOOD,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 10,
    value: 12,
    icon: '🍞',
    color: '#d7ccc8',
    description: 'Freshly baked bread. Restores hunger well.',
    weight: 0.3,
    effects: { health: 10, stamina: 15, hunger: 40 },
    tags: ['edible', 'food', 'sellable']
  },
  [ItemType.FISH]: {
    id: ItemType.FISH,
    name: 'Fish',
    type: ItemType.FISH,
    category: ItemCategory.FOOD,
    rarity: ItemRarity.UNCOMMON,
    stackable: true,
    maxStack: 10,
    value: 15,
    icon: '🐟',
    color: '#03a9f4',
    description: 'Fresh fish from the lake. Good for cooking.',
    weight: 0.5,
    effects: { health: 8, hunger: 30 },
    tags: ['edible', 'food', 'sellable', 'gatherable']
  },
  [ItemType.BERRY]: {
    id: ItemType.BERRY,
    name: 'Berry',
    type: ItemType.BERRY,
    category: ItemCategory.FOOD,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 30,
    value: 3,
    icon: '🫐',
    color: '#9c27b0',
    description: 'Wild berries. Small but nutritious.',
    weight: 0.1,
    effects: { health: 2, hunger: 10 },
    tags: ['edible', 'food', 'gatherable', 'sellable']
  },
  [ItemType.MUSHROOM]: {
    id: ItemType.MUSHROOM,
    name: 'Mushroom',
    type: ItemType.MUSHROOM,
    category: ItemCategory.FOOD,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 20,
    value: 4,
    icon: '🍄',
    color: '#795548',
    description: 'Forest mushroom. Can be eaten or used in potions.',
    weight: 0.1,
    effects: { health: 3, hunger: 12 },
    tags: ['edible', 'food', 'gatherable', 'craftable', 'sellable']
  },
  [ItemType.HERB]: {
    id: ItemType.HERB,
    name: 'Herb',
    type: ItemType.HERB,
    category: ItemCategory.MATERIAL,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 30,
    value: 6,
    icon: '🌿',
    color: '#8bc34a',
    description: 'Medicinal herb. Used for potions.',
    weight: 0.05,
    effects: { health: 2 },
    tags: ['gatherable', 'craftable', 'sellable', 'material']
  },
  [ItemType.WHEAT]: {
    id: ItemType.WHEAT,
    name: 'Wheat',
    type: ItemType.WHEAT,
    category: ItemCategory.FOOD,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 30,
    value: 8,
    icon: '🌾',
    color: '#d4a017',
    description: 'Harvested wheat. Can be milled into flour for bread.',
    weight: 0.3,
    effects: { hunger: 20 },
    tags: ['food', 'farmable', 'craftable', 'sellable', 'harvest']
  },
  [ItemType.CARROT]: {
    id: ItemType.CARROT,
    name: 'Carrot',
    type: ItemType.CARROT,
    category: ItemCategory.FOOD,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 20,
    value: 10,
    icon: '🥕',
    color: '#ff8c00',
    description: 'Fresh carrot. Nutritious and crunchy.',
    weight: 0.2,
    effects: { health: 5, hunger: 25 },
    tags: ['food', 'farmable', 'edible', 'sellable', 'harvest']
  },

  // Materials - stackable
  [ItemType.WOOD]: {
    id: ItemType.WOOD,
    name: 'Wood',
    type: ItemType.WOOD,
    category: ItemCategory.MATERIAL,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 50,
    value: 3,
    icon: '🪵',
    color: '#8d6e63',
    description: 'Common wood. Basic building and crafting material.',
    weight: 0.8,
    tags: ['material', 'craftable', 'sellable', 'gatherable']
  },
  [ItemType.STONE]: {
    id: ItemType.STONE,
    name: 'Stone',
    type: ItemType.STONE,
    category: ItemCategory.MATERIAL,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 50,
    value: 3,
    icon: '🪨',
    color: '#9e9e9e',
    description: 'Common stone. Used for crafting and building.',
    weight: 1.0,
    tags: ['material', 'craftable', 'sellable', 'gatherable']
  },
  [ItemType.ORE]: {
    id: ItemType.ORE,
    name: 'Ore',
    type: ItemType.ORE,
    category: ItemCategory.MATERIAL,
    rarity: ItemRarity.UNCOMMON,
    stackable: true,
    maxStack: 30,
    value: 10,
    icon: '⛏️',
    color: '#607d8b',
    description: 'Raw ore. Needs smelting.',
    weight: 1.2,
    tags: ['material', 'craftable', 'sellable', 'gatherable']
  },
  [ItemType.FIBER]: {
    id: ItemType.FIBER,
    name: 'Fiber',
    type: ItemType.FIBER,
    category: ItemCategory.MATERIAL,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 40,
    value: 2,
    icon: '🧵',
    color: '#cddc39',
    description: 'Plant fiber. Used for crafting.',
    weight: 0.1,
    tags: ['material', 'craftable', 'sellable', 'gatherable']
  },
  [ItemType.CLAY]: {
    id: ItemType.CLAY,
    name: 'Clay',
    type: ItemType.CLAY,
    category: ItemCategory.MATERIAL,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 30,
    value: 4,
    icon: '🏺',
    color: '#a1887f',
    description: 'Soft clay. For pottery and building.',
    weight: 0.9,
    tags: ['material', 'craftable', 'sellable', 'gatherable']
  },

  // Tools - non-stackable
  [ItemType.AXE]: {
    id: ItemType.AXE,
    name: 'Axe',
    type: ItemType.AXE,
    category: ItemCategory.TOOL,
    rarity: ItemRarity.COMMON,
    stackable: false,
    maxStack: 1,
    value: 30,
    icon: '🪓',
    color: '#795548',
    description: 'A basic axe for chopping wood.',
    weight: 2.5,
    durability: 100,
    tags: ['tool', 'non-stackable', 'sellable', 'equipment']
  },
  [ItemType.PICKAXE]: {
    id: ItemType.PICKAXE,
    name: 'Pickaxe',
    type: ItemType.PICKAXE,
    category: ItemCategory.TOOL,
    rarity: ItemRarity.COMMON,
    stackable: false,
    maxStack: 1,
    value: 35,
    icon: '⛏️',
    color: '#607d8b',
    description: 'A pickaxe for mining stone and ore.',
    weight: 3.0,
    durability: 100,
    tags: ['tool', 'non-stackable', 'sellable', 'equipment']
  },
  [ItemType.FISHING_ROD]: {
    id: ItemType.FISHING_ROD,
    name: 'Fishing Rod',
    type: ItemType.FISHING_ROD,
    category: ItemCategory.TOOL,
    rarity: ItemRarity.UNCOMMON,
    stackable: false,
    maxStack: 1,
    value: 40,
    icon: '🎣',
    color: '#03a9f4',
    description: 'A fishing rod for catching fish.',
    weight: 1.5,
    durability: 100,
    tags: ['tool', 'non-stackable', 'sellable', 'equipment']
  },
  [ItemType.SICKLE]: {
    id: ItemType.SICKLE,
    name: 'Sickle',
    type: ItemType.SICKLE,
    category: ItemCategory.TOOL,
    rarity: ItemRarity.COMMON,
    stackable: false,
    maxStack: 1,
    value: 25,
    icon: '🔪',
    color: '#8bc34a',
    description: 'A sickle for harvesting crops.',
    weight: 1.2,
    durability: 100,
    tags: ['tool', 'non-stackable', 'sellable', 'equipment']
  },

  // Seeds - stackable
  [ItemType.WHEAT_SEED]: {
    id: ItemType.WHEAT_SEED,
    name: 'Wheat Seed',
    type: ItemType.WHEAT_SEED,
    category: ItemCategory.SEED,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 50,
    value: 2,
    icon: '🌾',
    color: '#ffeb3b',
    description: 'Wheat seeds for farming.',
    weight: 0.02,
    tags: ['seed', 'farmable', 'sellable', 'plantable']
  },
  [ItemType.CARROT_SEED]: {
    id: ItemType.CARROT_SEED,
    name: 'Carrot Seed',
    type: ItemType.CARROT_SEED,
    category: ItemCategory.SEED,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 50,
    value: 3,
    icon: '🥕',
    color: '#ff9800',
    description: 'Carrot seeds for farming.',
    weight: 0.02,
    tags: ['seed', 'farmable', 'sellable', 'plantable']
  },

  // Potions - stackable
  [ItemType.HEALTH_POTION]: {
    id: ItemType.HEALTH_POTION,
    name: 'Health Potion',
    type: ItemType.HEALTH_POTION,
    category: ItemCategory.POTION,
    rarity: ItemRarity.UNCOMMON,
    stackable: true,
    maxStack: 10,
    value: 25,
    icon: '🧪',
    color: '#e91e63',
    description: 'Restores health.',
    weight: 0.3,
    effects: { health: 50 },
    tags: ['potion', 'consumable', 'sellable', 'craftable']
  },
  [ItemType.STAMINA_POTION]: {
    id: ItemType.STAMINA_POTION,
    name: 'Stamina Potion',
    type: ItemType.STAMINA_POTION,
    category: ItemCategory.POTION,
    rarity: ItemRarity.UNCOMMON,
    stackable: true,
    maxStack: 10,
    value: 20,
    icon: '⚗️',
    color: '#00bcd4',
    description: 'Restores stamina.',
    weight: 0.3,
    effects: { stamina: 50 },
    tags: ['potion', 'consumable', 'sellable', 'craftable']
  },

  // Treasure - stackable
  [ItemType.COIN]: {
    id: ItemType.COIN,
    name: 'Coin',
    type: ItemType.COIN,
    category: ItemCategory.TREASURE,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 999,
    value: 1,
    icon: '🪙',
    color: '#ffc107',
    description: 'Currency.',
    weight: 0.01,
    tags: ['currency', 'treasure', 'sellable']
  },
  [ItemType.GEM]: {
    id: ItemType.GEM,
    name: 'Gem',
    type: ItemType.GEM,
    category: ItemCategory.TREASURE,
    rarity: ItemRarity.RARE,
    stackable: true,
    maxStack: 20,
    value: 100,
    icon: '💎',
    color: '#00bcd4',
    description: 'A precious gem.',
    weight: 0.1,
    tags: ['treasure', 'valuable', 'sellable']
  },

  // Quest
  [ItemType.LETTER]: {
    id: ItemType.LETTER,
    name: 'Letter',
    type: ItemType.LETTER,
    category: ItemCategory.QUEST,
    rarity: ItemRarity.COMMON,
    stackable: false,
    maxStack: 1,
    value: 0,
    icon: '✉️',
    color: '#fff9c4',
    description: 'A letter for a quest.',
    weight: 0.05,
    tags: ['quest', 'non-stackable', 'important']
  },
  [ItemType.KEY]: {
    id: ItemType.KEY,
    name: 'Key',
    type: ItemType.KEY,
    category: ItemCategory.QUEST,
    rarity: ItemRarity.UNCOMMON,
    stackable: false,
    maxStack: 1,
    value: 0,
    icon: '🔑',
    color: '#ffd54f',
    description: 'A key for a locked area.',
    weight: 0.1,
    tags: ['quest', 'non-stackable', 'important']
  },

  // Misc
  [ItemType.FLOWER]: {
    id: ItemType.FLOWER,
    name: 'Flower',
    type: ItemType.FLOWER,
    category: ItemCategory.MISC,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 20,
    value: 4,
    icon: '🌸',
    color: '#e91e63',
    description: 'A pretty flower. Good as gift.',
    weight: 0.05,
    tags: ['gift', 'sellable', 'gatherable', 'misc']
  },
  [ItemType.FEATHER]: {
    id: ItemType.FEATHER,
    name: 'Feather',
    type: ItemType.FEATHER,
    category: ItemCategory.MISC,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 30,
    value: 2,
    icon: '🪶',
    color: '#fff',
    description: 'A light feather.',
    weight: 0.01,
    tags: ['material', 'sellable', 'gatherable', 'misc']
  }
};

export class ItemDatabase {
  private static instance: ItemDatabase | null = null;
  private items: Map<string, ItemDefinition> = new Map();

  constructor() {
    this.loadDatabase(ITEM_DATABASE);
    console.log(`[ItemDatabase] Loaded ${this.items.size} items`);
  }

  static getInstance(): ItemDatabase {
    if (!ItemDatabase.instance) {
      ItemDatabase.instance = new ItemDatabase();
    }
    return ItemDatabase.instance;
  }

  static resetInstance(): void {
    ItemDatabase.instance = null;
  }

  private loadDatabase(data: Record<string, ItemDefinition>): void {
    this.items.clear();
    for (const [id, def] of Object.entries(data)) {
      this.items.set(id, def);
      this.items.set(def.id, def); // also by id
    }
  }

  getItem(id: string): ItemDefinition | undefined {
    return this.items.get(id);
  }

  hasItem(id: string): boolean {
    return this.items.has(id);
  }

  getAllItems(): ItemDefinition[] {
    // Deduplicate by id
    const unique = new Map<string, ItemDefinition>();
    for (const item of this.items.values()) {
      unique.set(item.id, item);
    }
    return Array.from(unique.values());
  }

  getItemsByCategory(category: string): ItemDefinition[] {
    return this.getAllItems().filter(item => item.category === category);
  }

  getItemsByType(type: string): ItemDefinition[] {
    return this.getAllItems().filter(item => item.type === type);
  }

  getItemsByTag(tag: string): ItemDefinition[] {
    return this.getAllItems().filter(item => item.tags?.includes(tag));
  }

  getStackableItems(): ItemDefinition[] {
    return this.getAllItems().filter(item => item.stackable);
  }

  getNonStackableItems(): ItemDefinition[] {
    return this.getAllItems().filter(item => !item.stackable);
  }

  search(query: string): ItemDefinition[] {
    const lower = query.toLowerCase();
    return this.getAllItems().filter(item =>
      item.id.toLowerCase().includes(lower) ||
      item.name.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower)
    );
  }

  getCount(): number {
    const unique = new Set<string>();
    for (const item of this.items.values()) {
      unique.add(item.id);
    }
    return unique.size;
  }

  getCategories(): string[] {
    const cats = new Set<string>();
    for (const item of this.getAllItems()) {
      cats.add(item.category);
    }
    return Array.from(cats);
  }

  // Validation
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const item of this.getAllItems()) {
      if (!item.id) errors.push(`Item missing id: ${JSON.stringify(item)}`);
      if (!item.name) errors.push(`Item ${item.id} missing name`);
      if (item.maxStack <= 0) errors.push(`Item ${item.id} invalid maxStack ${item.maxStack}`);
      if (item.value < 0) errors.push(`Item ${item.id} negative value`);
      if (!item.stackable && item.maxStack !== 1) {
        // Non-stackable should have maxStack 1, but we allow warning not error
        // errors.push(`Non-stackable ${item.id} should have maxStack 1`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  // For data-driven extensibility - register new items at runtime
  registerItem(def: ItemDefinition): boolean {
    if (!def.id || !def.name) {
      console.warn(`[ItemDatabase] Invalid item definition: ${JSON.stringify(def)}`);
      return false;
    }
    this.items.set(def.id, def);
    console.log(`[ItemDatabase] Registered item ${def.id} - ${def.name}`);
    return true;
  }

  unregisterItem(id: string): boolean {
    return this.items.delete(id);
  }

  // Export for save or external use
  exportDatabase(): Record<string, ItemDefinition> {
    const result: Record<string, ItemDefinition> = {};
    for (const item of this.getAllItems()) {
      result[item.id] = item;
    }
    return result;
  }
}
