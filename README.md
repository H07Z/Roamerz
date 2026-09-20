# Roamerz - Living World Adventure Game

A 2D top-down living-world adventure where NPCs live independently.

## Phases

```
PHASE 1  — Project Foundation [COMPLETE]
PHASE 2  — World Map [COMPLETE]
PHASE 3  — Player Movement [COMPLETE]
PHASE 4  — Collision System [COMPLETE]
PHASE 5  — Camera System [COMPLETE]
PHASE 6  — NPC Foundation [CURRENT - COMPLETE]
PHASE 7  — NPC Pathfinding
PHASE 8  — NPC Homes & Buildings
PHASE 9  — Time & NPC Schedules
PHASE 10 — NPC Life Simulation
PHASE 11 — Player Interaction & Dialogue
PHASE 12 — Exploration & World Expansion
```

## Phase 5 - Camera System [COMPLETE]

### Features
- Player following (follow + update with lerp)
- World boundaries (clampToMap, never show outside)
- Camera clamping (handles map smaller than screen)
- Smooth movement (exponential decay `1-exp(-smoothing*dt)`, frame-rate independent, snap <0.1)
- Optional zoom (0.1-3, scaled screen, affects clamping)
- Dead zone support

### Camera.ts
- x,y offset, targetX,targetY, smoothing, zoom, deadZone
- follow(), centerOn(), centerOnTile(), update(dt), clampToMap(), worldToScreen(), screenToWorld()

### Tests
- Player visible PASS (centered 400,300)
- Camera follows PASS (approaches target)
- Never shows outside PASS (clamp 0,0 to 800,680)
- Player cannot escape PASS (no negative offset)
- No shake PASS (smoothing)
- Smooth movement PASS (60 vs 30 FPS same)
- Zoom PASS (1/1.5/0.75)

## Phase 6 - NPC Foundation [CURRENT]

### Objective
Introduce NPCs without pathfinding, 5 NPCs moving between two points.

### NPCs
- NPC001 Farmer Joe (farmer) farm 15,31 ↔ square 25,20 speed 40 home HOUSE001
- NPC002 Shopkeeper (shopkeeper) 32,13 ↔ square 22,18 speed 35 home HOUSE002
- NPC003 Blacksmith (blacksmith) 15,25 ↔ square 28,20 speed 30 home HOUSE003
- NPC004 Villager (villager) 28,26 ↔ square 24,19 speed 45 home HOUSE004
- NPC005 Child (child) 5,17 ↔ playground 25,17 speed 60 home HOUSE005

### NPC System
- NPC.ts: IDLE/WALK, 4-dir, x,y,speed,homeId, pointA/pointB/target, idleTimer 2s, stuck detection 2s, update moves towards target, dist<5 reached → IDLE
- NPCRenderer.ts: Role colors (farmer green, shop brown, blacksmith gray, villager blue, child purple), body rect, head circle, hat, role icon F/S/B/V/C, direction dot, state dot, name label, bobbing, Y-sorted, debug paths A↔B
- NPCManager.ts: Manages 5 NPCs, initialize, update, getAll, getByRole, getNear

### Tests
- NPCs render distinct PASS (5 roles)
- NPCs can move A↔B PASS
- NPCs stop correctly PASS (idle at destination)
- No crash PASS (stuck detection)
- State changes IDLE/WALK PASS
- No infinite loops PASS (20s sim)
- Has exactly one home PASS

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 5+6)
- **WASD/Arrows** - Move player
- **C** - Center on player, **V** - Village
- **Z** - Zoom 1/1.5/0.75, **X** - Smoothing 5/0/10
- **K** - Collision overlay, **G** - Grid, **B** - Tile coords
- **N** - Toggle NPC paths A↔B debug, **P** - Print NPC states
- **\` / F2 / Shift+D** - Debug, **H** - Help, **R** - Reset
- **1-4** - Teleport to tree/water/bridge/house tests

### Architecture

```
src/
├── core/Game.ts - + Camera, NPCManager/Renderer, sync WorldRenderer offset from Camera
├── core/DebugManager.ts - + cameraInfo, npcInfo
├── camera/
│   ├── Camera.ts - follow, centerOn, update lerp, clampToMap, zoom, deadZone
│   └── README.md
├── npc/
│   ├── NPC.ts - IDLE/WALK, A↔B movement, stuck detection
│   ├── NPCRenderer.ts - role colors, bobbing, debug paths
│   ├── NPCManager.ts - 5 NPCs
│   └── README.md
├── collision/...
├── world/...
├── player/...
└── main.ts
```

## Previous Phases
- Phase 4: Collision WALKABLE/BLOCKED/INTERACTABLE, AABB, sliding, K overlay, 1-4 teleports
- Phase 3: Player 150px/s, 8-dir, IDLE/WALK, placeholder, boundary clamp, camera follow
- Phase 2: Village 50x40=2000 tiles, 8 terrain, square, 5 houses, farm, river+bridge
- Phase 1: Game loop, renderer, input, debug, FPS

## Principles
Small changes, test before expanding, no unnecessary complexity, modular, data-driven, debug everything, placeholder graphics first
