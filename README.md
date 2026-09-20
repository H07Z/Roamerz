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
PHASE 16.2 — Crafting System [COMPLETE]
PHASE 16.3 — Cooking System [CURRENT]
PHASE 16.4 — Weather System
PHASE 16.5 — Economy / Shop System
```

## Phase 16.3 - Cooking System [CURRENT]

### Objective
Data-driven cooking recipes, ingredients consumption via inventory, result addItem, stations campfire/stove/kitchen display, categories BREAKFAST/MEAL/SOUP/DESSERT/DAIRY/MISC, persistence cooked counts, debug, small controlled phase, preserve farming/animals/crafting/inventory.

### Cooking System
- **CookingRecipe.ts**: CookingCategory BREAKFAST/MEAL/SOUP/DESSERT/DAIRY/MISC, CookingIngredient {itemId,quantity}, CookingRecipeDefinition {id,name,resultItemId,resultQuantity,ingredients[],category,requiredStation?,cookingTimeSeconds?,description,icon,unlockedByDefault,tags?,effects?}, CookingSaveData {recipesUnlocked, totalCooked, cookedCounts, version}, createDefaultCookingSaveData
- **CookingDatabase.ts**: 10 recipes data-driven:
  - cook_fried_egg 🍳 1 egg → 1 fried_egg BREAKFAST campfire 5s
  - cook_omelette 🥘 2 egg+1 milk+1 mushroom → 1 omelette BREAKFAST stove 15s
  - cook_cheese 🧀 2 milk → 1 cheese DAIRY kitchen 30s
  - cook_pancake 🥞 1 wheat+1 egg+1 milk → 2 pancake BREAKFAST stove 20s
  - cook_soup 🍲 1 carrot+1 mushroom+1 herb → 1 soup SOUP campfire 15s
  - cook_stew 🍛 1 carrot+1 wheat+1 mushroom+1 milk → 1 stew MEAL stove 25s
  - cook_cake 🍰 2 wheat+2 egg+1 milk+2 berry → 1 cake DESSERT kitchen 40s
  - cook_salad 🥗 1 carrot+1 berry+1 herb → 1 salad MEAL kitchen 10s
  - cook_truffle_soup 🍲 1 truffle+1 milk+1 mushroom → 2 soup SOUP kitchen 30s (rare animal product)
  - cook_egg_bread 🍞 2 wheat+1 egg+1 cheese → 2 bread MEAL kitchen 20s (dairy chain)
  Methods getRecipe, getAllRecipes, getRecipesByCategory, getUnlockedRecipes, getCount, hasRecipe, register/unregister, validate, getDebugString
- **CookingSystem.ts**: manager database, recipesUnlocked Set default, totalCooked, cookedCounts Map, version1. initialize logs. getDatabase, getUnlockedRecipeIds, getUnlockedRecipes, isUnlocked, unlockRecipe. canCook checks exists, unlocked, missing {itemId,need,have}[], hasSpace freeing logic. cook consumes ingredients, adds result rollback on fail, increments totalCooked. getCookableRecipes, getTotalCooked, getCookedCount, getSaveData/loadSaveData, clear, debug
- **CookingRenderer.ts**: render(ctx,w,h,cookingSystem,inventory) if showCooking: box 640x500, title 🍳 COOKING, stats filtered/total cookable totalCooked filter. Instructions Shift+K/ESC close, W/S navigate, Enter cook, C filter category, Ctrl+Shift+K toggle cookable only. Left list 240x350 rows 36 category color dots (BREAKFAST yellow #ffeb3b, MEAL green #8f8, SOUP brown #8d6e63, DESSERT pink #f48fb1, DAIRY white #fff9c4, MISC cyan #8ff), icon, name, result icon+qty+name, ✓ green / ✗ red. Right detail shows icon name, category station time, description wrapped 42 chars, result value stack rarity, effects hunger/health/stamina, ingredients have/need, cook status, missing list, cooked count, action hint orange box Enter to Cook. Footer version counts. renderQuickHint if not showing and cookable>0: small box 200x22 at 85px y “🍳 X cookable! Press Shift+K”
- **test_cooking.ts**: manual tsx 15 checks: count 10, validation, categories BREAKFAST 3 SOUP 2, inventory egg2 milk1 mushroom1, canCook omelette, cook omelette consumes adds, cheese 2 milk→1 cheese, soup, cake, cookable list 9 with many mats, save/load totalCooked, fried_egg, truffle_soup 1→2, new items exist 8 db count 41

### Inventory Extension Phase 16.3
- **Item.ts**: adds FRIED_EGG, OMELETTE, CHEESE, CAKE, SOUP, STEW, PANCAKE, SALAD (now 41 types)
- **ItemDatabase.ts**: 41 items, adds:
  - fried_egg 🍳 value15 hunger35 health5 stamina10 food cooked breakfast
  - omelette 🥘 value35 hunger60 health15 stamina20 food cooked breakfast uncommon
  - cheese 🧀 value20 hunger40 health8 food cooked dairy
  - cake 🍰 value60 hunger80 health25 stamina30 food cooked dessert uncommon
  - soup 🍲 value25 hunger50 health12 stamina15 food cooked soup
  - stew 🍛 value40 hunger75 health20 stamina25 food cooked meal uncommon
  - pancake 🥞 value30 hunger55 health10 stamina20 food cooked breakfast
  - salad 🥗 value22 hunger35 health15 stamina10 food cooked meal healthy

### Save Extension Phase 16.3
- **SaveTypes.ts**: SAVE_VERSION 18 SAVE_GAME_VERSION 0.18.0, WorldSaveData.cooking now {recipesUnlocked, totalCooked, cookedCounts, version:1} default, PlayerSaveData cooking placeholder
- **SaveMigration.ts**: case 18 migrateToV18: old cooking missing → new {recipesUnlocked=[], totalCooked 0, cookedCounts {}, version1}, preserves crafting 3, farming 2, animals 5

### Game Integration Phase 16.3
- **Fields**: cookingDatabase singleton, cookingSystem, cookingRenderer, showCooking false, showCookingDebug true
- **Constructor**: cookingDatabase = CookingDatabase.getInstance(), cookingSystem = new CookingSystem(cookingDatabase), cookingRenderer = new CookingRenderer(itemDatabase, cookingDatabase)
- **Initialize**: log Phase 16.3, cookingSystem.initialize, CookingDatabase count 10 debug, validation PASS, CookingSystem debug, setShowCooking false, logs Phase 16.3 controls
- **CollectSaveData**: cookingSave = cookingSystem.getSaveData() included in worldSave.cooking
- **ApplySaveData**: if world.cooking load via cookingSystem.loadSaveData
- **NewGame**: cookingSystem.clear, reset showCooking false
- **handleCookingInput**: if showCooking: ESC or Shift+K closes, W/S navigate filtered list (category + cookable only), C cycles categories [null,BREAKFAST,MEAL,SOUP,DESSERT,DAIRY,MISC], Ctrl+Shift+K toggles cookable only, Enter cooks selected via cookingSystem.cook(player.inventory) message 🍳 Cooked or ❌ failed. If not open and no dialogue/save/inventory/crafting: Shift+K toggles open, reset selectedIndex 0
- **Other inputs**: handleFarmingInput, handleAnimalInput, handleInventoryInput, handleCraftingInput, handleMapTransitions, auto-save, time, NPC/life, dialogue input all now also check isCookingOpen. handleInventoryInput second check includes cooking. Update calls handleCookingInput after crafting before farming/animal. handleDebugToggles now also checks showCooking, obstacle toggle moved from Shift+K to Ctrl+Shift+K to free Shift+K for cooking UI, Ctrl+Shift+C debug crafting still, cooking debug via (debug as any).setCookingInfo
- **Debug**: cookingInfo via DebugManager new interface. DebugManager phase label 18, box height includes cooking, renders COOKING line with recipes unlocked cooked debug UI
- **Render**: if showCrafting → crafting UI, else if showCooking → cooking UI, else if no UI → quick hints both crafting (60px y) and cooking (85px y). Farming/animal info now also requires !showCooking. Map edge hint requires !showCooking
- **Controls**: Shift+K toggle cooking UI (was obstacle toggle now Ctrl+Shift+K), W/S navigate, Enter cook, C filter category, Ctrl+Shift+K toggle cookable only, also Ctrl+Shift+C for crafting filter. Quick hints for both systems
- **Tests**: runPhase16_3Tests 12 tests:
  1 CookingDatabase count 10
  2 validation
  3 inventory egg2 milk1 mushroom1
  4 canCook omelette
  5 cook omelette consumes adds
  6 cheese 2 milk→1
  7 soup
  8 cake
  9 cookable list >=6
  10 save/load round-trip
  11 player cook fried_egg
  12 crafting chain hay→feed
  Preserved Phase16.2 crafting 12 recipes, Phase16.1 animals 4 types 5 default spawn, Phase15 farming

### DebugManager Phase 16.3
- Phase label 18, added CookingDebugInfo interface, field cookingInfo, setter setCookingInfo, boxHeight includes cookingHeight, renders COOKING recipes unlocked cooked debug UI orange #ffb74d

### Tests (Phase 16.3)
- Test1 CookingDatabase count 10 → PASS
- Test2 validation → PASS
- Test3 BREAKFAST 3 SOUP 2 → PASS
- Test4 inventory egg2 milk1 mushroom1 → PASS
- Test5 canCook omelette → PASS
- Test6 cook omelette → PASS egg0 milk0 mushroom0 omelette1
- Test7 cheese 2 milk→1 cheese → PASS
- Test8 soup carrot+mushroom+herb→1 soup → PASS
- Test9 cake 2 wheat+2 egg+1 milk+2 berry→1 cake → PASS
- Test10 cookable list with many mats 9 → PASS
- Test11 save/load totalCooked 4→4 PASS
- Test12 fried_egg 1 egg→1 PASS
- Test13 truffle_soup 1 truffle+1 milk+1 mushroom→2 soup PASS
- Test14 new cooked items 8 exist db count 41 → PASS
- Integration migration v17→v18 preserves crafting 3 → PASS
- Full chain craft bread PASS, cook fried_egg PASS, cheese from milk PASS, cake from farm+animal PASS
- Build 79 modules 424.20kB → PASS
- Manual tsx cooking lifecycle PASS

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 16.3)
- **WASD/Arrows** - Move player, walk to edge road to travel between maps
- **TAB** - Minimap, **F** farming overlay, **Shift+F** fog, **Shift+M** full map, **Shift+G** animals overlay, **Shift+C** crafting, **Shift+K** cooking (was obstacle toggle now Ctrl+Shift+K)
- **E / Enter** - Interact: NPC/building highest priority, else animal produce ready collect, else feed, else pet, else farming till/plant/water/harvest/clear. Prioritizes closer animal vs farm plot, produce ready wins
- **R** - Water nearby farm plot
- **I** - Inventory 41 items, WASD/Arrows navigate, Shift+S sort, C filter, M merge, Shift+O random items (includes fried_egg/omelette/cheese/cake/soup/stew/pancake/salad)
- **Crafting UI (Shift+C)**: W/S navigate, C filter category (ALL→TOOL→FOOD→MATERIAL→FEED→POTION→MISC), Shift+C toggle craftable only, Enter craft, ESC close, quick hint 60px y
- **Cooking UI (Shift+K)**: W/S navigate, C filter category (ALL→BREAKFAST→MEAL→SOUP→DESSERT→DAIRY→MISC), Ctrl+Shift+K toggle cookable only, Enter cook, ESC or Shift+K close, quick hint 85px y, stations campfire/stove/kitchen display only, effects hunger/health/stamina
  - Recipes: fried_egg (1 egg→1), omelette (2 egg+1 milk+1 mushroom→1), cheese (2 milk→1), pancake (1 wheat+1 egg+1 milk→2), soup (1 carrot+1 mushroom+1 herb→1), stew (1 carrot+1 wheat+1 mushroom+1 milk→1), cake (2 wheat+2 egg+1 milk+2 berry→1), salad (1 carrot+1 berry+1 herb→1), truffle soup (1 truffle+1 milk+1 mushroom→2), egg bread deluxe (2 wheat+1 egg+1 cheese→2 bread)
- **Shift+P** test farm plots 6, **Shift+U** test animals 4, **Ctrl+Shift+K** toggle obstacle (was Shift+K), **Ctrl+Shift+C** debug crafting
- **P** print all including cooking, **T** run all tests 7-16.3
- **Ctrl+S/L** quick save/load Slot0, **Ctrl+Shift+S/L** Save/Load UI, **Ctrl+N** new game, Auto-save 60s + map transition
- **Shift+R** reveal all, **Ctrl+R** reset exploration, **Shift+[ / ]** vision, **F1/F3/F4** jump maps
- **Space** pause, =/+ faster, -/_ slower, ] +1h, [ -1h, \ next phase, Shift+E clock
- **Q** schedule debug, ; , . needs/inventory/jobs, F10 boost 100%, F11 drain
- **C** center, **V** village, **Z** zoom, **X** smoothing, **K** collision, **N** paths, **M** nav grid, **J/L/U/Shift+I** building doors/labels/ownership/fronts, **G** grid, **B** coords, ` / F2 debug, **H** help, **R** reset

