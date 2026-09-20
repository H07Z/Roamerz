/**
 * CookingRenderer - Phase 16.3 Cooking System
 * Renders cooking UI overlay with recipes, ingredients, cookable status
 */

import { CookingSystem } from './CookingSystem';
import { CookingDatabase } from './CookingDatabase';
import { CookingRecipeDefinition, CookingCategory } from './CookingRecipe';
import { Inventory } from '../inventory/Inventory';
import { ItemDatabase } from '../inventory/ItemDatabase';

export class CookingRenderer {
  private showCooking: boolean = false;
  private selectedIndex: number = 0;
  private filterCategory: CookingCategory | null = null;
  private showOnlyCookable: boolean = false;
  private itemDatabase: ItemDatabase;
  private recipeDatabase: CookingDatabase;

  constructor(itemDatabase?: ItemDatabase, recipeDatabase?: CookingDatabase) {
    this.itemDatabase = itemDatabase ?? ItemDatabase.getInstance();
    this.recipeDatabase = recipeDatabase ?? CookingDatabase.getInstance();
  }

  setShowCooking(show: boolean): void {
    this.showCooking = show;
  }

  isShowing(): boolean {
    return this.showCooking;
  }

  toggle(): void {
    this.showCooking = !this.showCooking;
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  setSelectedIndex(idx: number): void {
    this.selectedIndex = Math.max(0, idx);
  }

  navigate(dir: 'up' | 'down', totalRecipes: number): void {
    switch (dir) {
      case 'up':
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        break;
      case 'down':
        this.selectedIndex = Math.min(totalRecipes - 1, this.selectedIndex + 1);
        break;
    }
  }

  getFilterCategory(): CookingCategory | null {
    return this.filterCategory;
  }

  setFilterCategory(cat: CookingCategory | null): void {
    this.filterCategory = cat;
    this.selectedIndex = 0;
  }

  getShowOnlyCookable(): boolean {
    return this.showOnlyCookable;
  }

  setShowOnlyCookable(show: boolean): void {
    this.showOnlyCookable = show;
    this.selectedIndex = 0;
  }

  toggleCookableFilter(): void {
    this.showOnlyCookable = !this.showOnlyCookable;
    this.selectedIndex = 0;
  }

  private getFilteredRecipes(cookingSystem: CookingSystem, inventory?: Inventory): CookingRecipeDefinition[] {
    let recipes = cookingSystem.getUnlockedRecipes();

    if (this.filterCategory) {
      recipes = recipes.filter(r => r.category === this.filterCategory);
    }

    if (this.showOnlyCookable && inventory) {
      recipes = recipes.filter(r => {
        const can = cookingSystem.canCook(r.id, inventory);
        return can.can;
      });
    }

    recipes.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    return recipes;
  }

  render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, cookingSystem: CookingSystem, inventory: Inventory): void {
    if (!this.showCooking) return;

    const filteredRecipes = this.getFilteredRecipes(cookingSystem, inventory);
    if (this.selectedIndex >= filteredRecipes.length) {
      this.selectedIndex = Math.max(0, filteredRecipes.length - 1);
    }
    const selectedRecipe = filteredRecipes.length > 0 ? filteredRecipes[this.selectedIndex] : null;

    ctx.save();

    const boxW = 640;
    const boxH = 500;
    const boxX = screenWidth / 2 - boxW / 2;
    const boxY = screenHeight / 2 - boxH / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = 'rgba(255, 180, 100, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🍳 COOKING', screenWidth / 2, boxY + 15);

