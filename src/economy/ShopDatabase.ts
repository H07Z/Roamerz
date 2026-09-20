/**
 * ShopDatabase - Phase 16.5 Economy / Shop System
 * Data-driven shop definitions, 3 shops small controlled phase
 */

import { ShopDefinition, ShopType } from './Shop';

export class ShopDatabase {
  private static instance: ShopDatabase | null = null;
  private shops: Map<string, ShopDefinition> = new Map();

  private constructor() {
    this.loadDefaultShops();
  }

  static getInstance(): ShopDatabase {
    if (!ShopDatabase.instance) {
      ShopDatabase.instance = new ShopDatabase();
    }
    return ShopDatabase.instance;
  }

  private loadDefaultShops(): void {
    const defs: ShopDefinition[] = [
      {
        id: 'general_store',
        type: ShopType.GENERAL,
        name: 'General Store',
        icon: '🏪',
        description: 'Sells everyday essentials, materials, and some food. Buys almost anything.',
        buyMultiplier: 1.2,
        sellMultiplier: 0.7,
        infiniteStock: false,
        mapId: 'village_01',
        x: 20,
        y: 20,
        tags: ['general', 'materials', 'food'],
        inventory: [
          { itemId: 'wood', quantity: 50 },
          { itemId: 'stone', quantity: 30 },
          { itemId: 'fiber', quantity: 20 },
          { itemId: 'bread', quantity: 15 },
          { itemId: 'apple', quantity: 20 },
          { itemId: 'coin', quantity: 100, infinite: true },
          { itemId: 'hay', quantity: 25 },
          { itemId: 'wheat_seed', quantity: 30 },
          { itemId: 'carrot_seed', quantity: 20 }
        ]
      },
      {
        id: 'food_stall',
        type: ShopType.FOOD,
        name: 'Food Stall',
        icon: '🍎',
        description: 'Fresh farm produce, cooked meals, and ingredients. Best prices for food.',
        buyMultiplier: 1.15,
        sellMultiplier: 0.8,
        infiniteStock: false,
        mapId: 'village_01',
        x: 22,
        y: 22,
        tags: ['food', 'cooked', 'farm'],
        inventory: [
          { itemId: 'bread', quantity: 20 },
          { itemId: 'apple', quantity: 30 },
          { itemId: 'carrot', quantity: 25 },
          { itemId: 'berry', quantity: 30 },
          { itemId: 'egg', quantity: 20 },
          { itemId: 'milk', quantity: 15 },
          { itemId: 'cheese', quantity: 10 },
          { itemId: 'soup', quantity: 10 },
          { itemId: 'fried_egg', quantity: 12 },
          { itemId: 'cake', quantity: 5 }
        ]
      },
      {
        id: 'tool_shop',
        type: ShopType.TOOL,
        name: 'Tool Shop',
        icon: '🔨',
        description: 'Tools, weapons, and rare materials. Sells and buys tools at good rates.',
        buyMultiplier: 1.3,
        sellMultiplier: 0.75,
        infiniteStock: false,
        mapId: 'village_01',
        x: 24,
        y: 20,
        tags: ['tools', 'weapons', 'rare'],
        inventory: [
          { itemId: 'axe', quantity: 5 },
          { itemId: 'pickaxe', quantity: 3 },
          { itemId: 'fishing_rod', quantity: 3 },
          { itemId: 'sickle', quantity: 4 },
          { itemId: 'ore', quantity: 20 },
          { itemId: 'gem', quantity: 5 },
          { itemId: 'wood', quantity: 30 },
          { itemId: 'stone', quantity: 20 }
        ]
      }
    ];

    for (const d of defs) {
      this.shops.set(d.id, d);
    }
    console.log(`[ShopDatabase] Loaded ${this.shops.size} shops`);
  }

  getShop(id: string): ShopDefinition | null {
    return this.shops.get(id.toLowerCase()) ?? null;
  }

  getAllShops(): ShopDefinition[] {
    return Array.from(this.shops.values());
  }

  getShopsByType(type: ShopType): ShopDefinition[] {
    return this.getAllShops().filter(s => s.type === type);
  }

  getCount(): number {
    return this.shops.size;
  }

  hasShop(id: string): boolean {
    return this.shops.has(id.toLowerCase());
  }

  registerShop(def: ShopDefinition): void {
    this.shops.set(def.id, def);
  }

  unregisterShop(id: string): boolean {
    return this.shops.delete(id.toLowerCase());
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const shop of this.shops.values()) {
      if (!shop.id) errors.push(`Shop missing id`);
      if (!shop.name) errors.push(`Shop ${shop.id} missing name`);
      if (!shop.type) errors.push(`Shop ${shop.id} missing type`);
      if (shop.buyMultiplier <= 0) errors.push(`Shop ${shop.id} invalid buyMultiplier`);
      if (shop.sellMultiplier <= 0) errors.push(`Shop ${shop.id} invalid sellMultiplier`);
      if (shop.inventory.length === 0) errors.push(`Shop ${shop.id} empty inventory`);
      for (const item of shop.inventory) {
        if (!item.itemId) errors.push(`Shop ${shop.id} has item without itemId`);
        if (item.quantity < 0) errors.push(`Shop ${shop.id} item ${item.itemId} negative quantity`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  getDebugString(): string {
    return `${this.shops.size} shops: ${Array.from(this.shops.keys()).join(', ')}`;
  }
}
