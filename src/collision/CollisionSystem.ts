/**
 * CollisionSystem - Phase 4
 * Handles collision detection and resolution for player movement
 * Separate from visual rendering and world logic
 */

import { CollisionMap } from './CollisionMap';
import { CollisionType } from './CollisionType';
import { WorldMap } from '../world/WorldMap';
import { WorldRenderer } from '../world/WorldRenderer';

export interface CollisionResult {
  collided: boolean;
  blockedTiles: { x: number; y: number; type: CollisionType }[];
  newX: number;
  newY: number;
  collisionType: CollisionType | null;
}

export class CollisionSystem {
  private collisionMap: CollisionMap | null = null;
  private worldMap: WorldMap | null = null;

  // For debug visualization
  private showCollision: boolean = false;
  private lastCollisionCheck: { x: number; y: number; tiles: { x: number; y: number; type: CollisionType }[] } | null = null;

  constructor() {}

  setCollisionMap(map: CollisionMap): void {
    this.collisionMap = map;
  }

  setWorldMap(map: WorldMap): void {
    this.worldMap = map;
  }

  getCollisionMap(): CollisionMap | null {
    return this.collisionMap;
  }

  initializeFromWorldMap(worldMap: WorldMap): void {
    this.worldMap = worldMap;
    this.collisionMap = CollisionMap.fromWorldMap(worldMap);
  }

