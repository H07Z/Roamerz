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
PHASE 16.3 — Cooking System [COMPLETE]
PHASE 16.4 — Weather System [COMPLETE]
PHASE 16.5 — Economy / Shop System [COMPLETE]
PHASE 17 — Quest System [CURRENT]
```

## Phase 17 - Quest System [CURRENT]

### Objective
Data-driven QuestDefinition (id,name,icon,description,objectives,rewards,prerequisites), QuestDatabase 3 quests (collect, talk, explore), QuestSystem manages active/completed, objectives tracking (collect item, talk NPC, visit map, farming harvest, animal produce, craft, cook, buy, sell), persistence world.quests or top-level quests v21, QuestRenderer UI Shift+Q toggle (avoid WASD), Q/C cycle filter, W/S navigate, Enter start/complete, debug overlay, small controlled phase, preserve all previous (farming/animals/inventory/crafting/cooking/weather/economy).

### Quest System
- **Quest.ts**: QuestObjectiveType COLLECT_ITEM|TALK_NPC|VISIT_MAP|HARVEST_CROP|COLLECT_ANIMAL_PRODUCE|CRAFT_ITEM|COOK_ITEM|BUY_ITEM|SELL_ITEM|CUSTOM, QuestObjective {id,type,targetId,requiredAmount,currentAmount,completed,description}, QuestReward {money?,items? {itemId,quantity}[],experience?}, QuestStatus LOCKED|AVAILABLE|ACTIVE|COMPLETED|FAILED, QuestDefinition {id,name,icon,description,objectives[],rewards,prerequisites?,repeatable?,timeLimit?,tags?}, QuestInstance {definition,status,objectives:QuestObjective[],startedAt?,completedAt?,failedAt?}, QuestProgress {completed,total,percent}, QuestSaveData {quests:Record<id,{status,objectives,startedAt?,completedAt?,failedAt?}>,talkedNPCs[],visitedMaps[],harvestedCrops Record<id,count>,collectedProduce Record<id,count>,craftedItems Record<id,count>,cookedItems Record<id,count>,boughtItems Record<id,count>,soldItems Record<id,count>,totalStarted,totalCompleted,totalFailed,version}
- **QuestDatabase.ts**: 3 quests data-driven:
  - quest_first_harvest 🌾 First Harvest: no prereq, objectives: collect 3 wheat_seed, harvest 1 wheat, have 3 wheat in inventory, rewards $50 + 2 bread + 5 carrot_seed, tags farming/beginner
  - quest_talk_to_elders 💬 Talk to Elders: no prereq, objectives: talk NPC001 Farmer, talk NPC002 Elder, visit village_01, rewards $30 + 5 apple + 10 coin, tags social/exploration
  - quest_explorer 🗺️ Explorer: prereq talk_to_elders, objectives: visit village_01, forest_01, lake_01, collect 10 wood, rewards $100 + axe + 3 bread, tags exploration/crafting
  Methods getQuest, getAllQuests, getQuestsByTag, getCount, hasQuest, register/unregister, validate (id,name,objectives non-empty, rewards, prerequisites exist), getDebugString
- **QuestSystem.ts**: manager database, itemDatabase, questInstances Map<id,QuestInstance>, talkedNPCs Set, visitedMaps Set, harvestedCrops Map, collectedProduce Map, craftedItems Map, cookedItems Map, boughtItems Map, soldItems Map, totalStarted/Completed/Failed, version 1. initialize() creates instances for all definitions, evaluates prerequisites: if prereqs empty → AVAILABLE else if all prereqs COMPLETED → AVAILABLE else LOCKED. canStartQuest(id) checks exists, status AVAILABLE, prereqs met. startQuest(id,totalSeconds) sets ACTIVE, startedAt, totalStarted++. updateObjectives(player Inventory, visitedMaps Set, totalSeconds) loops ACTIVE quests, for each objective: COLLECT_ITEM → player.getItemQuantity(targetId), TALK_NPC → talkedNPCs has, VISIT_MAP → visitedMaps has, HARVEST_CROP → harvestedCrops count, COLLECT_ANIMAL_PRODUCE → collectedProduce, CRAFT_ITEM → craftedItems, COOK_ITEM → cookedItems, BUY_ITEM → boughtItems, SELL_ITEM → soldItems. Updates currentAmount, completed. If all objectives completed → completeQuest: rewards money to player.money, items via player.addItem, sets COMPLETED, completedAt, totalCompleted++, unlocks dependent quests LOCKED→AVAILABLE if prereqs now met, returns completedQuests ids. recordTalkedNPC(id), recordVisitedMap(id), recordHarvestedCrop(id,amount), recordAnimalProduce(id,amount), recordCrafted, recordCooked, recordBought, recordSold. getQuest, getAllQuestInstances, getAvailable/Active/Completed/Locked, getCount, getTotalStarted/Completed, getQuestProgress(id) completed/total/percent, getSaveData {quests Record, talkedNPCs[], visitedMaps[], harvestedCrops Record, etc., totals, version}, loadSaveData rebuilds instances, restores status and objectives, restores tracking Sets/Maps, totals, logs. clear resets and initialize. getDebugString quests active completed started, debugPrint.
- **QuestRenderer.ts**: setShowQuests, isShowing, selectedQuestIndex, filterStatus null=ALL or QuestStatus. get/set filter, cycleFilter ALL→AVAILABLE→ACTIVE→COMPLETED→LOCKED→ALL, navigate up/down totalQuests, setSelected. getFilteredQuests from system getAllQuestInstances filtered by filterStatus, sorted order ACTIVE 0, AVAILABLE 1, COMPLETED 2, LOCKED 3, FAILED 4, then name. render(ctx,w,h,questSystem,playerInventory,playerMoney) quests filtered, total, selected clamping. Box 700x520 centered black 0.95 blue border #8af, title 📜 Quests filter ALL/STATUS count active/total. Subline Active x Done y Started z Completed w Filter ALL/C/Q Mode, hint Shift+Q/ESC close W/S nav C/Q filter Enter start. List left 280w 360h row 34: for each quest filtered: status icon ✅ AVAILABLE→📋 ACTIVE→▶️ COMPLETED→✅ LOCKED→🔒 FAILED→❌, def icon, name 18 chars, progress completed/total, percent bar if active, color status: active blue, available green, completed gray, locked dark. Right detail 360w: if selected: icon name, status color, desc wrapped 45 chars 2-3 lines, Objectives: each obj id desc required current completed checkmark, progress bar, Rewards: money $ + items list, Prerequisites: list ids + status, if AVAILABLE show green box Press ENTER to Start!, if ACTIVE show blue progress, if COMPLETED show gray completed at, if LOCKED show orange need prereqs. Footer gray 8px Quests v1 total active done. renderQuickHint if showQuests return, if active>0 show box 240x22 top-right 135y black 0.7 blue border text 📜 Quests: active Active, available Available! Press Shift+Q blue 9px.
- **test_quests.ts**: manual tsx 12 checks: count 3, validation, first_harvest objectives 3, available 2 locked 1, canStart first_harvest true, start success active 1, update after wheat_seed 5 wheat 5 harvest 1 completed 1 money 150 bread 2, start talk_to_elders, talk NPC001 NPC002 visit village completed 1 total 2, explorer unlocked AVAILABLE, start explorer, visit all 3 maps wood 15 completed 1 total 3, saveData quests 3 completed 3, load completed 3 explorer COMPLETED.

### Save Extension Phase 17
- **SaveTypes.ts**: SAVE_VERSION 21 SAVE_GAME_VERSION 0.21.0, WorldSaveData now includes quests? Actually top-level SaveFile.quests is QuestSaveData {quests Record, talkedNPCs, visitedMaps, harvestedCrops, collectedProduce, craftedItems, cookedItems, boughtItems, soldItems, totalStarted, totalCompleted, totalFailed, version}, createDefaultSaveFile quests empty, version 1. Also world.quests? No top-level.
- **SaveMigration.ts**: case 21 migrateToV21: old quests preserve if exists else default, preserves economy weather cooking crafting animals farming etc., version 21 game 0.21.0.
- **SaveManager.ts**: ensureDefaults farming animals crafting cooking weather economy quests with defaults, version bump.

### Game Integration Phase 17
- **Fields**: questDatabase singleton, questSystem, questRenderer, showQuests false modal, showQuestDebug true
- **Constructor**: questDatabase = QuestDatabase.getInstance(), questSystem = new QuestSystem(questDatabase), questRenderer = new QuestRenderer()
- **Initialize**: questSystem.initialize(), QuestDatabase count 3 debug, validation PASS, QuestSystem debug, setShowQuests false, recordVisitedMap initial map, logs Phase 17 controls
- **CollectSaveData**: questSave = questSystem.getSaveData() included in SaveFile.quests = questSave (top-level)
- **ApplySaveData**: if saveFile.quests load via questSystem.loadSaveData
- **NewGame**: questSystem.clear, reset showQuests false setShowQuests false
- **handleQuestInput**: modal: if showQuests ESC or Shift+Q close, W/S navigate up/down filtered count, C/Q cycle filter ALL→AVAILABLE→ACTIVE→COMPLETED→LOCKED, Enter start quest: get filtered sorted same as renderer, selected idx quest, if AVAILABLE startQuest via questSystem.startQuest totalSeconds, message 📜 Started quest icon name blue or ❌ Cannot start reason red, if ACTIVE show progress, if COMPLETED show completed, if LOCKED show need prereqs. If not open and no dialogue/save/inventory/crafting/cooking/economy, Shift+Q toggles open: setShowQuests true selected 0.
- **Other inputs**: farming/animal/crafting/cooking/weather/economy now also block if quest open, map transitions auto-save blocked if quest open, time update blocked if quest open, NPC update blocked, life blocked, dialogue blocked, interaction prompt blocked, etc. handleDebugToggles blocked if quest open. handleDialogueInput calls handleQuestInput blocking? Actually handleQuestInput called in update after dialogue but also blocking in handleDialogueInput? No, dialogue blocks quest.
- **Update**: questSystem.updateObjectives each frame if player exists: visited Set from openedLocations, totalSeconds, auto-complete rewards money+items, unlocks next quests, saveRenderer message quest completed +$money.
- **Tracking hooks**: recordTalkedNPC on dialogue start NPC id, recordVisitedMap on switchMap + initialize exploration initial, recordHarvestedCrop on harvestPlot success, recordAnimalProduce on collectProduce success, recordCrafted/recordCooked on craft/cook success, recordBought/recordSold on economy buy/sell success.
- **Render**: quest UI after economy before quick hints: if showQuests && player render questRenderer.render, else if not inventory/dialogue/save show quick hints crafting/cooking/economy/quests (active hint). Farming selected plot info and animals selected info now also require !showQuests. Interaction prompt requires !showQuests. Map edge travel hint requires !showQuests
- **Debug**: QuestDebugInfo interface {questCount,quests,activeCount,completedCount,totalStarted,totalCompleted,debug,showQuests}, phase label 21, box height includes questHeight, renders QUESTS line blue #8af with count active done started completed debug UI open/closed
- **Tests**: runPhase17Tests 7 tests: count 3, validation, available 2, canStart, start, update harvest, save/load. T runs 7-17, P prints quests + debugPrint
- **Controls**: Shift+Q toggle quest journal UI (Q for quest, avoid WASD, debug toggle F2/`), W/S navigate filtered list, C/Q cycle filter status, Enter start quest (AVAILABLE→ACTIVE) with saveRenderer messages, blocking prevents farming/animal/map/dialogue/inventory/crafting/cooking/weather/economy when quest UI open
- **Help**: PHASE 17 QUEST SYSTEM with controls

