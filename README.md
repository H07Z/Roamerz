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
PHASE 15 — Farming System [CURRENT]
```

## Phase 15 - Farming System [CURRENT]

### Objective
Data-driven farming with till soil (convert farmland/grass to tilled plot), plant seeds (wheat_seed, carrot_seed, berry, herb from inventory), growth stages TILLED→PLANTED→SPROUT→GROWING→MATURE→READY→WITHERED, watering boost (waterBoost multiplier x1.5), harvest yields via inventory addItem (harvestItemId + bonus seeds), time-based growth using TimeManager totalSeconds (growthTimeSeconds, witherTimeSeconds), plots per map persisted (x,y,mapId), reusable functions createPlot(), tillPlot(), plantSeed(), waterPlot(), harvestPlot(), getGrowthStage(), getPlotState(). Small changes, preserve Phase14 inventory.

### Farming System
- **Crop.ts**: GrowthStage enum TILLED/PLANTED/SPROUT/GROWING/MATURE/READY/WITHERED/HARVESTED, PlotState UNTILLED/TILLED/PLANTED/WATERED/GROWING/READY/WITHERED, CropDefinition {id, name, seedItemId, harvestItemId, bonusSeedItemId, growthTimeSeconds, stages[], stageThresholds[], yieldMin/Max, bonusSeedChance/Min/Max, waterBoost, witherTimeSeconds, icon, color, description, requiredTool, tags}, FarmPlotData {id, x,y, mapId, state, growthStage, cropId, plantedAt, wateredAt, isWatered, growthProgress 0-1, readyAt, witherAt, tilledAt, harvestCount, version}, FarmingSaveData {plots Record<id, data>, totalPlotsCreated, totalHarvested, totalPlanted, version}, helpers createEmptyPlot(x,y,mapId,totalSeconds), getGrowthStageFromProgress(progress, def) finds stage via thresholds, getPlotStateFromGrowthStage.
- **CropDatabase.ts**: singleton, 4 crops data-driven:
  - wheat: 🌾 2 days growth, yield 2-4 wheat, bonus 50% 1-2 wheat_seed, waterBoost 1.5, wither 1 day, icon 🌾
  - carrot: 🥕 1.5 days, yield 1-3 carrot, bonus 30% 1 carrot_seed, waterBoost 1.5, wither 1 day
  - berry_bush: 🫐 1 day, yield 2-5 berry, bonus 40% 1-2 berry, waterBoost 1.3, wither 2 days
  - herb: 🌿 0.8 days, yield 1-3 herb, bonus 60% 1-2 herb, waterBoost 1.4, wither 1.5 days
  Methods getCrop(id), getAllCrops, getCropBySeed(seedItemId), getCount, hasCrop, register/unregister, validate checks id/seed/harvest/growthTime/stages thresholds/yield, getDebugString `${size} crops: keys`.
- **FarmPlot.ts**: single plot logic till(), plant(cropId,totalSeconds), plantBySeed(seedItemId,totalSeconds) via CropDatabase lookup, water(totalSeconds) sets isWatered true wateredAt, update(totalSeconds) calculates elapsed = totalSeconds-plantedAt, effectiveElapsed = elapsed*waterBoost if watered, progress = min(1, effectiveElapsed/growthTime), stage via getGrowthStageFromProgress, when READY sets readyAt/witherAt = totalSeconds + witherTime, if totalSeconds>=witherAt → WITHERED, water dries after 0.5*86400s, harvest(totalSeconds) returns {success,cropId,yield,bonusSeeds,bonusSeedId} random yieldMin-Max and bonus chance, resets to TILLED HARVESTED, clearWithered, getSaveData/fromSaveData, getDebugString, getDetailedString, getData.
- **FarmingSystem.ts**: manager plots Map<id, FarmPlot>, cropDatabase, totals created/harvested/planted, version. initialize(maps) logs. createPlot(x,y,mapId,totalSeconds,worldMap?) checks bounds and TerrainType.FARMLAND/GRASS/ROAD, creates FarmPlot, increments created. tillPlot(x,y,mapId,totalSeconds,worldMap?) creates if not exists else plot.till. plantSeed uses plantBySeed, increments planted. plantCrop, waterPlot, harvestPlot increments harvested, getPlot/hasPlot/getPlotsForMap/getAllPlots/getPlotCount/getNearbyPlots radius search distSq<=r^2, update(totalSeconds) calls plot.update, getSaveData/loadSaveData with totals version, clear/clearMap, getDebugString `${size} plots (T:G:R:W) created planted harvested`, getMapDebugString, debugPrint, fillWithTestPlots for debug.
- **FarmingRenderer.ts**: render(ctx,farmingSystem,worldRenderer,camera,mapId,w,h) if showFarming, gets plots for map, culls off-screen, renders tilled soil brown with lines, withered 💀 dark, growing crop bg color per stage (PLANTED brown seed 🌰, SPROUT light green 🌱, GROWING green, MATURE darker, READY gold), icon crop.icon scaled by stage, progress bar black bg green (blue if watered) with %, watered 💧 top-right, ready gold glow pulse stroke + fill, renderPlotInfo selected plot box 300x120 bottom 20,80 showing state stage %, crop name description yield bonus growth water wither, actions [Plant:E][Water:R][Harvest:E][Clear:E], tilled/planted day.

### Inventory Extension Phase 15
- **Item.ts**: ItemType adds WHEAT='wheat', CARROT='carrot' (now 27 types)
- **ItemDatabase.ts**: 27 items, added wheat (🌾 value8 hunger20 tags harvest food farmable) and carrot (🥕 value10 health5 hunger25 tags harvest food farmable) for farming yield.

### Save Extension Phase 15
- **SaveTypes.ts**: SAVE_VERSION 15 SAVE_GAME_VERSION 0.15.0, WorldSaveData.farming now {plots, totalPlotsCreated, totalHarvested, totalPlanted, version:2} default.
- **SaveMigration.ts**: case 15 migrateToV15: old farming {plots, version1} → new {plots, totalPlotsCreated=plots length, totalHarvested 0, totalPlanted 0, version2}, preserves other worlds, generic fallback.

### Game Integration Phase 15
- **Fields**: cropDatabase singleton, farmingSystem, farmingRenderer, showFarming true, showFarmingDebug true, farmingInteractionRange 60, selectedFarmPlotId.
- **Initialize**: world 3 maps, exploration, collision/nav/pathfinder/building, time, schedule, NPCs, life, interaction, dialogue, exploration initial, fog/minimap, save slots, ItemDatabase 27 items validation, Inventory, FarmingSystem initialize with all maps, CropDatabase 4 crops validation, FarmingSystem debug, set showFarming, log Phase15 controls.
- **CollectSaveData**: farmingSave = farmingSystem.getSaveData() included in worldSave.farming.
- **ApplySaveData**: if saveFile.world.farming load via farmingSystem.loadSaveData.
- **NewGame**: farmingSystem initialize + clear, reset showFarming.
- **handleFarmingInput**: if no player or dialogue/save/inventory open return, get map tilePos totalSeconds, getNearbyPlots radius2 find closest, standingPlot, selectedFarmPlotId = closest if dist<=2 else standing else clear if far>3. E key: if hasInteractable (NPC/building) return to let dialogue handle. Else if closestPlot dist<=2:
  - TILLED: try seeds ['wheat_seed','carrot_seed','berry','herb'] if player hasItem, get crop via getCropBySeed, plantSeed, removeItem seed, message.
  - READY: harvestPlot, addItem harvestItemId yield, bonus seeds, message.
  - WITHERED: clearWithered.
  - GROWING/PLANTED/WATERED: if not watered waterPlot.
  Else no plot nearby: try till current tile if terrain FARMLAND(7) or GRASS(0) via tillPlot, else try front tile based on player direction (up/down/left/right) if farmland/grass till.
  R key water nearby if not watered and not TILLED/READY/WITHERED.
- **Update**: timeManager update if no UI, farmingSystem.update(totalSeconds, deltaTime), player update with isDialogueOpen|save|inventory, camera, exploration update, map transitions, debug player/collision, NPCs village only, life, interaction, dialogue input, inventory input, farming input, save input, debug NPC/pathfinding/building/time/schedule/life/interaction/dialogue/exploration/world/save/inventory/farming (cropCount, crops, plotCount, mapPlotCount, debug, mapDebug, showFarming), mapInfo, cameraInfo, handleDebugToggles.
- **Render**: clear, worldRenderer, collision debug, nav grid debug, buildingRenderer, building fronts, farmingRenderer.render (before fog), fog, NPCs village only, playerRenderer, vision debug, time overlay/clock/timeline, minimap, full map, interaction prompt if !dialogue&&!save&&!inventory, dialogue, inventoryRenderer, farming selected plot info if selected and no UI, saveRenderer, debug, help, map edge hint.
- **Controls**: F toggle farming overlay (was fog, now Shift+F fog), Shift+F fog, E till/plant/water/harvest/clear, R water, Shift+P create 6 test plots, P prints farming nearby + debug, T runs all tests 7-15.
- **Tests**: runPhase15Tests 12 tests:
  1 CropDatabase count 4
  2 validation
  3 createPlot
  4 tillPlot
  5 plantSeed
  6 waterPlot watered true
  7 growth 2 days progress>0.9 READY
  8 harvest yield 2-4
  9a carrot ready after 2 days, 9b wither after extra 2 days, 9c clear
  10 save/load round-trip
  11a player plant consumes seed, 11b harvest adds wheat
  12 nearby search
  Preserved Phase7-14 tests.

### DebugManager Phase 15
- Phase label 15, boxWidth 680, added farming debug via any (cropCount, plotCount etc) optional.

### Tests (Phase 15)
- Test1 CropDatabase count 4 → PASS
- Test2 validation → PASS
- Test3 createPlot → PASS
- Test4 tillPlot → PASS
- Test5 plantSeed wheat_seed → PASS
- Test6 waterPlot boost → PASS
- Test7 growth 2 days READY → PASS
- Test8 harvest yield → PASS
- Test9 wither and clear → PASS
- Test10 save/load → PASS
- Test11 player integration consume/add → PASS
- Test12 nearby search → PASS
- Preserved Phase14 inventory 27 items → PASS
- Build passes, manual tsx farming lifecycle PASS

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 15)
- **WASD/Arrows** - Move player, walk to edge road to travel between maps
- **TAB** - Toggle minimap
- **F** - Toggle farming overlay (was F fog), **Shift+F** - Toggle fog of war, **Shift+M** full map
- **E / Enter** - Interact NPC/building OR farming: near farmland/grass till soil, on TILLED plant if has seed (wheat_seed, carrot_seed, berry, herb), on growing water info, R to water, on READY (gold) harvest → adds wheat/carrot/berry/herb + bonus seeds, on WITHERED (💀) clear to tilled. Prioritizes NPC/building if prompt.
- **R** - Water nearby plot (boost x1.5, lasts 0.5 days)
- **I** - Open/Close Player Inventory (27 items), WASD/Arrows navigate, Shift+S sort, C filter, M merge, Shift+O random items (includes wheat/carrot seeds)
- **Shift+P** - Create 6 test farm plots (debug, when no UI)
- **P** - Print all including farming nearby plots
- **T** - Run all Phase7-15 tests
- **Ctrl+S** quick save Slot0, Ctrl+L quick load, Ctrl+Shift+S/L Save/Load UI, Ctrl+N new game, Auto-save 60s + map transition
- **Shift+R** reveal all, Ctrl+R reset exploration, Shift+[ / ] vision, F1/F3/F4 jump maps
- **Space** pause, =/+ faster, -/_ slower, ] +1h, [ -1h, \\ next phase, Shift+E clock
- **Q** schedule debug, ; , . needs/inventory/jobs, F10 boost 100%, F11 drain
- **C** center, **V** village, **Z** zoom, **X** smoothing, **K** collision, **N** paths, **M** nav grid, **J/L/U/Shift+I** building doors/labels/ownership/fronts
- **G** grid, **B** coords, ` / F2 debug, **H** help, **R** reset

