/**
 * Inventory - Phase 14 Inventory System
 * Player inventory with slots, stackable/non-stackable, capacity, sorting
 * Reusable functions: addItem, removeItem, hasItem, getItemQuantity, hasSpace, clearInventory
 */

import { ItemDefinition, InventorySlot, InventorySaveData } from './Item';
import { ItemDatabase } from './ItemDatabase';

export enum SortMode {
  NAME = 'NAME',
  CATEGORY = 'CATEGORY',
  VALUE = 'VALUE',
  QUANTITY = 'QUANTITY',
  RARITY = 'RARITY',
  TYPE = 'TYPE'
}

export class Inventory {
  private slots: (InventorySlot | null)[];
  private capacity: number;
  private itemDatabase: ItemDatabase;
  private version: number = 1;

  // Stats
  private totalAdded: number = 0;
  private totalRemoved: number = 0;
  private totalValue: number = 0;

  constructor(capacity: number = 20, itemDatabase?: ItemDatabase) {
    this.capacity = Math.max(1, Math.min(capacity, 100));
    this.slots = new Array(this.capacity).fill(null);
    this.itemDatabase = itemDatabase ?? ItemDatabase.getInstance();
    console.log(`[Inventory] Created capacity ${this.capacity}`);
  }

  // --- Core API (required by spec) ---

  /**
   * Add item to inventory
   * Handles stackable: fills existing stacks first, then empty slots
   * Handles non-stackable: each quantity needs one empty slot
   * Returns true if all added, false if partially or not added
   */
  addItem(itemId: string, quantity: number = 1): boolean {
    if (quantity <= 0) return false;
    const definition = this.itemDatabase.getItem(itemId);
    if (!definition) {
      console.warn(`[Inventory] addItem: Item ${itemId} not found in database`);
      return false;
    }

    let remaining = quantity;
    const isStackable = definition.stackable;
    const maxStack = definition.maxStack;

    // For stackable: fill existing stacks first
    if (isStackable) {
      for (let i = 0; i < this.slots.length && remaining > 0; i++) {
        const slot = this.slots[i];
        if (slot && slot.id === itemId && slot.quantity < maxStack) {
          const space = maxStack - slot.quantity;
          const toAdd = Math.min(space, remaining);
          slot.quantity += toAdd;
          remaining -= toAdd;
        }
      }
    }

    // Use empty slots for remaining
    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      if (this.slots[i] === null) {
        if (isStackable) {
          const toAdd = Math.min(maxStack, remaining);
          this.slots[i] = {
            id: itemId,
            quantity: toAdd,
            definition,
            metadata: {}
          };
          remaining -= toAdd;
        } else {
          // Non-stackable: one per slot, quantity always 1
          this.slots[i] = {
            id: itemId,
            quantity: 1,
            definition,
            metadata: { durability: definition.durability ?? 100 }
          };
          remaining -= 1;
        }
      }
    }

    const added = quantity - remaining;
    if (added > 0) {
      this.totalAdded += added;
      this.recalculateValue();
      console.log(`[Inventory] Added ${added}x ${itemId} (${definition.name}), remaining ${remaining}, total slots used ${this.getUsedSlots()}/${this.capacity}`);
    }