### DebugManager Phase 17
- Phase label 21, added QuestDebugInfo interface, field questInfo, setter setQuestInfo, boxHeight includes questHeight, renders QUESTS line #8af

### Tests (Phase 17)
- Test1 QuestDatabase count 3 → PASS
- Test2 validation → PASS
- Test3 available quests 2 (first_harvest, talk_to_elders) explorer locked → PASS
- Test4 canStart first_harvest → PASS
- Test5 start first_harvest → PASS
- Test6 update after wheat 5 + harvest 1 completed 1 → PASS
- Test7 saveData quests 3 completed 0 → PASS after clear, load count 3 → PASS
- Full test_quests.ts 12 checks all PASS including explorer chain
- Build tsc --noEmit --skipLibCheck PASS
- Manual tsx quest lifecycle PASS

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 17)
- **WASD/Arrows** - Move player, walk to edge road to travel between maps
- **TAB** - Minimap, **F** farming overlay, **Shift+F** fog, **Shift+M** full map, **Shift+G** animals overlay, **Shift+C** crafting, **Shift+K** cooking, **Shift+W** weather overlay, **Shift+B** economy/shop, **Shift+Q** quest journal (new), **Ctrl+Shift+W** cycle weather
- **E / Enter** - Interact: NPC/building highest priority, else animal produce ready collect, else feed, else pet, else farming till/plant/water/harvest/clear. Prioritizes closer animal vs farm plot, produce ready wins
- **R** - Water nearby farm plot, rain auto-waters growing plots when rainy/stormy
- **I** - Inventory 41 items, WASD/Arrows navigate, Shift+S sort, C filter, M merge, Shift+O random items (includes cooked foods)
- **Crafting UI (Shift+C)**: W/S navigate, C filter category (ALL→TOOL→FOOD→MATERIAL→FEED→POTION→MISC), Shift+C toggle craftable only, Enter craft, ESC close, quick hint 60px y
- **Cooking UI (Shift+K)**: W/S navigate, C filter category (ALL→BREAKFAST→MEAL→SOUP→DESSERT→DAIRY→MISC), Ctrl+Shift+K toggle cookable only, Enter cook, ESC or Shift+K close, quick hint 85px y
- **Weather Overlay (Shift+W)**: Toggle tint + particles, badge top-left shows icon name intensity%, auto-waters crops in rain, transitions every 0.2-3 days game time
- **Economy / Shop UI (Shift+B)**: Toggle shop UI modal, Q/E cycle shops (general_store 🏪, food_stall 🍎, tool_shop 🔨), W/S navigate items, TAB toggle BUY/SELL mode, C filter category (ALL→MATERIAL→FOOD→TOOL→POTION→TREASURE→SEED→MISC), Enter buy/sell 1, Shift+Enter x5, checks money + inventory space, transaction history, totalSpent/totalEarned, persistence v20
- **Quest Journal UI (Shift+Q)**: NEW - Toggle quest journal modal, W/S navigate quests, C/Q cycle filter status ALL→AVAILABLE→ACTIVE→COMPLETED→LOCKED, Enter start quest (AVAILABLE→ACTIVE), auto-complete when objectives done, rewards money + items, unlocks next quests via prerequisites, persistence v21
  - Quests: first_harvest 🌾 (collect wheat_seed 3, harvest wheat 1, have wheat 3) → $50 + bread 2 + carrot_seed 5, talk_to_elders 💬 (talk NPC001/002, visit village) → $30 + apple 5 + coin 10, explorer 🗺️ (visit all 3 maps, collect wood 10) requires talk_to_elders → $100 + axe + bread 3
  - Tracking: talk NPCs (E talk), visited maps (travel edges), harvested crops (farming E harvest), animal produce (E collect), crafted/cooked/bought/sold, inventory quantities
  - Quick hint top-right 135y shows active/available count
