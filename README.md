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
PHASE 12 — Exploration & World Expansion [CURRENT - COMPLETE]
```

## Phase 12 - Exploration & World Expansion [CURRENT]

### Objective
Player can explore world, discover tiles, fog of war, minimap, and world expansion with multiple maps (village + forest + lake) and transitions via map edges. Exploration persists per map, vision radius reveals tiles, fog darkens unexplored and dims explored-but-not-visible.

### Exploration System
- **ExplorationSystem**: per map ExplorationData {explored boolean[] flat, visible boolean[] per frame, width, height, discoveredCount, totalTiles}, visionRadius 8, explorationMap Map<mapId, data>, totalDiscovered, totalTiles, mapTransitions. initialize(maps) creates false arrays. update(playerTile, mapId) clears visible, iterates dx,dy within radius circle distSq<=radius^2, sets visible true, if not explored sets explored true increments discoveredCount and totalDiscovered. Methods isExplored, isVisible, getExploredData, getExploredCount, getTotalExploredCount, getTotalTiles, getTotalTilesForMap, getExplorationPercentage, getTotalExplorationPercentage, getAllMapsExploration, revealAll, revealAllMaps, reset, recordMapTransition, getMapTransitions, getDebugString, getMapDebugString.
- **ExplorationRenderer**: showFog true, showExploredDim true, renderFog(ctx, worldRenderer, camera, explorationSystem, mapId, screenW, screenH) calculates visible tile range from camera offset/zoom, for each tile in view if !explored fill rgba(0,0,0,0.95) dark, else if !visible and showExploredDim fill rgba(0,0,0,0.5) dim, else no fog. renderVisionDebug draws circle radius*tileSize*zoom dashed blue.
- **MinimapRenderer**: showMinimap true, minimapSize 150, scale 3, render(ctx, map, explorationSystem, player, npcs, buildings, screenW, screenH) top-right box 150x150 bg rgba(0,0,0,0.8) title map.name + exploration%, scale = min((box-10)/mapWidth, (box-20)/mapHeight, 3), offset x+5 y+15, render explored tiles color per TerrainType (grass #2d5a2d visible #1a3a1a dim, road #8B7355, water #2a5a8a, bridge #6b4c2a, tree #1a4a1a, rock #5a5a5a, house #8a5a3a, farmland #5a6b2a), buildings gray squares, NPCs colored dots per role (farmer #8f8, shopkeeper #ff8, blacksmith #f88, villager #8ff, child #f8f), player white dot + vision circle blue, border, instructions TAB minimap. renderFullMap centered 400x400 overlay bg 0.9 title exploration%, scale to fit, render explored tiles black if unexplored else terrain color, instructions M to close.

### World Expansion
- **World.ts Phase 12**: initialize loads village_01, forest_01, lake_01, creates WorldMap per data, stores in maps, currentMap=village, overrides village entrances to point to forest_01 and lake_01 at same road positions (24,0 north -> forest, 24,39 south -> lake, 0,19 west -> forest, 49,19 east -> lake). Methods getAllMaps, getAllMapsInfo, loadMap.
- **village_01.ts**: 50x40 Greenhollow Village, 5 houses, river 38,39 water, bridge 36,41 19,20, square 20,16 12x8 road, farm 8,31 12x5 farmland, forest dense north, trees/rocks scattered, entrances overridden to forest/lake.
- **forest_01.ts**: New 50x40 Whispering Woods, dense 60% trees, central clearing 20,16 12x8 grass with pond 23,18 6x4 water + bridge island, 3 ruins RUIN001 10,8 5x4, RUIN002 35,10 6x5, RUIN003 15,28 5x4, roads N-S 24,25 and E-W 19,20 cross, paths to ruins, rocks, boundaries trees, openings, entrances north->lake, south->village, west->village, east->lake.
- **lake_01.ts**: New 50x40 Crystal Lake, large lake 15,12 20x12 water with island 22,16 6x4 grass + tree + rock, bridge/dock to island N and S, sandy shore farmland around lake adjacent to water 70% chance, fishing hut 22,26 6x4 house + road, small farm 30,28 8x4 farmland + shed 32,29 2x2 house, trees/rocks scattered, roads cross, boundaries rock north tree south, openings, entrances north->village, south->forest, west->village, east->forest.

### Game Integration Phase 12
- **Fields:** explorationSystem, explorationRenderer, minimapRenderer, showFog true, showMinimap true, showFullMap false, showVisionDebug false, playerMapId village_01, mapTransitionCooldown 0.
- **Initialize:** world.initialize loads 3 maps, explorationSystem.initialize with all maps info, collision/navigation/pathfinder/building for current map (village), NPCs, life, interaction, dialogue, exploration initial update from player tile, set fog/minimap visibility, log Phase 12.
- **switchMap(targetMapId, entryEdge north/south/west/east):** If same map return false, get targetMap, world.loadMap, reinitialize collision, navigation, pathfinder grid, buildingManager, camera world map, position player at opposite edge (north->south edge y=height-2 x=24, south->north y=1 x=24, west->east x=width-2 y=19, east->west x=1 y=19), search nearby walkable if blocked radius 5, set player position, playerMapId=target, recordMapTransition, cooldown 1s, update exploration for new map, center camera, log.
- **handleMapTransitions():** If no player or cooldown>0 or dialogue open return, get current map and tilePos, if at edge y<=0 x=24/25 target based on current: village->forest, forest->lake, lake->village north; y>=height-1 x=24/25 south: village->lake, lake->forest, forest->village; x<=0 y=19/20 west: village->forest, forest->lake, lake->village; x>=width-1 y=19/20 east: village->lake, lake->forest, forest->village; if target and edge call switchMap.
- **Update:** renderer, world, worldRenderer, mapTransitionCooldown--, timeManager update if !dialogue open, player update with isDialogueOpen, camera follow, explorationSystem.update(tilePos, mapId), handleMapTransitions, debug player, collision, NPCs only if isVillage (mapId village_01) and !dialogue open, life only if isVillage and !dialogue open, interaction always, handleDialogueInput with wasDialogueOpenBeforeInput stored, debug NPC, pathfinding, building, time, schedule, life, interaction, dialogue, exploration (currentMap discovered/total percentage totalDiscovered/totalTiles totalPercentage visionRadius transitions showFog showMinimap debug), world (currentMapId/name mapCount allMaps playerMapId), debug update, mapInfo, worldOffset, cameraInfo, handleDebugToggles with wasDialogueOpen.
- **Render:** clear, worldRenderer render map, collision debug, navigation grid debug if show, buildingRenderer, fog via explorationRenderer.renderFog if showFog, NPCs only if isVillage, playerRenderer + vision debug if showVisionDebug, time overlay, clock, timeline, minimap if showMinimap, full map if showFullMap, interaction prompt if !dialogue open, dialogue if open, debug, help, map transition hint if at edge and cooldown<=0 (box centered top 50px "🌍 Press forward to travel to next map").
- **Controls:** TAB toggle minimap, F toggle fog (Shift+F overlay), Shift+M full map, Shift+R reveal all current map, Ctrl+R reset exploration, Shift+[ / Shift+] vision radius -/+, F1/F2/F3 jump to village/forest/lake (test), WASD move, E interact, 1-4 teleport safe (when dialogue closed), edges to travel, etc.
- **Tests:** Phase 12 tests - Test1 world maps 3, Test2 current map, Test3 vision radius 8, Test4 exploration current map discovered>0, Test5 total exploration, Test6 transitions, Test7 reveal all current map -> totalTiles, Test8 reset and re-explore -> >0, Test9 all maps exploration 3 entries, Test10 fog/minimap toggles.

### DebugManager Phase 12
- Phase label 12, boxWidth 620, added ExplorationDebugInfo {currentMapId, currentMapName, discovered, total, percentage, totalDiscovered, totalTiles, totalPercentage, visionRadius, transitions, showFog, showMinimap, debug} and WorldDebugInfo {currentMapId, currentMapName, mapCount, allMaps, playerMapId}, fields explorationInfo, worldInfo, setters, boxHeight includes worldHeight and explorationHeight, render WORLD line with mapCount currentMapId name playerMapId allMaps ids, EXPLORATION line with currentMapName discovered/total percentage totalDiscovered/totalTiles totalPercentage visionRadius transitions fog/minimap toggles.

### Tests (Phase 12)
- Test1 world maps 3 → PASS
- Test2 current map exists → PASS
- Test3 vision radius 8 → PASS
- Test4 exploration current map discovered>0 → PASS
- Test5 total exploration discovered>0 → PASS
- Test6 map transitions >=0 → PASS
- Test7 reveal all current map -> totalTiles → PASS
- Test8 reset and re-explore -> >0 → PASS
- Test9 all maps exploration 3 entries → PASS
- Test10 fog/minimap toggles → PASS
- Preserved Phase 11/10/9/8/7 → PASS

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 12)
- **WASD/Arrows** - Move player (blocked during dialogue), walk to edge road (N/S/E/W at 24,0 / 24,39 / 0,19 / 49,19) to travel between maps
- **TAB** - Toggle minimap (top-right, shows explored tiles, player white, NPCs colored, buildings gray, vision circle)
- **F** - Toggle fog of war (dark unexplored 0.95, dim explored 0.5), **Shift+F** - Toggle day/night overlay
- **Shift+M** - Toggle full map (400x400 overlay)
- **Shift+R** - Reveal all current map, **Ctrl+R** - Reset exploration
- **Shift+[ / Shift+]** - Vision radius -1/+1 (1-20)
- **F1/F2/F3** - Jump to village/forest/lake (test)
- **E / Enter** - Interact NPC/building when prompt (💬)
- **1-4** - Choose dialogue option (when open), else teleport safe positions (when closed, blocked if was open before)
- **ESC** - Close dialogue
- **O** - Toggle interaction prompt, **F12** - Test dialogue NPC001
- **Q** - Toggle schedule debug (when dialogue closed)
- **Shift+E** - Toggle clock
- **; , .** - Toggle needs/inventory/jobs
- **C** - Center on player, **V** - Village (center tile 25,20)
- **Z** - Zoom 1/1.5/0.75, **X** - Smoothing 5/0/10
- **K** - Collision overlay
- **N** - Toggle NPC paths, **M** - Toggle nav grid (Shift+M full map)
- **J/L/U/I** - Building doors/labels/ownership/fronts
- **Space** - Pause/resume time (blocked when dialogue open), **= / +** - Faster x2 max 500x, **- / _** - Slower /2 min 1x, **]** - Advance 1 hour, **[** - Back 1 hour, **\** - Next phase
- **Y** - All go home, **F5-F8** - NPC1-4 go home, **F9** - Toggle schedules, **F10** - Boost needs 100%, **F11** - Drain critical
- **T** - Run all Phase7+8+9+10+11+12 tests, **P** - Print time+NPC+building+schedule+life+interaction+dialogue+exploration+world, **O** - Toggle obstacle
- **5/6/7/8/9** - Pathfinding tests (blocked when dialogue open)
- **G** - Grid, **B** - Tile coords, **` / F2 / D** - Debug, **H** - Help, **R** - Reset

