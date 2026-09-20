# Life System - Phase 10 NPC Life Simulation

## Overview
NPCs have needs, inventory, jobs, and interactions that make them feel alive. Needs decay over time and are restored by activities, jobs produce items, and NPCs socialize when near each other.

## Modules

### NeedType.ts
- **NeedType enum:** ENERGY, HUNGER, SOCIAL, HAPPINESS, HEALTH (5 types)
- **NeedProperties:** name, icon (⚡🍖💬😊❤️), color, bgColor, criticalColor, decayRate per game hour, restoreRate per second, criticalThreshold, description
- **Helpers:** getNeedProperties, getAllNeedTypes, getCriticalNeeds
- Decay rates: ENERGY 4/h, HUNGER 5/h, SOCIAL 3/h, HAPPINESS 1/h, HEALTH 0.5/h
- Critical thresholds: ENERGY 20, HUNGER 25, SOCIAL 20, HAPPINESS 30, HEALTH 30

### NPCNeeds.ts
- **Class NPCNeeds:** npcId, needs Map<NeedType, number> 0-100, criticalTimes, totalDecay/Restore, lastActivity
- **update(deltaTime, currentActivity, isDaytime, timeScale, isInside):** Calculates gameHours = deltaTime*timeScale/3600, then per need:
  - ENERGY: restore 15/s when SLEEP, 0.3* when HOME/INSIDE, decay 4*multiplier per hour (FARM/WORK 1.5, SHOP 1.2, PLAY 1.3, etc)
  - HUNGER: restore 25/s when EAT, decay 5*1.5 when WORK/FARM
  - SOCIAL: restore 10/s SOCIAL, 0.5* PLAY, decay 3/h, 1.5x if inside at night alone
  - HAPPINESS: decay if low needs, restore PLAY 1.5x, SOCIAL 1x, HOME 0.3x, EAT 0.5x, decay extra if working with low energy
  - HEALTH: decay if >=2 critical needs, restore if all good and energy/hunger >70
- **Methods:** getNeed, setNeed, modifyNeed, getAllNeeds, getNeedsData, isCritical, isAnyCritical, getCriticalNeeds, getLowestNeed, getOverallWellbeing (avg), restoreSocial, getDebugString, getStats (decay, restore, criticalTimes, overall, lowest)

### NPCInventory.ts
- **ItemType enum:** FOOD, CROP, TOOL, WOOD, STONE, COIN, FLOWER, FISH, BREAD, POTION (10 types)
- **ItemProperties:** name, icon (🍎🌾🔨🪵🪨🪙🌸🐟🍞🧪), color, stackable, maxStack, value, description
- **Class NPCInventory:** npcId, items Map<ItemType, number>, maxSlots 10, totalCollected/Used
- **initializeForJob(jobType):** Role-based starting items:
  - FARMER: CROP 5, FOOD 3, TOOL 1, COIN 15
  - SHOPKEEPER: COIN 50, FOOD 5, BREAD 3, POTION 2
  - BLACKSMITH: TOOL 2, STONE 10, WOOD 5, COIN 30
  - VILLAGER: FOOD 2, WOOD 3, COIN 20, FLOWER 2
  - CHILD: FLOWER 5, FOOD 1, COIN 5
- **Methods:** addItem, removeItem, hasItem, getItemCount, getAllItems, getTotalItemCount, getTotalValue, useFood (tries BREAD→FOOD→FISH), canAfford, clear, getDebugString, getStats

### JobType.ts
- **JobType enum:** FARMER, SHOPKEEPER, BLACKSMITH, VILLAGER, CHILD, NONE (6 types)
- **JobProperties:** name, icon (🌾🏪🔨👨🧒❓), color, workActivity, produces (ItemTypes), workLocationType, workHours, incomePerHour, energyCostPerHour, happinessChangePerHour, description
- **Helpers:** getJobProperties, getJobTypeFromRole (role string → JobType)
- Income: FARMER 3/h, SHOPKEEPER 8/h, BLACKSMITH 6/h, VILLAGER 2/h, CHILD 0/h

### Job.ts
- **Class Job:** type, npcId, role, workDone hours, itemsProduced, coinsEarned, productionTimer, workProgress 0-1
- **update(deltaTime, currentActivity, isAtWorkLocation, timeScale):** Checks if work activity matches job (FARMER=FARM, SHOPKEEPER=SHOP, BLACKSMITH=WORK, VILLAGER=WORK/FARM, CHILD=PLAY), accumulates productionTimer, workProgress, workDone (game hours). Every productionInterval 10s produces item via getProducedItem (random from produces), every cycle earns coins incomePerHour*(interval/3600)*(timeScale/60) min 1 coin if income>0
- **Methods:** getWorkDone, getItemsProduced, getCoinsEarned, getWorkProgress, getData, getDebugString

### LifeManager.ts
- **Class LifeManager:** lifeData Map<npcId, {npcId, needs, inventory, job}>, buildingManager, timeManager, interactions counter, interactionCooldown 2s, workLocations cache
- **initialize(npcs, buildingManager, timeManager):** Creates NPCNeeds, NPCInventory (initializeForJob), Job for each NPC, links to NPC via (npc as any).needs/inventory/job
- **update(deltaTime, npcs, timeManager):** For each NPC: needs.update with currentActivity, isDaytime, timeScale, isInside; job.update with isAtWorkLocation; handle production (inventory.addItem), coins; handleNeedsOverrides (critical hunger <15 eat if has food at home/square, critical energy <10 go home if late); handleEating (every 2s of EAT consume food extra boost); then handleInteractions every 2s: check all pairs distance <50 and both social or at square → restoreSocial 2-5, occasional gift FLOWER, interactions++
- **Methods:** getLifeData, getAllLifeData, getCount, getInteractions, getNeedsForNPC, getInventoryForNPC, getJobForNPC, getAverageWellbeing, getCriticalCount, isNPCAtWorkLocation, isAtSquare

