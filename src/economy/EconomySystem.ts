/**
 * EconomySystem - Phase 16.5 Economy / Shop System
 * Manages shops, buy/sell, transaction history, persistence
 */

import { ShopDatabase } from './ShopDatabase';
import { ShopDefinition, ShopInventoryData, TransactionData, EconomySaveData, createDefaultEconomySaveData } from './Shop';
import { ItemDatabase } from '../inventory/ItemDatabase';
import { Inventory } from '../inventory/Inventory';

export class EconomySystem {
  private database: ShopDatabase;
  private itemDatabase: ItemDatabase;
  private shopInventories: Map<string, Map<string, number>> = new Map(); // shopId -> itemId -> qty
  private shopInfinite: Map<string, Map<string, boolean>> = new Map(); // shopId -> itemId -> infinite
  private transactionHistory: TransactionData[] = [];
  private totalTransactions: number = 0;
  private totalSpent: number = 0;
  private totalEarned: number = 0;
  private version: number = 1;

  constructor(database?: ShopDatabase, itemDatabase?: ItemDatabase) {
    this.database = database ?? ShopDatabase.getInstance();
    this.itemDatabase = itemDatabase ?? ItemDatabase.getInstance();
  }

  initialize(): void {
    this.shopInventories.clear();
    this.shopInfinite.clear();
    this.transactionHistory = [];
    this.totalTransactions = 0;
    this.totalSpent = 0;
    this.totalEarned = 0;

    for (const shopDef of this.database.getAllShops()) {
      const inv = new Map<string, number>();
      const inf = new Map<string, boolean>();
      for (const item of shopDef.inventory) {
        inv.set(item.itemId, item.quantity);
        inf.set(item.itemId, !!item.infinite || !!shopDef.infiniteStock);
      }
      this.shopInventories.set(shopDef.id, inv);
      this.shopInfinite.set(shopDef.id, inf);
    }

    console.log(`[EconomySystem] Initialized with ${this.database.getCount()} shops, ${this.getTotalStockCount()} total stock`);
  }

  private getShopDef(shopId: string): ShopDefinition | null {
    return this.database.getShop(shopId);
  }

  getShopInventory(shopId: string): Map<string, number> | null {
    return this.shopInventories.get(shopId) ?? null;
  }

  getShopStock(shopId: string, itemId: string): number {
    const inv = this.shopInventories.get(shopId);
    if (!inv) return 0;
    return inv.get(itemId) ?? 0;
  }

  isInfiniteStock(shopId: string, itemId: string): boolean {
    const inf = this.shopInfinite.get(shopId);
    if (!inf) return false;
    return inf.get(itemId) ?? false;
  }

  getBuyPrice(shopId: string, itemId: string): number {
    const shopDef = this.getShopDef(shopId);
    if (!shopDef) return 0;
    const itemDef = this.itemDatabase.getItem(itemId);
    if (!itemDef) return 0;

    // Check for override in shop inventory definition
    const override = shopDef.inventory.find(i => i.itemId === itemId)?.priceOverride;
    if (override !== undefined) return override;

    return Math.max(1, Math.floor(itemDef.value * shopDef.buyMultiplier));
  }

  getSellPrice(shopId: string, itemId: string): number {
    const shopDef = this.getShopDef(shopId);
    if (!shopDef) return 0;
    const itemDef = this.itemDatabase.getItem(itemId);
    if (!itemDef) return 0;

    return Math.max(1, Math.floor(itemDef.value * shopDef.sellMultiplier));
  }

