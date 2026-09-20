/**
 * Generate village_01.json from JS version of map generator
 * Keeps data separate from logic as per Phase 2 spec
 */

const TerrainType = {
  GRASS: 0,
  ROAD: 1,
  WATER: 2,
  BRIDGE: 3,
  TREE: 4,
  ROCK: 5,
  HOUSE: 6,
  FARMLAND: 7
};

function createVillageMap() {
  const width = 50;
  const height = 40;
  const tiles = new Array(width * height).fill(TerrainType.GRASS);

  const set = (x, y, type) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      tiles[y * width + x] = type;
    }
  };

  const setRect = (x, y, w, h, type) => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        set(x + dx, y + dy, type);
      }
    }
  };

  const setLine = (x1, y1, x2, y2, type) => {
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

  for (let x = 0; x < width; x++) {
    set(x, 0, TerrainType.TREE);
    set(x, height - 1, TerrainType.ROCK);
  }
  for (let y = 0; y < height; y++) {
    set(0, y, TerrainType.TREE);
    set(width - 1, y, TerrainType.ROCK);
  }
  set(24, 0, TerrainType.ROAD);
  set(25, 0, TerrainType.ROAD);
  set(24, height - 1, TerrainType.ROAD);
  set(25, height - 1, TerrainType.ROAD);
  set(0, 19, TerrainType.ROAD);
  set(0, 20, TerrainType.ROAD);
  set(width - 1, 19, TerrainType.ROAD);
  set(width - 1, 20, TerrainType.ROAD);

  for (let y = 1; y < height - 1; y++) {
    if (y >= 19 && y <= 20) continue;
    set(38, y, TerrainType.WATER);
    set(39, y, TerrainType.WATER);
  }
  set(37, 5, TerrainType.WATER);
  set(37, 6, TerrainType.WATER);
  set(40, 30, TerrainType.WATER);
  set(40, 31, TerrainType.WATER);

  setRect(36, 19, 6, 2, TerrainType.BRIDGE);

  setLine(24, 1, 24, height - 2, TerrainType.ROAD);
  setLine(25, 1, 25, height - 2, TerrainType.ROAD);
  setLine(1, 19, 35, 19, TerrainType.ROAD);
  setLine(42, 19, width - 2, 19, TerrainType.ROAD);
  setLine(1, 20, 35, 20, TerrainType.ROAD);
  setLine(42, 20, width - 2, 20, TerrainType.ROAD);

  setRect(20, 16, 12, 8, TerrainType.ROAD);

  setLine(18, 19, 18, 15, TerrainType.ROAD);
  setLine(19, 15, 19, 15, TerrainType.ROAD);
  setLine(31, 16, 31, 13, TerrainType.ROAD);
  setLine(32, 13, 33, 13, TerrainType.ROAD);
  setLine(20, 23, 20, 27, TerrainType.ROAD);
  setLine(30, 23, 30, 27, TerrainType.ROAD);
  setLine(14, 20, 14, 30, TerrainType.ROAD);
  setLine(15, 30, 20, 30, TerrainType.ROAD);

  const houses = [];
  setRect(12, 10, 6, 5, TerrainType.HOUSE);
  set(15, 14, TerrainType.ROAD);
  houses.push({ id: 'HOUSE001', x: 12, y: 10, width: 6, height: 5 });

  setRect(32, 8, 6, 5, TerrainType.HOUSE);
  set(34, 13, TerrainType.ROAD);
  houses.push({ id: 'HOUSE002', x: 32, y: 8, width: 6, height: 5 });

  setRect(15, 25, 6, 5, TerrainType.HOUSE);
  set(18, 25, TerrainType.ROAD);
  houses.push({ id: 'HOUSE003', x: 15, y: 25, width: 6, height: 5 });

  setRect(28, 26, 6, 5, TerrainType.HOUSE);
  set(30, 26, TerrainType.ROAD);
  houses.push({ id: 'HOUSE004', x: 28, y: 26, width: 6, height: 5 });

  setRect(5, 17, 5, 4, TerrainType.HOUSE);
  set(10, 19, TerrainType.ROAD);
  houses.push({ id: 'HOUSE005', x: 5, y: 17, width: 5, height: 4 });

  setRect(8, 31, 12, 5, TerrainType.FARMLAND);
  for (let x = 8; x < 20; x++) {
    if (tiles[31 * width + x] !== TerrainType.ROAD) set(x, 31, TerrainType.ROCK);
    set(x, 35, TerrainType.ROCK);
  }
  for (let y = 31; y <= 35; y++) {
    if (tiles[y * width + 8] !== TerrainType.ROAD) set(8, y, TerrainType.ROCK);
    set(20, y, TerrainType.ROCK);
  }
  set(14, 31, TerrainType.ROAD);
  set(15, 31, TerrainType.ROAD);
  setRect(9, 32, 2, 2, TerrainType.HOUSE);

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

  const treePositions = [
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

  const rockPositions = [
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

  setRect(20, 16, 12, 8, TerrainType.ROAD);
  for (let y = 1; y < height - 1; y++) {
    if (y >= 19 && y <= 20) continue;
    set(38, y, TerrainType.WATER);
    set(39, y, TerrainType.WATER);
  }
  setRect(36, 19, 6, 2, TerrainType.BRIDGE);
  setLine(1, 19, 35, 19, TerrainType.ROAD);
  setLine(42, 19, width - 2, 19, TerrainType.ROAD);
  setLine(1, 20, 35, 20, TerrainType.ROAD);
  setLine(42, 20, width - 2, 20, TerrainType.ROAD);
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

const fs = require('fs');
const path = require('path');

const mapData = createVillageMap();
const outDir = path.join(__dirname, '..', 'src', 'data', 'maps');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'village_01.json');
fs.writeFileSync(outPath, JSON.stringify(mapData, null, 2));
console.log(`Generated ${outPath} with ${mapData.tiles.length} tiles`);
console.log('Tile counts:', mapData.tiles.reduce((acc, t) => {
  acc[t] = (acc[t]||0)+1;
  return acc;
}, {}));
