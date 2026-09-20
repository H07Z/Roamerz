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
PHASE 16.1 — Animals / Livestock System [CURRENT]
PHASE 16.2 — Crafting System [NEXT]
PHASE 16.3 — Cooking System
PHASE 16.4 — Weather System
PHASE 16.5 — Economy / Shop System
```

## Phase 16.1 - Animals / Livestock System [CURRENT]

### Objective
Data-driven livestock that need feeding, produce items, can be petted, wander, and persist per map. Small changes, preserve farming & inventory, placeholder graphics, modular.

### Animal System
- **Animal.ts**: AnimalState IDLE/WANDERING/EATING/SLEEPING/PRODUCING/HAPPY/HUNGRY/SICK, AnimalType CHICKEN/COW/SHEEP/PIG, AnimalDefinition {id, type, name, icon, color, description, produceItemId, produceIntervalSeconds, produceMin/Max, produceChance, feedItems[], feedValue, happinessOnFeed/Pet, hungerDecayPerDay, happinessDecayPerDay, minHunger/HappinessForProduce, wanderRadius, wanderIntervalSeconds, speed, maxHunger/Happiness/Health, tags}, AnimalData {id, type, x,y, pixelX/Y, mapId, state, hunger/happiness/health 0-100, ageDays, lastFedAt/lastProduceAt/lastWanderAt/lastUpdateAt, produceReady, homeX/Y, targetX/Y, produceCount/petCount/feedCount, isMoving, version}, AnimalSaveData {animals Record, totalCreated/Collected/Fed/Petted, version}, helpers createEmptyAnimalData, getAnimalStateFromNeeds
- **AnimalDatabase.ts**: 4 animals data-driven:
  - chicken 🐔 egg 0.5d feed wheat_seed/wheat/hay/animal_feed, produce 1-2 egg 90% chance, wander 3 tiles every 10s speed 20
  - cow 🐄 milk 1d feed hay/wheat/animal_feed/carrot, produce 1-2 milk 80%, wander 4 tiles 15s speed 15
  - sheep 🐑 wool 1.5d feed hay/wheat/animal_feed/carrot/berry, produce 1-3 wool 85%, wander 3 tiles 12s speed 18
  - pig 🐖 truffle 2d feed everything, produce 1 truffle 50%, wander 5 tiles 8s speed 22
  Methods getAnimal, getAllAnimals, getCount, hasAnimal, register/unregister, validate, getDebugString
- **AnimalInstance.ts**: single animal logic feed(feedItemId,totalSeconds) checks allowed feeds, hunger+=feedValue capped, happiness+=happinessOnFeed, state EATING, pet() happiness+=happinessOnPet state HAPPY, collectProduce() chance check quantity min-max, reset produceReady/lastProduceAt, update(totalSeconds,deltaTime,isWalkable) decays hunger/happiness per day (hungerDecayPerDay, happinessDecayPerDay, extra if hungry), health loss if starving <10 hunger, produce ready if interval passed and hunger>=minHungerForProduce and happiness>=minHappinessForProduce and health>20, wander every wanderInterval 50% chance pick random target within radius from home if walkable, move towards target speed*deltaTime pixel, update tile from pixel, state from needs via getAnimalStateFromNeeds, save/load, debug strings
- **AnimalSystem.ts**: manager Map<id,AnimalInstance>, database, totals created/collected/fed/petted, version 2. initialize(maps) logs. createAnimal(x,y,mapId,type,totalSeconds,worldMap,navGrid) checks bounds and walkable (warn if not), id animal_x_y_mapId_created_type, increments created. createAnimalSimple, getAnimal, getAnimalAt, hasAnimal, getAnimalsForMap/getAll/getCount/getNearbyAnimals radius search, feedAnimal/petAnimal/collectProduce and At variants (nearby 2 tiles, prefer produce ready), update(totalSeconds,deltaTime,navGrid) calls animal.update with walkable lambda, getSaveData/loadSaveData with totals version, clear/clearMap, getDebugString Ready/Hungry/Happy counts, getMapDebugString, debugPrint, fillWithTestAnimals 4 types at 12,32
- **AnimalRenderer.ts**: render(ctx,animalSystem,worldRenderer,camera,mapId,w,h) if showAnimals, gets animals for map, culls, renders bg color per state (hungry red 0.3, happy green 0.3, producing gold 0.4, sick dark red 0.4, eating blue 0.3, wandering gray 0.2), icon scaled 0.8, produce ready gold glow stroke + fill + produce icon 🥚/🥛/🧶/✨ top-right, hunger bar bottom (red<30 yellow<60 green) and happiness bar above (blue), state text 4 chars when zoom>=1.2, renderAnimalInfo box 340x130 at 20,h-220 above farming info showing state hunger/happy/health, description, produce interval chance, feed items, needs, actions [Collect:E] or [Feed:E][Pet:E], age/home/target/moving

### Inventory Extension Phase 16.1
- **Item.ts**: adds EGG, MILK, WOOL, HAY, ANIMAL_FEED, TRUFFLE (now 33 types)
- **ItemDatabase.ts**: 33 items, adds:
  - egg 🥚 value8 hunger20 health2 food animal farm cooking
  - milk 🥛 value12 hunger25 health5 stamina10 food animal farm cooking
  - wool 🧶 value15 material animal farm craftable
  - hay 🌾 value3 material feed farm animal
  - animal_feed 🥣 value5 material feed farm animal craftable
  - truffle 🍄 value50 rare food animal farm treasure cooking

### Save Extension Phase 16.1
- **SaveTypes.ts**: SAVE_VERSION 16 SAVE_GAME_VERSION 0.16.0, WorldSaveData.animals now {animals, totalCreated, totalCollected, totalFed, totalPetted, version:2} default
- **SaveMigration.ts**: case 16 migrateToV16: old animals {animals, version1} → new {animals, totalCreated=count, totalCollected 0, totalFed 0, totalPetted 0, version2}

### Game Integration Phase 16.1
- **Fields**: animalDatabase singleton, animalSystem, animalRenderer, showAnimals true, showAnimalDebug true, selectedAnimalId
- **Initialize**: world 3 maps, exploration, collision/nav/pathfinder/building, time, schedule, NPCs, life, interaction, dialogue, exploration initial, fog/minimap, save slots, ItemDatabase 33 items validation PASS, Inventory, FarmingSystem init + CropDatabase 4 crops validation PASS, AnimalSystem init with maps + AnimalDatabase 4 animals validation PASS, set showAnimals, log Phase 16.1 controls
- **CollectSaveData**: animalSave = animalSystem.getSaveData() included in worldSave.animals
- **ApplySaveData**: if saveFile.world.animals load via animalSystem.loadSaveData
- **NewGame**: animalSystem initialize + clear, reset showAnimals
- **handleAnimalInput**: if no player or dialogue/save/inventory open return, get map tilePos totalSeconds, getNearbyAnimals radius2 find closest, selectedAnimalId = closest if dist<=2 else clear if >3. E key: if hasInteractable (NPC/building) return to let dialogue handle. Check nearby plots distance for priority: animalIsCloserOrReady = closestAnimal && (produceReady || dist <= closestPlotDist). If animal closer or ready and dist<=2:
  - produceReady → collectProduce, addItem produceItemId quantity, message
  - else try feedItems ['hay','animal_feed','wheat','wheat_seed','carrot','berry','apple','carrot_seed','mushroom'] if player hasItem and allowed per def, feedAnimal, removeItem feed, message
  - else petAnimal, message
- **Update**: timeManager update if no UI, farmingSystem.update(totalSeconds,deltaTime), animalSystem.update(totalSeconds,deltaTime,navigationGrid), player update, camera, exploration update, map transitions, debug player/collision, NPCs village only, life, interaction, dialogue input, inventory input, farming input, animal input, save input, debug NPC/pathfinding/building/time/schedule/life/interaction/dialogue/exploration/world/save/inventory/farming/animal (animalCount, animals, totalCount, mapCount, debug, mapDebug, showAnimals), mapInfo, cameraInfo, handleDebugToggles
- **Render**: clear, worldRenderer, collision debug, nav grid debug, buildingRenderer, building fronts, farmingRenderer.render, animalRenderer.render (before fog), fog, NPCs village only, playerRenderer, vision debug, time overlay/clock/timeline, minimap, full map, interaction prompt if !dialogue&&!save&&!inventory, dialogue, inventoryRenderer, farming selected plot info, animal selected info above farming, saveRenderer, debug, help, map edge hint
- **Controls**: Shift+G toggle animals overlay (avoid WASD), Shift+U create 4 test animals (chicken,cow,sheep,pig), F farming overlay, Shift+F fog, E feed/collect/pet (priority: NPC/building > animal produce ready/closer > farming), R water farm, Shift+P test farm plots, P prints farming+animals nearby + debug, T runs all tests 7-16.1
- **Tests**: runPhase16_1Tests 12 tests:
  1 AnimalDatabase count 4
  2 validation
  3 createAnimal chicken
  4 feed wheat_seed hunger up
  5 pet happy up
  6 produce after 0.6d ready
  7 collect egg
  8 hunger decay after 3d <50
  9 wander logic
  10 save/load round-trip
  11a player feed consumes hay, 11b collect adds milk (chance may fail)
  12 nearby search
  Preserved Phase15 farming, Phase14 inventory 33 items, etc.

### DebugManager Phase 16.1
- Phase label 16.1, boxWidth 680, added animal debug via any optional

### Tests (Phase 16.1)
- Test1 AnimalDatabase count 4 → PASS
- Test2 validation → PASS
- Test3 createAnimal chicken → PASS
- Test4 feed → PASS hunger up
- Test5 pet → PASS happy up
- Test6 produce after 0.6d → PASS READY
- Test7 collect → PASS egg 1-2
- Test8 hunger decay 3d <50 → PASS
- Test9 wander → PASS
- Test10 save/load → PASS
- Test11 player feed/collect → PASS (chance)
- Test12 nearby search → PASS
- Preserved Phase15 farming 4 crops → PASS
- Inventory 33 items → PASS
- Build 71 modules → PASS
- Manual tsx animals lifecycle PASS

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 16.1)
- **WASD/Arrows** - Move player, walk to edge road to travel between maps
- **TAB** - Minimap, **F** farming overlay, **Shift+F** fog, **Shift+M** full map, **Shift+G** animals overlay (avoid WASD conflict)
- **E / Enter** - Interact: NPC/building (💬) highest priority, else near animal if produce ready collect (egg/milk/wool/truffle) → adds to inventory, else feed if has feed (hay/animal_feed/wheat/wheat_seed/carrot/berry/apple/carrot_seed/mushroom) consumes 1 and restores hunger+happiness, else pet → happiness up. Else farming: till farmland/grass, plant seed, water, harvest, clear withered. Prioritizes closer animal vs farm plot when both nearby, produce ready wins.
- **R** - Water nearby farm plot
- **I** - Inventory 33 items, WASD/Arrows navigate, Shift+S sort, C filter, M merge, Shift+O random items (includes egg/milk/wool/hay/feed/truffle)
- **Shift+P** - Test farm plots 6, **Shift+U** - Test animals 4 (chicken,cow,sheep,pig)
- **P** - Print all including farming nearby + animals nearby + debug, **T** - Run all tests 7-16.1
- **Ctrl+S/L** quick save/load Slot0, **Ctrl+Shift+S/L** Save/Load UI, **Ctrl+N** new game, Auto-save 60s + map transition
- **Shift+R** reveal all, **Ctrl+R** reset exploration, **Shift+[ / ]** vision, **F1/F3/F4** jump maps
- **Space** pause, =/+ faster, -/_ slower, ] +1h, [ -1h, \ next phase, Shift+E clock
- **Q** schedule debug, ; , . needs/inventory/jobs, F10 boost 100%, F11 drain
- **C** center, **V** village, **Z** zoom, **X** smoothing, **K** collision, **N** paths, **M** nav grid, **J/L/U/Shift+I** building doors/labels/ownership/fronts, **G** grid, **B** coords, ` / F2 debug, **H** help, **R** reset

