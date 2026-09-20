/**
 * Player - Phase 3
 * Single player with movement, states, direction, world boundary clamping
 * No collision with terrain yet (Phase 4), only world boundaries
 */

import { InputManager } from '../core/InputManager';
import { WorldMap } from '../world/WorldMap';
import { WorldRenderer } from '../world/WorldRenderer';

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
  public speed: number; // pixels per second
  public direction: PlayerDirection;
  public state: PlayerState;

  // Size for rendering and boundary checks
  public width: number = 20;
  public height: number = 20;

  // For testing deltaTime consistency
  private totalDistanceTraveled: number = 0;

  constructor(x: number, y: number, speed: number = 150) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.direction = PlayerDirection.DOWN;
    this.state = PlayerState.IDLE;
  }

  /**
   * Update player based on input and deltaTime
   * Handles 8-directional movement with normalized diagonal speed
   */
  update(deltaTime: number, input: InputManager, worldMap: WorldMap | null): void {
    let moveX = 0;
    let moveY = 0;

    // Input: WASD + Arrow keys
    // UP
    if (input.isKeyDown('w') || input.isKeyDown('arrowup')) {
      moveY -= 1;
    }
    // DOWN
    if (input.isKeyDown('s') || input.isKeyDown('arrowdown')) {
      moveY += 1;
    }
    // LEFT
    if (input.isKeyDown('a') || input.isKeyDown('arrowleft')) {
      moveX -= 1;
    }
    // RIGHT - D is also debug toggle, but we allow movement when held
    // Check for D or E (E as alternative right to avoid debug conflict)
    if (input.isKeyDown('d') || input.isKeyDown('arrowright') || input.isKeyDown('e')) {
      // If D just pressed this frame, it toggled debug, but we still allow movement
      // For pure D press, movement will start next frame after toggle
      // To make it responsive, we check isKeyDown regardless
      moveX += 1;
    }

    // Determine if moving
    const isMoving = moveX !== 0 || moveY !== 0;

    if (isMoving) {
      // Normalize diagonal movement (so diagonal not faster)
      if (moveX !== 0 && moveY !== 0) {
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= length;
        moveY /= length;
      }

      // Update direction based on movement
      this.updateDirection(moveX, moveY);

      // Calculate new position with deltaTime
      const deltaX = moveX * this.speed * deltaTime;
      const deltaY = moveY * this.speed * deltaTime;

      let newX = this.x + deltaX;
      let newY = this.y + deltaY;

      // Clamp to world boundaries (Phase 3 requirement: cannot leave world)
      if (worldMap) {
        const mapPixelWidth = worldMap.width * WorldRenderer.TILE_SIZE;
        const mapPixelHeight = worldMap.height * WorldRenderer.TILE_SIZE;

        // Player is centered at x,y, so clamp with half width/height
        const halfW = this.width / 2;
        const halfH = this.height / 2;

        newX = Math.max(halfW, Math.min(newX, mapPixelWidth - halfW));
        newY = Math.max(halfH, Math.min(newY, mapPixelHeight - halfH));
      }

      // Track distance for testing consistency
      const dist = Math.sqrt((newX - this.x) ** 2 + (newY - this.y) ** 2);
      this.totalDistanceTraveled += dist;

      this.x = newX;
      this.y = newY;

      this.state = PlayerState.WALK;
    } else {
      this.state = PlayerState.IDLE;
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

  // For Phase 3 testing: set position directly
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  // Check if player at world boundary (for testing)
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
}
