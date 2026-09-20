/**
 * Building - Phase 8 NPC Homes & Buildings
 * Represents a building with door, owner, type, and interior
 */

import { BuildingType, getBuildingTypeProperties } from './BuildingType';

export interface BuildingDoor {
  x: number;
  y: number;
  // World pixel position (center of door tile)
  worldX: number;
  worldY: number;
  // Direction door faces: where player should stand to interact
  facing: 'north' | 'south' | 'east' | 'west';
  isLocked: boolean;
}

export interface BuildingInterior {
  hasInterior: boolean;
  interiorMapId: string | null; // Future: separate interior map
  interiorWidth: number;
  interiorHeight: number;
  entryTile: { x: number; y: number } | null; // Where player spawns inside
}

export interface BuildingData {
  id: string;
  type: BuildingType;
  name: string;
  x: number; // Tile X top-left
  y: number; // Tile Y top-left
  width: number;
  height: number;
  door: BuildingDoor;
  ownerId?: string; // NPC id
  description?: string;
  interior?: BuildingInterior;
}

export class Building {
  public readonly id: string;
  public readonly type: BuildingType;
  public readonly name: string;
  public readonly x: number;
  public readonly y: number;
  public readonly width: number;
  public readonly height: number;
  public readonly door: BuildingDoor;
  public readonly ownerId?: string;
  public readonly description: string;
  public readonly interior: BuildingInterior;

  // Runtime state
  private isOccupied: boolean = false;
  private occupantId: string | null = null;
  private isDoorOpen: boolean = false;

  constructor(data: BuildingData) {
    this.id = data.id;
    this.type = data.type;
    this.name = data.name;
    this.x = data.x;
    this.y = data.y;
    this.width = data.width;
    this.height = data.height;
    this.door = data.door;
    this.ownerId = data.ownerId;
    this.description = data.description ?? getBuildingTypeProperties(data.type).description;

    this.interior = data.interior ?? {
      hasInterior: getBuildingTypeProperties(data.type).hasInterior,
      interiorMapId: null,
      interiorWidth: data.width,
      interiorHeight: data.height,
      entryTile: null
    };
  }

  getTypeProperties() {
    return getBuildingTypeProperties(this.type);
  }

  // Check if a tile coordinate is inside this building (including walls)
  containsTile(tileX: number, tileY: number): boolean {
    return tileX >= this.x && tileX < this.x + this.width &&
           tileY >= this.y && tileY < this.y + this.height;
  }

  // Check if a tile is the door tile
  isDoorTile(tileX: number, tileY: number): boolean {
    return tileX === this.door.x && tileY === this.door.y;
  }

  // Get all tiles that are blocked (house interior) excluding door
  getBlockedTiles(): { x: number; y: number }[] {
    const blocked: { x: number; y: number }[] = [];
    for (let dy = 0; dy < this.height; dy++) {
      for (let dx = 0; dx < this.width; dx++) {
        const tx = this.x + dx;
        const ty = this.y + dy;
        if (tx === this.door.x && ty === this.door.y) continue; // Door is walkable
        blocked.push({ x: tx, y: ty });
      }
    }
    return blocked;
  }

  // Get door world position (center of tile)
  getDoorWorldPosition(tileSize: number = 32): { x: number; y: number } {
    return {
      x: this.door.worldX,
      y: this.door.worldY
    };
  }

  // Get position in front of door (where NPC/player stands to interact)
  getFrontOfDoorPosition(tileSize: number = 32): { x: number; y: number; tileX: number; tileY: number } {
    let frontTileX = this.door.x;
    let frontTileY = this.door.y;

    switch (this.door.facing) {
      case 'north':
        frontTileY = this.door.y - 1;
        break;
      case 'south':
        frontTileY = this.door.y + 1;
        break;
      case 'east':
        frontTileX = this.door.x + 1;
        break;
      case 'west':
        frontTileX = this.door.x - 1;
        break;
    }

    return {
      x: frontTileX * tileSize + tileSize / 2,
      y: frontTileY * tileSize + tileSize / 2,
      tileX: frontTileX,
      tileY: frontTileY
    };
  }

  // Occupancy
  setOccupied(occupied: boolean, occupantId: string | null = null): void {
    this.isOccupied = occupied;
    this.occupantId = occupantId;
  }

  getIsOccupied(): boolean {
    return this.isOccupied;
  }

  getOccupantId(): string | null {
    return this.occupantId;
  }

  // Door open/close (for future interaction)
  setDoorOpen(open: boolean): void {
    this.isDoorOpen = open;
  }

  getIsDoorOpen(): boolean {
    return this.isDoorOpen;
  }

  // Get center world position
  getCenterWorldPosition(tileSize: number = 32): { x: number; y: number } {
    return {
      x: (this.x + this.width / 2) * tileSize,
      y: (this.y + this.height / 2) * tileSize
    };
  }

  getData(): BuildingData {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      door: { ...this.door },
      ownerId: this.ownerId,
      description: this.description,
      interior: { ...this.interior }
    };
  }

  toString(): string {
    return `${this.id} ${this.name} (${BuildingType[this.type]}) at ${this.x},${this.y} ${this.width}x${this.height} door ${this.door.x},${this.door.y} owner ${this.ownerId ?? 'none'}`;
  }
}