    const cookableCount = cookingSystem.getCookableRecipes(inventory).length;
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Recipes: ${filteredRecipes.length}/${cookingSystem.getUnlockedRecipes().length} | Cookable: ${cookableCount} | Total Cooked: ${cookingSystem.getTotalCooked()} | Filter: ${this.filterCategory ?? 'ALL'} (C) CookableOnly:${this.showOnlyCookable ? 'ON' : 'OFF'}(Shift+K)`,
      screenWidth / 2,
      boxY + 35
    );

    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.fillText('Shift+K / ESC close, W/S navigate, Enter cook, C filter category, Shift+K toggle cookable only', screenWidth / 2, boxY + 50);

    const listX = boxX + 20;
    const listY = boxY + 70;
    const listW = 240;
    const listH = 350;
    const rowH = 36;

    ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.5)';
    ctx.strokeRect(listX, listY, listW, listH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(listX, listY, listW, listH);
    ctx.clip();

    const visibleRows = Math.floor(listH / rowH);
    const scrollOffset = Math.max(0, this.selectedIndex - visibleRows + 2);

    for (let i = 0; i < filteredRecipes.length; i++) {
      const recipe = filteredRecipes[i];
      const y = listY + (i - scrollOffset) * rowH;
      if (y + rowH < listY || y > listY + listH) continue;

      const isSelected = i === this.selectedIndex;
      const canResult = cookingSystem.canCook(recipe.id, inventory);
      const canCook = canResult.can;

      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 180, 100, 0.3)';
        ctx.fillRect(listX, y, listW, rowH);
        ctx.strokeStyle = 'rgba(255, 180, 100, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX, y, listW, rowH);
      } else {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(50, 50, 50, 0.5)' : 'rgba(40, 40, 40, 0.5)';
        ctx.fillRect(listX, y, listW, rowH);
      }

      let catColor = '#888';
      switch (recipe.category) {
        case CookingCategory.BREAKFAST: catColor = '#ffeb3b'; break;
        case CookingCategory.MEAL: catColor = '#8f8'; break;
        case CookingCategory.SOUP: catColor = '#8d6e63'; break;
        case CookingCategory.DESSERT: catColor = '#f48fb1'; break;
        case CookingCategory.DAIRY: catColor = '#fff9c4'; break;
        case CookingCategory.MISC: catColor = '#8ff'; break;
      }
      ctx.fillStyle = catColor;
      ctx.beginPath();
      ctx.arc(listX + 12, y + rowH / 2, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(recipe.icon, listX + 22, y + rowH / 2);

      ctx.fillStyle = canCook ? '#fff' : '#666';
      ctx.font = isSelected ? 'bold 10px monospace' : '10px monospace';
      ctx.fillText(recipe.name.substring(0, 18), listX + 44, y + 12);

      const resultDef = this.itemDatabase.getItem(recipe.resultItemId);
      const resultIcon = resultDef?.icon ?? '❓';
      ctx.fillStyle = canCook ? '#8f8' : '#555';
      ctx.font = '9px monospace';
      ctx.fillText(`${resultIcon} ${recipe.resultQuantity}x ${resultDef?.name ?? recipe.resultItemId}`, listX + 44, y + 24);

      if (canCook) {
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

    const detailX = listX + listW + 20;
    const detailY = listY;
    const detailW = boxW - listW - 60;
    const detailH = 350;

    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    ctx.fillRect(detailX, detailY, detailW, detailH);
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.strokeRect(detailX, detailY, detailW, detailH);

    if (selectedRecipe) {
      const canResult = cookingSystem.canCook(selectedRecipe.id, inventory);
      const resultDef = this.itemDatabase.getItem(selectedRecipe.resultItemId);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${selectedRecipe.icon} ${selectedRecipe.name}`, detailX + 10, detailY + 10);

      ctx.fillStyle = '#aaa';
      ctx.font = '9px monospace';
      ctx.fillText(`Category: ${selectedRecipe.category} | Station: ${selectedRecipe.requiredStation ?? 'any'} | ${selectedRecipe.cookingTimeSeconds ?? 0}s`, detailX + 10, detailY + 28);

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
        if (resultDef.effects) {
          const effStr = Object.entries(resultDef.effects).map(([k, v]) => `${k}+${v}`).join(' ');
          ctx.fillStyle = '#8af';
          ctx.font = '8px monospace';
          ctx.fillText(`Effects: ${effStr} | ${selectedRecipe.effects ?? ''}`, detailX + 10, detailY + 118);
        }
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`Ingredients:`, detailX + 10, detailY + 132);

      let ingY = detailY + 146;
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

      ctx.fillStyle = canResult.can ? '#0f0' : '#f88';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(canResult.can ? '✓ Can Cook [Enter]' : `✗ Cannot Cook: ${canResult.reason}`, detailX + 10, detailY + 230);

      if (canResult.missing && canResult.missing.length > 0) {
        ctx.fillStyle = '#fa8';
        ctx.font = '9px monospace';
        let missY = detailY + 246;
        for (const miss of canResult.missing.slice(0, 3)) {
          ctx.fillText(`Missing: ${miss.need - miss.have}x ${miss.itemId} (need ${miss.need}, have ${miss.have})`, detailX + 10, missY);
          missY += 11;
        }
      }

      const cookedCount = cookingSystem.getCookedCount(selectedRecipe.id);
      ctx.fillStyle = '#666';
      ctx.font = '8px monospace';
      ctx.fillText(`Cooked: ${cookedCount}x | Total: ${cookingSystem.getTotalCooked()}`, detailX + 10, detailY + 278);

      if (canResult.can) {
        ctx.fillStyle = 'rgba(255, 180, 100, 0.15)';
        ctx.fillRect(detailX + 10, detailY + 293, detailW - 20, 24);
        ctx.strokeStyle = 'rgba(255, 180, 100, 0.5)';
        ctx.strokeRect(detailX + 10, detailY + 293, detailW - 20, 24);
        ctx.fillStyle = '#ffb74d';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press ENTER to Cook!', detailX + detailW / 2, detailY + 301);
        ctx.textAlign = 'left';
      }
    } else {
      ctx.fillStyle = '#666';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No recipes found', detailX + detailW / 2, detailY + detailH / 2);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = '#444';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Cooking v1 | ${this.recipeDatabase.getCount()} recipes DB | ${filteredRecipes.length} filtered | ${cookableCount} cookable | Inv ${inventory.getUsedSlots()}/${inventory.getCapacity()}`,
      screenWidth / 2,
      boxY + boxH - 12
    );

    ctx.restore();
  }

  renderQuickHint(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, cookingSystem: CookingSystem, inventory: Inventory): void {
    if (this.showCooking) return;
    const cookable = cookingSystem.getCookableRecipes(inventory);
    if (cookable.length === 0) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const w = 200;
    const h = 22;
    const x = screenWidth - w - 20;
    const y = 85;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255, 180, 100, 0.4)';
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#ffb74d';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🍳 ${cookable.length} cookable! Press Shift+K`, x + 8, y + h / 2);

    ctx.restore();
  }
}