  canBuy(shopId: string, itemId: string, quantity: number, playerMoney: number, playerInventory: Inventory): { can: boolean; reason?: string; pricePerUnit?: number; totalPrice?: number; missingMoney?: number; missingSpace?: boolean } {
    const shopDef = this.getShopDef(shopId);
    if (!shopDef) return { can: false, reason: `Shop ${shopId} not found` };

    const stock = this.getShopStock(shopId, itemId);
    const infinite = this.isInfiniteStock(shopId, itemId);
    if (!infinite && stock < quantity) {
      return { can: false, reason: `Not enough stock: have ${stock}, need ${quantity}` };
    }

    const pricePerUnit = this.getBuyPrice(shopId, itemId);
    const totalPrice = pricePerUnit * quantity;

    if (playerMoney < totalPrice) {
      return { can: false, reason: `Not enough money: have ${playerMoney}, need ${totalPrice}`, pricePerUnit, totalPrice, missingMoney: totalPrice - playerMoney };
    }

    // Check inventory space - account for freeing slots? For buying, we just need space
    // Use hasSpace logic: if item stackable and already have, might not need new slot, but check via willFreeSlot? Actually buying doesn't free, so just check hasSpace or quantity
    const itemDef = this.itemDatabase.getItem(itemId);
    if (!itemDef) return { can: false, reason: `Item ${itemId} not found` };

    // Simplified space check: if stackable and already have some, allow, else need free slot
    let needsNewSlot = true;
    if (itemDef.stackable) {
      const existingQty = playerInventory.getItemQuantity(itemId);
      if (existingQty > 0) {
        // Check if existing stack has space
        const slots = playerInventory.getSlotsByItemId(itemId);
        for (const slot of slots) {
          if (slot.quantity < (itemDef.maxStack ?? 99)) {
            needsNewSlot = false;
            break;
          }
        }
        if (slots.length === 0) needsNewSlot = true;
      }
    }

    if (needsNewSlot && !playerInventory.hasSpace()) {
      // Check if will free slot? Buying doesn't free, so just check
      return { can: false, reason: `Inventory full`, pricePerUnit, totalPrice, missingSpace: true };
    }

    return { can: true, pricePerUnit, totalPrice };
  }

  buy(shopId: string, itemId: string, quantity: number, player: { money: number; getInventory: () => Inventory; addItem: (id: string, qty: number) => boolean }, totalSeconds: number = 0): { success: boolean; reason?: string; transaction?: TransactionData } {
    const playerInventory = player.getInventory();
    const canResult = this.canBuy(shopId, itemId, quantity, player.money, playerInventory);
    if (!canResult.can) {
      return { success: false, reason: canResult.reason };
    }

    const pricePerUnit = canResult.pricePerUnit!;
    const totalPrice = canResult.totalPrice!;

    const moneyBefore = player.money;
    // Deduct money
    player.money -= totalPrice;

    // Add item to player
    const added = player.addItem(itemId, quantity);
    if (!added) {
      // Rollback money
      player.money = moneyBefore;
      return { success: false, reason: `Failed to add ${itemId} to inventory (full?)` };
    }

    // Deduct from shop stock if not infinite
    if (!this.isInfiniteStock(shopId, itemId)) {
      const inv = this.shopInventories.get(shopId);
      if (inv) {
        const current = inv.get(itemId) ?? 0;
        inv.set(itemId, Math.max(0, current - quantity));
      }
    }

    // Transaction
    const transaction: TransactionData = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: totalSeconds,
      shopId,
      itemId,
      quantity,
      pricePerUnit,
      totalPrice,
      type: 'BUY',
      playerMoneyBefore: moneyBefore,
      playerMoneyAfter: player.money
    };

    this.transactionHistory.push(transaction);
    this.totalTransactions++;
    this.totalSpent += totalPrice;

    // Keep history limited to last 100
    if (this.transactionHistory.length > 100) {
      this.transactionHistory.shift();
    }

    console.log(`[EconomySystem] BUY ${quantity}x ${itemId} from ${shopId} for ${totalPrice} (${pricePerUnit} each) money ${moneyBefore} -> ${player.money}`);

