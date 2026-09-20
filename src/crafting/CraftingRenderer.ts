/**
 * CraftingRenderer - Phase 16.2 Crafting System
 * Renders crafting UI overlay with recipes, ingredients, craftable status
 */

import { CraftingSystem } from './CraftingSystem';
import { RecipeDatabase } from './RecipeDatabase';
import { RecipeDefinition, RecipeCategory } from './Recipe';
import { Inventory } from '../inventory/Inventory';
import { ItemDatabase } from '../inventory/ItemDatabase';

export class CraftingRenderer {
  private showCrafting: boolean = false;
  private selectedIndex: number = 0;
  private filterCategory: RecipeCategory | null = null;
  private showOnlyCraftable: boolean = false;
  private itemDatabase: ItemDatabase;
  private recipeDatabase: RecipeDatabase;

  constructor(itemDatabase?: ItemDatabase, recipeDatabase?: RecipeDatabase) {
    this.itemDatabase = itemDatabase ?? ItemDatabase.getInstance();
    this.recipeDatabase = recipeDatabase ?? RecipeDatabase.getInstance();
  }

  setShowCrafting(show: boolean): void {
    this.showCrafting = show;
  }

  isShowing(): boolean {
    return this.showCrafting;
  }

  toggle(): void {
    this.showCrafting = !this.showCrafting;
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  setSelectedIndex(idx: number): void {
    this.selectedIndex = Math.max(0, idx);
  }

  navigate(dir: 'up' | 'down' | 'left' | 'right', totalRecipes: number): void {
    const cols = 1; // list view
    switch (dir) {
      case 'up':
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        break;
      case 'down':
        this.selectedIndex = Math.min(totalRecipes - 1, this.selectedIndex + 1);
        break;
      case 'left':
      case 'right':
        // No horizontal nav for now
        break;
    }
  }

  getFilterCategory(): RecipeCategory | null {
    return this.filterCategory;
  }

  setFilterCategory(cat: RecipeCategory | null): void {
    this.filterCategory = cat;
    this.selectedIndex = 0;
  }

  getShowOnlyCraftable(): boolean {
    return this.showOnlyCraftable;
  }

  setShowOnlyCraftable(show: boolean): void {
    this.showOnlyCraftable = show;
    this.selectedIndex = 0;
  }

  toggleCraftableFilter(): void {
    this.showOnlyCraftable = !this.showOnlyCraftable;
    this.selectedIndex = 0;
  }

  private getFilteredRecipes(craftingSystem: CraftingSystem, inventory?: Inventory): RecipeDefinition[] {
    let recipes = craftingSystem.getUnlockedRecipes();

    if (this.filterCategory) {
      recipes = recipes.filter(r => r.category === this.filterCategory);
    }

    if (this.showOnlyCraftable && inventory) {
      recipes = recipes.filter(r => {
        const can = craftingSystem.canCraft(r.id, inventory);
        return can.can;
      });
    }

    // Sort by category then name
    recipes.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    return recipes;
  }

  render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, craftingSystem: CraftingSystem, inventory: Inventory): void {
    // Game.ts is source of truth for visibility, keep internal flag for quick hint but don't gate main render
    // if (!this.showCrafting) return;

    const filteredRecipes = this.getFilteredRecipes(craftingSystem, inventory);
    if (this.selectedIndex >= filteredRecipes.length) {
      this.selectedIndex = Math.max(0, filteredRecipes.length - 1);
    }
    const selectedRecipe = filteredRecipes.length > 0 ? filteredRecipes[this.selectedIndex] : null;

    ctx.save();

    const boxW = 640;
    const boxH = 500;
    const boxX = screenWidth / 2 - boxW / 2;
    const boxY = screenHeight / 2 - boxH / 2;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🔨 CRAFTING', screenWidth / 2, boxY + 15);

    // Stats
    const craftableCount = craftingSystem.getCraftableRecipes(inventory).length;
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Recipes: ${filteredRecipes.length}/${craftingSystem.getUnlockedRecipes().length} | Craftable: ${craftableCount} | Total Crafted: ${craftingSystem.getTotalCrafted()} | Filter: ${this.filterCategory ?? 'ALL'} (C) CraftableOnly:${this.showOnlyCraftable ? 'ON' : 'OFF'}(Shift+C)`,
      screenWidth / 2,
      boxY + 35
    );

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.fillText('Shift+C / ESC close, W/S navigate, Enter craft, C filter category, Shift+C toggle craftable only', screenWidth / 2, boxY + 50);

    // Left panel - recipe list
    const listX = boxX + 20;
    const listY = boxY + 70;
    const listW = 240;
    const listH = 350;
    const rowH = 36;

    ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.5)';
    ctx.strokeRect(listX, listY, listW, listH);

    // Clip for list
    ctx.save();
    ctx.beginPath();
    ctx.rect(listX, listY, listW, listH);
    ctx.clip();

    const visibleRows = Math.floor(listH / rowH);
    const scrollOffset = Math.max(0, this.selectedIndex - visibleRows + 2);
    if (this.selectedIndex < scrollOffset) {
      // adjust
    }

    for (let i = 0; i < filteredRecipes.length; i++) {
      const recipe = filteredRecipes[i];
      const y = listY + (i - scrollOffset) * rowH;

      if (y + rowH < listY || y > listY + listH) continue;

      const isSelected = i === this.selectedIndex;
      const canResult = craftingSystem.canCraft(recipe.id, inventory);
      const canCraft = canResult.can;

      // Row bg
      if (isSelected) {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.fillRect(listX, y, listW, rowH);
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX, y, listW, rowH);
      } else {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(50, 50, 50, 0.5)' : 'rgba(40, 40, 40, 0.5)';
        ctx.fillRect(listX, y, listW, rowH);
      }

      // Category color dot
      let catColor = '#888';
      switch (recipe.category) {
        case RecipeCategory.TOOL: catColor = '#ff8'; break;
        case RecipeCategory.FOOD: catColor = '#8f8'; break;
        case RecipeCategory.MATERIAL: catColor = '#aaa'; break;
        case RecipeCategory.FEED: catColor = '#fa8'; break;
        case RecipeCategory.POTION: catColor = '#f8f'; break;
        case RecipeCategory.MISC: catColor = '#8ff'; break;
      }
      ctx.fillStyle = catColor;
      ctx.beginPath();
      ctx.arc(listX + 12, y + rowH / 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Icon
      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(recipe.icon, listX + 22, y + rowH / 2);

      // Name
      ctx.fillStyle = canCraft ? '#fff' : '#666';
      ctx.font = isSelected ? 'bold 10px monospace' : '10px monospace';
      ctx.fillText(recipe.name.substring(0, 18), listX + 44, y + 12);

      // Result
      const resultDef = this.itemDatabase.getItem(recipe.resultItemId);
      const resultIcon = resultDef?.icon ?? '❓';
      ctx.fillStyle = canCraft ? '#8f8' : '#555';
      ctx.font = '9px monospace';
      ctx.fillText(`${resultIcon} ${recipe.resultQuantity}x ${resultDef?.name ?? recipe.resultItemId}`, listX + 44, y + 24);

      // Craftable indicator
      if (canCraft) {
        ctx.fillStyle = '#0f0';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('✓', listX + listW - 8, y + 12);
        ctx.textAlign = 'left';
      } else {
        ctx.fillStyle = '#600';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('✗', listX + listW - 8, y + 12);
        ctx.textAlign = 'left';
      }
    }

    ctx.restore();

    // Right panel - selected recipe details
    const detailX = listX + listW + 20;
    const detailY = listY;
    const detailW = boxW - listW - 60;
    const detailH = 350;

    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    ctx.fillRect(detailX, detailY, detailW, detailH);
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.strokeRect(detailX, detailY, detailW, detailH);

    if (selectedRecipe) {
      const canResult = craftingSystem.canCraft(selectedRecipe.id, inventory);
      const resultDef = this.itemDatabase.getItem(selectedRecipe.resultItemId);

      // Header
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${selectedRecipe.icon} ${selectedRecipe.name}`, detailX + 10, detailY + 10);