### Architecture

```
src/
├── cooking/
│   ├── CookingRecipe.ts - CookingCategory, CookingIngredient, CookingRecipeDefinition, CookingSaveData
│   ├── CookingDatabase.ts - 10 recipes BREAKFAST/MEAL/SOUP/DESSERT/DAIRY/MISC, stations, validation
│   ├── CookingSystem.ts - canCook/cook with inventory consumption, cookable list, save/load
│   ├── CookingRenderer.ts - UI overlay list+detail+quick hint, filters
│   └── test_cooking.ts - manual tsx 15 checks
├── crafting/
│   ├── Recipe.ts - categories TOOL/FOOD/MATERIAL/FEED/POTION/MISC
│   ├── RecipeDatabase.ts - 12 recipes
│   ├── CraftingSystem.ts - canCraft/craft
│   ├── CraftingRenderer.ts - UI Shift+C
│   └── test_crafting.ts
├── animals/ - 4 animals, feed/pet/produce/wander, 5 default spawn, minimap dots
├── farming/ - 4 crops, till/plant/water/harvest/wither
├── inventory/ - ItemType 41 types, 41 items adds 8 cooked foods
├── save/ - SAVE_VERSION 18, cooking totals, migrateToV18
├── exploration/ - fog, vision 8, minimap with animals
├── world/ - 3 maps, transitions
├── core/Game.ts - + cookingSystem/renderer, Shift+K cooking UI, save/load cooking, P prints cooking, T runs 7-16.3
└── main.ts
```

### Previous Phases
- Phase16.2: Crafting 12 recipes, ingredients consumption, persistence, Shift+C UI, save v17, build 391.79kB
- Phase16.1: Animals 4 types, feed/pet/produce/wander, hunger/happiness decay, 5 default spawn village, always visible after fog, minimap colored dots
- Phase15: Farming 4 crops, till/plant/water/harvest/wither, persistence, F overlay
- Phase14: Inventory 41 items now, stackable/non-stackable, slots, sorting, save/load, I UI
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
