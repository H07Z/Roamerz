/**
 * NPC - Phase 7 Pathfinding
 * Implements navigation/pathfinding with A*
 * - Receives START and DESTINATION
 * - Find Path → Validate → Follow → Reach
 * - Handles NO PATH, stuck detection, recalculation limiting
 */

import { WorldMap } from '../world/WorldMap';
import { WorldRenderer } from '../world/WorldRenderer';
import { CollisionSystem } from '../collision/CollisionSystem';
import { Pathfinder } from '../pathfinding/Pathfinder';
import { Path, PathNode, PathStatus } from '../pathfinding/Path';

export enum NPCState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  PATHFINDING = 'PATHFINDING',
  FOLLOWING_PATH = 'FOLLOWING_PATH',
  WAITING = 'WAITING',
  STUCK = 'STUCK'
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

  // Movement points for testing (Phase 6)
  private pointA: NPCPoint;
  private pointB: NPCPoint;
  private targetPoint: NPCPoint;
  private movingToB: boolean = true;
  private idleTimer: number = 0;
  private idleDuration: number = 2;

  // Pathfinding (Phase 7)
  private path: Path | null = null;
  private pathfinder: Pathfinder | null = null;
  private destinationTile: PathNode | null = null;
  private startTile: PathNode | null = null;

  // Stuck detection
  private lastX: number;
  private lastY: number;
  private stuckTime: number = 0;
  private stuckThreshold: number = 0.5; // seconds without progress = stuck
  private lastProgressTime: number = 0;
  private progressThreshold: number = 10; // pixels

  // Recalculation limiting
  private recalculationAttempts: number = 0;
  private maxRecalculations: number = 3;
  private recalculationCooldown: number = 0;
  private recalculationCooldownDuration: number = 2; // seconds

  // Path failure handling
  private pathFailedTimer: number = 0;
  private pathFailedWaitDuration: number = 3; // wait 3 sec before retry on failure
  private pathStatus: PathStatus | null = null;

  // For debug
  private totalDistanceTraveled: number = 0;
  private pathRequests: number = 0;
  private pathsFound: number = 0;
  private pathsFailed: number = 0;

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

  setPathfinder(pathfinder: Pathfinder): void {
    this.pathfinder = pathfinder;
  }

  /**
   * Request a path to a destination (tile coordinates)
   */
  requestPath(destinationTile: PathNode): boolean {
    if (!this.pathfinder) {
      console.warn(`[NPC] ${this.id} no pathfinder set`);
      return false;
    }

    const startTile = this.getTilePosition();
    this.startTile = { x: startTile.x, y: startTile.y };
    this.destinationTile = destinationTile;

    // Check if already at destination
    if (startTile.x === destinationTile.x && startTile.y === destinationTile.y) {
      console.log(`[NPC] ${this.id} already at destination ${destinationTile.x},${destinationTile.y}`);
      this.path = new Path([destinationTile], PathStatus.FOUND);
      this.pathStatus = PathStatus.FOUND;
      this.state = NPCState.IDLE;
      return true;
    }

    this.state = NPCState.PATHFINDING;
    this.pathRequests++;

    const result = this.pathfinder.requestPath(this.startTile, destinationTile, this.id);

    if (result.success && result.path) {
      this.path = result.path;
      this.pathStatus = result.path.status;
      this.pathsFound++;
      this.recalculationAttempts = 0;
      this.state = NPCState.FOLLOWING_PATH;
      console.log(`[NPC] ${this.id} path found: ${result.path.getLength()} nodes to ${destinationTile.x},${destinationTile.y}`);
      return true;
    } else {
      this.path = result.path;
      this.pathStatus = result.path ? result.path.status : PathStatus.NOT_FOUND;
      this.pathsFailed++;
      this.state = NPCState.WAITING;
      this.pathFailedTimer = 0;
      console.log(`[NPC] ${this.id} NO PATH to ${destinationTile.x},${destinationTile.y} status=${this.pathStatus}`);
      return false;
    }
  }

  /**
   * Request path to world pixel coordinates (converts to tile)
   */
  requestPathToWorld(worldX: number, worldY: number, tileSize: number = 32): boolean {
    const tileX = Math.floor(worldX / tileSize);
    const tileY = Math.floor(worldY / tileSize);
    return this.requestPath({ x: tileX, y: tileY });
  }

  update(deltaTime: number, _worldMap: WorldMap | null, _collisionSystem: CollisionSystem | null): void {
    // Handle recalculation cooldown
    if (this.recalculationCooldown > 0) {
      this.recalculationCooldown -= deltaTime;
    }

    // Handle path failure waiting
    if (this.state === NPCState.WAITING) {
      this.pathFailedTimer += deltaTime;
      if (this.pathFailedTimer >= this.pathFailedWaitDuration) {
        // Retry or choose alternative behavior
        if (this.recalculationAttempts < this.maxRecalculations) {
          this.recalculationAttempts++;
          console.log(`[NPC] ${this.id} retrying path after failure (attempt ${this.recalculationAttempts})`);
          if (this.destinationTile) {
            this.requestPath(this.destinationTile);
          }
        } else {
          // Max retries reached, switch to idle and choose alternative (switch target)
          console.log(`[NPC] ${this.id} max retries reached, switching to alternative behavior`);
          this.recalculationAttempts = 0;
          this.switchToAlternativeTarget();
        }
      }
      return;
    }

    // Handle stuck state
    if (this.state === NPCState.STUCK) {
      this.stuckTime += deltaTime;
      if (this.stuckTime >= 1) {
        // Try to recalculate
        if (this.recalculationCooldown <= 0 && this.recalculationAttempts < this.maxRecalculations) {
          this.recalculationAttempts++;
          this.recalculationCooldown = this.recalculationCooldownDuration;
          console.log(`[NPC] ${this.id} stuck, recalculating path (attempt ${this.recalculationAttempts})`);
          if (this.destinationTile) {
            this.requestPath(this.destinationTile);
          }
          this.stuckTime = 0;
          this.state = NPCState.PATHFINDING;
        } else if (this.recalculationAttempts >= this.maxRecalculations) {
          console.log(`[NPC] ${this.id} stuck max retries, waiting`);
          this.state = NPCState.WAITING;
          this.pathFailedTimer = 0;
          this.stuckTime = 0;
        }
      }
      return;
    }

    if (this.state === NPCState.IDLE) {
      this.idleTimer += deltaTime;
      if (this.idleTimer >= this.idleDuration) {
        this.idleTimer = 0;
        this.switchToAlternativeTarget();
      }
      return;
    }

    if (this.state === NPCState.FOLLOWING_PATH) {
      if (!this.path || this.path.isFailed()) {
        console.warn(`[NPC] ${this.id} following but no valid path`);
        this.state = NPCState.WAITING;
        this.pathFailedTimer = 0;
        return;
      }

      // Validate path still walkable (in case obstacle added)
      if (this.pathfinder && !this.pathfinder.validatePath(this.path)) {
        console.warn(`[NPC] ${this.id} path invalidated (obstacle added), recalculating`);
        if (this.recalculationCooldown <= 0 && this.recalculationAttempts < this.maxRecalculations) {
          this.recalculationAttempts++;
          this.recalculationCooldown = this.recalculationCooldownDuration;
          if (this.destinationTile) {
            this.requestPath(this.destinationTile);
          }
        } else {
          this.state = NPCState.WAITING;
          this.pathFailedTimer = 0;
        }
        return;
      }

      this.followPath(deltaTime);

      // Stuck detection - check if making progress
      const distMoved = Math.sqrt((this.x - this.lastX) ** 2 + (this.y - this.lastY) ** 2);
      this.totalDistanceTraveled += distMoved;

      if (distMoved < this.progressThreshold * deltaTime) {
        // Not making enough progress
        this.stuckTime += deltaTime;
        if (this.stuckTime >= this.stuckThreshold) {
          console.warn(`[NPC] ${this.id} stuck detected at ${this.x.toFixed(0)},${this.y.toFixed(0)}`);
          this.state = NPCState.STUCK;
          this.stuckTime = 0;
        }
      } else {
        this.stuckTime = 0;
        this.lastProgressTime = 0;
      }

      this.lastX = this.x;
      this.lastY = this.y;

      return;
    }

    // Legacy WALK state without pathfinding (fallback)
    if (this.state === NPCState.WALK) {
      const dx = this.targetPoint.x - this.x;
      const dy = this.targetPoint.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        this.x = this.targetPoint.x;
        this.y = this.targetPoint.y;
        this.state = NPCState.IDLE;
        this.idleTimer = 0;
        return;
      }

      const dirX = dx / dist;
      const dirY = dy / dist;
      this.updateDirection(dirX, dirY);
      this.x += dirX * this.speed * deltaTime;
      this.y += dirY * this.speed * deltaTime;
    }
  }

  private followPath(deltaTime: number): void {
    if (!this.path) return;

    const currentNode = this.path.getCurrentNode();
    if (!currentNode) {
      this.state = NPCState.IDLE;
      this.idleTimer = 0;
      console.log(`[NPC] ${this.id} reached destination`);
      return;
    }

    // Convert tile node to world pixel (center of tile)
    const tileSize = WorldRenderer.TILE_SIZE;
    const targetWorldX = currentNode.x * tileSize + tileSize / 2;
    const targetWorldY = currentNode.y * tileSize + tileSize / 2;

    const dx = targetWorldX - this.x;
    const dy = targetWorldY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If close to current node, advance to next
    if (dist < 8) {
      if (this.path.isComplete()) {
        // Reached final destination
        this.x = targetWorldX;
        this.y = targetWorldY;
        this.state = NPCState.IDLE;
        this.idleTimer = 0;
        this.path = null;
        console.log(`[NPC] ${this.id} reached final destination ${currentNode.x},${currentNode.y}`);
      } else {
        this.path.advance();
      }
      return;
    }

    // Move towards current node
    const dirX = dx / dist;
    const dirY = dy / dist;

    this.updateDirection(dirX, dirY);

    this.x += dirX * this.speed * deltaTime;
    this.y += dirY * this.speed * deltaTime;
  }

  private switchToAlternativeTarget(): void {
    // Switch between pointA and pointB (Phase 6 behavior) but now with pathfinding
    this.movingToB = !this.movingToB;
    const newTarget = this.movingToB ? this.pointB : this.pointA;
    this.targetPoint = newTarget;

    // Request path to new target
    const tileSize = WorldRenderer.TILE_SIZE;
    const tileX = Math.floor(newTarget.x / tileSize);
    const tileY = Math.floor(newTarget.y / tileSize);

    console.log(`[NPC] ${this.id} switching target to ${tileX},${tileY} (${this.movingToB ? 'B' : 'A'})`);
    this.requestPath({ x: tileX, y: tileY });
  }

  private updateDirection(dx: number, dy: number): void {
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

  getPath(): Path | null {
    return this.path;
  }

  getPathStatus(): PathStatus | null {
    return this.pathStatus;
  }

  getDestinationTile(): PathNode | null {
    return this.destinationTile;
  }

  getStartTile(): PathNode | null {
    return this.startTile;
  }

  getStats(): { requests: number; found: number; failed: number; distance: number; recalculations: number } {
    return {
      requests: this.pathRequests,
      found: this.pathsFound,
      failed: this.pathsFailed,
      distance: this.totalDistanceTraveled,
      recalculations: this.recalculationAttempts
    };
  }

  isAtDestination(threshold: number = 5): boolean {
    const dx = this.targetPoint.x - this.x;
    const dy = this.targetPoint.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }

  // For Phase 7 tests: set destination directly
  setDestinationTile(tileX: number, tileY: number): boolean {
    return this.requestPath({ x: tileX, y: tileY });
  }

  setDestinationWorld(worldX: number, worldY: number): boolean {
    return this.requestPathToWorld(worldX, worldY);
  }
}
