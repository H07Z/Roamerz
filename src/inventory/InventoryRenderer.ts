/**
 * InventoryRenderer - Phase 14 Inventory System
 * Renders player inventory UI overlay
 */

import { Inventory, SortMode } from './Inventory';
import { ItemDatabase } from './ItemDatabase';
import { InventorySlot } from './Item';

export class InventoryRenderer {
  private showInventory: boolean = false;
  private selectedSlot: number = 0;
  private sortMode: SortMode = SortMode.CATEGORY;
  private itemDatabase: ItemDatabase;
  private filterCategory: any = null; // ItemCategory or null for ALL
  private cols: number = 5;

  constructor(itemDatabase?: ItemDatabase) {
    this.itemDatabase = itemDatabase ?? ItemDatabase.getInstance();
  }

  setShowInventory(show: boolean): void {
    this.showInventory = show;
  }

  isShowing(): boolean {
    return this.showInventory;
  }

  toggle(): void {
    this.showInventory = !this.showInventory;
  }

  getSelectedSlot(): number {
    return this.selectedSlot;
  }

  setSelectedSlot(slot: number): void {
    this.selectedSlot = slot;
  }

  getSortMode(): SortMode {
    return this.sortMode;
  }

  setSortMode(mode: SortMode): void {
    this.sortMode = mode;
  }

  // Navigation for Game.ts inventory UI
  navigate(dir: 'up' | 'down' | 'left' | 'right'): void {
    const cap = 20; // default, but we clamp based on selected slot logic; actual capacity checked in render
    switch (dir) {
      case 'up':
        this.selectedSlot = Math.max(0, this.selectedSlot - this.cols);
        break;
      case 'down':
        this.selectedSlot = Math.min(cap - 1, this.selectedSlot + this.cols);
        break;
      case 'left':
        this.selectedSlot = Math.max(0, this.selectedSlot - 1);
        break;
      case 'right':
        this.selectedSlot = Math.min(cap - 1, this.selectedSlot + 1);
        break;
    }
  }

  getFilterCategory(): any {
    return this.filterCategory;
  }

  setFilterCategory(cat: any): void {
    this.filterCategory = cat;
  }

