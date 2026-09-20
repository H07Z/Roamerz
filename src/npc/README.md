# NPC System - Phase 6 Foundation

## Overview
Introduce NPCs without pathfinding. 5 NPCs with simple movement between two points to prove movement works.

## Modules

### NPC.ts
- **NPCState:** IDLE, WALK
- **NPCDirection:** 4-dir (UP,DOWN,LEFT,RIGHT)
- **NPCData:** id,name,role,x,y,speed,direction,state,homeId
- **NPCPoint:** x,y
- Properties: id,name,role,x,y,speed,direction,state,homeId,width/height 18, pointA,pointB,targetPoint,movingToB,idleTimer,idleDuration 2s, stuck detection
- Methods:
  - `update(deltaTime, worldMap, collisionSystem)` - IDLE waits 2s then switches target, WALK moves towards target, normalizes, checks distance <5 to reach, stuck detection 2s
  - `getPosition()`, `getTilePosition()`, `getTarget()`, `getPoints()`, `getData()`, `isAtDestination()`

**Movement Test (Phase 6):**
```
Point A → NPC → Point B (walk) → idle 2s → Point A → ...
```

### NPCRenderer.ts
- Placeholder shapes distinct per role:
  - Farmer: green/brown, F icon
  - Shopkeeper: brown/blue, S icon
  - Blacksmith: gray/black, B icon
  - Villager: blue/green, V icon
  - Child: purple/yellow, C icon
- Body rect, head circle, hat, role icon, direction dot, state dot, name label, ID
- Walk bobbing animation
- Sort by Y for overlap
- `renderDebugPath()` - shows A-B line, points, target, line to target

### NPCManager.ts
- Manages all NPCs: Map<string,NPC>
- `initialize(worldMap)` - creates 5 NPCs:
  - NPC001 Farmer Joe at farm (15,31) ↔ square (25,20) speed 40 home HOUSE001
  - NPC002 Shopkeeper at (32,13) ↔ square (22,18) speed 35 home HOUSE002
  - NPC003 Blacksmith at (15,25) ↔ square (28,20) speed 30 home HOUSE003
  - NPC004 Villager at (28,26) ↔ square (24,19) speed 45 home HOUSE004
  - NPC005 Child at (5,17) ↔ playground (25,17) speed 60 home HOUSE005
- Methods: update, getNPC, getAllNPCs, getNPCsByRole, getCount, getNPCsNear

## Testing (Phase 6)
- NPCs render → distinct colors/icons
- NPCs can move → walk between A-B
- NPCs stop correctly → idle at destination
- NPCs do not crash → stuck detection
- NPC state changes → IDLE/WALK
- NPC collision does not cause infinite loops → stuck detection + idle

## No Pathfinding Yet
- Direct movement, not A* (Phase 7)
- No schedules yet (Phase 9)
- No homes/buildings navigation yet (Phase 8 will connect homeId)

## Future
- Phase 7: A* pathfinding
- Phase 8: Homes
- Phase 9: Schedules
- Phase 10: Life simulation
