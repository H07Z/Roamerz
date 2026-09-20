/**
 * EconomyRenderer - Phase 16.5 Economy / Shop System
 * Renders shop UI overlay with buy/sell, prices, transaction history
 */

import { EconomySystem } from './EconomySystem';
import { ShopDatabase } from './ShopDatabase';
import { ShopDefinition, ShopType } from './Shop';
import { Inventory } from '../inventory/Inventory';
import { ItemDatabase } from '../inventory/ItemDatabase';
import { ItemCategory } from '../inventory/Item';

export class EconomyRenderer {
  private showEconomy: boolean = false;
  private selectedShopIndex: number = 0;
  private selectedItemIndex: number = 0;
  private buyMode: boolean = true; // true = buy from shop, false = sell to shop
  private filterCategory: ItemCategory | null = null;
  private itemDatabase: ItemDatabase;
  private shopDatabase: ShopDatabase;

  constructor(itemDatabase?: ItemDatabase, shopDatabase?: ShopDatabase) {
    this.itemDatabase = itemDatabase ?? ItemDatabase.getInstance();
    this.shopDatabase = shopDatabase ?? ShopDatabase.getInstance();
  }

  setShowEconomy(show: boolean): void {
    this.showEconomy = show;
  }

  isShowing(): boolean {
    return this.showEconomy;
  }

  toggle(): void {
    this.showEconomy = !this.showEconomy;
  }

  getSelectedShopIndex(): number {
    return this.selectedShopIndex;
  }

  setSelectedShopIndex(idx: number): void {
    this.selectedShopIndex = Math.max(0, idx);
  }

  getSelectedItemIndex(): number {
    return this.selectedItemIndex;
  }

  setSelectedItemIndex(idx: number): void {
    this.selectedItemIndex = Math.max(0, idx);
  }

  getBuyMode(): boolean {
    return this.buyMode;
  }

  setBuyMode(buy: boolean): void {
    this.buyMode = buy;
    this.selectedItemIndex = 0;
  }

  toggleBuyMode(): void {
    this.buyMode = !this.buyMode;
    this.selectedItemIndex = 0;
  }

  getFilterCategory(): ItemCategory | null {
    return this.filterCategory;
  }

  setFilterCategory(cat: ItemCategory | null): void {
    this.filterCategory = cat;
    this.selectedItemIndex = 0;
  }

  navigate(dir: 'up' | 'down', totalItems: number): void {
    switch (dir) {
      case 'up':
        this.selectedItemIndex = Math.max(0, this.selectedItemIndex - 1);
        break;
      case 'down':
        this.selectedItemIndex = Math.min(totalItems - 1, this.selectedItemIndex + 1);
        break;
    }
  }

  navigateShop(dir: 'left' | 'right' | 'up' | 'down', totalShops: number): void {
    if (dir === 'left' || dir === 'up') {
      this.selectedShopIndex = Math.max(0, this.selectedShopIndex - 1);
    } else {
      this.selectedShopIndex = Math.min(totalShops - 1, this.selectedShopIndex + 1);
    }
    this.selectedItemIndex = 0;
  }

  private getCurrentShop(economySystem: EconomySystem): ShopDefinition | null {
    const shops = economySystem.getAllShops();
    if (shops.length === 0) return null;
    const idx = Math.max(0, Math.min(this.selectedShopIndex, shops.length - 1));
    return shops[idx];
  }

