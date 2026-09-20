# World System - Phase 2

## Overview
First small village map with data-driven design.

## Modules

### TerrainType.ts
- Defines 8 terrain types: GRASS, ROAD, WATER, BRIDGE, TREE, ROCK, HOUSE, FARMLAND
- Properties: color, name, char, description
- Placeholder walkable check (will move to collision system Phase 4)

### WorldMap.ts
- Holds tile data for a single map
- Validation: checks tile count and invalid terrain types
- Methods: getTile, setTile, isInBounds, getTileCounts, getAsciiRegion
- Data-driven: accepts WorldMapData JSON

### maps/village_01.ts
- Generator for first village map 50x40 = 2000 tiles
- Features:
  - Village square at center (25,20)
  - Vertical road N-S at x=24-25, Horizontal road E-W at y=19-20
  - River vertical at x=38-39 with bridge at 36-41,19-20
  - 5 houses around square
  - Small farm SW with rock fence
  - Forest entrance north, dense trees
  - Scattered trees/rocks for visual distinction
  - Map boundaries: TREE/ROCK border with road openings
- Houses list with id, x, y, width, height
- Entrances list for future area transitions

### World.ts
- Manages current map and map registry
- Initializes village_01 as starting map
- Methods: getCurrentMap, getMap, loadMap, registerMap
- Update placeholder for future simulation

### WorldRenderer.ts
- Renders tiles with placeholder graphics
- TILE_SIZE = 32
- Features:
  - Visible tile culling (only renders on-screen tiles)
  - Distinct visuals for each terrain:
    - GRASS: checker + tufts
    - ROAD: dirt with center dot
    - WATER: animated wave
    - BRIDGE: planks + rails over water
    - TREE: trunk + layered leaves
    - ROCK: layered circles
    - HOUSE: walls + roof pattern
    - FARMLAND: furrows + crops
  - Map border rendering (red dashed) to prove boundaries exist
  - Grid toggle, tile coords toggle
  - Offset + clampToMap + centerOn
  - worldToScreen, screenToWorld, screenToTile helpers

## Data-Driven Design
- Map data separate from logic
- JSON example: src/data/maps/village_01.json (generated)
- TypeScript generator: src/world/maps/village_01.ts
- WorldMap validates on load

## Map Layout ASCII (approx)
```
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
T....TT....G....G....= =....TTTTT..~..G..TT.......T
T..T..TT............= =..TT..~T~........T..T.....T
...
T....H....ROAD....SQUARE....ROAD....BRIDGE....RIVER
T....H....ROAD....SQUARE....ROAD....BRIDGE....RIVER
...
T....FARM....ROCK FENCE....GRASS..............T
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```

## Testing
- Map loads: validation in WorldMap constructor
- Terrain renders: WorldRenderer distinct visuals
- Boundaries exist: border rendering + edge TREE/ROCK
- Distinguishable: 8 colors/shapes
- No missing tiles: tile count = width*height
- No corrupted data: validation throws on invalid
