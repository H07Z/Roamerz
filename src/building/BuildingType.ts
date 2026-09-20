/**
 * BuildingType - Phase 8 NPC Homes & Buildings
 * Types of buildings in the village
 */

export enum BuildingType {
  HOUSE = 0,
  SHOP = 1,
  BLACKSMITH = 2,
  FARMHOUSE = 3,
  SHED = 4,
  INN = 5,
  STORAGE = 6
}

export interface BuildingTypeProperties {
  type: BuildingType;
  name: string;
  color: string;
  roofColor: string;
  doorColor: string;
  char: string;
  description: string;
  hasInterior: boolean;
  isResidential: boolean;
}

export const BUILDING_TYPE_PROPERTIES: Record<BuildingType, BuildingTypeProperties> = {
  [BuildingType.HOUSE]: {
    type: BuildingType.HOUSE,
    name: 'House',
    color: '#8a5a3a',
    roofColor: '#8a3a2a',
    doorColor: '#4a2a0a',
    char: 'H',
    description: 'A cozy residential house',
    hasInterior: true,
    isResidential: true
  },
  [BuildingType.SHOP]: {
    type: BuildingType.SHOP,
    name: 'Shop',
    color: '#8a6a3a',
    roofColor: '#3a5a8a',
    doorColor: '#5a3a1a',
    char: 'S',
    description: 'A shop with goods for sale',
    hasInterior: true,
    isResidential: true
  },
  [BuildingType.BLACKSMITH]: {
    type: BuildingType.BLACKSMITH,
    name: 'Blacksmith',
    color: '#5a5a5a',
    roofColor: '#2a2a2a',
    doorColor: '#3a2a1a',
    char: 'B',
    description: 'A forge with anvil and tools',
    hasInterior: true,
    isResidential: true
  },
  [BuildingType.FARMHOUSE]: {
    type: BuildingType.FARMHOUSE,
    name: 'Farmhouse',
    color: '#6a8a3a',
    roofColor: '#6a4a2a',
    doorColor: '#4a3a1a',
    char: 'F',
    description: 'A farmhouse near fields',
    hasInterior: true,
    isResidential: true
  },
  [BuildingType.SHED]: {
    type: BuildingType.SHED,
    name: 'Shed',
    color: '#6a5a4a',
    roofColor: '#5a4a3a',
    doorColor: '#3a2a1a',
    char: 's',
    description: 'A small storage shed',
    hasInterior: false,
    isResidential: false
  },
  [BuildingType.INN]: {
    type: BuildingType.INN,
    name: 'Inn',
    color: '#7a5a3a',
    roofColor: '#4a3a2a',
    doorColor: '#4a2a1a',
    char: 'I',
    description: 'An inn for travelers',
    hasInterior: true,
    isResidential: false
  },
  [BuildingType.STORAGE]: {
    type: BuildingType.STORAGE,
    name: 'Storage',
    color: '#6a6a5a',
    roofColor: '#5a5a4a',
    doorColor: '#3a3a2a',
    char: 'D',
    description: 'Storage building',
    hasInterior: false,
    isResidential: false
  }
};

export function getBuildingTypeProperties(type: BuildingType): BuildingTypeProperties {
  return BUILDING_TYPE_PROPERTIES[type];
}

export function isResidential(type: BuildingType): boolean {
  return BUILDING_TYPE_PROPERTIES[type].isResidential;
}

export function hasInterior(type: BuildingType): boolean {
  return BUILDING_TYPE_PROPERTIES[type].hasInterior;
}
