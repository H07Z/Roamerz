# Player System - Phase 3

## Overview
Single player with movement, states, direction, world boundary clamping.

## Modules

### Player.ts
- **PlayerState:** IDLE, WALK
- **PlayerDirection:** 8 directions (UP, DOWN, LEFT, RIGHT, UP_LEFT, UP_RIGHT, DOWN_LEFT, DOWN_RIGHT)
- **PlayerData:** x, y, speed, direction, state
- Properties: x, y (world pixels), speed (px/s), direction, state, width/height (20x20), totalDistanceTraveled
- Methods:
  - `update(deltaTime, input, worldMap)` - handles WASD/Arrows, normalizes diagonal, deltaTime movement, clamps to world boundaries
  - `getPosition()`, `getTilePosition()`, `getData()`, `getTotalDistance()`
  - `isAtBoundary()` - checks if at world edge
  - `setPosition()` - for reset/testing

**Movement:**
- Uses deltaTime: `delta = direction * speed * deltaTime`
- Diagonal normalized: `length = sqrt(x²+y²)`, `x/=length`, `y/=length`
- Speed consistent at different FPS because deltaTime based
- Cannot leave world: clamped to `mapWidth*TILE_SIZE` and `mapHeight*TILE_SIZE`

### PlayerRenderer.ts
- Placeholder graphics:
  - Shadow ellipse
  - Body rectangle green tunic
  - Head circle skin + hair
  - Eyes offset by direction
  - Direction arrow triangle
  - State indicator dot (green idle, yellow walk)
  - White outline
  - Walk bobbing animation using sin(time)
- Methods:
  - `update(deltaTime, player)` - walk anim
  - `render(ctx, player, worldRenderer)` - worldToScreen conversion, culling

## Testing Requirements (Phase 3)
- Player moves up → PASS (W/Up)
- Player moves down → PASS (S/Down)
- Player moves left → PASS (A/Left)
- Player moves right → PASS (D/Right/E/Right)
- Diagonal behaves correctly → PASS (normalized, not faster)
- Movement speed consistent at different FPS → PASS (deltaTime)
- Player cannot leave world boundaries → PASS (clamped)

## Architecture
```
INPUT → Player.update(deltaTime) → Player.x,y → WorldRenderer offset follows → PlayerRenderer renders
```

Separated from World, Renderer, Input, Debug.
