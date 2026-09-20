/**
 * Item - Phase 14 Inventory System
 * Data-driven item definitions, categories, types
 */

export enum ItemCategory {
  FOOD = 'FOOD',
  MATERIAL = 'MATERIAL',
  TOOL = 'TOOL',
  SEED = 'SEED',
  POTION = 'POTION',
  TREASURE = 'TREASURE',
  QUEST = 'QUEST',
  MISC = 'MISC'
}

export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export enum ItemType {
  // Food
  APPLE = 'apple',
  BREAD = 'bread',
  FISH = 'fish',
  BERRY = 'berry',
  MUSHROOM = 'mushroom',
  HERB = 'herb',
  WHEAT = 'wheat',
  CARROT = 'carrot',

  // Materials
  WOOD = 'wood',
  STONE = 'stone',
  ORE = 'ore',
  FIBER = 'fiber',
  CLAY = 'clay',

  // Tools (non-stackable)
  AXE = 'axe',
  PICKAXE = 'pickaxe',
  FISHING_ROD = 'fishing_rod',
  SICKLE = 'sickle',

  // Seeds
  WHEAT_SEED = 'wheat_seed',
  CARROT_SEED = 'carrot_seed',

  // Potions
  HEALTH_POTION = 'health_potion',
  STAMINA_POTION = 'stamina_potion',

  // Treasure
  COIN = 'coin',
  GEM = 'gem',

  // Quest
  LETTER = 'letter',
  KEY = 'key',

  // Animal products & feed (Phase 16.1)
  EGG = 'egg',
  MILK = 'milk',
  WOOL = 'wool',
  HAY = 'hay',
  ANIMAL_FEED = 'animal_feed',
  TRUFFLE = 'truffle',

  // Cooked foods (Phase 16.3)
  FRIED_EGG = 'fried_egg',
  OMELETTE = 'omelette',
  CHEESE = 'cheese',
  CAKE = 'cake',
  SOUP = 'soup',
  STEW = 'stew',
  PANCAKE = 'pancake',
  SALAD = 'salad',

  // Misc
  FLOWER = 'flower',
  FEATHER = 'feather'
}

export interface ItemDefinition {
  id: string; // unique id, matches ItemType or custom
  name: string;
  type: ItemType | string;
  category: ItemCategory;
  rarity: ItemRarity;
  stackable: boolean;
  maxStack: number; // max per slot
  value: number; // base price
  icon: string; // emoji or icon char
  color: string; // display color
  description: string;
  weight?: number; // future: weight system
  durability?: number; // future: for tools
  effects?: {
    health?: number;
    stamina?: number;
    hunger?: number;
    energy?: number;
  };
  tags?: string[]; // e.g. ["edible", "craftable", "sellable"]
}

export interface InventorySlot {
  id: string; // item id
  quantity: number;
  definition?: ItemDefinition; // cached for quick access, not saved
  metadata?: Record<string, any>; // future: durability, enchant, etc.
}

export interface InventorySaveData {
  slots: (InventorySlot | null)[]; // fixed size array, null = empty, each slot may have id or itemId alias
  capacity: number;
  version: number;
  totalValue?: number;
}

export function createEmptySlot(): null {
  return null;
}

export function isSlotEmpty(slot: InventorySlot | null): boolean {
  return slot === null || slot.quantity <= 0;
}

export function canStack(slot: InventorySlot, itemId: string, maxStack: number): boolean {
  return slot.id === itemId && slot.quantity < maxStack;
}
