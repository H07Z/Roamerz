/**
 * Player - Phase 4
 * Single player with movement, states, direction, world boundary + collision
 * Now uses CollisionSystem to prevent walking through blocked objects
 */

import { InputManager } from '../core/InputManager';
import { WorldMap } from '../world/WorldMap';
import { WorldRenderer } from '../world/WorldRenderer';
import { CollisionSystem } from '../collision/CollisionSystem';
import { CollisionType } from '../collision/CollisionType';

export enum PlayerState {
  IDLE = 'IDLE',
  WALK = 'WALK'
}

export enum PlayerDirection {
  DOWN = 'down',
  UP = 'up',
  LEFT = 'left',
  RIGHT = 'right',
  UP_LEFT = 'up-left',
  UP_RIGHT = 'up-right',
  DOWN_LEFT = 'down-left',
  DOWN_RIGHT = 'down-right'
}

export interface PlayerData {
  x: number;
  y: number;
  speed: number;
  direction: PlayerDirection;
  state: PlayerState;
}

export class Player {
  public x: number;
  public y: number;
  public speed: number;
  public direction: PlayerDirection;
  public state: PlayerState;

  public width: number = 20;
  public height: number = 20;

  private totalDistanceTraveled: number = 0;

  // For Phase 4 collision debug
  private lastCollision: { x: number; y: number; type: CollisionType }[] = [];
  private isColliding: boolean = false;

  constructor(x: number, y: number, speed: number = 150) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.direction = PlayerDirection.DOWN;
    this.state = PlayerState.IDLE;
  }

  /**
   * Update player based on input, deltaTime, and collision system
   */
  update(
    deltaTime: number,
    input: InputManager,
    worldMap: WorldMap | null,
    collisionSystem: CollisionSystem | null = null
  ): void {
    let moveX = 0;
    let moveY = 0;

    if (input.isKeyDown('w') || input.isKeyDown('arrowup')) moveY -= 1;
    if (input.isKeyDown('s') || input.isKeyDown('arrowdown')) moveY += 1;
    if (input.isKeyDown('a') || input.isKeyDown('arrowleft')) moveX -= 1;
    if (input.isKeyDown('d') || input.isKeyDown('arrowright') || input.isKeyDown('e')) moveX += 1;

    const isMoving = moveX !== 0 || moveY !== 0;

    if (isMoving) {
      if (moveX !== 0 && moveY !== 0) {
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= length;
        moveY /= length;
      }

      this.updateDirection(moveX, moveY);

      const deltaX = moveX * this.speed * deltaTime;
      const deltaY = moveY * this.speed * deltaTime;

      let newX = this.x;
      let newY = this.y;
      this.isColliding = false;
      this.lastCollision = [];

      if (collisionSystem && collisionSystem.getCollisionMap()) {
        // Use collision system to resolve movement
        const result = collisionSystem.resolveMovement(this.x, this.y, deltaX, deltaY, this.width, this.height);
        newX = result.x;
        newY = result.y;
        this.isColliding = result.collidedX || result.collidedY;
        this.lastCollision = result.blockedTiles.map(t => ({ x: t.x, y: t.y, type: t.type }));
      } else {
        // Fallback to old boundary-only logic (Phase 3)
        let tempX = this.x + deltaX;
        let tempY = this.y + deltaY;

        if (worldMap) {
          const mapPixelWidth = worldMap.width * WorldRenderer.TILE_SIZE;
          const mapPixelHeight = worldMap.height * WorldRenderer.TILE_SIZE;
          const halfW = this.width / 2;
          const halfH = this.height / 2;
          tempX = Math.max(halfW, Math.min(tempX, mapPixelWidth - halfW));
          tempY = Math.max(halfH, Math.min(tempY, mapPixelHeight - halfH));
        }

        newX = tempX;
        newY = tempY;
      }

      const dist = Math.sqrt((newX - this.x) ** 2 + (newY - this.y) ** 2);
      this.totalDistanceTraveled += dist;

      // Only update position if actually moved (or if collision prevented movement, stay)
      this.x = newX;
      this.y = newY;

      // If collision prevented all movement, still WALK state? For Phase 4, if trying to walk into wall, stay WALK but position doesn't change
      // Could also set to IDLE if no movement, but we keep WALK to show intent
      if (dist > 0.01) {
        this.state = PlayerState.WALK;
      } else {
        // Trying to move but blocked
        this.state = PlayerState.WALK;
        // Alternatively, if completely blocked, we could keep WALK to indicate pushing against wall
      }
    } else {
      this.state = PlayerState.IDLE;
      this.isColliding = false;
    }
  }

  private updateDirection(moveX: number, moveY: number): void {
    if (moveX === 0 && moveY < 0) this.direction = PlayerDirection.UP;
    else if (moveX === 0 && moveY > 0) this.direction = PlayerDirection.DOWN;
    else if (moveX < 0 && moveY === 0) this.direction = PlayerDirection.LEFT;
    else if (moveX > 0 && moveY === 0) this.direction = PlayerDirection.RIGHT;
    else if (moveX < 0 && moveY < 0) this.direction = PlayerDirection.UP_LEFT;
    else if (moveX > 0 && moveY < 0) this.direction = PlayerDirection.UP_RIGHT;
    else if (moveX < 0 && moveY > 0) this.direction = PlayerDirection.DOWN_LEFT;
    else if (moveX > 0 && moveY > 0) this.direction = PlayerDirection.DOWN_RIGHT;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  getTilePosition(tileSize: number = 32): { x: number; y: number } {
    return {
      x: Math.floor(this.x / tileSize),
      y: Math.floor(this.y / tileSize)
    };
  }

  getData(): PlayerData {
    return {
      x: this.x,
      y: this.y,
      speed: this.speed,
      direction: this.direction,
      state: this.state
    };
  }

  getTotalDistance(): number {
    return this.totalDistanceTraveled;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  isAtBoundary(worldMap: WorldMap, threshold: number = 5): { atBoundary: boolean; side: string | null } {
    if (!worldMap) return { atBoundary: false, side: null };
    const mapPixelWidth = worldMap.width * WorldRenderer.TILE_SIZE;
    const mapPixelHeight = worldMap.height * WorldRenderer.TILE_SIZE;
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    if (this.x <= halfW + threshold) return { atBoundary: true, side: 'left' };
    if (this.x >= mapPixelWidth - halfW - threshold) return { atBoundary: true, side: 'right' };
    if (this.y <= halfH + threshold) return { atBoundary: true, side: 'top' };
    if (this.y >= mapPixelHeight - halfH - threshold) return { atBoundary: true, side: 'bottom' };
    return { atBoundary: false, side: null };
  }

  // Phase 4 collision debug
  getLastCollision(): { x: number; y: number; type: CollisionType }[] {
    return this.lastCollision;
  }

  getIsColliding(): boolean {
    return this.isColliding;
  }

  // Check what terrain is under player (for testing bridge etc)
  getCurrentTileInfo(worldMap: WorldMap | null): { terrain: number | null; collision: CollisionType | null } | null {
    if (!worldMap) return null;
    const tilePos = this.getTilePosition();
    const terrain = worldMap.getTile(tilePos.x, tilePos.y);
    return { terrain, collision: null };
  }
}