### Architecture

```
src/
├── farming/
│   ├── Crop.ts - enums GrowthStage/PlotState, interfaces CropDefinition/FarmPlotData/FarmingSaveData, helpers
│   ├── CropDatabase.ts - 4 crops wheat/carrot/berry_bush/herb, getCropBySeed, validation, register
│   ├── FarmPlot.ts - till/plant/plantBySeed/water/update/harvest/clearWithered, progress calc effectiveElapsed*waterBoost/growthTime, wither
│   ├── FarmingSystem.ts - createPlot checks FARMLAND/GRASS, tillPlot, plantSeed, plantCrop, waterPlot, harvestPlot, getPlot/hasPlot/getPlotsForMap/getAll/getNearby, update, save/load, clear, debug, fillWithTestPlots
│   ├── FarmingRenderer.ts - renders tilled soil lines, stage icons/colors, progress bar blue if watered, ready gold glow, withered skull, plot info box
│   ├── test_farming.ts - manual tsx tests 12 checks lifecycle
│   └── README.md
├── inventory/
│   ├── Item.ts - ItemType 27 types adds WHEAT,CARROT
│   ├── ItemDatabase.ts - 27 items adds wheat/carrot harvest
│   ├── Inventory.ts - stackable/non-stackable, slots, sorting
│   └── InventoryRenderer.ts - grid UI
├── save/
│   ├── SaveTypes.ts - SAVE_VERSION 15, farming totals version2
│   ├── SaveMigration.ts - case 15 migrateToV15
│   └── SaveManager.ts - versioned slots
├── exploration/ - fog, vision 8, minimap
├── world/ - 3 maps village+forest+lake, transitions
├── interaction/ - range 60px
├── dialogue/ - role-based trees
├── life/ - needs, inventory, jobs
├── time/ - TimeManager totalSeconds
├── core/Game.ts - + farmingSystem/renderer, F farming overlay, E/R farming input, save/load farming, P prints farming, T runs 7-15, Shift+P test plots
├── core/DebugManager.ts - Phase 15
└── main.ts
```

### Previous Phases
- Phase14: Inventory 27 items (now), stackable/non-stackable, slots, sorting, save/load, UI I, Shift+S sort, C filter, M merge
- Phase13: Save/Load 5 slots, validation, migration, corruption protection, auto-save 60s + map transition, new game
- Phase12: Exploration fog, vision 8, minimap, world 3 maps transitions
- Phase11: Interaction & Dialogue E 60px, dialogue UI, role trees
- Phase10: NPC Life needs inventory jobs
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
