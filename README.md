# Roamerz - Living World Adventure Game

A 2D top-down living-world adventure where NPCs live independently of the player.

## Technology Stack

**Selected for Phase 1:**
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
- **Phaser:** Great for 2D games, but hides core systems we want to build ourselves (collision, pathfinding). Overkill for foundation phases. Could be considered later if we need advanced sprite animation pipelines.
- **Godot / Unity:** Not web-native in this sandbox, binary assets, harder to preview, engine lock-in.
- **Python / Pygame:** Harder to host preview, not browser-native.

**Tradeoff Summary:** We sacrifice built-in physics/sprite tools for complete control and simplicity. This aligns with "No unnecessary complexity" and "Small changes" principles.

## Project Phases

```
PHASE 1  — Project Foundation [CURRENT - COMPLETE]
PHASE 2  — World Map
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

## Phase 1 - Project Foundation

### Objective
Smallest possible working game application:
- Game window
- Rendering surface
- Basic game loop
- Simple background
- FPS/debug information

No player, no NPCs, no pathfinding yet.

### Running

```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Controls
- **D** - Toggle debug overlay
- **R** - Reset game timer

### Architecture

```
src/
├── core/
│   ├── Game.ts          - Main loop: INITIALIZE → UPDATE → RENDER
│   ├── Renderer.ts      - Canvas & background
│   ├── InputManager.ts  - Keyboard/mouse
│   └── DebugManager.ts  - FPS, time, screen size
└── main.ts              - Bootstrap
```

### Debug Overlay Shows
- FPS (with color indicator: green >50, yellow 30-50, red <30)
- Game Time (HH:MM:SS)
- Screen Width/Height
- Total Frames
- Status

## Development Principles
1. Small changes
2. Test before expanding
3. No unnecessary complexity
4. Modular architecture
5. Data-driven design
6. Debug everything
7. Don't rewrite working systems
8. Placeholder graphics first
