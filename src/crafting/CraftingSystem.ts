/**
 * CraftingSystem - Phase 16.2 Crafting System
 * Manages crafting recipes, inventory checks, crafting execution
 */

import { RecipeDatabase } from './RecipeDatabase';
import { RecipeDefinition, CraftingSaveData, createDefaultCraftingSaveData } from './Recipe';
import { Inventory } from '../inventory/Inventory';

export class CraftingSystem {
  private database: RecipeDatabase;
  private recipesUnlocked: Set<string> = new Set();
  private totalCrafted: number = 0;
  private craftedCounts: Map<string, number> = new Map();
  private version: number = 1;

  constructor(database?: RecipeDatabase) {
    this.database = database ?? RecipeDatabase.getInstance();
    // Unlock default recipes
    for (const recipe of this.database.getAllRecipes()) {
      if (recipe.unlockedByDefault) {
        this.recipesUnlocked.add(recipe.id);
      }
    }
  }

  initialize(): void {
    console.log(`[CraftingSystem] Initialized with ${this.database.getCount()} recipes, ${this.recipesUnlocked.size} unlocked: ${this.database.getDebugString()}`);
  }

  getDatabase(): RecipeDatabase {
    return this.database;
  }

  getUnlockedRecipeIds(): string[] {
    return Array.from(this.recipesUnlocked);
  }

  getUnlockedRecipes(): RecipeDefinition[] {
    return this.database.getUnlockedRecipes(this.getUnlockedRecipeIds());
  }

  isUnlocked(recipeId: string): boolean {
    return this.recipesUnlocked.has(recipeId);
  }

  unlockRecipe(recipeId: string): boolean {
    if (!this.database.hasRecipe(recipeId)) {
      console.warn(`[CraftingSystem] Cannot unlock unknown recipe ${recipeId}`);
      return false;
    }
    if (this.recipesUnlocked.has(recipeId)) return false;
    this.recipesUnlocked.add(recipeId);
    console.log(`[CraftingSystem] Unlocked recipe ${recipeId}`);
    return true;
  }

  // Check if can craft given inventory
  canCraft(recipeId: string, inventory: Inventory): { can: boolean; reason?: string; missing?: { itemId: string; need: number; have: number }[] } {
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

    // Space check: rely on Inventory.hasSpace which accounts for stacking
    // Note: ingredients will be removed before result added, so free slots may appear.
    // For simplicity, we only block if inventory is full AND result is new non-stackable without freeing space.
    // If hasSpace returns false, check if any ingredient will free a slot entirely
    if (!inventory.hasSpace(recipe.resultItemId, recipe.resultQuantity)) {
      // Check if consuming ingredients will free at least one slot
      let willFreeSlot = false;
      for (const ing of recipe.ingredients) {
        const haveQty = inventory.getItemQuantity(ing.itemId);
        // If we consume exactly all of an item type, a slot will free (for non-stackable or last stack)
        // Simplified: if haveQty === need, it will free at least one slot
        if (haveQty === ing.quantity) {
          willFreeSlot = true;
          break;
        }
        // For stackable, if quantity in a single slot equals need, slot frees
        // We approximate by checking if haveQty <= need and haveQty>0
        if (haveQty <= ing.quantity) {
          willFreeSlot = true;
          break;
        }
      }
      if (!willFreeSlot) {
        // Still might be able to stack result if already have it
        const existingResultQty = inventory.getItemQuantity(recipe.resultItemId);
        if (existingResultQty === 0) {
          return { can: false, reason: `Inventory full` };
        }
        // If existing result but hasSpace failed, it means no stack space left
        return { can: false, reason: `Inventory full, no space for result` };
      }
    }

    return { can: true };
  }

