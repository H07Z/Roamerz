/**
 * NavigationGrid - Phase 7
 * Holds navigation information separate from visual tiles and collision
 * 0 = Walkable, 1 = Blocked
 * Separate from WorldMap and CollisionMap as per spec
 */

import { WorldMap } from '../world/WorldMap';
import { CollisionMap } from '../collision/CollisionMap';
import { CollisionType } from '../collision/CollisionType';

export class NavigationGrid {
  public readonly width: number;
  public readonly height: number;
  private grid: number[]; // 0 walkable, 1 blocked, flat array

  constructor(width: number, height: number, grid?: number[]) {
    this.width = width;
    this.height = height;
    this.grid = grid ?? new Array(width * height).fill(0);
  }

  isWalkable(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.grid[y * this.width + x] === 0;
  }

  isBlocked(x: number, y: number): boolean {
    return !this.isWalkable(x, y);
  }

  setWalkable(x: number, y: number, walkable: boolean): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    this.grid[y * this.width + x] = walkable ? 0 : 1;
    return true;
  }

  get(x: number, y: number): number | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    return this.grid[y * this.width + x];
  }

  set(x: number, y: number, value: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    this.grid[y * this.width + x] = value ? 1 : 0;
    return true;
  }

  getGrid(): number[] {
    return [...this.grid];
  }

  getCounts(): { walkable: number; blocked: number } {
    let walkable = 0, blocked = 0;
    for (const v of this.grid) {
      if (v === 0) walkable++; else blocked++;
    }
    return { walkable, blocked };
  }

  /**
   * Generate navigation grid from collision map
   * Keeps navigation separate from visual and collision
   */
  static fromCollisionMap(collisionMap: CollisionMap): NavigationGrid {
    const width = collisionMap.width;
    const height = collisionMap.height;
    const grid = new Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const collType = collisionMap.getCollisionType(x, y);
        // Walkable if WALKABLE or INTERACTABLE, blocked if BLOCKED
        grid[y * width + x] = (collType === CollisionType.WALKABLE || collType === CollisionType.INTERACTABLE) ? 0 : 1;
      }
    }

    console.log(`[NavigationGrid] Generated from collision map: ${width}x${height}`);
    const counts = { walkable: 0, blocked: 0 };
    for (const v of grid) {
      if (v === 0) counts.walkable++; else counts.blocked++;
    }
    console.log(`[NavigationGrid] Counts:`, counts);

    return new NavigationGrid(width, height, grid);
  }

  static fromWorldMap(worldMap: WorldMap): NavigationGrid {
    // Fallback: generate from world map directly if no collision map
    const width = worldMap.width;
    const height = worldMap.height;
    const grid = new Array(width * height);

    // Import TerrainType mapping - avoid circular, use numbers
    // GRASS 0, ROAD 1, WATER 2, BRIDGE 3, TREE 4, ROCK 5, HOUSE 6, FARMLAND 7
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const terrain = worldMap.getTile(x, y);
        if (terrain === null) {
          grid[y * width + x] = 1;
          continue;
        }
        // Walkable: GRASS, ROAD, BRIDGE, FARMLAND
        if (terrain === 0 || terrain === 1 || terrain === 3 || terrain === 7) {
          grid[y * width + x] = 0;
        } else {
          grid[y * width + x] = 1;
        }
      }
    }

    return new NavigationGrid(width, height, grid);
  }

  // For debugging: get ASCII region
  getAsciiRegion(startX: number, startY: number, w: number, h: number): string {
    let out = '';
    for (let y = startY; y < startY + h && y < this.height; y++) {
      for (let x = startX; x < startX + w && x < this.width; x++) {
        out += this.isWalkable(x, y) ? '.' : '#';
      }
      out += '\n';
    }
    return out;
  }
}