  private getFilteredShopItems(economySystem: EconomySystem): { itemId: string; quantity: number; price: number; infinite: boolean }[] {
    const shop = this.getCurrentShop(economySystem);
    if (!shop) return [];

    const inv = economySystem.getShopInventory(shop.id);
    if (!inv) return [];

    let items: { itemId: string; quantity: number; price: number; infinite: boolean }[] = [];
    for (const [itemId, qty] of inv.entries()) {
      if (qty <= 0 && !economySystem.isInfiniteStock(shop.id, itemId)) continue;
      const price = economySystem.getBuyPrice(shop.id, itemId);
      const infinite = economySystem.isInfiniteStock(shop.id, itemId);
      const def = this.itemDatabase.getItem(itemId);
      if (!def) continue;
      if (this.filterCategory && def.category !== this.filterCategory) continue;
      items.push({ itemId, quantity: qty, price, infinite });
    }

    items.sort((a, b) => {
      const defA = this.itemDatabase.getItem(a.itemId);
      const defB = this.itemDatabase.getItem(b.itemId);
      if (!defA || !defB) return 0;
      if (defA.category !== defB.category) return defA.category.localeCompare(defB.category);
      return defA.name.localeCompare(defB.name);
    });

    return items;
  }

  private getFilteredPlayerItems(inventory: Inventory): { itemId: string; quantity: number; def: any }[] {
    let slots = inventory.getNonEmptySlots();
    // Group by itemId for display? Keep slots but filter
    const grouped = new Map<string, { quantity: number; def: any }>();
    for (const slot of slots) {
      const def = this.itemDatabase.getItem(slot.id);
      if (!def) continue;
      if (this.filterCategory && def.category !== this.filterCategory) continue;
      const existing = grouped.get(slot.id);
      if (existing) {
        existing.quantity += slot.quantity;
      } else {
        grouped.set(slot.id, { quantity: slot.quantity, def });
      }
    }

    const items = Array.from(grouped.entries()).map(([itemId, data]) => ({ itemId, quantity: data.quantity, def: data.def }));
    items.sort((a, b) => {
      if (a.def.category !== b.def.category) return a.def.category.localeCompare(b.def.category);
      return a.def.name.localeCompare(b.def.name);
    });
    return items;
  }

