# Roamerz - Living World Adventure Game

A 2D top-down living-world adventure where NPCs live independently of the player.

## Technology Stack
- **TypeScript + Vite + HTML5 Canvas 2D**

## Project Phases

```
PHASE 1  — Project Foundation [COMPLETE]
PHASE 2  — World Map [COMPLETE]
PHASE 3  — Player Movement [COMPLETE]
PHASE 4  — Collision System [CURRENT - COMPLETE]
PHASE 5  — Camera System
PHASE 6  — NPC Foundation
PHASE 7  — NPC Pathfinding
PHASE 8  — NPC Homes & Buildings
PHASE 9  — Time & NPC Schedules
PHASE 10 — NPC Life Simulation
PHASE 11 — Player Interaction & Dialogue
PHASE 12 — Exploration & World Expansion
```

## Phase 4 - Collision System [CURRENT]

### Objective
Prevent player from walking through blocked objects. Collision separate from graphics.

### Collision Types
- **WALKABLE (0):** Grass, Road, Bridge, Farmland - player can walk
- **BLOCKED (1):** Water, Tree, Rock, House wall - blocks movement
- **INTERACTABLE (2):** Door (ROAD adjacent to HOUSE) - walkable + future interaction

### Design
- Collision info separate from visual graphics (spec requirement)
- Tile-based AABB collision, not pixel-perfect
- Axis-separated resolution for sliding and corners
- CollisionMap generated from WorldMap but stored separately
- Bridge is WALKABLE, player can cross

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 4)
- **WASD / Arrows** - Move player (diagonal supported, sliding along walls)
- **C** - Center on player
- **K** - Toggle collision overlay (Red=BLOCKED X, Yellow=INTERACTABLE)
- **G** - Toggle grid, **B** - Tile coords
- **\` / F2 / Shift+D** - Toggle debug
- **H** - Help, **R** - Reset to square
- **1/2/3/4** - Teleport to test areas: tree (3,3), water (38,10), bridge (36,19), house (12,10)

### Architecture

```
src/
├── core/
│   ├── Game.ts - + collisionSystem, collision debug rendering
│   ├── DebugManager.ts - + collision info, current tile type
│   └── ...
├── world/
│   ├── WorldRenderer.ts - + centerOnTilePixel
│   └── ...
├── player/
│   ├── Player.ts - + collisionSystem param, resolveMovement, lastCollision
│   └── PlayerRenderer.ts
├── collision/
│   ├── CollisionType.ts - WALKABLE/BLOCKED/INTERACTABLE
│   ├── CollisionMap.ts - holds grid, fromWorldMap(), counts
│   ├── CollisionSystem.ts - checkCollisionAt, resolveMovement, renderDebug
│   └── README.md
└── main.ts
```

### Debug Overlay
- FPS, Time, Screen, Offset
- Player: Pos, Tile, Speed, Dir, State, Dist, Boundary, Colliding YES/NO, Current Tile type, Blocked tiles list
- Collision: Counts WALKABLE/BLOCKED/INTERACT, Overlay ON/OFF, mapping legend
- Map: ID, Size, Tile counts

### Tests (Phase 4)
- Player → Tree stops → PASS (Tree BLOCKED, collision at 3,3)
- Player → Rock stops → PASS (Rock BLOCKED at 2,10)
- Player → Water stops → PASS (Water BLOCKED at 38,10)
- Player → House stops → PASS (House BLOCKED at 12,10)
- Player → Bridge crosses → PASS (Bridge WALKABLE at 36,19)
- Corners/diagonal handled → PASS (axis-separated, sliding, X/Y blocked separately)
- Door INTERACTABLE walkable → PASS (found at 18,15 etc)

## Phase 3 Recap
- Single player 150px/s, 8-dir, IDLE/WALK, placeholder graphics, boundary clamp, camera follow, deltaTime consistent

## Phase 2 Recap
- Village 50x40=2000 tiles, 8 terrain types, square, 5 houses, farm, river+bridge, forest, boundaries, data-driven JSON

## Phase 1 Recap
- Game window, loop with deltaTime, FPS/debug, resize

## Principles
Small changes, test before expanding, no unnecessary complexity, modular, data-driven, debug everything, placeholder graphics first
