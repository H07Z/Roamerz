# Pathfinding System - Phase 7

## Overview
Most important phase - implements navigation/pathfinding independent from schedules using A*.

## Modules

### NavigationGrid.ts
- Holds navigation info separate from visual tiles and collision
- 0=Walkable, 1=Blocked
- Methods: isWalkable, isBlocked, setWalkable, get, set, getCounts, getAsciiRegion
- `fromCollisionMap()` - generates from collision map (WALKABLE/INTERACTABLE→0, BLOCKED→1)
- `fromWorldMap()` - fallback from world map
- Separate from visual as per spec

### Path.ts
- PathNode {x,y}
- PathStatus: NOT_FOUND, FOUND, FOLLOWING, REACHED, FAILED, INVALID
- Path class: nodes, start, destination, status, currentIndex
- Methods: getLength, getCurrentNode, getNextNode, getCurrentIndex, advance, isComplete, isFound, isFailed, getRemainingNodes, validate(isWalkable)
- Static: notFound, failed

### AStar.ts
- Grid-based A* implementation
- 4-dir (reliable, no corner cutting) and optional 8-dir with corner checks
- Directions: 4 with cost 1, 8 with cost 1 and 1.4 diagonal
- Heuristic: Manhattan for 4-dir, Octile for 8-dir
- Uses openList sorted by f, closedSet, openMap for quick lookup
- Safety: aborts if nodesVisited > width*height*2
- Stats: nodesVisited, timeMs
- Methods: findPath(start,end,grid) → Path|null, setUseDiagonal, getLastSearchStats
- Handles start==end, start/dest not walkable

### Pathfinder.ts
- High-level manager using NavigationGrid + AStar
- PathRequest {id,start,destination,requestTime}, PathResult {request,path,success,timeMs,nodesVisited}
- Methods: setNavigationGrid, setUseDiagonal, setRecalculationCooldown, requestPath(start,dest,requesterId) → PathResult, validatePath, isWalkable, getStats, getGridAscii
- Recalculation limiting: lastPathRequests Map, cooldown 2000ms per NPC to prevent CPU spam
- Stats: total, successful, failed, successRate
- Logs path found / no path with length, nodes, time

## NPC Integration (Phase 7)

### NPC.ts updated:
- New states: PATHFINDING, FOLLOWING_PATH, WAITING, STUCK (plus IDLE,WALK)
- Properties: path:Path|null, pathfinder, destinationTile, startTile, stuck detection (lastX,lastY,stuckTime,progressThreshold), recalculationAttempts, maxRecalculations 3, cooldown, pathFailedTimer, pathStatus, stats
- Methods:
  - `setPathfinder()`
  - `requestPath(destinationTile)` → bool, sets state PATHFINDING, calls pathfinder.requestPath, handles success→FOLLOWING_PATH, failure→WAITING
  - `requestPathToWorld()`
  - `update()` now handles WAITING (retry after 3s, max 3 attempts → alternative), STUCK (recalculate with cooldown), IDLE (switch target), FOLLOWING_PATH (validate path, followPath, stuck detection)
  - `followPath()` → converts tile node to world pixel center, moves towards, dist<8 advance, complete→IDLE
  - `switchToAlternativeTarget()` → switches between pointA/B and requests path (Phase 6 behavior with pathfinding)
  - `getPath()`, `getPathStatus()`, `getDestinationTile()`, `getStartTile()`, `getStats()`

**Path Request Flow:**
```
START (tile) + DESTINATION (tile)
  ↓
Find Path (AStar)
  ↓
Validate Path
  ↓
Follow Path (node by node)
  ↓
Reach Destination (dist<8) → IDLE → switch target
```

**Path Failure:**
```
NO PATH FOUND
  ↓
WAITING 3s → Retry (max 3) → Alternative (switch target)
```

**Stuck Detection:**
```
Detect stuck (no progress <10px*dt for 0.5s)
  ↓
STUCK → Stop → Recalculate (cooldown 2s, max 3) → WAITING if max reached
```

**Recalculation Limiting:**
- Max 3 attempts per path
- Cooldown 2s between recalculations per NPC
- Prevents excessive CPU

### NPCManager.ts updated:
- Holds navigationGrid and pathfinder
- `initialize(worldMap, collisionMap, navigationGrid, pathfinder)` - creates grid from collisionMap if not provided, creates pathfinder 4-dir
- `setPathfinder()`, `setNavigationGrid()`, `getNavigationGrid()`, `getPathfinder()`
- Each NPC gets pathfinder and immediately requests path to B
- `requestAllToDestination()`, `getStats()`

### NPCRenderer.ts updated:
- Now shows actual A* path:
  - Path line cyan if found, red if failed
  - Nodes: visited gray small, current yellow pulsing 6px, future cyan 4px
  - Destination red 7px with DEST label
  - NPC to current node yellow dashed line
  - Path info label near NPC: status, Len, Cur
- Fallback to A↔B line if no path (Phase 6)

## Debug Path View
- `N` toggle NPC paths (shows ● nodes)
- `M` toggle navigation grid (red blocked, green walkable tint)
- Shows: Path Found, Path Length, Current Node, Destination
- Example:
```
NPC
 ↓
● ● ● ● ●
        ↓
        DESTINATION
```

## Phase 7 Tests
- Test1: NPC→nearby destination → PASS (short path)
- Test2: NPC→destination around building → PASS (A* navigates around HOUSE)
- Test3: NPC→destination across bridge → PASS (uses BRIDGE tiles)
- Test4: NPC→blocked destination (water) → PASS (correctly NO PATH)
- Test5: NPC→destination with no possible path (0,0 tree) → PASS (NOT_FOUND)
- Test6: Obstacle added to route → NPC must detect and recalculate → PASS (validatePath fails, recalculates)
- Test7: Multiple NPCs use paths simultaneously → PASS (5 NPCs pathfinding)

## Performance
- A* with open list sort (simple, okay for 50x40=2000 tiles)
- Safety abort if nodesVisited > width*height*2
- Recalculation cooldown prevents CPU spam
- Stats tracking: nodes visited, time ms

## Future
- Phase 8: Homes
- Phase 9: Time & Schedules (destination changes → new path)
- Phase 10: Life simulation
