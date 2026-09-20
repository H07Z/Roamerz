# Exploration System - Phase 12 World Expansion

## Overview
Tracks explored tiles per map, fog of war, vision radius, minimap, world expansion with 3 maps and transitions.

## Modules

### ExplorationSystem.ts
- **ExplorationData:** explored boolean[] flat, visible boolean[] per frame, width, height, discoveredCount, totalTiles
- **Class ExplorationSystem:** visionRadius 8, explorationMap Map<mapId, ExplorationData>, totalDiscovered, totalTiles, mapTransitions
- **initialize(maps):** Creates ExplorationData per map with false arrays, totalTiles sum
- **update(playerTile, mapId):** Clears visible, iterates dx,dy within radius circle (distSq <= radius^2), sets visible true, if not explored sets explored true and increments discoveredCount and totalDiscovered
- **Methods:** isExplored, isVisible, getExploredData, getExploredCount, getTotalExploredCount, getTotalTiles, getTotalTilesForMap, getExplorationPercentage, getTotalExplorationPercentage, getAllMapsExploration, revealAll, revealAllMaps, reset, recordMapTransition, getMapTransitions, getDebugString, getMapDebugString

### ExplorationRenderer.ts
- **Class ExplorationRenderer:** showFog true, showExploredDim true, setters
- **renderFog(ctx, worldRenderer, camera, explorationSystem, mapId, screenWidth, screenHeight):** If !showFog return, get data, calculate visible tile range from camera offset/zoom, for each tile in view if !explored fill rgba(0,0,0,0.95), else if !visible && showExploredDim fill rgba(0,0,0,0.5)
- **renderVisionDebug(ctx, worldRenderer, camera, playerX, playerY, visionRadius):** Draws circle radius * tileSize * zoom with dashed blue

