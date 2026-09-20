/**
 * village_01 - First small village map
 * Phase 2 - World Map
 *
 * Layout:
 * - Size: 50 x 40 tiles
 * - Village square at center (25,20)
 * - Vertical road N-S at x=24-25
 * - Horizontal road E-W at y=19-20 forming cross
 * - River vertical at x=38-39 with bridge at y=19-20
 * - 5 houses around square
 * - Small farm at SW
 * - Forest entrance at north
 * - Dense trees at north and edges
 *
 * Terrain visual:
 * GRASS = .
 * ROAD = =
 * WATER = ~
 * BRIDGE = #
 * TREE = T
 * ROCK = O
 * HOUSE = H
 * FARMLAND = F
 */

import { TerrainType } from '../TerrainType';
import { WorldMapData } from '../WorldMap';

export function createVillageMap(): WorldMapData {
  const width = 50;
  const height = 40;
  const tiles: number[] = new Array(width * height).fill(TerrainType.GRASS);

  const set = (x: number, y: number, type: TerrainType) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      tiles[y * width + x] = type;
    }
  };

  const setRect = (x: number, y: number, w: number, h: number, type: TerrainType) => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        set(x + dx, y + dy, type);
      }
    }
  };

  const setLine = (x1: number, y1: number, x2: number, y2: number, type: TerrainType) => {
    // Simple line for roads/river - axis aligned only for Phase 2
    if (x1 === x2) {
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      for (let y = minY; y <= maxY; y++) set(x1, y, type);
    } else if (y1 === y2) {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      for (let x = minX; x <= maxX; x++) set(x, y1, type);
    }
  };

  // 1. MAP BOUNDARIES - Rocks and Trees around edge to prove boundaries exist
  for (let x = 0; x < width; x++) {
    set(x, 0, TerrainType.TREE);
    set(x, height - 1, TerrainType.ROCK);
  }
  for (let y = 0; y < height; y++) {
    set(0, y, TerrainType.TREE);
    set(width - 1, y, TerrainType.ROCK);
  }
  // Leave openings for roads at north/south/east/west
  set(24, 0, TerrainType.ROAD);
  set(25, 0, TerrainType.ROAD);
  set(24, height - 1, TerrainType.ROAD);
  set(25, height - 1, TerrainType.ROAD);
  set(0, 19, TerrainType.ROAD);
  set(0, 20, TerrainType.ROAD);
  set(width - 1, 19, TerrainType.ROAD);
  set(width - 1, 20, TerrainType.ROAD);

  // 2. RIVER - Vertical at x=38,39 from y=0 to y=39
  for (let y = 1; y < height - 1; y++) {
    // Skip bridge area
    if (y >= 19 && y <= 20) continue;
    set(38, y, TerrainType.WATER);
    set(39, y, TerrainType.WATER);
  }
  // River meanders slightly for natural look
  set(37, 5, TerrainType.WATER);
  set(37, 6, TerrainType.WATER);
  set(40, 30, TerrainType.WATER);
  set(40, 31, TerrainType.WATER);

  // 3. BRIDGE - At y=19,20 crossing river (distinct terrain, walkable)
  setRect(36, 19, 6, 2, TerrainType.BRIDGE); // 36-41, 19-20 - bridge stays BRIDGE

  // 4. ROADS - Main cross
  // Vertical road N-S at x=24,25
  setLine(24, 1, 24, height - 2, TerrainType.ROAD);
  setLine(25, 1, 25, height - 2, TerrainType.ROAD);
  // Horizontal road E-W at y=19,20 - leave gap for bridge (bridge is walkable)
  setLine(1, 19, 35, 19, TerrainType.ROAD);
  setLine(42, 19, width - 2, 19, TerrainType.ROAD);
  setLine(1, 20, 35, 20, TerrainType.ROAD);
  setLine(42, 20, width - 2, 20, TerrainType.ROAD);

  // Village Square - enlarged road area at center
  setRect(20, 16, 12, 8, TerrainType.ROAD); // 20-31, 16-23

  // Small paths to houses
  // Path to house 1 (NW)
  setLine(18, 19, 18, 15, TerrainType.ROAD);
  setLine(19, 15, 19, 15, TerrainType.ROAD);
  // Path to house 2 (NE)
  setLine(31, 16, 31, 13, TerrainType.ROAD);
  setLine(32, 13, 33, 13, TerrainType.ROAD);
  // Path to house 3 (SW)
  setLine(20, 23, 20, 27, TerrainType.ROAD);
  // Path to house 4 (SE)
  setLine(30, 23, 30, 27, TerrainType.ROAD);
  // Path to farm
  setLine(14, 20, 14, 30, TerrainType.ROAD);
  setLine(15, 30, 20, 30, TerrainType.ROAD);

  // 5. HOUSES - 5 houses
  const houses: { id: string; x: number; y: number; width: number; height: number }[] = [];

  // HOUSE001 - Farmer's house NW of square
  setRect(12, 10, 6, 5, TerrainType.HOUSE);
  set(15, 14, TerrainType.ROAD); // Door facing south to road
  houses.push({ id: 'HOUSE001', x: 12, y: 10, width: 6, height: 5 });

  // HOUSE002 - Shopkeeper NE
  setRect(32, 8, 6, 5, TerrainType.HOUSE);
  set(34, 13, TerrainType.ROAD); // Door south
  houses.push({ id: 'HOUSE002', x: 32, y: 8, width: 6, height: 5 });

  // HOUSE003 - Blacksmith SW
  setRect(15, 25, 6, 5, TerrainType.HOUSE);
  set(18, 25, TerrainType.ROAD); // Door north
  houses.push({ id: 'HOUSE003', x: 15, y: 25, width: 6, height: 5 });

  // HOUSE004 - Villager SE
  setRect(28, 26, 6, 5, TerrainType.HOUSE);
  set(30, 26, TerrainType.ROAD); // Door north
  houses.push({ id: 'HOUSE004', x: 28, y: 26, width: 6, height: 5 });

  // HOUSE005 - Child's house west
  setRect(5, 17, 5, 4, TerrainType.HOUSE);
  set(10, 19, TerrainType.ROAD); // Door east to main road
  houses.push({ id: 'HOUSE005', x: 5, y: 17, width: 5, height: 4 });

  // 6. FARM - Small farm at SW (10,30 to 20,35)
  setRect(8, 31, 12, 5, TerrainType.FARMLAND);
  // Fence around farm with rocks
  for (let x = 8; x < 20; x++) {
    if (tiles[31 * width + x] !== TerrainType.ROAD) set(x, 31, TerrainType.ROCK);
    set(x, 35, TerrainType.ROCK);
  }
  for (let y = 31; y <= 35; y++) {
    if (tiles[y * width + 8] !== TerrainType.ROAD) set(8, y, TerrainType.ROCK);
    set(20, y, TerrainType.ROCK);
  }
  // Opening for road
  set(14, 31, TerrainType.ROAD);
  set(15, 31, TerrainType.ROAD);

  // Farm interior - some farmland pattern already, add a small shed
  setRect(9, 32, 2, 2, TerrainType.HOUSE); // Shed

  // 7. FOREST - Dense at north
  // Forest entrance at north road
  for (let y = 1; y < 8; y++) {
    for (let x = 5; x < 20; x++) {
      if (Math.random() < 0.4 && tiles[y * width + x] === TerrainType.GRASS) {
        set(x, y, TerrainType.TREE);
      }
    }
    for (let x = 30; x < 37; x++) {
      if (Math.random() < 0.4 && tiles[y * width + x] === TerrainType.GRASS) {
        set(x, y, TerrainType.TREE);
      }
    }
  }

  // 8. TREES - Scattered for visual distinction
  const treePositions: [number, number][] = [
    [3, 3], [4, 5], [6, 8], [8, 12], [10, 8], [12, 7],
    [35, 5], [36, 7], [42, 3], [43, 6], [45, 8], [44, 12],
    [3, 25], [4, 28], [6, 32], [7, 36], [3, 35],
    [42, 25], [44, 28], [45, 32], [43, 36], [41, 15],
    [22, 5], [27, 6], [23, 30], [26, 33], [33, 32],
    [18, 33], [19, 34], [11, 27], [13, 27]
  ];
  for (const [x, y] of treePositions) {
    if (tiles[y * width + x] === TerrainType.GRASS) {
      set(x, y, TerrainType.TREE);
    }
  }

  // 9. ROCKS - Scattered
  const rockPositions: [number, number][] = [
    [2, 10], [3, 14], [7, 15], [10, 22], [12, 24],
    [33, 24], [35, 26], [36, 28], [34, 30],
    [22, 10], [26, 8], [28, 10], [29, 14],
    [42, 18], [42, 22], [44, 20],
    [5, 30], [6, 33], [22, 32], [23, 34]
  ];
  for (const [x, y] of rockPositions) {
    if (tiles[y * width + x] === TerrainType.GRASS) {
      set(x, y, TerrainType.ROCK);
    }
  }

  // 10. Ensure village square is clear of obstacles
  setRect(20, 16, 12, 8, TerrainType.ROAD);

  // 11. Ensure bridge area is correct - BRIDGE must remain distinct (not overwritten by ROAD)
  // River water outside bridge
  for (let y = 1; y < height - 1; y++) {
    if (y >= 19 && y <= 20) continue;
    set(38, y, TerrainType.WATER);
    set(39, y, TerrainType.WATER);
  }
  // Bridge itself - keep as BRIDGE for visual distinction (walkable like road)
  setRect(36, 19, 6, 2, TerrainType.BRIDGE);
  // Re-apply road leading to bridge but not overwriting bridge completely
  // Roads approach bridge from west and east, bridge remains BRIDGE type
  setLine(1, 19, 35, 19, TerrainType.ROAD);
  setLine(42, 19, width - 2, 19, TerrainType.ROAD);
  setLine(1, 20, 35, 20, TerrainType.ROAD);
  setLine(42, 20, width - 2, 20, TerrainType.ROAD);
  // Vertical road continuity
  setLine(24, 1, 24, height - 2, TerrainType.ROAD);
  setLine(25, 1, 25, height - 2, TerrainType.ROAD);

  return {
    mapId: 'village_01',
    name: 'Greenhollow Village',
    width,
    height,
    tiles,
    description: 'A small village with a square, 5 houses, farm, river with bridge, and forest entrance',
    houses,
    entrances: [
      { x: 24, y: 0, targetMap: 'forest_entrance' },
      { x: 24, y: height - 1, targetMap: 'south_road' },
      { x: 0, y: 19, targetMap: 'west_path' },
      { x: width - 1, y: 19, targetMap: 'east_path' }
    ]
  };
}
