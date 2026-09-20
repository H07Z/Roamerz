# Roamerz - Living World Adventure Game

A 2D top-down living-world adventure where NPCs live independently of the player.

## Technology Stack

**Selected:**
- **TypeScript + Vite + HTML5 Canvas 2D**

### Why this stack?

**Chosen: Vanilla TypeScript + Canvas**
- ✅ Full control over game loop, rendering, collision, pathfinding
- ✅ Simplest reliable implementation (no engine bloat)
- ✅ Perfect for custom living-world simulation
- ✅ Works flawlessly in browser preview (Arena)
- ✅ Easy modular architecture
- ✅ Placeholder graphics first, sprite replacement later
- ✅ Zero heavy dependencies, fast iteration

**Considered Alternatives:**
- **Phaser:** Great for 2D games, but hides core systems we want to build ourselves (collision, pathfinding). Overkill for foundation phases.
- **Godot / Unity:** Not web-native in this sandbox, binary assets, harder to preview.
- **Python / Pygame:** Harder to host preview, not browser-native.

## Project Phases

```
PHASE 1  — Project Foundation [COMPLETE]
PHASE 2  — World Map [CURRENT - COMPLETE]
PHASE 3  — Player Movement
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

## Phase 2 - World Map [CURRENT]

### Objective
First small village map:
- Village square
- Forest entrance
- Road (N-S and E-W cross)
- 5 houses
- Small farm with fence
- Small river with bridge
- Trees, rocks, boundaries

### Map Details
- **ID:** village_01 - Greenhollow Village
- **Size:** 50 x 40 tiles = 2000 tiles
- **Tile Size:** 32px = 1600x1280px world
- **Terrain Types (8):** GRASS, ROAD, WATER, BRIDGE, TREE, ROCK, HOUSE, FARMLAND
- **Features:**
  - Village square at (25,20)
  - River at x=38-39 vertical
  - Bridge at 36-41,19-20 (12 tiles, distinct)
  - 5 houses with doors
  - Farm at SW with rock fence
  - Forest dense north
  - Boundaries: TREE/ROCK border with openings

### Running

```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Controls (Phase 2 Debug)
- **WASD / Arrows + E** - Pan map (debug, before camera system)
- **C** - Center on village square
- **G** - Toggle grid
- **B** - Toggle tile coordinates
- **D** - Toggle debug overlay
- **H** - Toggle help panel
- **R** - Reset timer + center

### Architecture

```
src/
├── core/
│   ├── Game.ts          - Main loop + world integration
│   ├── Renderer.ts      - Canvas & background (fallback)
│   ├── InputManager.ts  - Keyboard/mouse
│   └── DebugManager.ts  - FPS, time, screen, map info
├── world/
│   ├── TerrainType.ts   - Enum + properties
│   ├── WorldMap.ts      - Map data container + validation
│   ├── World.ts         - World manager
│   ├── WorldRenderer.ts - Tile rendering with distinct visuals
│   ├── maps/
│   │   └── village_01.ts - Generator (data separate from logic)
│   └── README.md
├── data/
│   └── maps/
│       └── village_01.json - JSON data file (data-driven)
└── main.ts              - Bootstrap
```

### Debug Overlay Shows
- FPS with color indicator
- Game Time
- Screen W/H
- World Offset (for boundary testing)
- Map ID, Name, Size, Tile count
- Tile counts per type (G,R,W,B,T,O,H,F)
- Validation: OK/CORRUPT + Types distinct count
- Map border (red dashed) when visible

### Data-Driven Design
- Map data in `src/data/maps/village_01.json`
- Generator in `src/world/maps/village_01.ts` separate from WorldMap logic
- WorldMap validates tile count and terrain validity on load

## Development Principles
1. Small changes
2. Test before expanding
3. No unnecessary complexity
4. Modular architecture
5. Data-driven design
6. Debug everything
7. Don't rewrite working systems
8. Placeholder graphics first

## Phase 1 Recap
- Game window, rendering surface, game loop with deltaTime
- FPS/debug, responsive resize
- No player/NPCs yet (by design)
