# Building System - Phase 8 Homes & Buildings

## Overview
Introduces buildings as first-class entities with doors, owners, types, interiors, and occupancy. Links NPCs to homes, enables goHome behavior.

## Modules

### BuildingType.ts
- **BuildingType enum:** HOUSE, SHOP, BLACKSMITH, FARMHOUSE, SHED, INN, STORAGE
- **Properties:** name, color, roofColor, doorColor, char, description, hasInterior, isResidential
- **Helpers:** getBuildingTypeProperties, isResidential, hasInterior
- 7 types, distinct colors, residential vs non-residential

### Building.ts
- **BuildingData:** id, type, name, x,y,width,height, door, ownerId, description, interior
- **BuildingDoor:** x,y,worldX,worldY,facing (north/south/east/west), isLocked
- **BuildingInterior:** hasInterior, interiorMapId (future), width,height, entryTile
- **Class Building:**
  - id, type, name, x,y,width,height, door, ownerId, description, interior
  - containsTile(tileX,tileY), isDoorTile, getBlockedTiles (all house tiles except door)
  - getDoorWorldPosition, getFrontOfDoorPosition (where NPC stands to interact, based on facing)
  - getCenterWorldPosition, occupancy setOccupied, isOccupied, occupantId
  - door open/close placeholder, toString, getData

### BuildingManager.ts
- Manages all buildings: Map<string,Building>, tileToBuilding, doorToBuilding
- **initialize(worldMap):** Creates 6 buildings from village_01:
  - HOUSE001 Farmer's House 12,10 6x5 door 15,14 south owner NPC001 FARMHOUSE
  - HOUSE002 Shopkeeper's House 32,8 6x5 door 34,13 south owner NPC002 SHOP
  - HOUSE003 Blacksmith's Forge 15,25 6x5 door 18,25 north owner NPC003 BLACKSMITH
  - HOUSE004 Villager's Cottage 28,26 6x5 door 30,26 north owner NPC004 HOUSE
  - HOUSE005 Child's Home 5,17 5x4 door 10,19 east owner NPC005 HOUSE
  - SHED001 Farm Shed 9,32 2x2 door 10,34 south no owner SHED
- Also supports generic buildings from worldMap.houses not in definitions
- Methods: getBuilding, getAllBuildings, getBuildingAtTile, getBuildingByDoorTile, getBuildingsByOwner, getBuildingByOwner, getResidentialBuildings, getBuildingsWithInterior, getBuildingsByType, getCount, getCounts (total,residential,withInterior,byType), isBuildingTile, isDoorTile, getAllDoors, getHomeForNPC, validate (checks door proximity, overlapping buildings)
- Counts: 6 total, 5 residential, 5 with interior (shed has no interior)

### BuildingRenderer.ts
- Renders building overlays separate from world tiles
- **renderDoor:** Brown door with knob, facing arrow, open indicator, zoom-scaled
- **renderLabel:** Building id+name above building, type indicator, zoom-scaled font
- **renderOwnership:** Owner label below building, occupied indicator (yellow dot if occupied)
- **renderBlockedOverlay:** Semi-transparent blue overlay for blocked tiles (debug)
- **renderFrontOfDoor:** Yellow transparent tile for front-of-door, dashed border, FRONT label, line door→front
- **renderAll:** Sorted by Y, calls render with options showDoors,showLabels,showOwnership,showBlocked
- **renderAllFrontOfDoors:** Shows all fronts for debugging pathfinding to homes

## Integration

### NPC Integration (Phase 8)
- NPCState extended: GOING_HOME, AT_HOME, INSIDE (in addition to IDLE,WALK,PATHFINDING,FOLLOWING_PATH,WAITING,STUCK)
- NPC has homeBuilding: Building|null, atHomeTimer, insideTimer, goingHome flag, homeVisits counter
- **setHomeBuilding(building), getHomeBuilding(), getHomeId()**
- **goHome():** Requests path to front-of-door (fallback door tile), sets GOING_HOME, logs
- **isAtHome():** Checks tile position equals front or door
- **enterHome():** Sets INSIDE, insideTimer 0, building.setOccupied(true,id), homeVisits++
- **leaveHome():** Sets IDLE, building.setOccupied(false), switchToAlternativeTarget
- **update():** Handles AT_HOME (wait atHomeDuration 3s → enterHome), INSIDE (wait insideDuration 5s → leaveHome), GOING_HOME same as FOLLOWING_PATH but transitions to AT_HOME when reaches destination, IDLE now 30% chance to goHome if has home
- **followPath():** When path complete, if goingHome → AT_HOME else IDLE
- **getStats():** Now includes homeVisits, isAtHome, hasHome

