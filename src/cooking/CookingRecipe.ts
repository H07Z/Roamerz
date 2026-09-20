/**
 * CookingRecipe - Phase 16.3 Cooking System
 * Data-driven cooking definitions
 */

export enum CookingCategory {
  BREAKFAST = 'BREAKFAST',
  MEAL = 'MEAL',
  SOUP = 'SOUP',
  DESSERT = 'DESSERT',
  DAIRY = 'DAIRY',
  MISC = 'MISC'
}

export interface CookingIngredient {
  itemId: string;
  quantity: number;
}

export interface CookingRecipeDefinition {
  id: string; // e.g. cook_fried_egg
  name: string;
  resultItemId: string;
  resultQuantity: number;
  ingredients: CookingIngredient[];
  category: CookingCategory;
  requiredStation?: string; // e.g. campfire, stove, kitchen - optional for now
  cookingTimeSeconds?: number; // cooking time, not enforced yet but for display
  description: string;
  icon: string;
  unlockedByDefault: boolean;
  tags?: string[];
  effects?: string; // description of effects
}

export interface CookingSaveData {
  recipesUnlocked: string[];
  totalCooked: number;
  cookedCounts: Record<string, number>;
  version: number;
}

export function createDefaultCookingSaveData(): CookingSaveData {
  return {
    recipesUnlocked: [],
    totalCooked: 0,
    cookedCounts: {},
    version: 1
  };
}
