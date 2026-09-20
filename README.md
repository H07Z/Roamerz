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
PHASE 8  — NPC Homes & Buildings [CURRENT - COMPLETE]
PHASE 9  — Time & NPC Schedules
PHASE 10 — NPC Life Simulation
PHASE 11 — Player Interaction & Dialogue
PHASE 12 — Exploration & World Expansion
```

## Phase 8 - NPC Homes & Buildings [CURRENT]

### Objective
Buildings as first-class entities with doors, owners, types, interiors. NPCs have homes they return to, occupancy tracking.

### Buildings
- 6 buildings: 5 houses + 1 shed
  - HOUSE001 Farmer's House 12,10 6x5 door 15,14 south FARMHOUSE owner NPC001
  - HOUSE002 Shopkeeper's House 32,8 6x5 door 34,13 south SHOP owner NPC002
  - HOUSE003 Blacksmith's Forge 15,25 6x5 door 18,25 north BLACKSMITH owner NPC003
  - HOUSE004 Villager's Cottage 28,26 6x5 door 30,26 north HOUSE owner NPC004
  - HOUSE005 Child's Home 5,17 5x4 door 10,19 east HOUSE owner NPC005
  - SHED001 Farm Shed 9,32 2x2 door 10,34 south SHED no owner
- BuildingType: HOUSE, SHOP, BLACKSMITH, FARMHOUSE, SHED, INN, STORAGE (7 types)
- Each building: id, type, name, x,y,width,height, door {x,y,worldX,worldY,facing,isLocked}, ownerId, interior {hasInterior, interiorMapId, entryTile}, occupancy
- Door facing determines front-of-door tile (where NPC stands)
- Validation: no overlaps, doors near building

### Building Manager & Renderer
- BuildingManager: creates from WorldMap, tileToBuilding and doorToBuilding maps, getBuildingAtTile, getBuildingByDoorTile, getHomeForNPC, getCounts (total,residential,withInterior,byType), validate
- BuildingRenderer: door overlay (brown with knob + facing arrow), label (id+name), ownership (owner + occupied dot), front-of-door (yellow transparent), blocked overlay, zoom-aware

### NPC Homes Integration
- NPCState extended: GOING_HOME, AT_HOME, INSIDE
- NPC has homeBuilding, atHomeTimer 3s, insideTimer 5s, homeVisits
- goHome() → path to front-of-door (fallback door tile), state GOING_HOME
- followPath() → if goingHome and complete → AT_HOME
- AT_HOME → wait 3s → enterHome() → INSIDE + building.setOccupied(true,id) + homeVisits++
- INSIDE → wait 5s → leaveHome() → building.setOccupied(false) → IDLE → alternative target
- IDLE 30% chance to goHome if has home
- NPCManager links homeId to building, setBuildingManager updates all

### Debug Building View
- J toggle doors, L toggle labels, U toggle ownership, I toggle front-of-door
- Y all NPCs go home, F5-F8 NPC1-4 go home
- Shows: Building id, name, x,y, door x,y, owner, occupied + occupant
- Visual: brown door with yellow knob, facing arrow, yellow front tile dashed

### Tests (Phase 8)
- Test1 building counts: total 6, residential 5, withInterior 5 → PASS
- Test2 doors walkable: 6 doors in nav grid walkable → PASS
- Test3 NPC homes valid: 5 NPCs have homeBuilding linked → PASS
- Test4 paths to home: pathfinder from NPC to front-of-door for each NPC → PASS (all FOUND)
- Test5 building validation: no overlaps, doors near building → PASS
- Test6 doors collision walkable: doors are ROAD → WALKABLE/INTERACTABLE not BLOCKED → PASS
- Test7 front-of-door walkable: 6 fronts walkable in nav grid → PASS
- Test8 ownership linkage: building owner exists and owner home matches building → PASS
- Additional: goHome → AT_HOME → INSIDE → leave cycle → PASS, occupancy tracking → PASS
- Phase 7 preserved: nearby, around building, across bridge, blocked dest, no path, multiple NPCs, stuck, recalc → PASS

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 8)
- **WASD/Arrows** - Move player
- **C** - Center on player, **V** - Village
- **Z** - Zoom 1/1.5/0.75, **X** - Smoothing 5/0/10
- **K** - Collision overlay (red X blocked, yellow interactable)
- **N** - Toggle NPC paths (● nodes, yellow current, cyan future, red dest)
- **M** - Toggle navigation grid (red blocked tint, green walkable)
- **J** - Toggle building doors (brown door + knob + facing arrow)
- **L** - Toggle building labels (id+name)
- **U** - Toggle ownership (owner + occupied)
- **I** - Toggle front-of-door (yellow transparent + FRONT label + line)
- **Y** - All NPCs go home, **F5-F8** - NPC1-4 go home
- **T** - Run all Phase7+8 tests in console
- **P** - Print NPC + building states
- **O** - Toggle obstacle at 24,18 (Test6 recalculate)
- **5/6/7/8/9** - Pathfinding tests (nearby, around building, across bridge, blocked, no path)
- **1/2/3/4** - Teleport to tree/water/bridge/house
- **G** - Grid, **B** - Tile coords, **` / F2 / D** - Debug, **H** - Help, **R** - Reset