### Architecture

```
src/
├── exploration/
│   ├── ExplorationSystem.ts - per map explored/visible boolean arrays, vision radius 8 circle, update reveals, percentages, transitions
│   ├── ExplorationRenderer.ts - fog dark unexplored 0.95, dim explored 0.5, vision debug circle
│   ├── MinimapRenderer.ts - top-right 150x150 minimap with terrain colors, buildings, NPCs, player, vision circle, full map 400x400 overlay
│   └── README.md
├── world/
│   ├── World.ts - Phase 12 loads 3 maps village+forest+lake, getAllMaps, getAllMapsInfo, loadMap, entrances overridden
│   ├── maps/
│   │   ├── village_01.ts - 50x40 Greenhollow, 5 houses, river, bridge, square, farm
│   │   ├── forest_01.ts - 50x40 Whispering Woods, 60% trees, clearing pond, 3 ruins
│   │   └── lake_01.ts - 50x40 Crystal Lake, large lake 20x12, island, fishing hut, sandy shore
│   ├── WorldMap.ts - map data, tileCounts, ascii
│   └── WorldRenderer.ts - tile rendering with zoom
├── interaction/ - preserved Phase 11 (range 60px, prompt)
├── dialogue/ - preserved Phase 11 (role-based trees, placeholders, actions)
├── life/ - preserved Phase 10 (needs, inventory, jobs)
├── time/ - preserved Phase 9 (TimeManager, TimeRenderer)
├── schedule/ - preserved Phase 9 (ScheduleManager)
├── building/ - preserved Phase 8 (6 buildings village, 3 ruins forest, 1 hut lake)
├── core/Game.ts - + ExplorationSystem/Renderer/MinimapRenderer, switchMap, handleMapTransitions, fog/minimap/full map rendering, TAB/F/Shift+M/Shift+R/Ctrl+R/F1-3 controls, T runs Phase7-12
├── core/DebugManager.ts - + ExplorationDebugInfo/WorldDebugInfo, WORLD and EXPLORATION lines, Phase 12 boxWidth 620
├── player/Player.ts - preserved with isDialogueOpen block, fixed E bug
├── npc/ - preserved village only
├── pathfinding/ - preserved A*
└── main.ts
```

