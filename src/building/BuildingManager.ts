/**
 * BuildingManager - Phase 8 NPC Homes & Buildings
 * Manages all buildings, creates from WorldMap, links to NPCs
 */

import { WorldMap } from '../world/WorldMap';
import { Building, BuildingData, BuildingDoor } from './Building';
import { BuildingType } from './BuildingType';
import { WorldRenderer } from '../world/WorldRenderer';

export interface BuildingDefinition {
  id: string;
  type: BuildingType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  doorTile: { x: number; y: number; facing: BuildingDoor['facing'] };
  ownerId?: string;
  description?: string;
}

export class BuildingManager {
  private buildings: Map<string, Building> = new Map();
  private tileToBuilding: Map<string, string> = new Map(); // tile key -> building id
  private doorToBuilding: Map<string, string> = new Map(); // door tile key -> building id

  constructor() {}

  initialize(worldMap: WorldMap | null): void {
    console.log('[BuildingManager] Initializing Phase 8 - Homes & Buildings...');
    this.buildings.clear();
    this.tileToBuilding.clear();
    this.doorToBuilding.clear();

    if (!worldMap) {
      console.warn('[BuildingManager] No world map provided');
      return;
    }

    // Define buildings from village_01 map
    // These match the houses in village_01.ts plus door info
    const tileSize = WorldRenderer.TILE_SIZE;

    const definitions: BuildingDefinition[] = [
      {
        id: 'HOUSE001',
        type: BuildingType.FARMHOUSE,
        name: "Farmer's House",
        x: 12,
        y: 10,
        width: 6,
        height: 5,
        doorTile: { x: 15, y: 14, facing: 'south' },
        ownerId: 'NPC001',
        description: "Farmer Joe's cozy house near the farm"
      },
      {
        id: 'HOUSE002',
        type: BuildingType.SHOP,
        name: "Shopkeeper's House",
        x: 32,
        y: 8,
        width: 6,
        height: 5,
        doorTile: { x: 34, y: 13, facing: 'south' },
        ownerId: 'NPC002',
        description: "Shopkeeper's house with a small shop front"
      },
      {
        id: 'HOUSE003',
        type: BuildingType.BLACKSMITH,
        name: "Blacksmith's Forge",
        x: 15,
        y: 25,
        width: 6,
        height: 5,
        doorTile: { x: 18, y: 25, facing: 'north' },
        ownerId: 'NPC003',
        description: "Blacksmith's forge with anvil and tools"
      },
      {
        id: 'HOUSE004',
        type: BuildingType.HOUSE,
        name: "Villager's Cottage",
        x: 28,
        y: 26,
        width: 6,
        height: 5,
        doorTile: { x: 30, y: 26, facing: 'north' },
        ownerId: 'NPC004',
        description: "A simple cottage near the square"
      },
      {
        id: 'HOUSE005',
        type: BuildingType.HOUSE,
        name: "Child's Home",
        x: 5,
        y: 17,
        width: 5,
        height: 4,
        doorTile: { x: 10, y: 19, facing: 'east' },
        ownerId: 'NPC005',
        description: "Small house at the edge of village"
      },
      // Additional building: farm shed
      {
        id: 'SHED001',
        type: BuildingType.SHED,
        name: "Farm Shed",
        x: 9,
        y: 32,
        width: 2,
        height: 2,
        doorTile: { x: 10, y: 34, facing: 'south' },
        description: "Small shed for farm tools"
      }
    ];

    // Also include any houses from worldMap that are not in our definitions
    // (to support future maps)
    const existingIds = new Set(definitions.map(d => d.id));
    for (const house of worldMap.houses) {
      if (!existingIds.has(house.id)) {
        // Create generic building for unknown house
        definitions.push({
          id: house.id,
          type: BuildingType.HOUSE,
          name: house.id,
          x: house.x,
          y: house.y,
          width: house.width,
          height: house.height,
          doorTile: { x: house.x + Math.floor(house.width / 2), y: house.y + house.height, facing: 'south' },
          description: `Building ${house.id}`
        });
      }
    }

    // Create Building objects
    for (const def of definitions) {
      const door: BuildingDoor = {
        x: def.doorTile.x,
        y: def.doorTile.y,
        worldX: def.doorTile.x * tileSize + tileSize / 2,
        worldY: def.doorTile.y * tileSize + tileSize / 2,
        facing: def.doorTile.facing,
        isLocked: false
      };

      const buildingData: BuildingData = {
        id: def.id,
        type: def.type,
        name: def.name,
        x: def.x,
        y: def.y,
        width: def.width,
        height: def.height,
        door,
        ownerId: def.ownerId,
        description: def.description,
        interior: {
          hasInterior: def.type !== BuildingType.SHED,
          interiorMapId: null,
          interiorWidth: def.width,
          interiorHeight: def.height,
          entryTile: { x: 1, y: 1 }
        }
      };

      const building = new Building(buildingData);
      this.buildings.set(building.id, building);

      // Map tiles to building
      for (let dy = 0; dy < building.height; dy++) {
        for (let dx = 0; dx < building.width; dx++) {
          const tx = building.x + dx;
          const ty = building.y + dy;
          const key = `${tx},${ty}`;
          this.tileToBuilding.set(key, building.id);
        }
      }

      // Map door
      const doorKey = `${building.door.x},${building.door.y}`;
      this.doorToBuilding.set(doorKey, building.id);

      console.log(`[BuildingManager] Created ${building.toString()}`);
    }

    console.log(`[BuildingManager] Initialized ${this.buildings.size} buildings`);
    console.log(`[BuildingManager] Residential: ${this.getResidentialBuildings().length}, With interior: ${this.getBuildingsWithInterior().length}`);
  }