### Architecture

```
src/
├── building/
│   ├── BuildingType.ts - 7 types, properties, residential, interior
│   ├── Building.ts - door, interior, occupancy, front-of-door, blocked tiles
│   ├── BuildingManager.ts - 6 buildings, tile maps, validation, counts
│   ├── BuildingRenderer.ts - doors, labels, ownership, fronts, zoom-aware
│   └── README.md
├── core/Game.ts - + BuildingManager/Renderer, J/L/U/I/Y/F5-F8, T runs Phase7+8, building debug
├── core/DebugManager.ts - + buildingInfo, buildingDetails, Phase 8
├── npc/
│   ├── NPC.ts - + GOING_HOME,AT_HOME,INSIDE, homeBuilding, goHome(), enter/leave, homeVisits
│   ├── NPCManager.ts - + buildingManager linking
│   ├── NPCRenderer.ts - + home indicator ⌂, visits, INSIDE dimmed
│   └── README.md
├── pathfinding/ - preserved Phase 7 A*
├── camera/ - preserved zoom sync
├── collision/ - doors walkable
├── world/ - 50x40 village
└── main.ts
```

### Previous Phases
- Phase 7: A* pathfinding, navigation grid 0/1, path request START→DEST→Find→Validate→Follow→Reach, failure handling WAITING 3s retry max 3 → alternative, stuck detection 10px 0.5s → STUCK → recalc limit 3 cooldown 2s, debug path view N toggle ● nodes
- Phase 6: NPC foundation 5 NPCs A↔B, role colors, stuck detection
- Phase 5: Camera follow, clamp, smooth lerp, zoom (fixed WorldRenderer sync)
- Phase 4: Collision WALKABLE/BLOCKED/INTERACTABLE, AABB sliding
- Phase 3: Player 150px/s, 8-dir, IDLE/WALK, boundary clamp
- Phase 2: Village 50x40=2000 tiles, 8 terrain, square, houses, farm, river+bridge
- Phase 1: Game loop, renderer, input, debug

## Principles
Small changes, test before expanding, no unnecessary complexity, modular, data-driven, debug everything, placeholder graphics first

## Phase 7 - NPC Pathfinding (Archive)

### Objective
Most important phase - A* navigation independent from schedules, robust failure handling.

### Navigation Grid
- Separate from visual tiles and collision
- 0=Walkable, 1=Blocked
- Generated from CollisionMap (WALKABLE/INTERACTABLE→0, BLOCKED→1)
- 50x40=2000 tiles, 1493 walkable, 507 blocked
- ASCII debug view available

### A* Pathfinding
- 4-dir for reliability (no corner cutting), optional 8-dir with corner checks
- Manhattan heuristic for 4-dir, Octile for 8-dir
- Open list sorted by f, closed set, open map for lookup
- Safety abort if nodesVisited > width*height*2
- Stats: nodesVisited, timeMs
- Handles start==end, not walkable start/dest

### Pathfinder
- High-level manager: NavigationGrid + AStar
- requestPath(start,dest,requesterId) → PathResult {path,success,timeMs,nodesVisited}
- validatePath() checks if path still walkable (for obstacle added)
- Recalculation limiting: cooldown 2000ms per NPC, max 3 attempts
- Stats: total, successful, failed, successRate

