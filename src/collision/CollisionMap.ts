/**
 * CollisionMap - Phase 4
 * Holds collision data separate from visual tiles
 */

import { CollisionType } from './CollisionType';
import { WorldMap } from '../world/WorldMap';
import { TerrainType } from '../world/TerrainType';

export class CollisionMap {
  public readonly width: number;
  public readonly height: number;
  private tiles: CollisionType[];

  constructor(width: number, height: number, tiles?: CollisionType[]) {
    this.width = width;
    this.height = height;
    this.tiles = tiles ?? new Array(width * height).fill(CollisionType.WALKABLE);
  }

  getCollisionType(x: number, y: number): CollisionType | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return CollisionType.BLOCKED;
    }
    return this.tiles[y * this.width + x];
  }

  setCollisionType(x: number, y: number, type: CollisionType): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    this.tiles[y * this.width + x] = type;
    return true;
  }

  isWalkable(x: number, y: number): boolean {
    const type = this.getCollisionType(x, y);
    if (type === null) return false;
    return type === CollisionType.WALKABLE || type === CollisionType.INTERACTABLE;
  }

  isBlocked(x: number, y: number): boolean {
    const type = this.getCollisionType(x, y);
    return type === CollisionType.BLOCKED;
  }

  isInteractable(x: number, y: number): boolean {
    return this.getCollisionType(x, y) === CollisionType.INTERACTABLE;
  }

  getTiles(): CollisionType[] {
    return [...this.tiles];
  }

  getCounts(): Record<string, number> {
    const counts: Record<string, number> = { WALKABLE: 0, BLOCKED: 0, INTERACTABLE: 0 };
    for (const t of this.tiles) {
      if (t === CollisionType.WALKABLE) counts.WALKABLE++;
      else if (t === CollisionType.BLOCKED) counts.BLOCKED++;
      else if (t === CollisionType.INTERACTABLE) counts.INTERACTABLE++;
    }
    return counts;
  }

  static fromWorldMap(worldMap: WorldMap): CollisionMap {
    const width = worldMap.width;
    const height = worldMap.height;
    const collisionTiles: CollisionType[] = new Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const terrain = worldMap.getTile(x, y);
        if (terrain === null) {
          collisionTiles[y * width + x] = CollisionType.BLOCKED;
          continue;
        }
        let collision: CollisionType;
        switch (terrain) {
          case TerrainType.GRASS:
          case TerrainType.ROAD:
          case TerrainType.BRIDGE:
          case TerrainType.FARMLAND:
            collision = CollisionType.WALKABLE;
            break;
          case TerrainType.WATER:
          case TerrainType.TREE:
          case TerrainType.ROCK:
          case TerrainType.HOUSE:
            collision = CollisionType.BLOCKED;
            break;
          default:
            collision = CollisionType.BLOCKED;
        }
        collisionTiles[y * width + x] = collision;
      }
    }

    // Mark doors as INTERACTABLE: ROAD tiles adjacent to HOUSE
    for (const house of worldMap.houses) {
      for (let hx = house.x - 1; hx <= house.x + house.width; hx++) {
        for (let hy = house.y - 1; hy <= house.y + house.height; hy++) {
          const isBorder = hx === house.x - 1 || hx === house.x + house.width || hy === house.y - 1 || hy === house.y + house.height;
          if (!isBorder) continue;
          if (hx < 0 || hy < 0 || hx >= width || hy >= height) continue;
          const terrain = worldMap.getTile(hx, hy);
          if (terrain === TerrainType.ROAD) {
            let adjacentToHouse = false;
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const nx = hx + dx;
                const ny = hy + dy;
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                if (worldMap.getTile(nx, ny) === TerrainType.HOUSE) {
                  adjacentToHouse = true;
                  break;
                }
              }
              if (adjacentToHouse) break;
            }
            if (adjacentToHouse) {
              collisionTiles[hy * width + hx] = CollisionType.INTERACTABLE;
            }
          }
        }
      }
    }

    console.log(`[CollisionMap] Generated from ${worldMap.mapId}: ${width}x${height}`);
    const counts = { WALKABLE: 0, BLOCKED: 0, INTERACTABLE: 0 };
    for (const t of collisionTiles) {
      if (t === CollisionType.WALKABLE) counts.WALKABLE++;
      else if (t === CollisionType.BLOCKED) counts.BLOCKED++;
      else counts.INTERACTABLE++;
    }
    console.log(`[CollisionMap] Counts:`, counts);

    return new CollisionMap(width, height, collisionTiles);
  }
}