  // Craft recipe - consumes ingredients, adds result
  craft(recipeId: string, inventory: Inventory): { success: boolean; reason?: string; resultItemId?: string; resultQuantity?: number } {
    const canResult = this.canCraft(recipeId, inventory);
    if (!canResult.can) {
      return { success: false, reason: canResult.reason };
    }

    const recipe = this.database.getRecipe(recipeId)!;

    // Consume ingredients
    for (const ing of recipe.ingredients) {
      const removed = inventory.removeItem(ing.itemId, ing.quantity);
      if (!removed) {
        console.error(`[CraftingSystem] Failed to remove ingredient ${ing.itemId} x${ing.quantity} for ${recipeId}`);
        return { success: false, reason: `Failed to consume ${ing.itemId}` };
      }
    }

    // Add result
    const added = inventory.addItem(recipe.resultItemId, recipe.resultQuantity);
    if (!added) {
      // Rollback ingredients if failed to add result (inventory full after removal? should not happen)
      console.warn(`[CraftingSystem] Failed to add result ${recipe.resultItemId} x${recipe.resultQuantity}, rolling back ingredients`);
      for (const ing of recipe.ingredients) {
        inventory.addItem(ing.itemId, ing.quantity);
      }
      return { success: false, reason: `Failed to add result, inventory full?` };
    }

    this.totalCrafted++;
    const count = this.craftedCounts.get(recipeId) ?? 0;
    this.craftedCounts.set(recipeId, count + 1);

    console.log(`[CraftingSystem] Crafted ${recipe.resultQuantity}x ${recipe.resultItemId} via ${recipeId} (${recipe.name}) total ${this.totalCrafted}`);

    return { success: true, resultItemId: recipe.resultItemId, resultQuantity: recipe.resultQuantity };
  }

  // Get craftable recipes for given inventory
  getCraftableRecipes(inventory: Inventory): RecipeDefinition[] {
    const craftable: RecipeDefinition[] = [];
    for (const recipe of this.getUnlockedRecipes()) {
      const can = this.canCraft(recipe.id, inventory);
      if (can.can) craftable.push(recipe);
    }
    return craftable;
  }

  getTotalCrafted(): number {
    return this.totalCrafted;
  }

  getCraftedCount(recipeId: string): number {
    return this.craftedCounts.get(recipeId) ?? 0;
  }

  // Save/Load
  getSaveData(): CraftingSaveData {
    const craftedCounts: Record<string, number> = {};
    for (const [id, count] of this.craftedCounts.entries()) {
      craftedCounts[id] = count;
    }
    return {
      recipesUnlocked: Array.from(this.recipesUnlocked),
      totalCrafted: this.totalCrafted,
      craftedCounts,
      version: this.version
    };
  }

  loadSaveData(data: CraftingSaveData | any): void {
    if (!data) return;
    try {
      this.recipesUnlocked.clear();
      const unlocked = data.recipesUnlocked ?? [];
      for (const id of unlocked) {
        this.recipesUnlocked.add(id);
      }
      // Ensure default unlocked are present
      for (const recipe of this.database.getAllRecipes()) {
        if (recipe.unlockedByDefault) {
          this.recipesUnlocked.add(recipe.id);
        }
      }
      this.totalCrafted = typeof data.totalCrafted === 'number' ? data.totalCrafted : 0;
      this.craftedCounts.clear();
      const counts = data.craftedCounts ?? {};
      for (const id of Object.keys(counts)) {
        this.craftedCounts.set(id, counts[id]);
      }
      this.version = typeof data.version === 'number' ? data.version : 1;
      console.log(`[CraftingSystem] Loaded ${this.recipesUnlocked.size} unlocked, totalCrafted ${this.totalCrafted}`);
    } catch (e) {
      console.error('[CraftingSystem] Failed to load save data:', e);
    }
  }

  clear(): void {
    this.recipesUnlocked.clear();
    for (const recipe of this.database.getAllRecipes()) {
      if (recipe.unlockedByDefault) {
        this.recipesUnlocked.add(recipe.id);
      }
    }
    this.totalCrafted = 0;
    this.craftedCounts.clear();
    console.log('[CraftingSystem] Cleared');
  }

  // Debug
  getDebugString(): string {
    return `${this.database.getCount()} recipes, ${this.recipesUnlocked.size} unlocked, crafted ${this.totalCrafted} total`;
  }

  debugPrint(): void {
    console.log(`[CraftingSystem] ${this.getDebugString()}`);
    for (const recipe of this.getUnlockedRecipes()) {
      const count = this.getCraftedCount(recipe.id);
      console.log(`  ${recipe.icon} ${recipe.id} ${recipe.name} → ${recipe.resultQuantity}x ${recipe.resultItemId} [${recipe.ingredients.map(i => `${i.quantity}x ${i.itemId}`).join(', ')}] crafted ${count}x`);
    }
  }
}
