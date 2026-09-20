/**
 * CookingSystem - Phase 16.3 Cooking System
 * Manages cooking recipes, inventory checks, cooking execution
 */

import { CookingDatabase } from './CookingDatabase';
import { CookingRecipeDefinition, CookingSaveData } from './CookingRecipe';
import { Inventory } from '../inventory/Inventory';

export class CookingSystem {
  private database: CookingDatabase;
  private recipesUnlocked: Set<string> = new Set();
  private totalCooked: number = 0;
  private cookedCounts: Map<string, number> = new Map();
  private version: number = 1;

  constructor(database?: CookingDatabase) {
    this.database = database ?? CookingDatabase.getInstance();
    for (const recipe of this.database.getAllRecipes()) {
      if (recipe.unlockedByDefault) {
        this.recipesUnlocked.add(recipe.id);
      }
    }
  }

  initialize(): void {
    console.log(`[CookingSystem] Initialized with ${this.database.getCount()} recipes, ${this.recipesUnlocked.size} unlocked: ${this.database.getDebugString()}`);
  }

  getDatabase(): CookingDatabase {
    return this.database;
  }

  getUnlockedRecipeIds(): string[] {
    return Array.from(this.recipesUnlocked);
  }

  getUnlockedRecipes(): CookingRecipeDefinition[] {
    return this.database.getUnlockedRecipes(this.getUnlockedRecipeIds());
  }

  isUnlocked(recipeId: string): boolean {
    return this.recipesUnlocked.has(recipeId);
  }

  unlockRecipe(recipeId: string): boolean {
    if (!this.database.hasRecipe(recipeId)) {
      console.warn(`[CookingSystem] Cannot unlock unknown recipe ${recipeId}`);
      return false;
    }
    if (this.recipesUnlocked.has(recipeId)) return false;
    this.recipesUnlocked.add(recipeId);
    console.log(`[CookingSystem] Unlocked recipe ${recipeId}`);
    return true;
  }

  canCook(recipeId: string, inventory: Inventory): { can: boolean; reason?: string; missing?: { itemId: string; need: number; have: number }[] } {
    const recipe = this.database.getRecipe(recipeId);
    if (!recipe) {
      return { can: false, reason: `Recipe ${recipeId} not found` };
    }
    if (!this.isUnlocked(recipeId)) {
      return { can: false, reason: `Recipe ${recipeId} not unlocked` };
    }

    const missing: { itemId: string; need: number; have: number }[] = [];
    for (const ing of recipe.ingredients) {
      const have = inventory.getItemQuantity(ing.itemId);
      if (have < ing.quantity) {
        missing.push({ itemId: ing.itemId, need: ing.quantity, have });
      }
    }

    if (missing.length > 0) {
      return { can: false, reason: `Missing ingredients`, missing };
    }

    // Space check similar to crafting
    if (!inventory.hasSpace(recipe.resultItemId, recipe.resultQuantity)) {
      let willFreeSlot = false;
      for (const ing of recipe.ingredients) {
        const haveQty = inventory.getItemQuantity(ing.itemId);
        if (haveQty === ing.quantity || haveQty <= ing.quantity) {
          willFreeSlot = true;
          break;
        }
      }
      if (!willFreeSlot) {
        const existingResultQty = inventory.getItemQuantity(recipe.resultItemId);
        if (existingResultQty === 0) {
          return { can: false, reason: `Inventory full` };
        }
        return { can: false, reason: `Inventory full, no space for result` };
      }
    }

    return { can: true };
  }

