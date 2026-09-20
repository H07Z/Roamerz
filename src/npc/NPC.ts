/**
 * NPC - Phase 10 NPC Life Simulation
 * Implements navigation/pathfinding with A* + home building + time-based schedules + life needs
 * - Receives START and DESTINATION
 * - Find Path → Validate → Follow → Reach
 * - Handles NO PATH, stuck detection, recalculation limiting
 * - Phase 8: Homes, goHome, AT_HOME, INSIDE, building occupancy
 * - Phase 9: Time-based schedules, activities, day phases
 * - Phase 10: Needs (energy, hunger, social, happiness, health), inventory, jobs, interactions
 */

import { WorldMap } from '../world/WorldMap';
import { WorldRenderer } from '../world/WorldRenderer';
import { CollisionSystem } from '../collision/CollisionSystem';
import { Pathfinder } from '../pathfinding/Pathfinder';
import { Path, PathNode, PathStatus } from '../pathfinding/Path';
import { Building } from '../building/Building';
import { Schedule } from '../schedule/Schedule';
import { ScheduleEntry } from '../schedule/ScheduleEntry';
import { ScheduleActivityType } from '../schedule/ScheduleActivityType';
import { NPCNeeds } from '../life/NPCNeeds';
import { NPCInventory } from '../life/NPCInventory';
import { Job } from '../life/Job';