### NPC Integration
- New states: PATHFINDING, FOLLOWING_PATH, WAITING, STUCK, IDLE, WALK
- requestPath(tile), requestPathToWorld()
- Flow: START+DEST → Find Path → Validate → Follow node by node → Reached → IDLE → switch target
- Failure: NO PATH → WAITING 3s → Retry max 3 → Alternative (switch A↔B)
- Stuck: Detect no progress 0.5s → STUCK → recalculate with cooldown 2s max 3 → WAITING
- followPath() converts tile to world center, dist<8 advance, complete→IDLE
- Stats: requests, found, failed, distance, recalculations

### Debug Path View
- N toggle paths, M toggle nav grid
- Shows: Path Found, Path Length, Current Node, Destination
- Visual: cyan line if found, red if failed, nodes ● (gray visited, yellow current 6px pulsing, cyan future 4px), dest red 7px DEST label, NPC→current yellow dashed
- Example: NPC ↓ ● ● ● ● ● → DESTINATION

### Tests (Phase 7)
- Test1 nearby (25,20→27,20) length 3 → PASS
- Test2 around building (10,10→18,10) length 11 detour around HOUSE001 → PASS
- Test3 across bridge (24,19→42,19) length 19 uses bridge 36-41 → PASS
- Test4 blocked dest water (38,10) → NO PATH correctly → PASS
- Test5 no path (0,0 tree border) → NOT_FOUND → PASS
- Test6 obstacle added at 24,19 → recalculate around → PASS
- Test7 multiple NPCs 5 simultaneously all FOUND → PASS
- Failure handling: no freeze/crash/wall/teleport → PASS (WAITING→Retry→Alternative)
- Stuck detection → PASS (0.5s threshold, cooldown 2s, max 3)
- Recalculation limiting → PASS (2000ms cooldown)
- Debug view → PASS (N toggle shows nodes)

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 7)
- **WASD/Arrows** - Move player
- **C** - Center on player, **V** - Village
- **Z** - Zoom 1/1.5/0.75, **X** - Smoothing 5/0/10
- **K** - Collision overlay (red X blocked, yellow interactable)
- **N** - Toggle NPC paths (● nodes, yellow current, cyan future, red dest)
- **M** - Toggle navigation grid (red blocked tint, green walkable)
- **T** - Run all Phase 7 tests in console
- **O** - Toggle obstacle at 24,18 (Test6 recalculate)
- **5/6/7/8/9** - Test1-5 for individual NPCs
- **P** - Print NPC path states, **G** - Grid, **B** - Tile coords
- **\` / F2** - Debug, **H** - Help, **R** - Reset

### Architecture

```
src/
├── core/Game.ts - + NavigationGrid, Pathfinder, NPCManager with pathfinding, debug T/O/5-9
├── core/DebugManager.ts - + pathfindingInfo, npcPathInfo
├── pathfinding/
│   ├── NavigationGrid.ts - 0 walkable 1 blocked separate from visual
│   ├── Path.ts - nodes, status, currentIndex, validation
│   ├── AStar.ts - 4-dir A* with heuristic, corner checks, stats
│   ├── Pathfinder.ts - requestPath, validation, cooldown limiting, stats
│   └── README.md
├── npc/
│   ├── NPC.ts - PATHFINDING/FOLLOWING_PATH/WAITING/STUCK + IDLE/WALK, requestPath, followPath, stuck detection
│   ├── NPCRenderer.ts - actual A* path rendering with nodes
│   ├── NPCManager.ts - creates nav grid + pathfinder, 5 NPCs with walkable door starts
│   └── README.md
├── camera/...
├── collision/...
├── world/...
└── main.ts
```

### Previous Phases
- Phase 6: NPC foundation 5 NPCs A↔B, role colors, stuck detection
- Phase 5: Camera follow, clamp, smooth lerp, zoom
- Phase 4: Collision WALKABLE/BLOCKED/INTERACTABLE, AABB sliding
- Phase 3: Player 150px/s, 8-dir, IDLE/WALK, boundary clamp
- Phase 2: Village 50x40=2000 tiles, 8 terrain, square, houses, farm, river+bridge
- Phase 1: Game loop, renderer, input, debug

## Principles
Small changes, test before expanding, no unnecessary complexity, modular, data-driven, debug everything, placeholder graphics first