### Architecture

```
src/
├── animals/
│   ├── Animal.ts - enums AnimalState/AnimalType, interfaces AnimalDefinition/AnimalData/AnimalSaveData, helpers
│   ├── AnimalDatabase.ts - 4 animals chicken/cow/sheep/pig, produce intervals, feed items, validation
│   ├── AnimalInstance.ts - feed/pet/collectProduce/update hunger/happiness decay, produce ready, wander random walk with navGrid, save/load, debug
│   ├── AnimalSystem.ts - createAnimal checks bounds/walkable, feedAnimal/petAnimal/collectProduce, getAnimal/getAnimalAt/getAnimalsForMap/getNearby, update, save/load, clear, debug, fillWithTestAnimals
│   ├── AnimalRenderer.ts - renders bg per state, icon, produce gold glow + icon, hunger/happiness bars, info box
│   ├── test_animals.ts - manual tsx 12 checks lifecycle
│   └── README.md
├── farming/ - 4 crops, till/plant/water/harvest/wither, persistence
├── inventory/ - ItemType 33 types adds EGG,MILK,WOOL,HAY,ANIMAL_FEED,TRUFFLE, 33 items
├── save/ - SAVE_VERSION 16, animals totals version2, migrateToV16
├── exploration/ - fog, vision 8, minimap
├── world/ - 3 maps, transitions
├── interaction/ - range 60px
├── dialogue/ - role trees
├── life/ - needs, inventory, jobs
├── time/ - TimeManager totalSeconds
├── core/Game.ts - + animalSystem/renderer, Shift+G animals overlay, E feed/collect/pet, save/load animals, P prints animals, T runs 7-16.1, Shift+U test animals
└── main.ts
```

### Previous Phases
- Phase15: Farming 4 crops, till/plant/water/harvest/wither, persistence, F overlay, E/R farming
- Phase14: Inventory 33 items (now), stackable/non-stackable, slots, sorting, save/load, I UI
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
