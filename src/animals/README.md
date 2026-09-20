# Phase 16.1 Animals / Livestock System

Data-driven livestock that need feeding, produce items, can be petted, wander, and persist per map.

## Files
- `Animal.ts` - enums AnimalState IDLE/WANDERING/EATING/SLEEPING/PRODUCING/HAPPY/HUNGRY/SICK, AnimalType CHICKEN/COW/SHEEP/PIG, interfaces AnimalDefinition (produceItemId, produceIntervalSeconds, feedItems, feedValue, happinessOnFeed/Pet, hungerDecayPerDay, minHunger/HappinessForProduce, wanderRadius/Interval, speed), AnimalData (id, type, x,y, pixelX/Y, mapId, state, hunger/happiness/health 0-100, ageDays, lastFedAt/lastProduceAt/lastWanderAt/lastUpdateAt, produceReady, homeX/Y, targetX/Y, produceCount/petCount/feedCount, isMoving, version), AnimalSaveData (animals Record, totalCreated/Collected/Fed/Petted, version), helpers createEmptyAnimalData, getAnimalStateFromNeeds
- `AnimalDatabase.ts` - 4 animals: chicken 🐔 egg 0.5d feed wheat_seed/wheat/hay/animal_feed, cow 🐄 milk 1d feed hay/wheat/animal_feed/carrot, sheep 🐑 wool 1.5d feed hay/wheat/animal_feed/carrot/berry, pig 🐖 truffle 2d feed everything, validation, register
- `AnimalInstance.ts` - single animal: feed(feedItemId,totalSeconds) checks allowed feeds, hunger+=feedValue, happiness+=happinessOnFeed, pet() happiness+=happinessOnPet, collectProduce() chance check, quantity min-max, update(totalSeconds,deltaTime,isWalkable) decays hunger/happiness per day, health loss if starving, produce ready if interval passed and hunger/happiness thresholds, wander every wanderInterval 50% chance pick random target within radius from home if walkable, move towards target speed*deltaTime, state from needs, save/load, debug strings
- `AnimalSystem.ts` - manager: createAnimal(x,y,mapId,type,totalSeconds,worldMap,navGrid) checks bounds and walkable, id animal_x_y_mapId_created_type, createAnimalSimple, getAnimal, getAnimalAt, hasAnimal, getAnimalsForMap/getAll/getCount/getNearbyAnimals radius search, feedAnimal/petAnimal/collectProduce (also At variants), update(totalSeconds,deltaTime,navGrid), getSaveData/loadSaveData, clear/clearMap, getDebugString Ready/Hungry/Happy counts, getMapDebugString, debugPrint, fillWithTestAnimals
- `AnimalRenderer.ts` - renders animals with pixelX/Y, bg color per state (hungry red, happy green, producing gold, sick dark red, eating blue, wandering gray), icon, produce ready gold glow + produce icon 🥚/🥛/🧶/✨, hunger bar (red/yellow/green) and happiness bar (blue), state text when zoomed, renderAnimalInfo box 340x130 above farming info showing state hunger/happy/health, description, produce interval chance, feed items, needs, actions [Collect:E] or [Feed:E][Pet:E], age/home/target/moving

## Integration
- Inventory: add egg, milk, wool, hay, animal_feed, truffle items
- Save: bump to v16, WorldSaveData.animals {animals, totalCreated, totalCollected, totalFed, totalPetted, version:2}
- Game: animalSystem/renderer fields, init with maps, update with navGrid, handleAnimalInput E near animal feed/collect/pet, R? not needed, Shift+G toggle animals overlay (avoid WASD movement), Shift+U test animals, render overlay, save/load, help text, runPhase16_1Tests

## Lifecycle
IDLE → (wander interval) → WANDERING → IDLE → (hunger <20) → HUNGRY → (feed) → EATING → IDLE → (produce interval && hunger/happy thresholds) → PRODUCING (ready) → (collect) → IDLE → (happiness >80) → HAPPY

## Controls
- E near animal: if produce ready collect, else if has feed item feed, else pet
- Shift+G toggle animals overlay
- Shift+U create 4 test animals
- P prints animals
- T runs all tests

## Tests
12 tests: database count 4, validation, createAnimal, feed, pet, produce after 0.5d, collect, hunger decay, wander, save/load, player integration feed/collect, nearby search
