/**
 * Shop.ts - Phase 16.5 Economy / Shop System
 * Defines shop types, inventory, transactions
 */

export enum ShopType {
  GENERAL = 'GENERAL',
  FOOD = 'FOOD',
  TOOL = 'TOOL',
  SEED = 'SEED',
  POTION = 'POTION',
  TREASURE = 'TREASURE'
}

export interface ShopItem {
  itemId: string;
  quantity: number; // stock
  priceOverride?: number; // if set, use this instead of calculated
  infinite?: boolean; // if true, stock never depletes
}

export interface ShopDefinition {
  id: string;
  type: ShopType;
  name: string;
  icon: string;
  description: string;
  buyMultiplier: number; // player buys at value * multiplier (e.g., 1.2)
  sellMultiplier: number; // player sells at value * multiplier (e.g., 0.8)
  inventory: ShopItem[];
  infiniteStock?: boolean; // if true, all items infinite
  ownerId?: string; // NPC owner
  mapId?: string; // location
  x?: number;
  y?: number;
  tags?: string[];
}

export interface ShopInventoryData {
  items: Record<string, number>; // itemId -> quantity
  version: number;
}

export interface TransactionData {
  id: string;
  timestamp: number; // game totalSeconds
  shopId: string;
  itemId: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  type: 'BUY' | 'SELL';
  playerMoneyBefore: number;
  playerMoneyAfter: number;
}

export interface EconomySaveData {
  shopInventories: Record<string, ShopInventoryData>; // shopId -> inventory
  prices: Record<string, number>; // itemId -> custom price override (future)
  transactionHistory: TransactionData[];
  totalTransactions: number;
  totalSpent: number; // total money spent buying
  totalEarned: number; // total money earned selling
  version: number;
}

export function createDefaultEconomySaveData(): EconomySaveData {
  return {
    shopInventories: {},
    prices: {},
    transactionHistory: [],
    totalTransactions: 0,
    totalSpent: 0,
    totalEarned: 0,
    version: 1
  };
}