### MinimapRenderer.ts
- **Class MinimapRenderer:** showMinimap true, minimapSize 150, minimapX/Y, scale 3, setters
- **render(ctx, map, explorationSystem, player, npcs, buildings, screenWidth, screenHeight):** Top-right box 150x150, bg rgba(0,0,0,0.8), title map.name + exploration%, scale = min((box-10)/mapWidth, (box-20)/mapHeight, 3), offset x+5 y+15, render explored tiles with color per TerrainType (grass #2d5a2d visible #1a3a1a dim, road #8B7355, water #2a5a8a, bridge #6b4c2a, tree #1a4a1a, rock #5a5a5a, house #8a5a3a, farmland #5a6b2a), buildings as gray squares, NPCs as colored dots per role, player white dot + vision circle, border, instructions TAB minimap
- **renderFullMap(ctx, map, explorationSystem, screenWidth, screenHeight):** Centered 400x400 overlay bg 0.9, title exploration%, scale to fit, render explored tiles black if unexplored else terrain color, instructions M to close

## World Expansion

### World.ts Phase 12
- **initialize():** Loads village_01, forest_01, lake_01, creates WorldMap per data, stores in maps, currentMap = village, overrides village entrances to point to forest_01 and lake_01 at same positions (24,0 north -> forest, 24,39 south -> lake, 0,19 west -> forest, 49,19 east -> lake)
- **getAllMaps(), getAllMapsInfo():** Returns all maps
- **loadMap(mapId):** Sets currentMap

### Maps
- **village_01.ts:** Existing 50x40, 5 houses, river, bridge, square, farm, forest dense north, entrances overridden in World.ts to forest/lake
- **forest_01.ts:** New 50x40 Whispering Woods, dense 60% trees, central clearing 20,16 12x8 grass with pond 23,18 6x4 water + bridge island, 3 ruins (RUIN001 10,8 5x4, RUIN002 35,10 6x5, RUIN003 15,28 5x4), roads N-S 24,25 and E-W 19,20 cross, paths to ruins, rocks, boundaries trees, openings at same road positions, entrances north->lake, south->village, west->village, east->lake
- **lake_01.ts:** New 50x40 Crystal Lake, large lake 15,12 20x12 water with island 22,16 6x4 grass + tree + rock, bridge/dock to island N and S, sandy shore farmland around lake adjacent to water 70% chance, fishing hut 22,26 6x4 house + road, small farm 30,28 8x4 farmland + shed 32,29 2x2 house, trees/rocks scattered, roads cross, boundaries rock north tree south, openings, entrances north->village, south->forest, west->village, east->forest

### Game Integration Phase 12
- **Fields:** explorationSystem, explorationRenderer, minimapRenderer, showFog true, showMinimap true, showFullMap false, showVisionDebug false, playerMapId village_01, mapTransitionCooldown 0
- **Initialize:** world.initialize loads 3 maps, explorationSystem.initialize with all maps info, collision/navigation/pathfinder/building for current map (village), NPCs, life, interaction, dialogue, exploration initial update from player tile, set fog/minimap visibility, log Phase 12
- **switchMap(targetMapId, entryEdge north/south/west/east):** If same map return false, get targetMap, world.loadMap, reinitialize collision, navigation, pathfinder grid, buildingManager, camera world map, position player at opposite edge (north->south edge y=height-2 x=24, south->north y=1 x=24, west->east x=width-2 y=19, east->west x=1 y=19), search nearby walkable if blocked (radius 5), set player position, playerMapId=target, recordMapTransition, cooldown 1s, update exploration for new map, center camera, log
- **handleMapTransitions():** If no player or cooldown>0 or dialogue open return, get current map and tilePos, if at edge y<=0 x=24/25 target based on current: village->forest, forest->lake, lake->village north; y>=height-1 x=24/25 south: village->lake, lake->forest, forest->village; x<=0 y=19/20 west: village->forest, forest->lake, lake->village; x>=width-1 y=19/20 east: village->lake, lake->forest, forest->village; if target and edge call switchMap
- **Update:** renderer, world, worldRenderer, mapTransitionCooldown--, timeManager update if !dialogue open, player update with isDialogueOpen, camera follow, explorationSystem.update(tilePos, mapId), handleMapTransitions, debug player, collision, NPCs only if isVillage (mapId village_01) and !dialogue open, life only if isVillage and !dialogue open, interaction always, handleDialogueInput with wasDialogueOpenBeforeInput stored, debug NPC, pathfinding, building, time, schedule, life, interaction, dialogue, exploration (currentMap discovered/total percentage totalDiscovered/totalTiles totalPercentage visionRadius transitions showFog showMinimap debug), world (currentMapId/name mapCount allMaps playerMapId), debug update, mapInfo, worldOffset, cameraInfo, handleDebugToggles with wasDialogueOpen
- **Render:** clear, worldRenderer render map, collision debug, navigation grid debug if show, buildingRenderer, fog via explorationRenderer.renderFog if showFog, NPCs only if isVillage, playerRenderer + vision debug if showVisionDebug, time overlay, clock, timeline, minimap if showMinimap, full map if showFullMap, interaction prompt if !dialogue open, dialogue if open, debug, help, map transition hint if at edge and cooldown<=0 (box centered top 50px "🌍 Press forward to travel to next map")
- **Controls:** TAB toggle minimap, F toggle fog (Shift+F overlay), Shift+M full map, Shift+R reveal all current map, Ctrl+R reset exploration, Shift+[ / Shift+] vision radius -/+, F1/F2/F3 jump to village/forest/lake (test), WASD move, E interact, 1-4 teleport safe (when dialogue closed), edges to travel, etc.
- **Tests:** Phase 12 tests - Test1 world maps 3, Test2 current map, Test3 vision radius 8, Test4 exploration current map discovered>0, Test5 total exploration, Test6 transitions, Test7 reveal all current map -> totalTiles, Test8 reset and re-explore -> >0, Test9 all maps exploration 3 entries, Test10 fog/minimap toggles

### DebugManager Phase 12
- Phase label 12, boxWidth 620, added ExplorationDebugInfo and WorldDebugInfo interfaces, fields explorationInfo, worldInfo, setters, boxHeight includes worldHeight and explorationHeight, render WORLD line with mapCount currentMapId name playerMapId allMaps ids, EXPLORATION line with currentMapName discovered/total percentage totalDiscovered/totalTiles totalPercentage visionRadius transitions fog/minimap toggles

## Testing Phase 12
- Test1 world maps 3 -> PASS
- Test2 current map exists -> PASS
- Test3 vision radius 8 -> PASS
- Test4 exploration current map discovered>0 -> PASS
- Test5 total exploration discovered>0 -> PASS
- Test6 map transitions >=0 -> PASS
- Test7 reveal all current map -> totalTiles -> PASS
- Test8 reset and re-explore -> >0 -> PASS
- Test9 all maps exploration 3 entries -> PASS
- Test10 fog/minimap toggles -> PASS
- Preserved Phase 11/10/9/8/7 -> PASS

## Controls Phase 12
- **WASD/Arrows** - Move player (blocked during dialogue), walk to edge road to travel between maps
- **E / Enter** - Interact NPC/building when prompt
- **1-4** - Choose dialogue option (when open), else teleport safe positions (when closed, and was not open before)
- **TAB** - Toggle minimap (top-right, shows explored, player white, NPCs colored, buildings gray, vision circle)
- **F** - Toggle fog of war (dark unexplored 0.95, dim explored 0.5)
- **Shift+M** - Toggle full map (400x400 overlay)
- **Shift+R** - Reveal all current map
- **Ctrl+R** - Reset exploration
- **Shift+[ / Shift+]** - Vision radius -1/+1 (1-20)
- **F1/F2/F3** - Jump to village/forest/lake (test)
- **ESC** - Close dialogue
- **O** - Toggle interaction prompt
- **Q** - Toggle schedule debug (when dialogue closed)
- **Shift+E** - Toggle clock, **Shift+F** - Toggle day/night overlay
- **; , .** - Toggle needs/inventory/jobs
- **Space** - Pause/resume time (blocked when dialogue open)
- **T** - Run all Phase7+8+9+10+11+12 tests, **P** - Print states
- **N/M/J/L/U/I/Y/F5-F8/F9/F10/F11/F12** - Previous debug
- **G/B/`/F2/D/H/R** - General debug