  render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, inventory: Inventory): void {
    if (!this.showInventory) return;

    ctx.save();

    const boxW = 500;
    const boxH = 450;
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
    ctx.fillText('🎒 INVENTORY', screenWidth / 2, boxY + 15);

    // Stats
    const stats = inventory.getStats();
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.fillText(`Slots: ${stats.used}/${stats.capacity} | Items: ${stats.totalCount} | Value: ${stats.totalValue} | Sort: ${this.sortMode} (S to change)`, screenWidth / 2, boxY + 35);

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.fillText('I / ESC close, ARROWS/WASD select, S sort, C clear, M merge, 1-5 test add, Q drop', screenWidth / 2, boxY + 50);

    // Grid
    const cols = 5;
    const rows = Math.ceil(inventory.getCapacity() / cols);
    const slotSize = 70;
    const slotPadding = 8;
    const gridStartX = boxX + 30;
    const gridStartY = boxY + 70;
    const gridW = cols * (slotSize + slotPadding);

    // Draw slots
    for (let i = 0; i < inventory.getCapacity(); i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridStartX + col * (slotSize + slotPadding);
      const y = gridStartY + row * (slotSize + slotPadding);

      const slot = inventory.getSlot(i);
      const isSelected = i === this.selectedSlot;

      // Slot background
      if (isSelected) {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.fillRect(x, y, slotSize, slotSize);
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, slotSize, slotSize);
      } else {
        ctx.fillStyle = slot ? 'rgba(60, 60, 60, 0.8)' : 'rgba(30, 30, 30, 0.5)';
        ctx.fillRect(x, y, slotSize, slotSize);
        ctx.strokeStyle = 'rgba(80, 80, 80, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, slotSize, slotSize);
      }

      // Slot content
      if (slot) {
        const def = slot.definition ?? this.itemDatabase.getItem(slot.id);
        if (def) {
          // Icon
          ctx.fillStyle = '#fff';
          ctx.font = '24px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(def.icon, x + slotSize / 2, y + slotSize / 2 - 10);

          // Name
          ctx.fillStyle = def.color ?? '#fff';
          ctx.font = '8px monospace';
          ctx.fillText(def.name.substring(0, 10), x + slotSize / 2, y + slotSize / 2 + 12);

          // Quantity
          if (def.stackable && slot.quantity > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`x${slot.quantity}`, x + slotSize - 5, y + slotSize - 5);
          } else if (!def.stackable) {
            // Show durability or non-stackable indicator
            ctx.fillStyle = '#aaa';
            ctx.font = '7px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('1', x + slotSize - 5, y + slotSize - 5);
          }

          // Rarity border tint
          if (def.rarity !== 'COMMON') {
            let rarityColor = 'rgba(100,100,100,0.3)';
            switch (def.rarity) {
              case 'UNCOMMON': rarityColor = 'rgba(100,255,100,0.4)'; break;
              case 'RARE': rarityColor = 'rgba(100,100,255,0.5)'; break;
              case 'EPIC': rarityColor = 'rgba(200,100,255,0.5)'; break;
              case 'LEGENDARY': rarityColor = 'rgba(255,200,50,0.6)'; break;
            }
            ctx.strokeStyle = rarityColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, slotSize, slotSize);
          }
        } else {
          ctx.fillStyle = '#f88';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('?', x + slotSize / 2, y + slotSize / 2);
        }
      } else {
        // Empty slot indicator
        ctx.fillStyle = '#333';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${i + 1}`, x + slotSize / 2, y + slotSize / 2);
      }
    }

    // Selected item details
    const selected = inventory.getSlot(this.selectedSlot);
    const detailX = boxX + 20;
    const detailY = gridStartY + rows * (slotSize + slotPadding) + 15;
    const detailW = boxW - 40;
    const detailH = 80;

    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    ctx.fillRect(detailX, detailY, detailW, detailH);
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.strokeRect(detailX, detailY, detailW, detailH);

    if (selected) {
      const def = selected.definition ?? this.itemDatabase.getItem(selected.id);
      if (def) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`${def.icon} ${def.name} x${selected.quantity}`, detailX + 10, detailY + 8);

        ctx.fillStyle = '#aaa';
        ctx.font = '9px monospace';
        ctx.fillText(`ID: ${def.id} | Type: ${def.type} | Cat: ${def.category} | Rarity: ${def.rarity}`, detailX + 10, detailY + 24);
        ctx.fillText(`Value: ${def.value} each | Total: ${def.value * selected.quantity} | ${def.stackable ? `Stack: ${selected.quantity}/${def.maxStack}` : 'Non-stackable'} | Weight: ${def.weight ?? 0}`, detailX + 10, detailY + 36);

        ctx.fillStyle = '#ccc';
        ctx.font = '9px monospace';
        // Wrap description
        const desc = def.description;
        const maxChars = 70;
        let descLine = desc;
        if (desc.length > maxChars) {
          descLine = desc.substring(0, maxChars) + '...';
        }
        ctx.fillText(descLine, detailX + 10, detailY + 50);

        if (def.effects) {
          const effStr = Object.entries(def.effects).map(([k, v]) => `${k}+${v}`).join(' ');
          ctx.fillStyle = '#8f8';
          ctx.fillText(`Effects: ${effStr}`, detailX + 10, detailY + 62);
        }

        if (def.tags) {
          ctx.fillStyle = '#666';
          ctx.font = '8px monospace';
          ctx.fillText(`Tags: ${def.tags.join(', ')}`, detailX + 10, detailY + 74);
        }
      }
    } else {
      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Empty slot - Select an item to see details', detailX + 10, detailY + 10);
      ctx.fillText(`Total Value: ${stats.totalValue} | Added: ${stats.totalAdded} | Removed: ${stats.totalRemoved}`, detailX + 10, detailY + 26);
    }

    // Footer
    ctx.fillStyle = '#444';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Inventory v${(inventory as any).version ?? 1} | ${stats.used}/${stats.capacity} used | ${stats.free} free | Data-driven ${this.itemDatabase.getCount()} items`, screenWidth / 2, boxY + boxH - 12);

    ctx.restore();
  }

  renderHotbar(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, inventory: Inventory): void {
    // Optional: render quick slots at bottom? For now just small indicator
    if (this.showInventory) return; // Don't show hotbar when inventory open

    const slots = inventory.getNonEmptySlots().slice(0, 5);
    if (slots.length === 0) return;

    ctx.save();
    const barW = 250;
    const barH = 40;
    const x = screenWidth / 2 - barW / 2;
    const y = screenHeight - barH - 10;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, barW, barH);
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.strokeRect(x, y, barW, barH);

    ctx.fillStyle = '#aaa';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Inv:', x + 5, y + 5);

    let offsetX = x + 30;
    for (let i = 0; i < Math.min(slots.length, 5); i++) {
      const slot = slots[i];
      const def = slot.definition ?? this.itemDatabase.getItem(slot.id);
      if (!def) continue;

      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.icon, offsetX + 15, y + 20);

      if (def.stackable && slot.quantity > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`x${slot.quantity}`, offsetX + 28, y + 30);
      }

      offsetX += 35;
    }

    ctx.fillStyle = '#666';
    ctx.font = '7px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${inventory.getUsedSlots()}/${inventory.getCapacity()}`, x + barW - 5, y + 5);

    ctx.restore();
  }
}
