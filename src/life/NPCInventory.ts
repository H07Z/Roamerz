/**
 * NPCInventory - Phase 10 NPC Life Simulation
 * Simple inventory system for NPCs
 */

export enum ItemType {
  FOOD = 'FOOD',
  CROP = 'CROP',
  TOOL = 'TOOL',
  WOOD = 'WOOD',
  STONE = 'STONE',
  COIN = 'COIN',
  FLOWER = 'FLOWER',
  FISH = 'FISH',
  BREAD = 'BREAD',
  POTION = 'POTION'
}

export interface ItemProperties {
  type: ItemType;
  name: string;
  icon: string;
  color: string;
  stackable: boolean;
  maxStack: number;
  value: number;
  description: string;
}

const ITEM_PROPERTIES: Record<ItemType, ItemProperties> = {
  [ItemType.FOOD]: {
    type: ItemType.FOOD,
    name: 'Food',
    icon: '🍎',
    color: '#4caf50',
    stackable: true,
    maxStack: 20,
    value: 5,
    description: 'Restores hunger'
  },
  [ItemType.CROP]: {
    type: ItemType.CROP,
    name: 'Crop',
    icon: '🌾',
    color: '#ffeb3b',
    stackable: true,
    maxStack: 50,
    value: 3,
    description: 'Harvested crops'
  },
  [ItemType.TOOL]: {
    type: ItemType.TOOL,
    name: 'Tool',
    icon: '🔨',
    color: '#795548',
    stackable: false,
    maxStack: 1,
    value: 20,
    description: 'Work tool'
  },
  [ItemType.WOOD]: {
    type: ItemType.WOOD,
    name: 'Wood',
    icon: '🪵',
    color: '#8d6e63',
    stackable: true,
    maxStack: 30,
    value: 2,
    description: 'Building material'
  },
  [ItemType.STONE]: {
    type: ItemType.STONE,
    name: 'Stone',
    icon: '🪨',
    color: '#9e9e9e',
    stackable: true,
    maxStack: 30,
    value: 2,
    description: 'Building material'
  },
  [ItemType.COIN]: {
    type: ItemType.COIN,
    name: 'Coin',
    icon: '🪙',
    color: '#ffc107',
    stackable: true,
    maxStack: 999,
    value: 1,
    description: 'Currency'
  },
  [ItemType.FLOWER]: {
    type: ItemType.FLOWER,
    name: 'Flower',
    icon: '🌸',
    color: '#e91e63',
    stackable: true,
    maxStack: 10,
    value: 4,
    description: 'Gift for social'
  },
  [ItemType.FISH]: {
    type: ItemType.FISH,
    name: 'Fish',
    icon: '🐟',
    color: '#03a9f4',
    stackable: true,
    maxStack: 10,
    value: 8,
    description: 'Food from fishing'
  },
  [ItemType.BREAD]: {
    type: ItemType.BREAD,
    name: 'Bread',
    icon: '🍞',
    color: '#d7ccc8',
    stackable: true,
    maxStack: 10,
    value: 10,
    description: 'Restores hunger well'
  },
  [ItemType.POTION]: {
    type: ItemType.POTION,
    name: 'Potion',
    icon: '🧪',
    color: '#9c27b0',
    stackable: true,
    maxStack: 5,
    value: 25,
    description: 'Restores health'
  }
};

export function getItemProperties(type: ItemType): ItemProperties {
  return ITEM_PROPERTIES[type];
}

export class NPCInventory {
  private items: Map<ItemType, number> = new Map();
  private readonly npcId: string;
  private maxSlots: number = 10;
  private totalItemsCollected: number = 0;
  private totalItemsUsed: number = 0;

  constructor(npcId: string) {
    this.npcId = npcId;
    // Start with some basic items based on role
    this.initializeForRole();
  }

  private initializeForRole(): void {
    // Will be set by LifeManager based on role
    // Default: small amount of food and coins
    this.items.set(ItemType.COIN, 10 + Math.floor(Math.random() * 20));
    this.items.set(ItemType.FOOD, 2 + Math.floor(Math.random() * 3));
  }