  /**
   * Check if a world position (center) with given size collides with blocked tiles
   */
  checkCollisionAt(worldX: number, worldY: number, width: number, height: number): CollisionResult {
    if (!this.collisionMap) {
      return { collided: false, blockedTiles: [], newX: worldX, newY: worldY, collisionType: null };
    }

    const halfW = width / 2;
    const halfH = height / 2;

    const left = worldX - halfW;
    const right = worldX + halfW;
    const top = worldY - halfH;
    const bottom = worldY + halfH;

    const tileSize = WorldRenderer.TILE_SIZE;

    const startTileX = Math.floor(left / tileSize);
    const endTileX = Math.floor(right / tileSize);
    const startTileY = Math.floor(top / tileSize);
    const endTileY = Math.floor(bottom / tileSize);

    const blockedTiles: { x: number; y: number; type: CollisionType }[] = [];
    let hasBlocked = false;
    let firstBlockedType: CollisionType | null = null;

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const collisionType = this.collisionMap.getCollisionType(tx, ty);
        if (collisionType === null) continue;

        if (collisionType === CollisionType.BLOCKED) {
          hasBlocked = true;
          blockedTiles.push({ x: tx, y: ty, type: collisionType });
          if (!firstBlockedType) firstBlockedType = collisionType;
        } else if (collisionType === CollisionType.INTERACTABLE) {
          // Interactable is walkable, but we track it
          blockedTiles.push({ x: tx, y: ty, type: collisionType });
        }
      }
    }

    this.lastCollisionCheck = {
      x: worldX,
      y: worldY,
      tiles: blockedTiles.map(t => ({ x: t.x, y: t.y, type: t.type }))
    };

    return {
      collided: hasBlocked,
      blockedTiles,
      newX: worldX,
      newY: worldY,
      collisionType: firstBlockedType
    };
  }

  /**
   * Resolve movement with collision - handles X and Y separately for sliding
   * Returns new position that doesn't collide
   */
  resolveMovement(
    currentX: number,
    currentY: number,
    deltaX: number,
    deltaY: number,
    width: number,
    height: number
  ): { x: number; y: number; collidedX: boolean; collidedY: boolean; blockedTiles: { x: number; y: number; type: CollisionType }[] } {
    if (!this.collisionMap) {
      return { x: currentX + deltaX, y: currentY + deltaY, collidedX: false, collidedY: false, blockedTiles: [] };
    }

    let newX = currentX;
    let newY = currentY;
    let collidedX = false;
    let collidedY = false;
    const allBlockedTiles: { x: number; y: number; type: CollisionType }[] = [];

    // Try X movement first
    if (deltaX !== 0) {
      const testX = currentX + deltaX;
      const resultX = this.checkCollisionAt(testX, currentY, width, height);
      if (!resultX.collided) {
        newX = testX;
      } else {
        collidedX = true;
        allBlockedTiles.push(...resultX.blockedTiles.filter(t => t.type === CollisionType.BLOCKED));
      }
    }

    // Try Y movement (using newX if X succeeded, for diagonal sliding)
    if (deltaY !== 0) {
      const testY = currentY + deltaY;
      const resultY = this.checkCollisionAt(newX, testY, width, height);
      if (!resultY.collided) {
        newY = testY;
      } else {
        collidedY = true;
        allBlockedTiles.push(...resultY.blockedTiles.filter(t => t.type === CollisionType.BLOCKED));
      }
    }

    // If both axes blocked when trying diagonal, try to slide along one axis
    // Already handled by separate X and Y checks - if X blocked but Y not, Y will succeed, etc.

    // Special case: if moving diagonally and both X and Y blocked individually, but diagonal position itself might be blocked
    // Our separate checks already handle sliding - player will stop

    // Clamp to world boundaries as well (world boundary is BLOCKED outside map)
    const tileSize = WorldRenderer.TILE_SIZE;
    if (this.collisionMap) {
      const mapPixelWidth = this.collisionMap.width * tileSize;
      const mapPixelHeight = this.collisionMap.height * tileSize;
      const halfW = width / 2;
      const halfH = height / 2;

      newX = Math.max(halfW, Math.min(newX, mapPixelWidth - halfW));
      newY = Math.max(halfH, Math.min(newY, mapPixelHeight - halfH));
    }

    return { x: newX, y: newY, collidedX, collidedY, blockedTiles: allBlockedTiles };
  }

  /**
   * Check if a specific tile is walkable
   */
  isTileWalkable(tileX: number, tileY: number): boolean {
    if (!this.collisionMap) return false;
    return this.collisionMap.isWalkable(tileX, tileY);
  }

  // Debug
  setShowCollision(show: boolean): void {
    this.showCollision = show;
  }

  isShowCollision(): boolean {
    return this.showCollision;
  }

  getLastCollisionCheck() {
    return this.lastCollisionCheck;
  }

  renderDebug(
    ctx: CanvasRenderingContext2D,
    worldRenderer: WorldRenderer,
    screenWidth: number,
    screenHeight: number
  ): void {
    if (!this.showCollision || !this.collisionMap) return;

    const tileSize = worldRenderer.getTileSize();
    const offset = worldRenderer.getOffset();

    const startCol = Math.floor(offset.x / tileSize);
    const endCol = Math.ceil((offset.x + screenWidth) / tileSize);
    const startRow = Math.floor(offset.y / tileSize);
    const endRow = Math.ceil((offset.y + screenHeight) / tileSize);

    const clampedStartCol = Math.max(0, startCol);
    const clampedEndCol = Math.min(this.collisionMap.width, endCol);
    const clampedStartRow = Math.max(0, startRow);
    const clampedEndRow = Math.min(this.collisionMap.height, endRow);

    ctx.save();

    for (let y = clampedStartRow; y < clampedEndRow; y++) {
      for (let x = clampedStartCol; x < clampedEndCol; x++) {
        const type = this.collisionMap.getCollisionType(x, y);
        if (type === null) continue;

        const screenX = x * tileSize - offset.x;
        const screenY = y * tileSize - offset.y;

        if (type === CollisionType.BLOCKED) {
          ctx.fillStyle = 'rgba(255, 50, 50, 0.35)';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
          // X mark
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.beginPath();
          ctx.moveTo(screenX + 4, screenY + 4);
          ctx.lineTo(screenX + tileSize - 4, screenY + tileSize - 4);
          ctx.moveTo(screenX + tileSize - 4, screenY + 4);
          ctx.lineTo(screenX + 4, screenY + tileSize - 4);
          ctx.stroke();
        } else if (type === CollisionType.INTERACTABLE) {
          ctx.fillStyle = 'rgba(255, 255, 50, 0.35)';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
        }
        // WALKABLE not rendered to avoid clutter, but could show green tint
      }
    }

    ctx.restore();
  }
}