### NPCManager Integration
- initialize now takes buildingManager parameter
- Links each NPC homeId to building via buildingManager.getBuilding(homeId)
- setHomeBuilding updates all NPCs
- Logs building counts

### Game Integration
- BuildingManager + BuildingRenderer fields
- Initialize: buildingManager.initialize(map), validate, then npcManager.initialize with buildingManager
- Rendering: after world + collision + nav grid, before NPCs, render buildings with doors (default ON), labels OFF, ownership OFF, fronts optional
- Debug: setBuildingInfo (counts, showDoors,showLabels,showOwnership,showFronts) and setBuildingDetails (id,name,type,x,y,door,owner,occupied,occupant)
- Controls: J toggle doors, L toggle labels, U toggle ownership, I toggle fronts, Y all go home, F5-F8 NPC1-4 go home, P prints building states, T runs Phase7+Phase8 tests

### DebugManager
- Phase 8: currentPhase='8', buildingInfo and buildingDetails
- render: shows BUILDINGS line with counts and toggles, BUILDING DETAILS with occupancy colors (green occupied)

### Collision
- Doors remain ROAD tiles → INTERACTABLE (walkable) in CollisionMap
- House tiles remain BLOCKED
- Front-of-door tiles are walkable (grass/road) → validated in tests

## Testing (Phase 8)

- Test1 building counts: total 6, residential 5, withInterior 5 → PASS
- Test2 doors walkable: each door tile in NavigationGrid walkable → PASS (6 doors)
- Test3 NPC homes valid: each NPC has homeBuilding linked → PASS (5 NPCs)
- Test4 paths to home: pathfinder request from NPC tile to front-of-door for each NPC → PASS, lengths vary but found
- Test5 building validation: no overlaps, doors near building → PASS
- Test6 doors collision walkable: collision type not BLOCKED → PASS (doors are ROAD → WALKABLE/INTERACTABLE)
- Test7 front-of-door walkable: front tiles walkable in nav grid → PASS
- Test8 ownership linkage: building owner exists and owner home matches building → PASS
- Additional: NPC go home → AT_HOME → INSIDE → leave → IDLE cycle → PASS
- Occupancy: building setOccupied when NPC inside, cleared when leaves → PASS
- Rendering: doors show brown with knob and facing arrow, labels, ownership, fronts debug → PASS (J/L/U/I toggles)
- Zoom: building overlays scale with zoom → PASS (uses camera.worldToScreen and zoom factor)
- Pathfinding preserved: Phase 7 tests still PASS (nearby, around building, across bridge, blocked, no path, multiple NPCs)

## Controls (Phase 8)

- **WASD/Arrows** - Move player
- **C** - Center, **V** - Village, **Z** - Zoom, **X** - Smoothing
- **K** - Collision overlay, **G** - Grid, **B** - Tile coords
- **N** - NPC paths, **M** - Nav grid
- **J** - Building doors, **L** - Building labels, **U** - Ownership, **I** - Front-of-door
- **Y** - All NPCs go home, **F5-F8** - NPC1-4 go home individually
- **T** - Run Phase7+Phase8 tests, **P** - Print states, **O** - Toggle obstacle
- **5-9** - Pathfinding tests, **1-4** - Teleports
- **` / F2 / D** - Debug, **H** - Help, **R** - Reset

## Architecture

```
src/building/
├── BuildingType.ts - 7 types, properties, residential check
├── Building.ts - door, interior, occupancy, front-of-door, blocked tiles
├── BuildingManager.ts - 6 buildings, tile maps, validation, counts
├── BuildingRenderer.ts - doors, labels, ownership, fronts, zoom-aware
└── README.md

src/npc/
├── NPC.ts - + GOING_HOME,AT_HOME,INSIDE, homeBuilding, goHome(), enter/leave, homeVisits
├── NPCManager.ts - + buildingManager linking
└── NPCRenderer.ts - + home indicator ⌂, visits, INSIDE dimmed

src/core/
├── Game.ts - + BuildingManager/Renderer, J/L/U/I/Y/F5-F8, T runs both tests, building debug
└── DebugManager.ts - + buildingInfo, buildingDetails, Phase 8

Preserved:
- Phase 7 pathfinding A*, navigation grid, stuck detection
- Phase 5 camera zoom sync
- Phase 4 collision
- Phase 2 world map
```

## Future

- Phase 9: Time & NPC Schedules (use home buildings for sleep, work, etc.)
- Phase 10: Life simulation (NPCs inside buildings do activities)
- Phase 11: Player interaction with doors (enter building interior)
- Phase 12: Interiors as separate maps
