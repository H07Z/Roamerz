# Roamerz - Living World Adventure Game

A 2D top-down living-world adventure where NPCs live independently of the player.

## Technology Stack

**Selected:**
- **TypeScript + Vite + HTML5 Canvas 2D**

### Why this stack?
- Full control over game loop, rendering, collision, pathfinding
- Simplest reliable implementation, no engine bloat
- Perfect for custom living-world simulation
- Works in browser preview, modular, placeholder graphics first

## Project Phases

```
PHASE 1  — Project Foundation [COMPLETE]
PHASE 2  — World Map [COMPLETE]
PHASE 3  — Player Movement [CURRENT - COMPLETE]
PHASE 4  — Collision System
PHASE 5  — Camera System
PHASE 6  — NPC Foundation
PHASE 7  — NPC Pathfinding
PHASE 8  — NPC Homes & Buildings
PHASE 9  — Time & NPC Schedules
PHASE 10 — NPC Life Simulation
PHASE 11 — Player Interaction & Dialogue
PHASE 12 — Exploration & World Expansion
```

## Phase 3 - Player Movement [CURRENT]

### Objective
Add exactly ONE player with placeholder graphics, movement, states, world boundary clamping.

### Player Details
- **Start Position:** Village square (25,20) = 816,656 px
- **Speed:** 150 px/s (consistent via deltaTime)
- **Size:** 20x20 px
- **States:** IDLE, WALK
- **Directions:** 8-way (UP, DOWN, LEFT, RIGHT, UP_LEFT, UP_RIGHT, DOWN_LEFT, DOWN_RIGHT)
- **Movement:** WASD + Arrows, diagonal normalized (not faster), deltaTime based
- **Boundary:** Cannot leave world (1600x1280), clamped to map edges

### Placeholder Graphics
- Shadow ellipse
- Green tunic body rectangle
- Skin head circle + hair
- Eyes offset by direction
- Direction arrow triangle
- State dot (green IDLE, yellow WALK)
- Walk bobbing animation (sin wave)

### Running

```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Controls (Phase 3)
- **WASD / Arrows** - Move player (diagonal: W+A etc)
- **C** - Center camera on player
- **V** - Center on village square (debug)
- **G** - Toggle grid
- **B** - Toggle tile coords
- **\` / F2 / Shift+D** - Toggle debug overlay (D conflict avoided)
- **H** - Toggle help panel
- **R** - Reset player to village square + timer

### Architecture

```
src/
├── core/
│   ├── Game.ts          - Main loop + player + world + camera follow
│   ├── Renderer.ts      - Canvas fallback
│   ├── InputManager.ts  - Keyboard/mouse
│   └── DebugManager.ts  - FPS, time, screen, map, player info
├── world/
│   ├── TerrainType.ts
│   ├── WorldMap.ts
│   ├── World.ts
│   ├── WorldRenderer.ts - + centerOnTilePixel, camera follow
│   ├── maps/village_01.ts
│   └── README.md
├── player/
│   ├── Player.ts        - x,y,speed,dir,state, update with deltaTime, boundary clamp
│   ├── PlayerRenderer.ts - placeholder graphics, bobbing, direction indicator
│   └── README.md
├── data/maps/village_01.json
└── main.ts
```

### Debug Overlay Shows
- FPS, Game Time, Screen W/H, World Offset
- Player: Pos (px), Tile, Speed, Dir, State, Distance traveled, Boundary status
- Map: ID, Name, Size, Tile counts, Validation
- Help panel with controls + test checklist

### Tests (Phase 3)
- Move up (W/Up) → PASS
- Move down (S/Down) → PASS
- Move left (A/Left) → PASS
- Move right (D/Right/E) → PASS
- Diagonal normalized (150 not 212) → PASS
- Speed consistent at 60/30/10 FPS (deltaTime) → PASS
- Cannot leave world boundaries → PASS
- States IDLE/WALK → PASS

## Phase 2 Recap
- Village map 50x40 = 2000 tiles, 8 terrain types
- Square, 5 houses, farm, river with bridge, forest, boundaries
- Data-driven JSON + generator, validation

## Phase 1 Recap
- Game window, rendering surface, loop with deltaTime
- FPS/debug, resize handling

## Development Principles
1. Small changes
2. Test before expanding
3. No unnecessary complexity
4. Modular architecture
5. Data-driven design
6. Debug everything
7. Don't rewrite working systems
8. Placeholder graphics first
