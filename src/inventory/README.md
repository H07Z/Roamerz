# Inventory System - Phase 14

## Overview
Player inventory with slots, stackable/non-stackable items, capacity, sorting, data-driven item database.

## Files
- `Item.ts` - Item types, categories, rarity, slot interfaces
- `ItemDatabase.ts` - Data-driven database of 25+ items (food, materials, tools, seeds, potions, treasure, quest, misc), validation, search, extensible registration
- `Inventory.ts` - Core inventory class with required API: addItem, removeItem, hasItem, getItemQuantity, hasSpace, clearInventory, plus sorting, merging, swapping, save/load
- `InventoryRenderer.ts` - UI overlay for inventory grid, item details, hotbar

## Item Database
Data-driven, not hard-coded logic:
```ts
{
  id: "apple",
  name: "Apple",
  type: "apple",
  category: "FOOD",
  rarity: "COMMON",
  stackable: true,
  maxStack: 20,
  value: 5,
  icon: "🍎",
  description: "...",
  effects: { health: 5, hunger: 15 },
  tags: ["edible", "gatherable"]
}
```

25 items covering all future needs: apple, bread, fish, berry, mushroom, herb, wood, stone, ore, fiber, clay, axe, pickaxe, fishing_rod, sickle, wheat_seed, carrot_seed, health_potion, stamina_potion, coin, gem, letter, key, flower, feather.

## Inventory Features
- **Slots**: Fixed capacity (default 20, max 100), each slot null or {id, quantity, definition, metadata}
- **Stackable**: Fills existing stacks up to maxStack first, then empty slots
- **Non-stackable**: Each quantity needs one empty slot, quantity always 1 per slot, metadata for durability
- **API**: 
  - `addItem(id, qty)` → boolean (all added)
  - `removeItem(id, qty)` → boolean
  - `hasItem(id, qty)` → boolean
  - `getItemQuantity(id)` → number
  - `hasSpace(id?, qty)` → boolean
  - `clearInventory()`
  - `getItems()`, `getNonEmptySlots()`, `getUsedSlots()`, `getFreeSlots()`, `getTotalItemCount()`, `getTotalValue()`
  - `sort(mode)` — NAME, CATEGORY, VALUE, QUANTITY, RARITY, TYPE
  - `mergeStacks()`, `swapSlots(a,b)`, `setCapacity()`
  - `getSaveData()` / `loadSaveData()` — handles legacy format from Player placeholder
- **Sorting**: By name, category, value (desc), quantity (desc), rarity, type
- **Save/Load**: Slots array with id/quantity/metadata, capacity, version, handles legacy items array format

## Controls (Phase 14)
- I: Toggle inventory UI (moved building fronts to Shift+I)
- ESC: Close inventory
- ARROWS/WASD: Select slot in inventory
- S: Cycle sort mode (NAME→CATEGORY→VALUE→QUANTITY→RARITY→TYPE)
- C: Clear inventory
- M: Merge stacks
- Q: Drop selected (remove 1)
- 1-5: Test add items (apple, wood, stone, berry, coin) when inventory open
- Shift+I: Toggle building fronts debug (was I)

## Testing
- T runs all tests including Phase 14
- P prints inventory debug
- Inventory persists via save/load (Phase 13)
