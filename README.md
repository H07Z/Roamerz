# Roamerz - Living World Adventure Game

A 2D top-down living-world adventure where NPCs live independently.

## Phases

```
PHASE 1  — Project Foundation [COMPLETE]
PHASE 2  — World Map [COMPLETE]
PHASE 3  — Player Movement [COMPLETE]
PHASE 4  — Collision System [COMPLETE]
PHASE 5  — Camera System [COMPLETE]
PHASE 6  — NPC Foundation [COMPLETE]
PHASE 7  — NPC Pathfinding [COMPLETE]
PHASE 8  — NPC Homes & Buildings [COMPLETE]
PHASE 9  — Time & NPC Schedules [COMPLETE]
PHASE 10 — NPC Life Simulation [COMPLETE]
PHASE 11 — Player Interaction & Dialogue [COMPLETE]
PHASE 12 — Exploration & World Expansion [COMPLETE]
PHASE 13 — Save/Load & World Persistence [COMPLETE]
PHASE 14 — Inventory System [COMPLETE]
PHASE 15 — Farming System [COMPLETE]
PHASE 16.1 — Animals / Livestock System [COMPLETE]
PHASE 16.2 — Crafting System [CURRENT]
PHASE 16.3 — Cooking System
PHASE 16.4 — Weather System
PHASE 16.5 — Economy / Shop System
```

## Phase 16.2 - Crafting System [CURRENT]

### Objective
Data-driven crafting recipes, ingredients consumption via inventory, result addItem, categories TOOL/FOOD/MATERIAL/FEED/POTION/MISC, optional station/tool, persistence crafted counts, debug, small controlled phase, preserve farming/animals/inventory.

### Crafting System
- **Recipe.ts**: RecipeCategory TOOL/FOOD/MATERIAL/FEED/POTION/MISC, RecipeIngredient {itemId,quantity}, RecipeDefinition {id,name,resultItemId,resultQuantity,ingredients[],category,requiredStation?,requiredTool?,timeSeconds?,description,icon,unlockedByDefault,tags?}, CraftingSaveData {recipesUnlocked:string[], totalCrafted, craftedCounts:Record, version}, createDefaultCraftingSaveData
- **RecipeDatabase.ts**: 12 recipes data-driven:
  - craft_axe 🪓 3 wood+2 stone → 1 axe TOOL
  - craft_pickaxe ⛏️ 3 wood+3 stone+1 ore → 1 pickaxe TOOL
  - craft_fishing_rod 🎣 3 wood+2 fiber → 1 fishing_rod TOOL
  - craft_sickle 🔪 2 wood+1 ore → 1 sickle TOOL
  - craft_bread 🍞 3 wheat → 1 bread FOOD
  - craft_bread_egg 🍞 2 wheat+1 egg → 2 bread FOOD (animal product integration)
  - craft_hay 🌾 2 wheat → 2 hay FEED (farm → feed)
  - craft_animal_feed 🥣 2 hay+1 wheat+1 carrot → 3 animal_feed FEED
  - craft_health_potion 🧪 2 herb+1 mushroom → 1 health_potion POTION
  - craft_stamina_potion ⚗️ 1 herb+2 berry+1 mushroom → 1 stamina_potion POTION
  - craft_fiber 🧵 1 wood → 2 fiber MATERIAL
  - craft_coin 🪙 1 ore → 10 coin MATERIAL
  Methods getRecipe, getAllRecipes, getRecipesByCategory, getUnlockedRecipes, getCount, hasRecipe, register/unregister, validate, getDebugString
