/**
 * forest_01 - Dense forest north of village
 * Phase 12 - World Expansion
 * - Size: 50x40
 * - Dense trees with clearings
 * - Ruins (old houses)
 * - Roads N-S and E-W, connecting to village and lake
 * - Small lake/pond in center
 * - Forest entrance lore
 */

import { TerrainType } from '../TerrainType';
import { WorldMapData } from '../WorldMap';

export function createForestMap(): WorldMapData {
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
    set(x, 0, TerrainType.TREE);
    set(x, height - 1, TerrainType.TREE);
  }
  for (let y = 0; y < height; y++) {
    set(0, y, TerrainType.TREE);
    set(width - 1, y, TerrainType.TREE);
  }
  // Openings for roads
  set(24, 0, TerrainType.ROAD);
  set(25, 0, TerrainType.ROAD);
  set(24, height - 1, TerrainType.ROAD);
  set(25, height - 1, TerrainType.ROAD);
  set(0, 19, TerrainType.ROAD);
  set(0, 20, TerrainType.ROAD);
  set(width - 1, 19, TerrainType.ROAD);
  set(width - 1, 20, TerrainType.ROAD);

  // Main roads cross
  setLine(24, 1, 24, height - 2, TerrainType.ROAD);
  setLine(25, 1, 25, height - 2, TerrainType.ROAD);
  setLine(1, 19, width - 2, 19, TerrainType.ROAD);
  setLine(1, 20, width - 2, 20, TerrainType.ROAD);

  // Central clearing - ancient ruins square
  setRect(20, 16, 12, 8, TerrainType.GRASS);
  // Small pond in center of clearing
  setRect(23, 18, 6, 4, TerrainType.WATER);
  set(24, 19, TerrainType.BRIDGE); // Small island bridge
  set(25, 19, TerrainType.BRIDGE);

  // Ruins - 3 old houses
  const houses: { id: string; x: number; y: number; width: number; height: number }[] = [];

  setRect(10, 8, 5, 4, TerrainType.HOUSE);
  set(12, 12, TerrainType.ROAD);
  houses.push({ id: 'RUIN001', x: 10, y: 8, width: 5, height: 4 });

  setRect(35, 10, 6, 5, TerrainType.HOUSE);
  set(37, 15, TerrainType.ROAD);
  houses.push({ id: 'RUIN002', x: 35, y: 10, width: 6, height: 5 });

  setRect(15, 28, 5, 4, TerrainType.HOUSE);
  set(17, 28, TerrainType.ROAD);
  houses.push({ id: 'RUIN003', x: 15, y: 28, width: 5, height: 4 });

  // Dense forest - 60% trees
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const current = tiles[y * width + x];
      if (current !== TerrainType.GRASS) continue;
      // Keep roads and clearing grass
      if (y >= 16 && y < 24 && x >= 20 && x < 32) continue;
      if (Math.random() < 0.6) {
        set(x, y, TerrainType.TREE);
      }
    }
  }

  // Paths to ruins
  setLine(12, 12, 12, 19, TerrainType.ROAD);
  setLine(37, 15, 32, 15, TerrainType.ROAD);
  setLine(17, 28, 20, 28, TerrainType.ROAD);
  setLine(20, 28, 20, 24, TerrainType.ROAD);

  // Scattered rocks - ancient stones
  const rockPositions: [number, number][] = [
    [22, 14], [26, 14], [23, 24], [27, 24],
    [8, 15], [40, 18], [18, 22], [32, 22],
    [12, 30], [38, 30], [20, 32], [30, 32]
  ];
  for (const [x, y] of rockPositions) {
    if (tiles[y * width + x] === TerrainType.GRASS) set(x, y, TerrainType.ROCK);
  }

  // Ensure roads to edges are clear
  setLine(24, 1, 24, height - 2, TerrainType.ROAD);
  setLine(25, 1, 25, height - 2, TerrainType.ROAD);
  setLine(1, 19, width - 2, 19, TerrainType.ROAD);
  setLine(1, 20, width - 2, 20, TerrainType.ROAD);

  // Clear entrance roads
  set(24, 0, TerrainType.ROAD);
  set(25, 0, TerrainType.ROAD);
  set(24, height - 1, TerrainType.ROAD);
  set(25, height - 1, TerrainType.ROAD);
  set(0, 19, TerrainType.ROAD);
  set(0, 20, TerrainType.ROAD);
  set(width - 1, 19, TerrainType.ROAD);
  set(width - 1, 20, TerrainType.ROAD);

  return {
    mapId: 'forest_01',
    name: 'Whispering Woods',
    width,
    height,
    tiles,
    description: 'Dense forest north of village, ancient ruins and a small pond in central clearing',
    houses,
    entrances: [
      { x: 24, y: 0, targetMap: 'lake_01' },
      { x: 24, y: height - 1, targetMap: 'village_01' },
      { x: 0, y: 19, targetMap: 'village_01' },
      { x: width - 1, y: 19, targetMap: 'lake_01' }
    ]
  };
}