export enum NPCState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  PATHFINDING = 'PATHFINDING',
  FOLLOWING_PATH = 'FOLLOWING_PATH',
  WAITING = 'WAITING',
  STUCK = 'STUCK',
  GOING_HOME = 'GOING_HOME',
  AT_HOME = 'AT_HOME',
  INSIDE = 'INSIDE',
  SLEEPING = 'SLEEPING',
  WORKING = 'WORKING',
  EATING = 'EATING',
  SOCIALIZING = 'SOCIALIZING',
  FARMING = 'FARMING',
  SHOPPING = 'SHOPPING',
  PLAYING = 'PLAYING',
  WANDERING = 'WANDERING'
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

  // Phase 8: Building / Home integration
  private homeBuilding: Building | null = null;
  private workBuilding: Building | null = null;
  private atHomeTimer: number = 0;
  private atHomeDuration: number = 3; // seconds to stay at home before leaving
  private insideTimer: number = 0;
  private insideDuration: number = 5; // seconds inside
  private goingHome: boolean = false;

  // Phase 9: Schedule integration
  private schedule: Schedule | null = null;
  private currentScheduleEntry: ScheduleEntry | null = null;
  private currentActivity: ScheduleActivityType | null = null;
  private scheduleEnabled: boolean = true;
  private lastScheduleMinutes: number = -1;
  private activityTimer: number = 0;
  private workLocation: { x: number; y: number; tileX: number; tileY: number } | null = null;

  // Phase 10: Life simulation
  private needs: NPCNeeds | null = null;
  private inventory: NPCInventory | null = null;
  private job: Job | null = null;
  private lastEatTime: number = -10;
  private socialInteractions: number = 0;
  private itemsProduced: number = 0;

  // For debug
  private totalDistanceTraveled: number = 0;
  private pathRequests: number = 0;
  private pathsFound: number = 0;
  private pathsFailed: number = 0;
  private homeVisits: number = 0;
  private scheduleChanges: number = 0;
  private activitiesCompleted: Map<string, number> = new Map();

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

  // Phase 8: Home building
  setHomeBuilding(building: Building | null): void {
    this.homeBuilding = building;
  }

  getHomeBuilding(): Building | null {
    return this.homeBuilding;
  }

  getHomeId(): string | undefined {
    return this.homeId;
  }

  goHome(): boolean {
    if (!this.homeBuilding) {
      console.warn(`[NPC] ${this.id} has no home building to go home`);
      return false;
    }

    const front = this.homeBuilding.getFrontOfDoorPosition();
    const door = this.homeBuilding.door;

    // Try to go to front of door first (more natural), fallback to door tile
    this.goingHome = true;
    this.state = NPCState.GOING_HOME;

    // Request path to front of door
    const success = this.requestPath({ x: front.tileX, y: front.tileY });
    if (!success) {
      // Fallback to door tile itself
      console.log(`[NPC] ${this.id} failed to path to front of home ${this.homeBuilding.id}, trying door tile`);
      return this.requestPath({ x: door.x, y: door.y });
    }

    console.log(`[NPC] ${this.id} going home to ${this.homeBuilding.id} at ${front.tileX},${front.tileY} (front of door)`);
    return success;
  }

  isAtHome(): boolean {
    if (!this.homeBuilding) return false;
    const front = this.homeBuilding.getFrontOfDoorPosition();
    const tilePos = this.getTilePosition();
    // Check if at front or at door
    return (tilePos.x === front.tileX && tilePos.y === front.tileY) ||
           (tilePos.x === this.homeBuilding.door.x && tilePos.y === this.homeBuilding.door.y);
  }

  enterHome(): void {
    if (!this.homeBuilding) return;
    this.state = NPCState.INSIDE;
    this.insideTimer = 0;
    this.homeBuilding.setOccupied(true, this.id);
    this.homeVisits++;
    console.log(`[NPC] ${this.id} entered home ${this.homeBuilding.id} (visits: ${this.homeVisits})`);
  }

  leaveHome(): void {
    if (this.homeBuilding) {
      this.homeBuilding.setOccupied(false, null);
    }
    this.state = NPCState.IDLE;
    this.idleTimer = 0;
    this.goingHome = false;
    console.log(`[NPC] ${this.id} left home ${this.homeBuilding?.id}`);
    this.switchToAlternativeTarget();
  }

  // Phase 9: Schedule
  setSchedule(schedule: Schedule | null): void {
    this.schedule = schedule;
    if (schedule) {
      console.log(`[NPC] ${this.id} schedule set with ${schedule.getEntryCount()} entries`);
    }
  }

  getSchedule(): Schedule | null {
    return this.schedule;
  }

  getCurrentScheduleEntry(): ScheduleEntry | null {
    return this.currentScheduleEntry;
  }

  getCurrentActivity(): ScheduleActivityType | null {
    return this.currentActivity;
  }

  setScheduleEnabled(enabled: boolean): void {
    this.scheduleEnabled = enabled;
    console.log(`[NPC] ${this.id} schedule ${enabled ? 'enabled' : 'disabled'}`);
  }

  isScheduleEnabled(): boolean {
    return this.scheduleEnabled;
  }

  setWorkBuilding(building: Building | null): void {
    this.workBuilding = building;
  }

  getWorkBuilding(): Building | null {
    return this.workBuilding;
  }

  setWorkLocation(x: number, y: number, tileSize: number = 32): void {
    this.workLocation = {
      x,
      y,
      tileX: Math.floor(x / tileSize),
      tileY: Math.floor(y / tileSize)
    };
  }

  getWorkLocation(): { x: number; y: number; tileX: number; tileY: number } | null {
    return this.workLocation;
  }

  // Phase 10: Life simulation
  setNeeds(needs: NPCNeeds | null): void {
    this.needs = needs;
  }

  getNeeds(): NPCNeeds | null {
    return this.needs;
  }

  setInventory(inventory: NPCInventory | null): void {
    this.inventory = inventory;
  }

  getInventory(): NPCInventory | null {
    return this.inventory;
  }

  setJob(job: Job | null): void {
    this.job = job;
  }

  getJob(): Job | null {
    return this.job;
  }

  getActivityTimer(): number {
    return this.activityTimer;
  }

  getLastEatTime(): number {
    return this.lastEatTime;
  }

  setLastEatTime(time: number): void {
    this.lastEatTime = time;
  }

  incrementSocialInteractions(): void {
    this.socialInteractions++;
  }

  getSocialInteractions(): number {
    return this.socialInteractions;
  }

  incrementItemsProduced(): void {
    this.itemsProduced++;
  }

  getItemsProduced(): number {
    return this.itemsProduced;
  }

  // Update schedule based on current time (minutes since midnight)
  updateSchedule(currentMinutes: number, buildingManager?: any): boolean {
    if (!this.scheduleEnabled || !this.schedule) return false;

    // Only check if time has changed significantly (every minute) or entry changed
    if (currentMinutes === this.lastScheduleMinutes && this.currentScheduleEntry !== null) {
      return false;
    }

    this.lastScheduleMinutes = currentMinutes;
    const newEntry = this.schedule.getCurrentEntry(currentMinutes);

    if (!newEntry) {
      // No entry for current time, keep current activity
      return false;
    }

    // Check if entry changed
    if (this.currentScheduleEntry && this.currentScheduleEntry.startMinutes === newEntry.startMinutes &&
        this.currentScheduleEntry.activity === newEntry.activity) {
      // Same entry, no change
      return false;
    }

    // Entry changed - handle new activity
    const oldEntry = this.currentScheduleEntry;
    this.currentScheduleEntry = newEntry;
    this.currentActivity = newEntry.activity;
    this.scheduleChanges++;

    console.log(`[NPC] ${this.id} schedule change: ${oldEntry?.activity ?? 'none'} -> ${newEntry.activity} at ${newEntry.formatTimeRange()} dest ${JSON.stringify(newEntry.destination)}`);

    // Handle activity
    this.handleScheduleActivityChange(newEntry, buildingManager);

    // Track activity
    const count = this.activitiesCompleted.get(newEntry.activity) ?? 0;
    this.activitiesCompleted.set(newEntry.activity, count + 1);

    return true;
  }

  private handleScheduleActivityChange(entry: ScheduleEntry, buildingManager?: any): void {
    this.activityTimer = 0;

    switch (entry.activity) {
      case ScheduleActivityType.SLEEP:
        // Go home and sleep inside
        if (this.homeBuilding) {
          this.goingHome = true;
          this.state = NPCState.GOING_HOME;
          // Will transition to SLEEPING when reaches home and enters
          this.goHome();
        } else {
          this.state = NPCState.SLEEPING;
        }
        break;

      case ScheduleActivityType.HOME:
        this.goHome();
        break;

      case ScheduleActivityType.INSIDE:
        if (this.homeBuilding) {
          if (this.isAtHome()) {
            this.enterHome();
          } else {
            this.goHome();
          }
        } else {
          this.state = NPCState.INSIDE;
        }
        break;

      case ScheduleActivityType.WORK:
      case ScheduleActivityType.SHOP:
      case ScheduleActivityType.FARM:
        // Go to work location
        this.goToScheduleDestination(entry, buildingManager);
        break;

      case ScheduleActivityType.EAT:
      case ScheduleActivityType.SOCIAL:
      case ScheduleActivityType.WANDER:
      case ScheduleActivityType.PLAY:
      case ScheduleActivityType.PATROL:
        this.goToScheduleDestination(entry, buildingManager);
        break;

      default:
        this.goToScheduleDestination(entry, buildingManager);
        break;
    }
  }

  private goToScheduleDestination(entry: ScheduleEntry, buildingManager?: any): boolean {
    const dest = entry.destination;
    const tileSize = WorldRenderer.TILE_SIZE;

    let targetTile: { x: number; y: number } | null = null;

    switch (dest.type) {
      case 'home':
        if (this.homeBuilding) {
          const front = this.homeBuilding.getFrontOfDoorPosition();
          targetTile = { x: front.tileX, y: front.tileY };
        } else if (dest.buildingId && buildingManager) {
          const building = buildingManager.getBuilding(dest.buildingId);
          if (building) {
            const front = building.getFrontOfDoorPosition();
            targetTile = { x: front.tileX, y: front.tileY };
          }
        }
        break;

      case 'building':
        if (dest.buildingId && buildingManager) {
          const building = buildingManager.getBuilding(dest.buildingId);
          if (building) {
            const front = building.getFrontOfDoorPosition();
            targetTile = { x: front.tileX, y: front.tileY };
          }
        }
        break;

      case 'tile':
        if (dest.tile) {
          targetTile = dest.tile;
        }
        break;

      case 'point':
        if (dest.point) {
          targetTile = {
            x: Math.floor(dest.point.x / tileSize),
            y: Math.floor(dest.point.y / tileSize)
          };
        }
        break;

      case 'square':
        // Village square at 25,20
        targetTile = { x: 25, y: 20 };
        break;

      case 'farm':
        // Farm area 15,31
        targetTile = { x: 15, y: 31 };
        break;

      default:
        targetTile = { x: 25, y: 20 };
        break;
    }

    if (!targetTile) {
      console.warn(`[NPC] ${this.id} could not resolve destination for ${entry.activity} ${JSON.stringify(dest)}`);
      return false;
    }

    // Map activity to state
    let newState = NPCState.WANDERING;
    switch (entry.activity) {
      case ScheduleActivityType.WORK:
        newState = NPCState.WORKING;
        break;
      case ScheduleActivityType.FARM:
        newState = NPCState.FARMING;
        break;
      case ScheduleActivityType.SHOP:
        newState = NPCState.SHOPPING;
        break;
      case ScheduleActivityType.EAT:
        newState = NPCState.EATING;
        break;
      case ScheduleActivityType.SOCIAL:
        newState = NPCState.SOCIALIZING;
        break;
      case ScheduleActivityType.PLAY:
        newState = NPCState.PLAYING;
        break;
      case ScheduleActivityType.WANDER:
      case ScheduleActivityType.PATROL:
        newState = NPCState.WANDERING;
        break;
      case ScheduleActivityType.HOME:
        newState = NPCState.GOING_HOME;
        this.goingHome = true;
        break;
      case ScheduleActivityType.SLEEP:
        newState = NPCState.GOING_HOME;
        this.goingHome = true;
        break;
      case ScheduleActivityType.INSIDE:
        newState = NPCState.INSIDE;
        break;
    }

    // Request path
    const success = this.requestPath(targetTile);
    if (success) {
      // Override state to scheduled state (follow path will handle)
      // Keep FOLLOWING_PATH but track activity
      console.log(`[NPC] ${this.id} scheduled ${entry.activity} -> path to ${targetTile.x},${targetTile.y} state ${newState}`);
    }

    return success;
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

  update(
    deltaTime: number,
    _worldMap: WorldMap | null,
    _collisionSystem: CollisionSystem | null,
    currentMinutes?: number,
    buildingManager?: any
  ): void {
    // Handle recalculation cooldown
    if (this.recalculationCooldown > 0) {
      this.recalculationCooldown -= deltaTime;
    }

    // Phase 9: Update schedule if time provided and enabled
    if (currentMinutes !== undefined && this.scheduleEnabled && this.schedule) {
      this.updateSchedule(currentMinutes, buildingManager);
    }

    // Phase 9: Handle SLEEPING state
    if (this.state === NPCState.SLEEPING) {
      this.activityTimer += deltaTime;
      // Sleeping is long, but if schedule changes, updateSchedule will handle
      // For now, just stay sleeping, check if should wake based on schedule
      // If not schedule-driven, wake after some time
      if (!this.scheduleEnabled) {
        if (this.activityTimer >= 10) {
          this.state = NPCState.IDLE;
          this.idleTimer = 0;
        }
      }
      return;
    }

    // Phase 9: Handle WORKING, FARMING, SHOPPING, etc. - stay at work location
    if (
      this.state === NPCState.WORKING ||
      this.state === NPCState.FARMING ||
      this.state === NPCState.SHOPPING ||
      this.state === NPCState.EATING ||
      this.state === NPCState.SOCIALIZING ||
      this.state === NPCState.PLAYING ||
      this.state === NPCState.WANDERING
    ) {
      this.activityTimer += deltaTime;

      // If schedule enabled, activity will be changed by schedule
      // If not schedule-enabled, wander or idle after some time
      if (!this.scheduleEnabled) {
        if (this.activityTimer >= 5) {
          this.state = NPCState.IDLE;
          this.idleTimer = 0;
        }
      }
      return;
    }

    // Phase 8: Handle AT_HOME state
    if (this.state === NPCState.AT_HOME) {
      this.atHomeTimer += deltaTime;
      this.activityTimer += deltaTime;
      if (this.atHomeTimer >= this.atHomeDuration) {
        // Enter inside
        this.enterHome();
      }
      return;
    }

    // Phase 8: Handle INSIDE state
    if (this.state === NPCState.INSIDE) {
      this.insideTimer += deltaTime;
      this.activityTimer += deltaTime;
      // If schedule says SLEEP, stay inside longer
      if (this.currentActivity === ScheduleActivityType.SLEEP) {
        // Stay inside until schedule changes
        return;
      }
      if (this.insideTimer >= this.insideDuration) {
        // Only leave if not scheduled to be inside/sleeping
        if (this.scheduleEnabled && this.currentScheduleEntry) {
          if (this.currentScheduleEntry.activity === ScheduleActivityType.SLEEP ||
              this.currentScheduleEntry.activity === ScheduleActivityType.INSIDE) {
            return; // Stay inside
          }
        }
        this.leaveHome();
      }
      return;
    }

    // Handle path failure waiting
    if (this.state === NPCState.WAITING) {
      this.pathFailedTimer += deltaTime;
      if (this.pathFailedTimer >= this.pathFailedWaitDuration) {
        if (this.recalculationAttempts < this.maxRecalculations) {
          this.recalculationAttempts++;
          console.log(`[NPC] ${this.id} retrying path after failure (attempt ${this.recalculationAttempts})`);
          if (this.destinationTile) {
            this.requestPath(this.destinationTile);
          }
        } else {
          console.log(`[NPC] ${this.id} max retries reached, switching to alternative behavior`);
          this.recalculationAttempts = 0;
          if (this.scheduleEnabled && this.currentScheduleEntry) {
            // Retry schedule destination
            this.goToScheduleDestination(this.currentScheduleEntry, buildingManager);
          } else {
            this.switchToAlternativeTarget();
          }
        }
      }
      return;
    }

    // Handle stuck state
    if (this.state === NPCState.STUCK) {
      this.stuckTime += deltaTime;
      if (this.stuckTime >= 1) {
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
        // If schedule enabled, let schedule drive behavior, don't random wander
        if (this.scheduleEnabled && this.currentScheduleEntry) {
          // Stay idle until schedule changes
          return;
        }
        // Phase 8: Occasionally go home (30% chance if has home)
        if (this.homeBuilding && Math.random() < 0.3) {
          this.goHome();
        } else {
          this.switchToAlternativeTarget();
        }
      }
      return;
    }

    // Phase 8+9: GOING_HOME is similar to FOLLOWING_PATH but with home logic
    if (this.state === NPCState.GOING_HOME || this.state === NPCState.FOLLOWING_PATH) {
      if (!this.path || this.path.isFailed()) {
        console.warn(`[NPC] ${this.id} following but no valid path`);
        this.state = NPCState.WAITING;
        this.pathFailedTimer = 0;
        return;
      }

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

      const distMoved = Math.sqrt((this.x - this.lastX) ** 2 + (this.y - this.lastY) ** 2);
      this.totalDistanceTraveled += distMoved;

      if (distMoved < this.progressThreshold * deltaTime) {
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
      // Reached end of path but no node - handle home logic
      if (this.goingHome && this.homeBuilding) {
        this.state = NPCState.AT_HOME;
        this.atHomeTimer = 0;
        console.log(`[NPC] ${this.id} arrived home ${this.homeBuilding.id}`);
      } else if (this.currentActivity) {
        // Schedule activity reached
        this.transitionToActivityState(this.currentActivity);
      } else {
        this.state = NPCState.IDLE;
        this.idleTimer = 0;
      }
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

        // Phase 8: Check if this was going home
        if (this.goingHome && this.homeBuilding) {
          this.state = NPCState.AT_HOME;
          this.atHomeTimer = 0;
          this.activityTimer = 0;
          console.log(`[NPC] ${this.id} reached home ${this.homeBuilding.id} at ${currentNode.x},${currentNode.y}`);
        } else if (this.currentActivity) {
          // Phase 9: Reached scheduled activity destination
          this.transitionToActivityState(this.currentActivity);
          console.log(`[NPC] ${this.id} reached scheduled ${this.currentActivity} at ${currentNode.x},${currentNode.y}`);
        } else {
          this.state = NPCState.IDLE;
          this.idleTimer = 0;
          this.goingHome = false;
          console.log(`[NPC] ${this.id} reached final destination ${currentNode.x},${currentNode.y}`);
        }

        this.path = null;
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

  private transitionToActivityState(activity: ScheduleActivityType): void {
    this.activityTimer = 0;
    this.goingHome = false;

    switch (activity) {
      case ScheduleActivityType.SLEEP:
        // If at home, enter and sleep
        if (this.homeBuilding && this.isAtHome()) {
          this.enterHome();
          this.state = NPCState.SLEEPING;
          if (this.homeBuilding) {
            this.homeBuilding.setOccupied(true, this.id);
          }
        } else {
          this.state = NPCState.SLEEPING;
        }
        break;
      case ScheduleActivityType.HOME:
        this.state = NPCState.AT_HOME;
        this.atHomeTimer = 0;
        break;
      case ScheduleActivityType.INSIDE:
        if (this.homeBuilding) {
          this.enterHome();
        } else {
          this.state = NPCState.INSIDE;
        }
        break;
      case ScheduleActivityType.WORK:
        this.state = NPCState.WORKING;
        break;
      case ScheduleActivityType.FARM:
        this.state = NPCState.FARMING;
        break;
      case ScheduleActivityType.SHOP:
        this.state = NPCState.SHOPPING;
        break;
      case ScheduleActivityType.EAT:
        this.state = NPCState.EATING;
        break;
      case ScheduleActivityType.SOCIAL:
        this.state = NPCState.SOCIALIZING;
        break;
      case ScheduleActivityType.PLAY:
        this.state = NPCState.PLAYING;
        break;
      case ScheduleActivityType.WANDER:
      case ScheduleActivityType.PATROL:
        this.state = NPCState.WANDERING;
        break;
      default:
        this.state = NPCState.IDLE;
        this.idleTimer = 0;
        break;
    }
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

  getStats(): {
    requests: number;
    found: number;
    failed: number;
    distance: number;
    recalculations: number;
    homeVisits: number;
    isAtHome: boolean;
    hasHome: boolean;
    scheduleChanges: number;
    currentActivity: string | null;
    hasSchedule: boolean;
    activitiesCompleted: Record<string, number>;
    socialInteractions: number;
    itemsProduced: number;
    hasNeeds: boolean;
    hasInventory: boolean;
    hasJob: boolean;
    overallWellbeing: number;
  } {
    const activities: Record<string, number> = {};
    for (const [key, value] of this.activitiesCompleted.entries()) {
      activities[key] = value;
    }

    const overallWellbeing = this.needs ? this.needs.getOverallWellbeing() : 0;

    return {
      requests: this.pathRequests,
      found: this.pathsFound,
      failed: this.pathsFailed,
      distance: this.totalDistanceTraveled,
      recalculations: this.recalculationAttempts,
      homeVisits: this.homeVisits,
      isAtHome: this.state === NPCState.AT_HOME || this.state === NPCState.INSIDE || this.state === NPCState.SLEEPING,
      hasHome: this.homeBuilding !== null,
      scheduleChanges: this.scheduleChanges,
      currentActivity: this.currentActivity,
      hasSchedule: this.schedule !== null,
      activitiesCompleted: activities,
      socialInteractions: this.socialInteractions,
      itemsProduced: this.itemsProduced,
      hasNeeds: this.needs !== null,
      hasInventory: this.inventory !== null,
      hasJob: this.job !== null,
      overallWellbeing: overallWellbeing
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