      ctx.fillStyle = '#aaa';
      ctx.font = '9px monospace';
      ctx.fillText(`Category: ${selectedRecipe.category} | ID: ${selectedRecipe.id}`, detailX + 10, detailY + 28);

      ctx.fillStyle = '#ccc';
      ctx.font = '9px monospace';
      const desc = selectedRecipe.description;
      const maxChars = 42;
      let lines: string[] = [];
      let remaining = desc;
      while (remaining.length > maxChars) {
        let cut = remaining.lastIndexOf(' ', maxChars);
        if (cut === -1) cut = maxChars;
        lines.push(remaining.substring(0, cut));
        remaining = remaining.substring(cut).trim();
      }
      if (remaining) lines.push(remaining);
      for (let i = 0; i < Math.min(lines.length, 3); i++) {
        ctx.fillText(lines[i], detailX + 10, detailY + 42 + i * 11);
      }

      // Result
      ctx.fillStyle = '#8f8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`Result: ${resultDef?.icon ?? '❓'} ${selectedRecipe.resultQuantity}x ${resultDef?.name ?? selectedRecipe.resultItemId}`, detailX + 10, detailY + 80);
      if (resultDef) {
        ctx.fillStyle = '#888';
        ctx.font = '8px monospace';
        ctx.fillText(`Value: ${resultDef.value} each | ${resultDef.stackable ? `Stack ${resultDef.maxStack}` : 'Non-stackable'} | ${resultDef.rarity}`, detailX + 10, detailY + 94);
        ctx.fillStyle = '#aaa';
        ctx.font = '8px monospace';
        ctx.fillText(resultDef.description.substring(0, 55), detailX + 10, detailY + 106);
      }