    return remaining === 0;
  }

  /**
   * Remove item from inventory
   * Returns true if all removed, false if not enough
   */
  removeItem(itemId: string, quantity: number = 1): boolean {
    if (quantity <= 0) return false;
    if (!this.hasItem(itemId, quantity)) {
      return false;
    }

    let remaining = quantity;

    // Remove from slots (for stackable, remove from any, for non-stackable each slot is 1)
    // Prefer removing from smallest stacks first to keep large stacks?
    // For simplicity, iterate and remove

    // Sort slots by quantity ascending for stackable to preserve large stacks
    const indices = this.slots
      .map((slot, idx) => ({ slot, idx }))
      .filter(({ slot }) => slot && slot.id === itemId)
      .sort((a, b) => (a.slot!.quantity - b.slot!.quantity))
      .map(({ idx }) => idx);

    for (const i of indices) {
      if (remaining <= 0) break;
      const slot = this.slots[i];
      if (!slot) continue;

      if (slot.quantity <= remaining) {
        remaining -= slot.quantity;
        this.slots[i] = null;
      } else {
        slot.quantity -= remaining;
        remaining = 0;
      }
    }

    if (remaining === 0) {
      this.totalRemoved += quantity;
      this.recalculateValue();
      console.log(`[Inventory] Removed ${quantity}x ${itemId}, slots used ${this.getUsedSlots()}/${this.capacity}`);
      return true;
    }

    // Should not happen if hasItem check passed, but handle
    return false;
  }

  /**
   * Check if inventory has item with at least quantity
   */
  hasItem(itemId: string, quantity: number = 1): boolean {
    return this.getItemQuantity(itemId) >= quantity;
  }

  /**
   * Get total quantity of item in inventory
   */
  getItemQuantity(itemId: string): number {
    let total = 0;
    for (const slot of this.slots) {
      if (slot && slot.id === itemId) {
        total += slot.quantity;
      }
    }
    return total;
  }

  /**
   * Check if has space for item
   * For stackable: checks existing stack space + empty slots
   * For non-stackable: checks empty slots >= quantity
   */
  hasSpace(itemId?: string, quantity: number = 1): boolean {
    if (!itemId) {
      // Generic check: any empty slot
      return this.getFreeSlots() > 0;
    }

    const definition = this.itemDatabase.getItem(itemId);
    if (!definition) return false;

    if (definition.stackable) {
      let space = 0;
      for (const slot of this.slots) {
        if (slot === null) {
          space += definition.maxStack;
        } else if (slot.id === itemId) {
          space += definition.maxStack - slot.quantity;
        }
      }
      return space >= quantity;
    } else {
      // Non-stackable needs quantity empty slots
      return this.getFreeSlots() >= quantity;
    }
  }

  /**
   * Clear inventory
   */
  clearInventory(): void {
    this.slots.fill(null);
    this.totalAdded = 0;
    this.totalRemoved = 0;
    this.totalValue = 0;
    console.log('[Inventory] Cleared');
  }

  // --- Additional helpers ---

  getItems(): (InventorySlot | null)[] {
    return [...this.slots];
  }

  getNonEmptySlots(): InventorySlot[] {
    return this.slots.filter((s): s is InventorySlot => s !== null);
  }

  getUsedSlots(): number {
    return this.slots.filter(s => s !== null).length;
  }

  getFreeSlots(): number {
    return this.capacity - this.getUsedSlots();
  }

  getCapacity(): number {
    return this.capacity;
  }

  setCapacity(newCapacity: number): void {
    const cap = Math.max(1, Math.min(newCapacity, 100));
    if (cap === this.capacity) return;

    if (cap < this.capacity) {
      // Check if we would lose items
      const used = this.getUsedSlots();
      if (used > cap) {
        console.warn(`[Inventory] Cannot reduce capacity to ${cap}, ${used} slots used`);
        return;
      }
    }

    const newSlots: (InventorySlot | null)[] = new Array(cap).fill(null);
    let idx = 0;
    for (const slot of this.slots) {
      if (slot !== null && idx < cap) {
        newSlots[idx++] = slot;
      }
    }
    this.slots = newSlots;
    this.capacity = cap;
    console.log(`[Inventory] Capacity set to ${cap}`);
  }

  getTotalItemCount(): number {
    let total = 0;
    for (const slot of this.slots) {
      if (slot) total += slot.quantity;
    }
    return total;
  }

  getTotalValue(): number {
    return this.totalValue;
  }

  // Helper for tests: get slots by item id
  getSlotsByItemId(itemId: string): InventorySlot[] {
    return this.slots.filter((s): s is InventorySlot => s !== null && s.id === itemId);
  }

  // Alias for clearInventory for compatibility
  clear(): void {
    this.clearInventory();
  }

  // Alias for getDetailedDebugString for Game.ts compatibility
  getInventoryDetailedString(): string {
    return this.getDetailedDebugString();
  }

  private recalculateValue(): void {
    let total = 0;
    for (const slot of this.slots) {
      if (slot) {
        const def = slot.definition ?? this.itemDatabase.getItem(slot.id);
        if (def) {
          total += def.value * slot.quantity;
        }
      }
    }
    this.totalValue = total;
  }

  // Sorting
  sort(mode: SortMode = SortMode.NAME): void {
    const nonEmpty = this.getNonEmptySlots();

    nonEmpty.sort((a, b) => {
      const defA = a.definition ?? this.itemDatabase.getItem(a.id);
      const defB = b.definition ?? this.itemDatabase.getItem(b.id);
      if (!defA || !defB) return 0;

      switch (mode) {
        case SortMode.NAME:
          return defA.name.localeCompare(defB.name);
        case SortMode.CATEGORY:
          if (defA.category === defB.category) {
            return defA.name.localeCompare(defB.name);
          }
          return defA.category.localeCompare(defB.category);
        case SortMode.VALUE:
          return defB.value - defA.value; // descending value
        case SortMode.QUANTITY:
          return b.quantity - a.quantity; // descending quantity
        case SortMode.RARITY:
          const rarityOrder = { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4 };
          const ra = rarityOrder[defA.rarity as keyof typeof rarityOrder] ?? 0;
          const rb = rarityOrder[defB.rarity as keyof typeof rarityOrder] ?? 0;
          if (ra === rb) return defA.name.localeCompare(defB.name);
          return rb - ra;
        case SortMode.TYPE:
          if (defA.type === defB.type) return defA.name.localeCompare(defB.name);
          return String(defA.type).localeCompare(String(defB.type));
        default:
          return 0;
      }
    });

    // Rebuild slots array with sorted items first, then empty
    this.slots.fill(null);
    for (let i = 0; i < nonEmpty.length && i < this.capacity; i++) {
      this.slots[i] = nonEmpty[i];
    }

    console.log(`[Inventory] Sorted by ${mode}, ${nonEmpty.length} items`);
  }

  // Check item
  getSlot(index: number): InventorySlot | null {
    if (index < 0 || index >= this.capacity) return null;
    return this.slots[index];
  }

  // Swap slots
  swapSlots(indexA: number, indexB: number): boolean {
    if (indexA < 0 || indexA >= this.capacity || indexB < 0 || indexB >= this.capacity) return false;
    const temp = this.slots[indexA];
    this.slots[indexA] = this.slots[indexB];
    this.slots[indexB] = temp;
    return true;
  }

  // Merge stacks
  mergeStacks(): void {
    // For each item id, merge quantities into as few stacks as possible
    const grouped = new Map<string, { total: number; definition: ItemDefinition | undefined }>();

    for (const slot of this.slots) {
      if (slot) {
        const existing = grouped.get(slot.id);
        if (existing) {
          existing.total += slot.quantity;
        } else {
          grouped.set(slot.id, { total: slot.quantity, definition: slot.definition ?? this.itemDatabase.getItem(slot.id) });
        }
      }
    }

    this.slots.fill(null);
    let slotIdx = 0;

    for (const [id, { total, definition }] of grouped.entries()) {
      if (!definition) continue;
      if (!definition.stackable) {
        // Non-stackable: one per slot
        for (let i = 0; i < total && slotIdx < this.capacity; i++) {
          this.slots[slotIdx++] = {
            id,
            quantity: 1,
            definition,
            metadata: { durability: definition.durability ?? 100 }
          };
        }
      } else {
        let remaining = total;
        while (remaining > 0 && slotIdx < this.capacity) {
          const toAdd = Math.min(definition.maxStack, remaining);
          this.slots[slotIdx++] = {
            id,
            quantity: toAdd,
            definition,
            metadata: {}
          };
          remaining -= toAdd;
        }
      }
    }

    this.recalculateValue();
    console.log(`[Inventory] Merged stacks, used ${this.getUsedSlots()}/${this.capacity}`);
  }

  // Save/Load
  getSaveData(): InventorySaveData {
    // Clone slots without definition (to save space, definition can be looked up on load)
    const saveSlots = this.slots.map(slot => {
      if (!slot) return null;
      return {
        id: slot.id,
        itemId: slot.id, // alias for SaveTypes compat
        quantity: slot.quantity,
        metadata: slot.metadata
      };
    });

    return {
      slots: saveSlots as any,
      capacity: this.capacity,
      version: this.version,
      totalValue: this.totalValue
    };
  }

  loadSaveData(data: any): void {
    if (!data) return;
    try {
      const capacity = typeof data.capacity === 'number' ? data.capacity : this.capacity;
      this.setCapacity(capacity);

      if (Array.isArray(data.slots)) {
        this.slots.fill(null);
        // Handle both fixed-size array with nulls (internal format) and compact array (SaveTypes format)
        const isCompact = data.slots.length > 0 && data.slots.every((s: any) => s && (s.itemId || s.id) && !data.slots.includes(null));
        // Actually check if array contains nulls - if it does, treat as fixed-size, else compact
        const hasNulls = data.slots.some((s: any) => s === null);
        if (hasNulls || data.slots.length === this.capacity) {
          // Fixed-size format: slots[i] = null or {id, quantity}
          for (let i = 0; i < Math.min(data.slots.length, this.capacity); i++) {
            const savedSlot = data.slots[i];
            if (!savedSlot) {
              this.slots[i] = null;
            } else {
              const itemId = savedSlot.id ?? savedSlot.itemId;
              const def = this.itemDatabase.getItem(itemId);
              if (!def) {
                console.warn(`[Inventory] Load: Item ${itemId} not found in database, skipping`);
                continue;
              }
              this.slots[i] = {
                id: itemId,
                quantity: typeof savedSlot.quantity === 'number' ? savedSlot.quantity : 1,
                definition: def,
                metadata: savedSlot.metadata ?? {}
              };
            }
          }
        } else {
          // Compact format: array of {itemId, quantity} non-null, fill sequentially
          let idx = 0;
          for (const savedSlot of data.slots) {
            if (idx >= this.capacity) break;
            if (!savedSlot) continue;
            const itemId = savedSlot.itemId ?? savedSlot.id;
            if (!itemId) continue;
            const def = this.itemDatabase.getItem(itemId);
            if (!def) {
              console.warn(`[Inventory] Load: Item ${itemId} not found in database, skipping`);
              continue;
            }
            this.slots[idx++] = {
              id: itemId,
              quantity: typeof savedSlot.quantity === 'number' ? savedSlot.quantity : 1,
              definition: def,
              metadata: savedSlot.metadata ?? {}
            };
          }
        }
      } else if (Array.isArray(data.items)) {
        // Legacy format from Player placeholder: items = [{id, quantity}] or [{itemId, count}]
        this.slots.fill(null);
        let idx = 0;
        for (const item of data.items) {
          if (idx >= this.capacity) break;
          const itemId = item.id ?? item.itemId ?? item.itemId;
          if (!itemId) continue;
          const qty = typeof item.quantity === 'number' ? item.quantity : (typeof item.count === 'number' ? item.count : 1);
          const def = this.itemDatabase.getItem(itemId);
          if (!def) continue;
          if (def.stackable) {
            this.slots[idx++] = {
              id: itemId,
              quantity: qty,
              definition: def,
              metadata: {}
            };
          } else {
            for (let q = 0; q < qty && idx < this.capacity; q++) {
              this.slots[idx++] = {
                id: itemId,
                quantity: 1,
                definition: def,
                metadata: {}
              };
            }
          }
        }
      }

      this.recalculateValue();
      console.log(`[Inventory] Loaded save: ${this.getUsedSlots()}/${this.capacity} slots, ${this.getTotalItemCount()} items, value ${this.totalValue}`);
    } catch (e) {
      console.error('[Inventory] Failed to load save data:', e);
    }
  }

  // For testing and debug
  getDebugString(): string {
    const items = this.getNonEmptySlots();
    if (items.length === 0) return 'Empty';
    return items.map(slot => {
      const def = slot.definition ?? this.itemDatabase.getItem(slot.id);
      const icon = def?.icon ?? '❓';
      return `${icon}${slot.quantity > 1 ? `x${slot.quantity}` : ''}`;
    }).join(' ');
  }

  getDetailedDebugString(): string {
    const items = this.getNonEmptySlots();
    if (items.length === 0) return 'Inventory Empty';
    const lines = items.map(slot => {
      const def = slot.definition ?? this.itemDatabase.getItem(slot.id);
      return `${def?.icon ?? '❓'} ${def?.name ?? slot.id} x${slot.quantity} (value ${def?.value ?? 0} each)`;
    });
    return `${this.getUsedSlots()}/${this.capacity} slots, ${this.getTotalItemCount()} items, value ${this.totalValue}\n  ` + lines.join('\n  ');
  }

  getStats(): { used: number; free: number; capacity: number; totalCount: number; totalValue: number; totalAdded: number; totalRemoved: number } {
    return {
      used: this.getUsedSlots(),
      free: this.getFreeSlots(),
      capacity: this.capacity,
      totalCount: this.getTotalItemCount(),
      totalValue: this.totalValue,
      totalAdded: this.totalAdded,
      totalRemoved: this.totalRemoved
    };
  }

  // For Phase 14 testing - fill with random items
  fillWithTestItems(): void {
    this.clearInventory();
    const testItems = ['apple', 'wood', 'stone', 'berry', 'flower', 'coin'];
    for (let i = 0; i < Math.min(testItems.length, this.capacity); i++) {
      const id = testItems[i];
      const qty = Math.floor(Math.random() * 5) + 1;
      this.addItem(id, qty);
    }
    // Add non-stackable
    if (this.getFreeSlots() >= 2) {
      this.addItem('axe', 1);
      this.addItem('pickaxe', 1);
    }
  }
}
