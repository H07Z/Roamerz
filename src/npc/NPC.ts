/**
 * NPC - Phase 6 Foundation
 * Basic NPC without pathfinding yet
 * Has homes, jobs, movement between two predefined points for testing
 */

import { WorldMap } from '../world/WorldMap';
import { WorldRenderer } from '../world/WorldRenderer';
import { CollisionSystem } from '../collision/CollisionSystem';

export enum NPCState {
  IDLE = 'IDLE',
  WALK = 'WALK'
}

export enum NPCDirection {
  DOWN = 'down',
  UP = 'up',
  LEFT = 'left',
  RIGHT = 'right'
}

export interface NPCData {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  speed: number;
  direction: NPCDirection;
  state: NPCState;
  homeId?: string;
}

export interface NPCPoint {
  x: number;
  y: number;
}

export class NPC {
  public readonly id: string;
  public readonly name: string;
  public readonly role: string;
  public x: number;
  public y: number;
  public speed: number;
  public direction: NPCDirection;
  public state: NPCState;
  public homeId?: string;

  public width: number = 18;
  public height: number = 18;

  // For testing movement between two points (Phase 6)
  private pointA: NPCPoint;
  private pointB: NPCPoint;
  private targetPoint: NPCPoint;
  private movingToB: boolean = true;
  private idleTimer: number = 0;
  private idleDuration: number = 2; // seconds to idle at destination

  // For stuck detection (future Phase 7)
  private lastX: number;
  private lastY: number;
  private stuckTime: number = 0;

  constructor(data: NPCData, pointA: NPCPoint, pointB: NPCPoint) {
    this.id = data.id;
    this.name = data.name;
    this.role = data.role;
    this.x = data.x;
    this.y = data.y;
    this.speed = data.speed;
    this.direction = data.direction as NPCDirection;
    this.state = data.state as NPCState;
    this.homeId = data.homeId;

    this.pointA = pointA;
    this.pointB = pointB;
    this.targetPoint = pointB;
    this.movingToB = true;

    this.lastX = this.x;
    this.lastY = this.y;
  }

  update(deltaTime: number, _worldMap: WorldMap | null, _collisionSystem: CollisionSystem | null): void {
    // Phase 6: Simple movement between two points without pathfinding
    // This proves NPC movement works before introducing A* in Phase 7

    if (this.state === NPCState.IDLE) {
      this.idleTimer += deltaTime;
      if (this.idleTimer >= this.idleDuration) {
        this.idleTimer = 0;
        this.state = NPCState.WALK;
        // Switch target
        this.movingToB = !this.movingToB;
        this.targetPoint = this.movingToB ? this.pointB : this.pointA;
      }
      return;
    }

    // WALK state - move towards target
    const dx = this.targetPoint.x - this.x;
    const dy = this.targetPoint.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      // Reached destination
      this.x = this.targetPoint.x;
      this.y = this.targetPoint.y;
      this.state = NPCState.IDLE;
      this.idleTimer = 0;
      return;
    }

    // Normalize and move
    const dirX = dx / dist;
    const dirY = dy / dist;

    this.updateDirection(dirX, dirY);

    const moveX = dirX * this.speed * deltaTime;
    const moveY = dirY * this.speed * deltaTime;

    // For Phase 6, no collision yet for NPCs (will be added Phase 7+)
    // But we do basic boundary check
    this.x += moveX;
    this.y += moveY;

    // Stuck detection
    const movedDist = Math.sqrt((this.x - this.lastX) ** 2 + (this.y - this.lastY) ** 2);
    if (movedDist < 0.1) {
      this.stuckTime += deltaTime;
      if (this.stuckTime > 2) {
        // Stuck for 2 seconds, switch to idle and retry
        console.warn(`[NPC] ${this.id} stuck at ${this.x.toFixed(1)},${this.y.toFixed(1)}, switching to idle`);
        this.state = NPCState.IDLE;
        this.idleTimer = 0;
        this.stuckTime = 0;
      }
    } else {
      this.stuckTime = 0;
    }

    this.lastX = this.x;
    this.lastY = this.y;
  }

  private updateDirection(dx: number, dy: number): void {
    // Simple 4-direction based on dominant axis
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? NPCDirection.RIGHT : NPCDirection.LEFT;
    } else {
      this.direction = dy > 0 ? NPCDirection.DOWN : NPCDirection.UP;
    }
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

  getTarget(): NPCPoint {
    return this.targetPoint;
  }

  getPoints(): { a: NPCPoint; b: NPCPoint } {
    return { a: this.pointA, b: this.pointB };
  }

  getData(): NPCData {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      x: this.x,
      y: this.y,
      speed: this.speed,
      direction: this.direction as any,
      state: this.state as any,
      homeId: this.homeId
    };
  }

  isAtDestination(threshold: number = 5): boolean {
    const dx = this.targetPoint.x - this.x;
    const dy = this.targetPoint.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }
}