  render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, economySystem: EconomySystem, playerInventory: Inventory, playerMoney: number): void {
    const shop = this.getCurrentShop(economySystem);
    if (!shop) return;

    const buyItems = this.getFilteredShopItems(economySystem);
    const sellItems = this.getFilteredPlayerItems(playerInventory);
    const currentItems = this.buyMode ? buyItems : sellItems;
    const totalItems = currentItems.length;

    if (this.selectedItemIndex >= totalItems) {
      this.selectedItemIndex = Math.max(0, totalItems - 1);
    }

    const selected = totalItems > 0 ? currentItems[this.selectedItemIndex] : null;

    ctx.save();

    const boxW = 700;
    const boxH = 520;
    const boxX = screenWidth / 2 - boxW / 2;
    const boxY = screenHeight / 2 - boxH / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`🏪 ${shop.icon} ${shop.name.toUpperCase()} - ${this.buyMode ? 'BUY' : 'SELL'}`, screenWidth / 2, boxY + 15);

    const shops = economySystem.getAllShops();
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Shops: ${this.selectedShopIndex + 1}/${shops.length} [Q/E cycle] | ${this.buyMode ? 'Buying from' : 'Selling to'} ${shop.name} | Player: $${playerMoney} | Tx: ${economySystem.getTotalTransactions()} Spent:$${economySystem.getTotalSpent()} Earned:$${economySystem.getTotalEarned()} | Filter:${this.filterCategory ?? 'ALL'} (C) | Mode:${this.buyMode ? 'BUY' : 'SELL'} (TAB)`,
      screenWidth / 2,
      boxY + 35
    );

    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.fillText('Shift+B / ESC close, W/S navigate, Q/E cycle shop, TAB toggle BUY/SELL, C filter, Enter buy/sell 1, Shift+Enter x5', screenWidth / 2, boxY + 50);

    // Shop tabs
    const tabY = boxY + 65;
    const tabH = 22;
    let tabX = boxX + 20;
    for (let i = 0; i < shops.length; i++) {
      const s = shops[i];
      const isSelectedShop = i === this.selectedShopIndex;
      const tabW = 120;
      ctx.fillStyle = isSelectedShop ? 'rgba(255, 215, 0, 0.3)' : 'rgba(50, 50, 50, 0.5)';
      ctx.fillRect(tabX, tabY, tabW, tabH);
      ctx.strokeStyle = isSelectedShop ? 'rgba(255, 215, 0, 0.8)' : 'rgba(80, 80, 80, 0.5)';
      ctx.strokeRect(tabX, tabY, tabW, tabH);
      ctx.fillStyle = isSelectedShop ? '#ffd700' : '#aaa';
      ctx.font = isSelectedShop ? 'bold 10px monospace' : '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${s.icon} ${s.name}`, tabX + tabW / 2, tabY + tabH / 2);
      tabX += tabW + 6;
    }

    // Left panel - item list
    const listX = boxX + 20;
    const listY = tabY + tabH + 10;
    const listW = 280;
    const listH = 360;
    const rowH = 34;

    ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.5)';
    ctx.strokeRect(listX, listY, listW, listH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(listX, listY, listW, listH);
    ctx.clip();

    const visibleRows = Math.floor(listH / rowH);
    const scrollOffset = Math.max(0, this.selectedItemIndex - visibleRows + 2);

    for (let i = 0; i < currentItems.length; i++) {
      const y = listY + (i - scrollOffset) * rowH;
      if (y + rowH < listY || y > listY + listH) continue;

      const isSelected = i === this.selectedItemIndex;

      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.fillRect(listX, y, listW, rowH);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX, y, listW, rowH);
      } else {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(50, 50, 50, 0.5)' : 'rgba(40, 40, 40, 0.5)';
        ctx.fillRect(listX, y, listW, rowH);
      }

      if (this.buyMode) {
        const item = currentItems[i] as { itemId: string; quantity: number; price: number; infinite: boolean };
        const def = this.itemDatabase.getItem(item.itemId);
        if (!def) continue;

        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.icon, listX + 8, y + rowH / 2);

        ctx.fillStyle = isSelected ? '#fff' : '#ccc';
        ctx.font = isSelected ? 'bold 10px monospace' : '9px monospace';
        ctx.fillText(def.name.substring(0, 16), listX + 30, y + 10);

        ctx.fillStyle = '#ffd700';
        ctx.font = '9px monospace';
        ctx.fillText(`$${item.price} x${item.infinite ? '∞' : item.quantity}`, listX + 30, y + 22);

        // Can buy indicator
        const can = economySystem.canBuy(shop.id, item.itemId, 1, playerMoney, playerInventory);
        ctx.fillStyle = can.can ? '#0f0' : '#f44';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(can.can ? '✓' : '✗', listX + listW - 8, y + 10);
        ctx.textAlign = 'left';
      } else {
        const item = currentItems[i] as { itemId: string; quantity: number; def: any };
        const def = item.def;
        const sellPrice = economySystem.getSellPrice(shop.id, item.itemId);

        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.icon, listX + 8, y + rowH / 2);

        ctx.fillStyle = isSelected ? '#fff' : '#ccc';
        ctx.font = isSelected ? 'bold 10px monospace' : '9px monospace';
        ctx.fillText(def.name.substring(0, 16), listX + 30, y + 10);

        ctx.fillStyle = '#8f8';
        ctx.font = '9px monospace';
        ctx.fillText(`$${sellPrice} x${item.quantity}`, listX + 30, y + 22);

        ctx.fillStyle = '#0f0';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('✓', listX + listW - 8, y + 10);
        ctx.textAlign = 'left';
      }
    }

    ctx.restore();

    // Right panel - details
    const detailX = listX + listW + 20;
    const detailY = listY;
    const detailW = boxW - listW - 60;
    const detailH = 360;

    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    ctx.fillRect(detailX, detailY, detailW, detailH);
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.strokeRect(detailX, detailY, detailW, detailH);

    if (selected) {
      if (this.buyMode) {
        const item = selected as { itemId: string; quantity: number; price: number; infinite: boolean };
        const def = this.itemDatabase.getItem(item.itemId);
        if (def) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 13px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(`${def.icon} ${def.name}`, detailX + 10, detailY + 10);

          ctx.fillStyle = '#aaa';
          ctx.font = '9px monospace';
          ctx.fillText(`ID: ${def.id} | Cat: ${def.category} | Rarity: ${def.rarity} | Stock: ${item.infinite ? '∞' : item.quantity}`, detailX + 10, detailY + 28);

          ctx.fillStyle = '#ccc';
          ctx.font = '9px monospace';
          const desc = def.description;
          const maxChars = 40;
          let lines: string[] = [];
          let remaining = desc;
          while (remaining.length > maxChars) {
            let cut = remaining.lastIndexOf(' ', maxChars);
            if (cut === -1) cut = maxChars;
            lines.push(remaining.substring(0, cut));
            remaining = remaining.substring(cut).trim();
          }
          if (remaining) lines.push(remaining);
          for (let i = 0; i < Math.min(lines.length, 2); i++) {
            ctx.fillText(lines[i], detailX + 10, detailY + 42 + i * 11);
          }

          ctx.fillStyle = '#ffd700';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`Buy Price: $${item.price} each (value $${def.value} x${shop.buyMultiplier})`, detailX + 10, detailY + 70);

          const can1 = economySystem.canBuy(shop.id, item.itemId, 1, playerMoney, playerInventory);
          const can5 = economySystem.canBuy(shop.id, item.itemId, 5, playerMoney, playerInventory);

          ctx.fillStyle = can1.can ? '#0f0' : '#f88';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(can1.can ? `✓ Can Buy 1 for $${item.price} [Enter]` : `✗ Cannot Buy: ${can1.reason}`, detailX + 10, detailY + 90);

          if (can5.can) {
            ctx.fillStyle = '#8f8';
            ctx.font = '10px monospace';
            ctx.fillText(`✓ Can Buy 5 for $${item.price * 5} [Shift+Enter]`, detailX + 10, detailY + 106);
          } else if (item.quantity >= 5 || item.infinite) {
            ctx.fillStyle = '#fa8';
            ctx.font = '9px monospace';
            ctx.fillText(`Cannot Buy 5: ${can5.reason}`, detailX + 10, detailY + 106);
          }

          ctx.fillStyle = '#aaa';
          ctx.font = '9px monospace';
          ctx.fillText(`Player Money: $${playerMoney} -> $${playerMoney - item.price} after buy 1`, detailX + 10, detailY + 124);
          ctx.fillText(`Player Has: ${playerInventory.getItemQuantity(item.itemId)}x ${def.name} | Inv: ${playerInventory.getUsedSlots()}/${playerInventory.getCapacity()}`, detailX + 10, detailY + 138);

          ctx.fillStyle = '#666';
          ctx.font = '8px monospace';
          ctx.fillText(`Shop: ${shop.icon} ${shop.name} | ${shop.description.substring(0, 55)}`, detailX + 10, detailY + 156);

          if (can1.can) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
            ctx.fillRect(detailX + 10, detailY + 175, detailW - 20, 26);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.strokeRect(detailX + 10, detailY + 175, detailW - 20, 26);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Press ENTER to Buy 1!', detailX + detailW / 2, detailY + 184);
            ctx.textAlign = 'left';
          }
        }
      } else {
        const item = selected as { itemId: string; quantity: number; def: any };
        const def = item.def;
        const sellPrice = economySystem.getSellPrice(shop.id, item.itemId);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`${def.icon} ${def.name} x${item.quantity}`, detailX + 10, detailY + 10);

        ctx.fillStyle = '#aaa';
        ctx.font = '9px monospace';
        ctx.fillText(`ID: ${def.id} | Cat: ${def.category} | Rarity: ${def.rarity} | Have: ${item.quantity}`, detailX + 10, detailY + 28);

        ctx.fillStyle = '#ccc';
        ctx.font = '9px monospace';
        ctx.fillText(def.description.substring(0, 45), detailX + 10, detailY + 42);

        ctx.fillStyle = '#8f8';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`Sell Price: $${sellPrice} each (value $${def.value} x${shop.sellMultiplier})`, detailX + 10, detailY + 60);

        const can1 = economySystem.canSell(shop.id, item.itemId, 1, playerInventory);
        const can5 = economySystem.canSell(shop.id, item.itemId, 5, playerInventory);

        ctx.fillStyle = can1.can ? '#0f0' : '#f88';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(can1.can ? `✓ Can Sell 1 for $${sellPrice} [Enter]` : `✗ Cannot Sell: ${can1.reason}`, detailX + 10, detailY + 80);

        if (can5.can) {
          ctx.fillStyle = '#8f8';
          ctx.font = '10px monospace';
          ctx.fillText(`✓ Can Sell 5 for $${sellPrice * 5} [Shift+Enter]`, detailX + 10, detailY + 96);
        }

        ctx.fillStyle = '#aaa';
        ctx.font = '9px monospace';
        ctx.fillText(`Player Money: $${playerMoney} -> $${playerMoney + sellPrice} after sell 1`, detailX + 10, detailY + 114);
        ctx.fillText(`Shop Stock After: ${economySystem.getShopStock(shop.id, item.itemId) + 1}x`, detailX + 10, detailY + 128);

        if (can1.can) {
          ctx.fillStyle = 'rgba(100, 255, 100, 0.15)';
          ctx.fillRect(detailX + 10, detailY + 145, detailW - 20, 26);
          ctx.strokeStyle = 'rgba(100, 255, 100, 0.5)';
          ctx.strokeRect(detailX + 10, detailY + 145, detailW - 20, 26);
          ctx.fillStyle = '#8f8';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('Press ENTER to Sell 1!', detailX + detailW / 2, detailY + 154);
          ctx.textAlign = 'left';
        }
      }

      // Recent transactions
      const recent = economySystem.getTransactionHistory().slice(-3);
      if (recent.length > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Recent Transactions:', detailX + 10, detailY + 210);
        let ty = detailY + 222;
        for (const tx of recent) {
          const itemDef = this.itemDatabase.getItem(tx.itemId);
          ctx.fillStyle = tx.type === 'BUY' ? '#ffd700' : '#8f8';
          ctx.font = '8px monospace';
          ctx.fillText(`${tx.type} ${tx.quantity}x ${itemDef?.icon ?? ''}${tx.itemId} $${tx.totalPrice} @${tx.shopId}`, detailX + 10, ty);
          ty += 10;
        }
      }
    } else {
      ctx.fillStyle = '#666';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.buyMode ? 'No items in shop' : 'No items to sell', detailX + detailW / 2, detailY + detailH / 2);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = '#444';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Economy v1 | ${this.shopDatabase.getCount()} shops | ${economySystem.getTotalStockCount()} stock | ${economySystem.getTotalTransactions()} tx | Player $${playerMoney} Inv ${playerInventory.getUsedSlots()}/${playerInventory.getCapacity()}`,
      screenWidth / 2,
      boxY + boxH - 12
    );

    ctx.restore();
  }

  renderQuickHint(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, economySystem: EconomySystem, playerMoney: number): void {
    if (this.showEconomy) return;
    // Show hint if player has low money or shop has deals? For now show if player has items to sell or money to buy
    if (playerMoney < 10) return; // don't spam if broke? Actually show hint if can buy something

    const shops = economySystem.getAllShops();
    if (shops.length === 0) return;

    // Check if any shop has affordable items
    let affordable = 0;
    for (const shop of shops.slice(0, 1)) {
      const inv = economySystem.getShopInventory(shop.id);
      if (!inv) continue;
      for (const [itemId] of inv.entries()) {
        const price = economySystem.getBuyPrice(shop.id, itemId);
        if (playerMoney >= price) affordable++;
      }
    }

    if (affordable === 0) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const w = 220;
    const h = 22;
    const x = screenWidth - w - 20;
    const y = 110;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#ffd700';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🏪 Shop: ${affordable} affordable! Press Shift+B`, x + 8, y + h / 2);

    ctx.restore();
  }
}
