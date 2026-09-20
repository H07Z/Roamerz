/**
 * lake_01 - Lakeside south of village
 * Phase 12 - World Expansion
 * - Size: 50x40
 * - Large lake in center with island
 * - Sandy shores (road as sand)
 * - Fishing hut, small dock (bridge)
 * - Roads connecting to village and forest
 */

import { TerrainType } from '../TerrainType';
import { WorldMapData } from '../WorldMap';

export function createLakeMap(): WorldMapData {
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

  // Boundaries
  for (let x = 0; x < width; x++) {
    set(x, 0, TerrainType.ROCK);
    set(x, height - 1, TerrainType.TREE);
  }
  for (let y = 0; y < height; y++) {
    set(0, y, TerrainType.TREE);
    set(width - 1, y, TerrainType.ROCK);
  }
  // Openings
  set(24, 0, TerrainType.ROAD);
  set(25, 0, TerrainType.ROAD);
  set(24, height - 1, TerrainType.ROAD);
  set(25, height - 1, TerrainType.ROAD);
  set(0, 19, TerrainType.ROAD);
  set(0, 20, TerrainType.ROAD);
  set(width - 1, 19, TerrainType.ROAD);
  set(width - 1, 20, TerrainType.ROAD);

  // Roads cross
  setLine(24, 1, 24, height - 2, TerrainType.ROAD);
  setLine(25, 1, 25, height - 2, TerrainType.ROAD);
  setLine(1, 19, width - 2, 19, TerrainType.ROAD);
  setLine(1, 20, width - 2, 20, TerrainType.ROAD);

  // Large lake in center - 20x12
  setRect(15, 12, 20, 12, TerrainType.WATER);
  // Make lake more natural - rounded edges
  set(15, 12, TerrainType.GRASS);
  set(16, 12, TerrainType.GRASS);
  set(34, 12, TerrainType.GRASS);
  set(15, 23, TerrainType.GRASS);
  set(34, 23, TerrainType.GRASS);

  // Island in lake
  setRect(22, 16, 6, 4, TerrainType.GRASS);
  set(24, 17, TerrainType.TREE);
  set(25, 18, TerrainType.ROCK);

  // Bridge/dock to island from south
  setLine(24, 20, 24, 23, TerrainType.BRIDGE);
  setLine(25, 20, 25, 23, TerrainType.BRIDGE);
  setLine(24, 16, 24, 15, TerrainType.BRIDGE);
  setLine(25, 16, 25, 15, TerrainType.BRIDGE);

  // Sandy shore around lake (using farmland as sand visual)
  for (let y = 11; y <= 24; y++) {
    for (let x = 14; x <= 35; x++) {
      const current = tiles[y * width + x];
      if (current === TerrainType.GRASS) {
        // Check if adjacent to water
        const adjWater = 
          (x > 0 && tiles[y * width + (x-1)] === TerrainType.WATER) ||
          (x < width-1 && tiles[y * width + (x+1)] === TerrainType.WATER) ||
          (y > 0 && tiles[(y-1) * width + x] === TerrainType.WATER) ||
          (y < height-1 && tiles[(y+1) * width + x] === TerrainType.WATER);
        if (adjWater && Math.random() < 0.7) {
          set(x, y, TerrainType.FARMLAND);
        }
      }
    }
  }

  // Fishing hut near lake south shore
  const houses: { id: string; x: number; y: number; width: number; height: number }[] = [];
  setRect(22, 26, 6, 4, TerrainType.HOUSE);
  set(24, 26, TerrainType.ROAD);
  houses.push({ id: 'HUT001', x: 22, y: 26, width: 6, height: 4 });

  // Path from hut to dock
  setLine(24, 26, 24, 24, TerrainType.ROAD);
  setLine(25, 26, 25, 24, TerrainType.ROAD);

  // Small farm near hut
  setRect(30, 28, 8, 4, TerrainType.FARMLAND);
  setRect(32, 29, 2, 2, TerrainType.HOUSE);

  // Trees scattered
  const treePositions: [number, number][] = [
    [5, 5], [8, 8], [12, 6], [40, 5], [42, 8], [45, 10],
    [5, 30], [8, 32], [10, 35], [40, 30], [42, 33], [44, 35],
    [18, 8], [28, 8], [20, 30], [26, 32]
  ];
  for (const [x, y] of treePositions) {
    if (tiles[y * width + x] === TerrainType.GRASS) set(x, y, TerrainType.TREE);
  }

  // Rocks
  const rockPositions: [number, number][] = [
    [16, 10], [33, 10], [14, 25], [36, 25],
    [20, 9], [30, 9], [19, 27], [31, 27]
  ];
  for (const [x, y] of rockPositions) {
    if (tiles[y * width + x] === TerrainType.GRASS) set(x, y, TerrainType.ROCK);
  }

  // Ensure roads
  setLine(24, 1, 24, height - 2, TerrainType.ROAD);
  setLine(25, 1, 25, height - 2, TerrainType.ROAD);
  setLine(1, 19, width - 2, 19, TerrainType.ROAD);
  setLine(1, 20, width - 2, 20, TerrainType.ROAD);

  // Entrances
  set(24, 0, TerrainType.ROAD);
  set(25, 0, TerrainType.ROAD);
  set(24, height - 1, TerrainType.ROAD);
  set(25, height - 1, TerrainType.ROAD);
  set(0, 19, TerrainType.ROAD);
  set(0, 20, TerrainType.ROAD);
  set(width - 1, 19, TerrainType.ROAD);
  set(width - 1, 20, TerrainType.ROAD);

  return {
    mapId: 'lake_01',
    name: 'Crystal Lake',
    width,
    height,
    tiles,
    description: 'Large lake south of village with island, fishing hut, sandy shores',
    houses,
    entrances: [
      { x: 24, y: 0, targetMap: 'village_01' },
      { x: 24, y: height - 1, targetMap: 'forest_01' },
      { x: 0, y: 19, targetMap: 'village_01' },
      { x: width - 1, y: 19, targetMap: 'forest_01' }
    ]
  };
}