  initializeForJob(jobType: string): void {
    this.items.clear();
    
    switch (jobType) {
      case 'FARMER':
        this.items.set(ItemType.CROP, 5);
        this.items.set(ItemType.FOOD, 3);
        this.items.set(ItemType.TOOL, 1);
        this.items.set(ItemType.COIN, 15);
        break;
      case 'SHOPKEEPER':
        this.items.set(ItemType.COIN, 50);
        this.items.set(ItemType.FOOD, 5);
        this.items.set(ItemType.BREAD, 3);
        this.items.set(ItemType.POTION, 2);
        break;
      case 'BLACKSMITH':
        this.items.set(ItemType.TOOL, 2);
        this.items.set(ItemType.STONE, 10);
        this.items.set(ItemType.WOOD, 5);
        this.items.set(ItemType.COIN, 30);
        break;
      case 'VILLAGER':
        this.items.set(ItemType.FOOD, 2);
        this.items.set(ItemType.WOOD, 3);
        this.items.set(ItemType.COIN, 20);
        this.items.set(ItemType.FLOWER, 2);
        break;
      case 'CHILD':
        this.items.set(ItemType.FLOWER, 5);
        this.items.set(ItemType.FOOD, 1);
        this.items.set(ItemType.COIN, 5);
        break;
      default:
        this.items.set(ItemType.COIN, 10);
        this.items.set(ItemType.FOOD, 2);
        break;
    }
  }

  addItem(type: ItemType, amount: number = 1): boolean {
    const current = this.items.get(type) ?? 0;
    const props = getItemProperties(type);
    
    if (props.stackable) {
      if (current + amount > props.maxStack) {
        // Cap at max stack
        this.items.set(type, props.maxStack);
        this.totalItemsCollected += props.maxStack - current;
        return false; // Could not add all
      }
      this.items.set(type, current + amount);
    } else {
      // Non-stackable, just count
      this.items.set(type, current + amount);
    }
    
    this.totalItemsCollected += amount;
    return true;
  }

  removeItem(type: ItemType, amount: number = 1): boolean {
    const current = this.items.get(type) ?? 0;
    if (current < amount) return false;
    
    const newAmount = current - amount;
    if (newAmount <= 0) {
      this.items.delete(type);
    } else {
      this.items.set(type, newAmount);
    }
    
    this.totalItemsUsed += amount;
    return true;
  }

  hasItem(type: ItemType, amount: number = 1): boolean {
    return (this.items.get(type) ?? 0) >= amount;
  }

  getItemCount(type: ItemType): number {
    return this.items.get(type) ?? 0;
  }

  getAllItems(): Map<ItemType, number> {
    return new Map(this.items);
  }

  getTotalItemCount(): number {
    let total = 0;
    for (const count of this.items.values()) {
      total += count;
    }
    return total;
  }

  getTotalValue(): number {
    let total = 0;
    for (const [type, count] of this.items.entries()) {
      const props = getItemProperties(type);
      total += props.value * count;
    }
    return total;
  }

  useFood(): boolean {
    // Try bread first, then food, then fish
    if (this.hasItem(ItemType.BREAD, 1)) {
      this.removeItem(ItemType.BREAD, 1);
      return true;
    }
    if (this.hasItem(ItemType.FOOD, 1)) {
      this.removeItem(ItemType.FOOD, 1);
      return true;
    }
    if (this.hasItem(ItemType.FISH, 1)) {
      this.removeItem(ItemType.FISH, 1);
      return true;
    }
    return false;
  }

  canAfford(cost: Map<ItemType, number>): boolean {
    for (const [type, amount] of cost.entries()) {
      if (!this.hasItem(type, amount)) return false;
    }
    return true;
  }

  clear(): void {
    this.items.clear();
  }

  getDebugString(): string {
    const parts: string[] = [];
    for (const [type, count] of this.items.entries()) {
      const props = getItemProperties(type);
      parts.push(`${props.icon}${count}`);
    }
    return parts.join(' ') || 'Empty';
  }

  getStats(): {
    totalCollected: number;
    totalUsed: number;
    totalValue: number;
    totalCount: number;
    itemCount: number;
  } {
    return {
      totalCollected: this.totalItemsCollected,
      totalUsed: this.totalItemsUsed,
      totalValue: this.getTotalValue(),
      totalCount: this.getTotalItemCount(),
      itemCount: this.items.size
    };
  }
}