  cook(recipeId: string, inventory: Inventory): { success: boolean; reason?: string; resultItemId?: string; resultQuantity?: number } {
    const canResult = this.canCook(recipeId, inventory);
    if (!canResult.can) {
      return { success: false, reason: canResult.reason };
    }

    const recipe = this.database.getRecipe(recipeId)!;

    for (const ing of recipe.ingredients) {
      const removed = inventory.removeItem(ing.itemId, ing.quantity);
      if (!removed) {
        console.error(`[CookingSystem] Failed to remove ingredient ${ing.itemId} x${ing.quantity} for ${recipeId}`);
        return { success: false, reason: `Failed to consume ${ing.itemId}` };
      }
    }

    const added = inventory.addItem(recipe.resultItemId, recipe.resultQuantity);
    if (!added) {
      console.warn(`[CookingSystem] Failed to add result ${recipe.resultItemId} x${recipe.resultQuantity}, rolling back`);
      for (const ing of recipe.ingredients) {
        inventory.addItem(ing.itemId, ing.quantity);
      }
      return { success: false, reason: `Failed to add result, inventory full?` };
    }

    this.totalCooked++;
    const count = this.cookedCounts.get(recipeId) ?? 0;
    this.cookedCounts.set(recipeId, count + 1);

    console.log(`[CookingSystem] Cooked ${recipe.resultQuantity}x ${recipe.resultItemId} via ${recipeId} (${recipe.name}) total ${this.totalCooked}`);

    return { success: true, resultItemId: recipe.resultItemId, resultQuantity: recipe.resultQuantity };
  }

  getCookableRecipes(inventory: Inventory): CookingRecipeDefinition[] {
    const cookable: CookingRecipeDefinition[] = [];
    for (const recipe of this.getUnlockedRecipes()) {
      const can = this.canCook(recipe.id, inventory);
      if (can.can) cookable.push(recipe);
    }
    return cookable;
  }

  getTotalCooked(): number {
    return this.totalCooked;
  }

  getCookedCount(recipeId: string): number {
    return this.cookedCounts.get(recipeId) ?? 0;
  }

  getSaveData(): CookingSaveData {
    const cookedCounts: Record<string, number> = {};
    for (const [id, count] of this.cookedCounts.entries()) {
      cookedCounts[id] = count;
    }
    return {
      recipesUnlocked: Array.from(this.recipesUnlocked),
      totalCooked: this.totalCooked,
      cookedCounts,
      version: this.version
    };
  }

  loadSaveData(data: CookingSaveData | any): void {
    if (!data) return;
    try {
      this.recipesUnlocked.clear();
      const unlocked = data.recipesUnlocked ?? [];
      for (const id of unlocked) {
        this.recipesUnlocked.add(id);
      }
      for (const recipe of this.database.getAllRecipes()) {
        if (recipe.unlockedByDefault) {
          this.recipesUnlocked.add(recipe.id);
        }
      }
      this.totalCooked = typeof data.totalCooked === 'number' ? data.totalCooked : 0;
      this.cookedCounts.clear();
      const counts = data.cookedCounts ?? {};
      for (const id of Object.keys(counts)) {
        this.cookedCounts.set(id, counts[id]);
      }
      this.version = typeof data.version === 'number' ? data.version : 1;
      console.log(`[CookingSystem] Loaded ${this.recipesUnlocked.size} unlocked, totalCooked ${this.totalCooked}`);
    } catch (e) {
      console.error('[CookingSystem] Failed to load save data:', e);
    }
  }

  clear(): void {
    this.recipesUnlocked.clear();
    for (const recipe of this.database.getAllRecipes()) {
      if (recipe.unlockedByDefault) {
        this.recipesUnlocked.add(recipe.id);
      }
    }
    this.totalCooked = 0;
    this.cookedCounts.clear();
    console.log('[CookingSystem] Cleared');
  }

  getDebugString(): string {
    return `${this.database.getCount()} recipes, ${this.recipesUnlocked.size} unlocked, cooked ${this.totalCooked} total`;
  }

  debugPrint(): void {
    console.log(`[CookingSystem] ${this.getDebugString()}`);
    for (const recipe of this.getUnlockedRecipes()) {
      const count = this.getCookedCount(recipe.id);
      console.log(`  ${recipe.icon} ${recipe.id} ${recipe.name} → ${recipe.resultQuantity}x ${recipe.resultItemId} [${recipe.ingredients.map(i => `${i.quantity}x ${i.itemId}`).join(', ')}] cooked ${count}x`);
    }
  }
}
