# Collision System - Phase 4

## Overview
Prevents player from walking through blocked objects. Collision data separate from visual graphics.

## Modules

### CollisionType.ts
- **WALKABLE (0):** Grass, Road, Bridge, Farmland - player can walk
- **BLOCKED (1):** Water, Tree, Rock, House - blocks movement
- **INTERACTABLE (2):** Door (ROAD adjacent to HOUSE) - walkable + interactable for future phases
- Properties: walkable, blocksMovement, isInteractable, debugColor
- Separate from TerrainType - collision logic independent of visuals

### CollisionMap.ts
- Holds collision grid: width, height, tiles: CollisionType[]
- Methods: getCollisionType, setCollisionType, isWalkable, isBlocked, isInteractable, getCounts
- `fromWorldMap(worldMap)` - generates collision from world map:
  - Maps terrain to collision: GRASS/ROAD/BRIDGE/FARMLAND→WALKABLE, WATER/TREE/ROCK/HOUSE→BLOCKED
  - Second pass: marks ROAD tiles adjacent to HOUSE as INTERACTABLE (doors)
  - Logs counts for debug
- World boundaries outside map return BLOCKED

### CollisionSystem.ts
- Manages CollisionMap + WorldMap
- **checkCollisionAt(worldX, worldY, width, height):** Checks AABB overlap with tiles, returns collided, blockedTiles, collisionType
- **resolveMovement(currentX, currentY, deltaX, deltaY, width, height):** Resolves movement with collision:
  - Tries X movement first, checks collision
  - Then Y movement (using newX for sliding)
  - Handles diagonal sliding: if X blocked but Y not, Y succeeds, etc.
  - Clamps to world boundaries
  - Returns newX,newY, collidedX, collidedY, blockedTiles
- **isTileWalkable(tileX, tileY)**
- Debug: showCollision toggle, lastCollisionCheck, renderDebug:
  - Renders red overlay with X for BLOCKED, yellow for INTERACTABLE
  - Only visible tiles, semi-transparent

## Design Principles
- Collision separate from graphics (spec requirement)
- Tile-based collision shapes, not pixel-perfect
- AABB vs tiles
- Axis-separated resolution for corners/diagonal
- Sliding behavior: player can slide along wall when moving diagonally into it

## Player Integration
- Player.update now takes collisionSystem parameter
- Uses collisionSystem.resolveMovement instead of direct position update
- Tracks lastCollision and isColliding for debug
- Still uses deltaTime, normalized diagonal

## Testing (Phase 4)
- Player → Tree stops
- Player → Rock stops
- Player → Water stops
- Player → House stops
- Player → Bridge crosses (BRIDGE=WALKABLE)
- Corners and diagonal handled (sliding, not getting stuck)

## Debug
- K toggles collision overlay
- 1/2/3/4 teleport to test areas: tree, water, bridge, house
- Debug overlay shows current tile collision type, blocked tiles, counts, overlay status