### LifeRenderer.ts
- **Class LifeRenderer:** showNeeds, showInventory, showJobs toggles
- **renderAll(ctx, npcs, lifeManager, worldRenderer, camera):** For each NPC calls renderNeedsBar, renderInventory, renderJob
- **renderNeedsBar:** 4 bars (ENERGY, HUNGER, SOCIAL, HEALTH) 32x3px, background rgba, fill color critical if low, above NPC -44px
- **renderInventory:** debug string (icons+counts) below NPC +44px if not empty
- **renderJob:** work progress bar 30x3px above needs when working, job icon 🌾🏪🔨⚒ when working
- **renderDetailedLife:** Detailed panel for selected NPC (not used in main render, for debug)

## Integration

### NPC Integration (Phase 10)
- NPC has needs: NPCNeeds|null, inventory: NPCInventory|null, job: Job|null, lastEatTime, socialInteractions, itemsProduced
- setNeeds/getNeeds, setInventory/getInventory, setJob/getJob, getActivityTimer, getLastEatTime/setLastEatTime, incrementSocialInteractions, incrementItemsProduced
- getStats extended: socialInteractions, itemsProduced, hasNeeds, hasInventory, hasJob, overallWellbeing
- Existing update already handles activityTimer, isAtHome, etc. Needs update handled by LifeManager, not inside NPC.update to keep modular

### NPCManager Integration
- initialize now 8 params: ... buildingManager, scheduleManager, timeManager, lifeManager
- Stores lifeManager, after creating NPCs if lifeManager+buildingManager+timeManager present calls lifeManager.initialize(allNPCs, buildingManager, timeManager)
- setLifeManager/getLifeManager

### NPCRenderer Integration
- Phase 10: imports NeedType, shows wellbeing in path status, renders needs bars (4 bars) above activity, inventory debug below NPC

### Game Integration
- Fields: lifeManager, lifeRenderer, showNeeds true, showInventory false, showJobs true
- Initialize: creates LifeManager, LifeRenderer, passes lifeManager to npcManager.initialize (8 params), ensures lifeManager initialized if count 0
- Update: calls lifeManager.update(deltaTime, allNPCs, timeManager) after npcManager.update
- Debug: setLifeInfo (count, showNeeds, showInventory, showJobs, averageWellbeing, criticalCount, interactions) and setLifeDetails (npcId, needs {energy,hunger,social,happiness,health,overall,lowest,critical}, inventory {debug,value,count}, job {type,workDone,itemsProduced,coinsEarned,progress}, stats {socialInteractions,itemsProduced,homeVisits})
- Render: after npcRenderer, if lifeManager and (showNeeds||showInventory||showJobs) calls lifeRenderer.renderAll
- Controls: ; toggle needs, , toggle inventory, . toggle jobs, F10 boost all needs 100%, F11 drain to critical, T runs Phase7+8+9+10, P prints life states
- Help: Phase 10 header, shows wellbeing, life counts, needs/inventory/job per NPC

### DebugManager
- Phase 10: currentPhase='10', LifeDebugInfo and LifeDetailInfo interfaces, fields lifeInfo, lifeDetails, setters setLifeInfo/setLifeDetails
- Render: boxWidth 560, LIFE line with avg wellbeing, critical, interactions, toggles, LIFE DETAILS with wellbeing, needs, critical, lowest, job work/prod/coins, inventory debug/value, interactions

## Testing (Phase 10)

- Test1 life counts: 5 NPCs → PASS
- Test2 NPC needs valid: 5 have needs with debug string → PASS
- Test3 NPC inventory valid: 5 have inventory with debug and value → PASS
- Test4 NPC jobs valid: 5 have jobs with debug → PASS
- Test5 needs decay: energy 80 -> after 1h farm decreases → PASS
- Test6 eating restores: hunger 30 -> after 2s EAT increases → PASS
- Test7 job production: work 20s produces items → PASS
- Test8 average wellbeing >0 → PASS
- Test9 critical count >=0 → PASS
- Test10 inventory add/remove: count increases then returns → PASS
- Preserved Phase 9: time initial, schedule counts 5, schedules valid, full coverage, activities at times, paths to scheduled, day phases, time scale, pause, schedule changes → PASS
- Preserved Phase 8: building counts, doors walkable, homes valid, paths to home, validation, doors collision, fronts walkable, ownership → PASS
- Preserved Phase 7: nearby, around building, across bridge, blocked dest, no path, multiple NPCs → PASS

## Controls (Phase 10)
- **;** - Toggle needs bars (⚡🍖💬❤️ 32x3px above NPC)
- **,** - Toggle inventory (🍎🌾🔨🪙 below NPC)
- **.** - Toggle job progress (green bar + icon when working)
- **F10** - Boost all needs to 100%
- **F11** - Drain needs to critical (10%)
- **T** - Run all Phase7+8+9+10 tests
- **P** - Print life states + needs + inventory + jobs
- Previous: Q schedules, E clock, F overlay, Space pause, =/+ faster, -/_ slower, ] +1h, [ -1h, \ next phase, N paths, M nav grid, J/L/U/I buildings, Y all home, F5-F8 home, F9 toggle schedules, 5-9 path tests, 1-4 teleport, Z zoom, X smoothing, K collision, G grid, B coords, ` F2 debug, H help, R reset
