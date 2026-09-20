/**
 * TerrainType - Phase 2
 * Defines all terrain types for the world grid
 * Keeps visual properties separate from collision (Phase 4 will add collision)
 */

export enum TerrainType {
  GRASS = 0,
  ROAD = 1,
  WATER = 2,
  BRIDGE = 3,
  TREE = 4,
  ROCK = 5,
  HOUSE = 6,
  FARMLAND = 7 // Extra for farm area, still within placeholder graphics
}

export interface TerrainProperties {
  id: TerrainType;
  name: string;
  color: string;
  secondaryColor: string;
  char: string; // For debug ASCII view
  description: string;
}

export const TERRAIN_PROPERTIES: Record<TerrainType, TerrainProperties> = {
  [TerrainType.GRASS]: {
    id: TerrainType.GRASS,
    name: 'Grass',
    color: '#3a6b3a',
    secondaryColor: '#2d5a2d',
    char: '.',
    description: 'Walkable grassland'
  },
  [TerrainType.ROAD]: {
    id: TerrainType.ROAD,
    name: 'Road',
    color: '#8B7355',
    secondaryColor: '#a08a6a',
    char: '=',
    description: 'Walkable road/path'
  },
  [TerrainType.WATER]: {
    id: TerrainType.WATER,
    name: 'Water',
    color: '#2a5a8a',
    secondaryColor: '#3a7ab5',
    char: '~',
    description: 'Blocked - water'
  },
  [TerrainType.BRIDGE]: {
    id: TerrainType.BRIDGE,
    name: 'Bridge',
    color: '#6b4c2a',
    secondaryColor: '#8a6a4a',
    char: '#',
    description: 'Walkable bridge over water'
  },
  [TerrainType.TREE]: {
    id: TerrainType.TREE,
    name: 'Tree',
    color: '#1a4a1a',
    secondaryColor: '#2d6a2d',
    char: 'T',
    description: 'Blocked - tree'
  },
  [TerrainType.ROCK]: {
    id: TerrainType.ROCK,
    name: 'Rock',
    color: '#5a5a5a',
    secondaryColor: '#7a7a7a',
    char: 'O',
    description: 'Blocked - rock'
  },
  [TerrainType.HOUSE]: {
    id: TerrainType.HOUSE,
    name: 'House',
    color: '#8a3a2a',
    secondaryColor: '#a84a3a',
    char: 'H',
    description: 'Blocked - house wall'
  },
  [TerrainType.FARMLAND]: {
    id: TerrainType.FARMLAND,
    name: 'Farmland',
    color: '#5a6b2a',
    secondaryColor: '#6b7a3a',
    char: 'F',
    description: 'Walkable farmland'
  }
};

export function getTerrainName(type: TerrainType): string {
  return TERRAIN_PROPERTIES[type]?.name ?? 'Unknown';
}

export function isTerrainWalkablePlaceholder(type: TerrainType): boolean {
  // Placeholder for Phase 4 collision - visual only for Phase 2
  // This will be moved to collision system later
  switch (type) {
    case TerrainType.GRASS:
    case TerrainType.ROAD:
    case TerrainType.BRIDGE:
    case TerrainType.FARMLAND:
      return true;
    case TerrainType.WATER:
    case TerrainType.TREE:
    case TerrainType.ROCK:
    case TerrainType.HOUSE:
      return false;
    default:
      return false;
  }
}