  getBuilding(id: string): Building | undefined {
    return this.buildings.get(id);
  }

  getAllBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  getBuildingAtTile(tileX: number, tileY: number): Building | undefined {
    const key = `${tileX},${tileY}`;
    const buildingId = this.tileToBuilding.get(key);
    if (!buildingId) return undefined;
    return this.buildings.get(buildingId);
  }

  getBuildingByDoorTile(tileX: number, tileY: number): Building | undefined {
    const key = `${tileX},${tileY}`;
    const buildingId = this.doorToBuilding.get(key);
    if (!buildingId) return undefined;
    return this.buildings.get(buildingId);
  }

  getBuildingsByOwner(ownerId: string): Building[] {
    return Array.from(this.buildings.values()).filter(b => b.ownerId === ownerId);
  }

  getBuildingByOwner(ownerId: string): Building | undefined {
    return Array.from(this.buildings.values()).find(b => b.ownerId === ownerId);
  }

  getResidentialBuildings(): Building[] {
    return Array.from(this.buildings.values()).filter(b => b.getTypeProperties().isResidential);
  }

  getBuildingsWithInterior(): Building[] {
    return Array.from(this.buildings.values()).filter(b => b.interior.hasInterior);
  }

  getBuildingsByType(type: BuildingType): Building[] {
    return Array.from(this.buildings.values()).filter(b => b.type === type);
  }

  getCount(): number {
    return this.buildings.size;
  }

  getCounts(): { total: number; residential: number; withInterior: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    for (const b of this.buildings.values()) {
      const typeName = BuildingType[b.type];
      byType[typeName] = (byType[typeName] || 0) + 1;
    }
    return {
      total: this.buildings.size,
      residential: this.getResidentialBuildings().length,
      withInterior: this.getBuildingsWithInterior().length,
      byType
    };
  }

  // Check if a tile is part of any building (including door)
  isBuildingTile(tileX: number, tileY: number): boolean {
    const key = `${tileX},${tileY}`;
    return this.tileToBuilding.has(key);
  }

  // Check if a tile is a door tile
  isDoorTile(tileX: number, tileY: number): boolean {
    const key = `${tileX},${tileY}`;
    return this.doorToBuilding.has(key);
  }

  // Get all door tiles
  getAllDoors(): { x: number; y: number; buildingId: string }[] {
    const doors: { x: number; y: number; buildingId: string }[] = [];
    for (const [key, buildingId] of this.doorToBuilding.entries()) {
      const [x, y] = key.split(',').map(Number);
      doors.push({ x, y, buildingId });
    }
    return doors;
  }

  // For NPCs: get home building
  getHomeForNPC(npcId: string): Building | undefined {
    return this.getBuildingByOwner(npcId);
  }

  // Validation
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check each building has valid door (door not inside another building except its own)
    for (const building of this.buildings.values()) {
      // Door should be at edge of building or adjacent
      const isDoorAtEdge =
        building.door.x === building.x - 1 ||
        building.door.x === building.x + building.width ||
        building.door.y === building.y - 1 ||
        building.door.y === building.y + building.height ||
        building.containsTile(building.door.x, building.door.y); // Door is on building tile (replaces one tile)

      // For our village, door is on edge tile of building footprint that is ROAD
      // So it should be contained OR adjacent
      if (!isDoorAtEdge) {
        // Allow door to be one tile outside building
        const dx = Math.abs(building.door.x - (building.x + building.width / 2));
        const dy = Math.abs(building.door.y - (building.y + building.height / 2));
        if (dx > building.width / 2 + 1 || dy > building.height / 2 + 1) {
          errors.push(`Building ${building.id} door at ${building.door.x},${building.door.y} too far from building ${building.x},${building.y}`);
        }
      }
    }

    // Check for overlapping buildings (except allowed overlaps)
    const tileMap = new Map<string, string[]>();
    for (const building of this.buildings.values()) {
      for (let dy = 0; dy < building.height; dy++) {
        for (let dx = 0; dx < building.width; dx++) {
          const tx = building.x + dx;
          const ty = building.y + dy;
          const key = `${tx},${ty}`;
          if (!tileMap.has(key)) tileMap.set(key, []);
          tileMap.get(key)!.push(building.id);
        }
      }
    }
    for (const [tile, ids] of tileMap.entries()) {
      if (ids.length > 1) {
        errors.push(`Tile ${tile} overlaps buildings: ${ids.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