      // Ingredients
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`Ingredients:`, detailX + 10, detailY + 124);

      let ingY = detailY + 138;
      for (const ing of selectedRecipe.ingredients) {
        const ingDef = this.itemDatabase.getItem(ing.itemId);
        const have = inventory.getItemQuantity(ing.itemId);
        const need = ing.quantity;
        const hasEnough = have >= need;

        ctx.fillStyle = hasEnough ? '#8f8' : '#f88';
        ctx.font = '10px monospace';
        ctx.fillText(
          `${ingDef?.icon ?? '❓'} ${need}x ${ingDef?.name ?? ing.itemId} - have ${have}/${need} ${hasEnough ? '✓' : '✗'}`,
          detailX + 15,
          ingY
        );
        ingY += 14;
      }

      // Craft status
      ctx.fillStyle = canResult.can ? '#0f0' : '#f88';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(canResult.can ? '✓ Can Craft [Enter]' : `✗ Cannot Craft: ${canResult.reason}`, detailX + 10, detailY + 220);

      if (canResult.missing && canResult.missing.length > 0) {
        ctx.fillStyle = '#fa8';
        ctx.font = '9px monospace';
        let missY = detailY + 236;
        for (const miss of canResult.missing.slice(0, 3)) {
          ctx.fillText(`Missing: ${miss.need - miss.have}x ${miss.itemId} (need ${miss.need}, have ${miss.have})`, detailX + 10, missY);
          missY += 11;
        }
      }

      // Crafted count
      const craftedCount = craftingSystem.getCraftedCount(selectedRecipe.id);
      ctx.fillStyle = '#666';
      ctx.font = '8px monospace';
      ctx.fillText(`Crafted: ${craftedCount}x | Total: ${craftingSystem.getTotalCrafted()}`, detailX + 10, detailY + 270);

      // Action hint
      if (canResult.can) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
        ctx.fillRect(detailX + 10, detailY + 285, detailW - 20, 24);
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.strokeRect(detailX + 10, detailY + 285, detailW - 20, 24);
        ctx.fillStyle = '#8f8';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press ENTER to Craft!', detailX + detailW / 2, detailY + 293);
        ctx.textAlign = 'left';
      }
    } else {
      ctx.fillStyle = '#666';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No recipes found', detailX + detailW / 2, detailY + detailH / 2);
      ctx.textAlign = 'left';
    }

    // Footer
    ctx.fillStyle = '#444';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Crafting v1 | ${this.recipeDatabase.getCount()} recipes DB | ${filteredRecipes.length} filtered | ${craftableCount} craftable | Inv ${inventory.getUsedSlots()}/${inventory.getCapacity()}`,
      screenWidth / 2,
      boxY + boxH - 12
    );

    ctx.restore();
  }

  renderQuickHint(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, craftingSystem: CraftingSystem, inventory: Inventory): void {
    if (this.showCrafting) return;
    const craftable = craftingSystem.getCraftableRecipes(inventory);
    if (craftable.length === 0) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const w = 200;
    const h = 22;
    const x = screenWidth - w - 20;
    const y = 60;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#8af';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🔨 ${craftable.length} craftable! Press Shift+C`, x + 8, y + h / 2);

    ctx.restore();
  }
}