- **Shift+P** test farm plots 6, **Shift+U** test animals 4, **Ctrl+Shift+K** toggle obstacle, **Ctrl+Shift+C** debug crafting
- **P** print all including quests, **T** run all tests 7-17
- **Ctrl+S/L** quick save/load Slot0, **Ctrl+Shift+S/L** Save/Load UI, **Ctrl+N** new game, Auto-save 60s + map transition
- **Shift+R** reveal all, **Ctrl+R** reset exploration, **Shift+[ / ]** vision, **F1/F3/F4** jump maps
- **Space** pause, =/+ faster, -/_ slower, ] +1h, [ -1h, \\ next phase, Shift+E clock
- **Q** schedule debug, ; , . needs/inventory/jobs, F10 boost 100%, F11 drain
- **C** center, **V** village, **Z** zoom, **X** smoothing, **K** collision, **N** paths, **M** nav grid, **J/L/U/Shift+I** building doors/labels/ownership/fronts, **G** grid, **B** coords, ` / F2 debug, **H** help, **R** reset

### Architecture

```
src/
├── quests/
│   ├── Quest.ts - QuestObjectiveType, QuestDefinition, QuestInstance, QuestSaveData
│   ├── QuestDatabase.ts - 3 quests first_harvest/talk_to_elders/explorer, validation
│   ├── QuestSystem.ts - active/completed, objectives tracking, rewards, prerequisites, persistence v21
│   ├── QuestRenderer.ts - 700x520 UI, filter status, W/S nav, C/Q cycle, Enter start, quick hint
│   └── test_quests.ts - manual tsx 12 checks
├── economy/ - 3 shops, Shift+B UI, save v20
├── weather/ - 6 weathers, Shift+W overlay, Ctrl+Shift+W cycle, auto-waters farming, save v19
├── cooking/ - 10 recipes, Shift+K UI, save v18
├── crafting/ - 12 recipes, Shift+C UI, save v17
├── animals/ - 4 animals, feed/pet/produce/wander, 5 default spawn, minimap dots
├── farming/ - 4 crops, till/plant/water/harvest/wither, auto-watered by rain
├── inventory/ - 41 items, I UI
├── save/ - SAVE_VERSION 21, quests top-level QuestSaveData, migrateToV21
├── exploration/ - fog, vision 8, minimap with animals
├── world/ - 3 maps, transitions
├── core/Game.ts - + questSystem/renderer/database, Shift+Q modal UI, W/S nav, C/Q filter, Enter start, save/load quests v21, tracking hooks talked/visited/harvest/produce/craft/cook/buy/sell, updateObjectives auto-complete, P prints quests, T runs 7-17
└── main.ts
```

### Previous Phases
- Phase16.5: Economy 3 shops, buy/sell, persistence v20, Shift+B UI, build 483.19kB
- Phase16.4: Weather 6 weathers, tint+particles, auto-water farming, save v19, Shift+W/Ctrl+Shift+W, build 448.66kB
- Phase16.3: Cooking 10 recipes, 8 new cooked foods, inventory 41, save v18, Shift+K UI, build 424.20kB, inventory fix sync renderer flags
- Phase16.2: Crafting 12 recipes, ingredients consumption, persistence, Shift+C UI, save v17, build 391.79kB
- Phase16.1: Animals 4 types, feed/pet/produce/wander, hunger/happiness decay, 5 default spawn village, always visible after fog, minimap colored dots
- Phase15: Farming 4 crops, till/plant/water/harvest/wither, persistence, F overlay
- Phase14: Inventory 41 items, stackable/non-stackable, slots, sorting, save/load, I UI (fixed)
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
