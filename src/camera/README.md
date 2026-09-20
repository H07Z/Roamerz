# Camera System - Phase 5

## Overview
Follows player, handles world boundaries, clamping, smooth movement, optional zoom.

## Camera.ts
- **Properties:** x,y (offset), targetX,targetY, smoothing, zoom, deadZone, screenWidth/Height, worldMap, tileSize
- **Config:** smoothing (0=instant, 5=smooth), zoom (1=normal, 0.5-3), deadZone (pixels around center where camera doesn't move)
- **Methods:**
  - `follow(worldX,worldY)` - set target to center on world pos
  - `centerOn(worldX,worldY)` - instant center
  - `centerOnTile(tileX,tileY)` - center on tile
  - `update(deltaTime)` - smooth follow using `lerpFactor = 1 - exp(-smoothing * dt)` frame-rate independent, snap if close, clamp to map
  - `clampToMap()` - never show outside world, handles map smaller than screen
  - `getOffset()`, `setOffset()`, `worldToScreen()`, `screenToWorld()`, `screenToTile()`, `getWorldBounds()`, `isWorldPositionVisible()`
  - `setSmoothing()`, `setZoom()`, `setDeadZone()`

**Smoothing:** Uses exponential decay for frame-rate independence, prevents shake.

**Clamping:** Ensures camera never shows outside world, handles both larger and smaller maps.

**Zoom:** Scales screen coordinates, affects clamping.

**Dead Zone:** Optional area where camera doesn't move if target inside.

## Integration
- Game creates Camera, sets worldMap and screen size
- Each frame: Camera.follow(player.x,player.y), Camera.update(deltaTime)
- WorldRenderer offset synced from Camera offset
- PlayerRenderer and NPCRenderer use Camera.worldToScreen

## Testing (Phase 5)
- Player remains visible → Camera follows
- Camera follows correctly → target = player
- Camera never shows outside world → clampToMap
- Player cannot escape map → collision + camera clamp
- Camera does not shake → smoothing + snap
- Movement remains smooth → lerp

## Future
- Phase 12+ will add cinematic effects, but not now