- **CraftingSystem.ts**: manager database, recipesUnlocked Set (default unlocked), totalCrafted, craftedCounts Map, version 1. initialize logs. getDatabase, getUnlockedRecipeIds, getUnlockedRecipes, isUnlocked, unlockRecipe. canCraft(recipeId, inventory) checks exists, unlocked, missing ingredients {itemId,need,have}[], hasSpace with freeing slot logic (if ingredient qty==have, slot will free). craft(recipeId, inventory) checks canCraft, removes ingredients, adds result, rollback if add fails, increments totalCrafted and craftedCounts. getCraftableRecipes(inventory) filters unlocked by canCraft. getTotalCrafted, getCraftedCount, getSaveData/loadSaveData (preserves unlocked default + totals), clear, getDebugString, debugPrint
- **CraftingRenderer.ts**: render(ctx,w,h,craftingSystem,inventory) if showCrafting: box 640x500 center, title 🔨 CRAFTING, stats recipes filtered/total, craftable, totalCrafted, filter. Instructions Shift+C/ESC close, W/S navigate, Enter craft, C filter category, Shift+C toggle craftable only. Left panel list 240x350 rows 36, bg per row, category color dot (TOOL yellow, FOOD green, MATERIAL gray, FEED orange, POTION magenta, MISC cyan), icon, name, result icon+qty+name, ✓ craftable green / ✗ red. Scroll offset selectedIndex-visibleRows. Right panel detail  detailW = boxW-listW-60, shows icon name, category ID, description wrapped 42 chars, result with value stack rarity, ingredients list with have/need ✓/✗ green/red, craft status can/cannot reason, missing list, crafted count, action hint green box Enter to Craft. Footer version counts. renderQuickHint if not showing and craftable>0: small box 200x22 top-right 60px “🔨 X craftable! Press Shift+C”
- **test_crafting.ts**: manual tsx 15 checks: count 12, validation, categories TOOL 4 FEED 2, inventory wood5 stone3, canCraft axe, craft axe consumes 3 wood 2 stone adds axe, canCraft again fails missing, bread 3 wheat→1 bread, hay 2 wheat→2 hay, animal_feed, craftable list with many mats >=6, save/load round-trip, coin 1 ore→10 coin, health potion 2 herb+1 mushroom

### Save Extension Phase 16.2
- **SaveTypes.ts**: SAVE_VERSION 17 SAVE_GAME_VERSION 0.17.0, WorldSaveData.crafting now {recipesUnlocked, totalCrafted, craftedCounts, version:1} default {[],0,{},1}
- **SaveMigration.ts**: case 17 migrateToV17: old crafting missing → new {recipesUnlocked=[], totalCrafted 0, craftedCounts {}, version1}, preserves farming totals and animals totals