    return { success: true, transaction };
  }

  canSell(shopId: string, itemId: string, quantity: number, playerInventory: Inventory): { can: boolean; reason?: string; pricePerUnit?: number; totalPrice?: number } {
    const shopDef = this.getShopDef(shopId);
    if (!shopDef) return { can: false, reason: `Shop ${shopId} not found` };

    const have = playerInventory.getItemQuantity(itemId);
    if (have < quantity) {
      return { can: false, reason: `Not enough ${itemId}: have ${have}, need ${quantity}` };
    }

    const pricePerUnit = this.getSellPrice(shopId, itemId);
    const totalPrice = pricePerUnit * quantity;

    return { can: true, pricePerUnit, totalPrice };
  }

  sell(shopId: string, itemId: string, quantity: number, player: { money: number; getInventory: () => Inventory; removeItem: (id: string, qty: number) => boolean }, totalSeconds: number = 0): { success: boolean; reason?: string; transaction?: TransactionData } {
    const playerInventory = player.getInventory();
    const canResult = this.canSell(shopId, itemId, quantity, playerInventory);
    if (!canResult.can) {
      return { success: false, reason: canResult.reason };
    }

    const pricePerUnit = canResult.pricePerUnit!;
    const totalPrice = canResult.totalPrice!;

    const moneyBefore = player.money;

    // Remove from player
    const removed = player.removeItem(itemId, quantity);
    if (!removed) {
      return { success: false, reason: `Failed to remove ${itemId} from inventory` };
    }

    // Add money
    player.money += totalPrice;

    // Add to shop stock
    const inv = this.shopInventories.get(shopId);
    if (inv) {
      const current = inv.get(itemId) ?? 0;
      inv.set(itemId, current + quantity);
    } else {
      // Create inventory if missing
      const newInv = new Map<string, number>();
      newInv.set(itemId, quantity);
      this.shopInventories.set(shopId, newInv);
    }

    const transaction: TransactionData = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: totalSeconds,
      shopId,
      itemId,
      quantity,
      pricePerUnit,
      totalPrice,
      type: 'SELL',
      playerMoneyBefore: moneyBefore,
      playerMoneyAfter: player.money
    };

    this.transactionHistory.push(transaction);
    this.totalTransactions++;
    this.totalEarned += totalPrice;

    if (this.transactionHistory.length > 100) {
      this.transactionHistory.shift();
    }

    console.log(`[EconomySystem] SELL ${quantity}x ${itemId} to ${shopId} for ${totalPrice} (${pricePerUnit} each) money ${moneyBefore} -> ${player.money}`);

    return { success: true, transaction };
  }

  getAllShops(): ShopDefinition[] {
    return this.database.getAllShops();
  }

  getShopCount(): number {
    return this.database.getCount();
  }

  getTotalStockCount(): number {
    let total = 0;
    for (const inv of this.shopInventories.values()) {
      for (const qty of inv.values()) {
        total += qty;
      }
    }
    return total;
  }

  getTransactionHistory(): TransactionData[] {
    return [...this.transactionHistory];
  }

  getTotalTransactions(): number {
    return this.totalTransactions;
  }

  getTotalSpent(): number {
    return this.totalSpent;
  }

  getTotalEarned(): number {
    return this.totalEarned;
  }

  getDatabase(): ShopDatabase {
    return this.database;
  }

  getSaveData(): EconomySaveData {
    const shopInventories: Record<string, ShopInventoryData> = {};
    for (const [shopId, invMap] of this.shopInventories.entries()) {
      const items: Record<string, number> = {};
      for (const [itemId, qty] of invMap.entries()) {
        items[itemId] = qty;
      }
      shopInventories[shopId] = { items, version: 1 };
    }

    return {
      shopInventories,
      prices: {},
      transactionHistory: [...this.transactionHistory],
      totalTransactions: this.totalTransactions,
      totalSpent: this.totalSpent,
      totalEarned: this.totalEarned,
      version: this.version
    };
  }

  loadSaveData(data: EconomySaveData | any): void {
    if (!data) return;
    try {
      this.shopInventories.clear();
      const shopInvs = data.shopInventories ?? {};
      for (const shopId of Object.keys(shopInvs)) {
        const invData = shopInvs[shopId];
        const items = invData.items ?? invData ?? {};
        const map = new Map<string, number>();
        for (const itemId of Object.keys(items)) {
          const qty = items[itemId];
          if (typeof qty === 'number') map.set(itemId, qty);
        }
        this.shopInventories.set(shopId, map);
      }

      // Ensure all shops from database have at least default if missing
      for (const shopDef of this.database.getAllShops()) {
        if (!this.shopInventories.has(shopDef.id)) {
          const inv = new Map<string, number>();
          for (const item of shopDef.inventory) {
            inv.set(item.itemId, item.quantity);
          }
          this.shopInventories.set(shopDef.id, inv);
        }
      }

      // Rebuild infinite map from database (not saved, derived)
      this.shopInfinite.clear();
      for (const shopDef of this.database.getAllShops()) {
        const inf = new Map<string, boolean>();
        for (const item of shopDef.inventory) {
          inf.set(item.itemId, !!item.infinite || !!shopDef.infiniteStock);
        }
        // Also for any extra items added via selling, not infinite
        const existingInv = this.shopInventories.get(shopDef.id);
        if (existingInv) {
          for (const itemId of existingInv.keys()) {
            if (!inf.has(itemId)) inf.set(itemId, false);
          }
        }
        this.shopInfinite.set(shopDef.id, inf);
      }

      this.transactionHistory = Array.isArray(data.transactionHistory) ? data.transactionHistory : [];
      this.totalTransactions = typeof data.totalTransactions === 'number' ? data.totalTransactions : this.transactionHistory.length;
      this.totalSpent = typeof data.totalSpent === 'number' ? data.totalSpent : 0;
      this.totalEarned = typeof data.totalEarned === 'number' ? data.totalEarned : 0;
      this.version = typeof data.version === 'number' ? data.version : 1;

      console.log(`[EconomySystem] Loaded ${this.shopInventories.size} shops, ${this.getTotalStockCount()} stock, ${this.transactionHistory.length} transactions, spent ${this.totalSpent}, earned ${this.totalEarned}`);
    } catch (e) {
      console.error('[EconomySystem] Failed to load save data:', e);
    }
  }

  clear(): void {
    this.shopInventories.clear();
    this.shopInfinite.clear();
    this.transactionHistory = [];
    this.totalTransactions = 0;
    this.totalSpent = 0;
    this.totalEarned = 0;
    console.log('[EconomySystem] Cleared');
    this.initialize();
  }

  getDebugString(): string {
    return `${this.database.getCount()} shops, ${this.getTotalStockCount()} stock, ${this.totalTransactions} tx, spent ${this.totalSpent}, earned ${this.totalEarned}`;
  }

  debugPrint(): void {
    console.log(`[EconomySystem] ${this.getDebugString()}`);
    for (const shop of this.database.getAllShops()) {
      const inv = this.shopInventories.get(shop.id);
      const stockStr = inv ? Array.from(inv.entries()).map(([id, qty]) => `${id}:${qty}`).join(', ') : 'empty';
      console.log(`  ${shop.icon} ${shop.id} ${shop.name} buy x${shop.buyMultiplier} sell x${shop.sellMultiplier} | ${stockStr}`);
    }
    console.log(`  Transactions: ${this.transactionHistory.length}`);
    for (const tx of this.transactionHistory.slice(-5)) {
      console.log(`    ${tx.type} ${tx.quantity}x ${tx.itemId} @${tx.pricePerUnit} total ${tx.totalPrice} shop ${tx.shopId} money ${tx.playerMoneyBefore}->${tx.playerMoneyAfter}`);
    }
  }
}