### Previous Phases
- Phase 11: Interaction & Dialogue - E to talk 60px prioritize NPC, dialogue UI bottom box 600x400 speaker color wrapped text choices 1-4 ESC, role-based trees with placeholders, actions giveItem/restoreNeed, social++ happiness, building prompt, movement blocked during dialogue, time paused, teleport bug fixed (wasDialogueOpenBeforeInput)
- Phase 10: NPC Life Simulation - Needs 5 types decay/restore, Inventory 10 items role-based, Jobs 6 types produce every 10s, LifeManager eating/interactions, LifeRenderer bars
- Phase 9: Time & Schedules - TimeManager day phases, timeScale 60x, ScheduleManager 5 role schedules full coverage, NPC schedule changes
- Phase 8: 6 buildings, doors walkable, homes valid, paths to home, occupancy
- Phase 7: A* pathfinding, navigation grid, path request flow, failure handling WAITING retry, stuck detection, recalc limiting
- Phase 6: NPC foundation 5 NPCs A↔B, role colors
- Phase 5: Camera follow, clamp, smooth, zoom sync fixed
- Phase 4: Collision WALKABLE/BLOCKED/INTERACTABLE, AABB sliding
- Phase 3: Player 150px/s, 8-dir, IDLE/WALK, boundary
- Phase 2: Village 50x40, 8 terrain, square, houses, farm, river+bridge
- Phase 1: Game loop, renderer, input, debug

## Principles
Small changes, test before expanding, no unnecessary complexity, modular, data-driven, debug everything, placeholder graphics first