### Game Integration Phase 16.2
- **Fields**: recipeDatabase singleton, craftingSystem, craftingRenderer, showCrafting false, showCraftingDebug true
- **Constructor**: recipeDatabase = RecipeDatabase.getInstance(), craftingSystem = new CraftingSystem(recipeDatabase), craftingRenderer = new CraftingRenderer(itemDatabase, recipeDatabase)
- **Initialize**: log Phase 16.2, craftingSystem.initialize, RecipeDatabase count 12 debug, validation PASS, CraftingSystem debug, setShowCrafting false, logs Phase 16.2 controls
- **CollectSaveData**: craftingSave = craftingSystem.getSaveData() included in worldSave.crafting
- **ApplySaveData**: if (world as any).crafting load via craftingSystem.loadSaveData
- **NewGame**: craftingSystem.clear, reset showCrafting false
- **handleCraftingInput**: if showCrafting: ESC or Shift+C closes, W/S navigate filtered list (filter category + craftable only if player inventory), C cycles categories [null,TOOL,FOOD,MATERIAL,FEED,POTION,MISC], Shift+C toggles craftable only, Enter crafts selected recipe via craftingSystem.craft(player.inventory) add/remove, message 🔨 Crafted or ❌ failed. If not open and no dialogue/save/inventory: Shift+C toggles open, reset selectedIndex 0
- **Other inputs**: handleFarmingInput, handleAnimalInput, handleInventoryInput, handleMapTransitions, auto-save, time update, NPC/life, dialogue input all now also check isCraftingOpen to block. handleInventoryInput second check includes crafting open. Update calls handleCraftingInput after inventory before farming/animal
- **Debug**: farmingInfo, animalInfo, inventoryInfo, craftingInfo via DebugManager new interfaces. DebugManager phase label 17, box height includes farming/animal/inventory/crafting, renders INVENTORY, FARMING, ANIMALS, CRAFTING lines with counts and debug
- **Render**: if showCrafting && player → craftingRenderer.render, else if not inventory/dialogue/save → renderQuickHint with craftable count. Farming selected plot info and animals selected info now also require !showCrafting. Map edge hint also requires !showCrafting
- **Controls**: Shift+C toggle crafting UI (avoid WASD conflict, debug toggle uses F2/`), W/S navigate, Enter craft, C filter category, Shift+C toggle craftable only, Ctrl+Shift+C debug print crafting
- **Tests**: runPhase16_2Tests 12 tests:
  1 RecipeDatabase count 12
  2 validation
  3 inventory wood5 stone3
  4 canCraft axe
  5 craft axe consumes adds
  6 canCraft again fails missing
  7 canCraft bread + craft
  8 hay
  9 animal_feed
  10 craftable list >=4
  11 save/load round-trip preserves totalCrafted
  12 player craft axe integration
  Preserved Phase16.1 animals, Phase15 farming, Phase14 inventory

### DebugManager Phase 16.2
- Phase label 17, added FarmingDebugInfo, AnimalDebugInfo, InventoryDebugInfo, CraftingDebugInfo interfaces, fields, setters setFarmingInfo/setAnimalInfo/setInventoryInfo/setCraftingInfo, boxHeight includes new heights, renders INVENTORY DB count categories player used/capacity value count sort UI debug, FARMING crops debug map, ANIMALS types debug map, CRAFTING recipes unlocked crafted debug UI

### Tests (Phase 16.2)
- Test1 RecipeDatabase count 12 → PASS
- Test2 validation → PASS
- Test3 TOOL 4 FEED 2 → PASS
- Test4 inventory wood5 stone3 → PASS
- Test5 canCraft axe → PASS
- Test6 craft axe → PASS wood2 stone1 axe1
- Test7 canCraft again fails → PASS missing wood,stone
- Test8 bread 3 wheat→1 bread → PASS
- Test9 hay 2 wheat→2 hay → PASS
- Test10 animal_feed 2 hay+1 wheat+1 carrot→3 feed → PASS
- Test11 craftable list with many mats >=6 → PASS 10 found
- Test12 save/load totalCrafted → PASS
- Test13 coin 1 ore→10 coin → PASS
- Test14 health_potion → PASS
- Integration migration v16→v17 preserves animals 5 farming 2 → PASS
- Crafting chain hay → feed animal → PASS
- Build 75 modules 391.79kB → PASS
- Manual tsx crafting lifecycle PASS

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 16.2)
- **WASD/Arrows** - Move player, walk to edge road to travel between maps
- **TAB** - Minimap, **F** farming overlay, **Shift+F** fog, **Shift+M** full map, **Shift+G** animals overlay, **Shift+C** crafting UI (avoid WASD conflict)
- **E / Enter** - Interact: NPC/building (💬) highest priority, else near animal if produce ready collect (egg/milk/wool/truffle) → adds to inventory, else feed if has feed (hay/animal_feed/wheat/wheat_seed/carrot/berry/apple/carrot_seed/mushroom) consumes 1 and restores hunger+happiness, else pet → happiness up. Else farming: till farmland/grass, plant seed, water, harvest, clear withered. Prioritizes closer animal vs farm plot when both nearby, produce ready wins.
- **R** - Water nearby farm plot
- **I** - Inventory 33 items, WASD/Arrows navigate, Shift+S sort, C filter, M merge, Shift+O random items (includes egg/milk/wool/hay/feed/truffle)
- **Crafting UI (Shift+C)**:
  - W/S or Up/Down navigate recipes list
  - C filter category (ALL → TOOL → FOOD → MATERIAL → FEED → POTION → MISC)
  - Shift+C toggle craftable only filter
  - Enter craft selected if canCraft (consumes ingredients, adds result)
  - ESC or Shift+C close
  - Quick hint top-right when not open shows craftable count
  - Recipes: axe (3 wood+2 stone), pickaxe (3 wood+3 stone+1 ore), fishing_rod (3 wood+2 fiber), sickle (2 wood+1 ore), bread (3 wheat), egg bread (2 wheat+1 egg→2 bread), hay (2 wheat→2 hay), animal_feed (2 hay+1 wheat+1 carrot→3 feed), health_potion (2 herb+1 mushroom), stamina_potion (1 herb+2 berry+1 mushroom), fiber (1 wood→2 fiber), coin (1 ore→10 coin)
- **Shift+P** - Test farm plots 6, **Shift+U** - Test animals 4 (chicken,cow,sheep,pig), **Ctrl+Shift+C** - Debug print crafting
- **P** - Print all including farming nearby + animals nearby + crafting debug, **T** - Run all tests 7-16.2
- **Ctrl+S/L** quick save/load Slot0, **Ctrl+Shift+S/L** Save/Load UI, **Ctrl+N** new game, Auto-save 60s + map transition
- **Shift+R** reveal all, **Ctrl+R** reset exploration, **Shift+[ / ]** vision, **F1/F3/F4** jump maps
- **Space** pause, =/+ faster, -/_ slower, ] +1h, [ -1h, \ next phase, Shift+E clock
- **Q** schedule debug, ; , . needs/inventory/jobs, F10 boost 100%, F11 drain
- **C** center, **V** village, **Z** zoom, **X** smoothing, **K** collision, **N** paths, **M** nav grid, **J/L/U/Shift+I** building doors/labels/ownership/fronts, **G** grid, **B** coords, ` / F2 debug, **H** help, **R** reset

### Architecture

```
src/
├── crafting/
│   ├── Recipe.ts - RecipeCategory, RecipeIngredient, RecipeDefinition, CraftingSaveData
│   ├── RecipeDatabase.ts - 12 recipes TOOL/FOOD/MATERIAL/FEED/POTION/MISC, validation
│   ├── CraftingSystem.ts - canCraft/craft with inventory consumption, craftable list, save/load, totals
│   ├── CraftingRenderer.ts - UI overlay list + detail + quick hint, filters
│   └── test_crafting.ts - manual tsx 15 checks
├── animals/
│   ├── Animal.ts - states, types, definitions, data
│   ├── AnimalDatabase.ts - 4 animals chicken/cow/sheep/pig
│   ├── AnimalInstance.ts - feed/pet/collect/update wander
│   ├── AnimalSystem.ts - manager, persistence
│   ├── AnimalRenderer.ts - icons + bars + gold glow + minimap dots
│   └── test_animals.ts
├── farming/ - 4 crops, till/plant/water/harvest/wither, persistence
├── inventory/ - ItemType 33 types, 33 items
├── save/ - SAVE_VERSION 17, crafting totals, migrateToV17
├── exploration/ - fog, vision 8, minimap with animals dots colored gold when ready
├── world/ - 3 maps, transitions
├── core/Game.ts - + craftingSystem/renderer, Shift+C crafting UI, save/load crafting, P prints crafting, T runs 7-16.2
└── main.ts
```

### Previous Phases
- Phase16.1: Animals 4 types, feed/pet/produce/wander, hunger/happiness decay, 5 default spawn 22,22 23,22 15,32 16,32 24,23 village, always visible after fog, minimap colored dots yellow chicken #ffeb3b brown cow #8d6e63 white sheep #e0e0e0 pink pig #f48fb1 gold #ffd700 ready
- Phase15: Farming 4 crops, till/plant/water/harvest/wither, persistence, F overlay, E/R farming
- Phase14: Inventory 33 items, stackable/non-stackable, slots, sorting, save/load, I UI
- Phase13: Save/Load 5 slots, validation, migration, auto-save, new game
- Phase12: Exploration fog, minimap, 3 maps transitions
- Phase11: Interaction & Dialogue
- Phase10: Life needs inventory jobs
- Phase9: Time & Schedules
- Phase8: Buildings homes
- Phase7: Pathfinding A*
- Phase6: NPC foundation
- Phase5: Camera
- Phase4: Collision
- Phase3: Player
- Phase2: World map
- Phase1: Foundation

## Principles
Small changes, test before expanding, no unnecessary complexity, modular, data-driven, debug everything, placeholder graphics first
