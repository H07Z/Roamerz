/**
 * Recipe - Phase 16.2 Crafting System
 * Data-driven recipe definitions
 */

export enum RecipeCategory {
  TOOL = 'TOOL',
  FOOD = 'FOOD',
  MATERIAL = 'MATERIAL',
  FEED = 'FEED',
  POTION = 'POTION',
  MISC = 'MISC'
}

export interface RecipeIngredient {
  itemId: string;
  quantity: number;
}

export interface RecipeDefinition {
  id: string; // e.g. craft_axe
  name: string;
  resultItemId: string;
  resultQuantity: number;
  ingredients: RecipeIngredient[];
  category: RecipeCategory;
  requiredStation?: string; // e.g. workbench, furnace, kitchen - optional for now
  requiredTool?: string; // e.g. hammer - optional
  timeSeconds?: number; // crafting time, not enforced yet
  description: string;
  icon: string;
  value?: number; // optional override result value?
  unlockedByDefault: boolean;
  tags?: string[];
}

export interface CraftingSaveData {
  recipesUnlocked: string[]; // recipe ids unlocked
  totalCrafted: number;
  craftedCounts: Record<string, number>; // recipeId -> count
  version: number;
}

export function createDefaultCraftingSaveData(): CraftingSaveData {
  return {
    recipesUnlocked: [],
    totalCrafted: 0,
    craftedCounts: {},
    version: 1
  };
}
