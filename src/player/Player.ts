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

  // Phase 13 Save/Load & Persistence - forward compatible fields
  public health: number = 100;
  public maxHealth: number = 100;
  public stamina: number = 100;
  public maxStamina: number = 100;
  public money: number = 50;
  public level: number = 1;
  public xp: number = 0;
  public playTimeSeconds: number = 0;

  // Inventory placeholder (Phase 14)
  public inventoryItems: { id: string; quantity: number }[] = [];
  public inventoryCapacity: number = 20;

  // Relationships (Phase 19)
  public relationships: Record<string, number> = {};
  public relationshipStages: Record<string, string> = {};

  // Quest progress (Phase 17)
  public questProgress: Record<string, any> = {};
  public completedQuests: string[] = [];
  public activeQuests: string[] = [];

  // Flags (generic world flags, important flags)
  public flags: Record<string, boolean | string | number | null> = {};
  public importantFlags: Record<string, boolean | string | number | null> = {};

  // Stats
  public mapsDiscovered: Set<string> = new Set();
  public npcsMet: Set<string> = new Set();
  public totalInteractions: number = 0;

  // Future placeholders
  public farmingData: Record<string, any> = {};
  public craftingData: Record<string, any> = {};
  public equipmentData: Record<string, any> = {};
  public combatData: Record<string, any> = {};

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
    collisionSystem: CollisionSystem | null = null,
    isDialogueOpen: boolean = false
  ): void {
    // Don't move if dialogue is open (Phase 11)
    if (isDialogueOpen) {
      this.state = PlayerState.IDLE;
      this.isColliding = false;
      return;
    }

    let moveX = 0;
    let moveY = 0;

    if (input.isKeyDown('w') || input.isKeyDown('arrowup')) moveY -= 1;
    if (input.isKeyDown('s') || input.isKeyDown('arrowdown')) moveY += 1;
    if (input.isKeyDown('a') || input.isKeyDown('arrowleft')) moveX -= 1;
    if (input.isKeyDown('d') || input.isKeyDown('arrowright')) moveX += 1;

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

  // Phase 13 Save/Load
  getSaveData(mapId: string): any {
    return {
      x: this.x,
      y: this.y,
      mapId,
      direction: this.direction,
      state: this.state,
      health: this.health,
      maxHealth: this.maxHealth,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      money: this.money,
      inventory: {
        items: this.inventoryItems,
        capacity: this.inventoryCapacity,
        coins: this.money,
        version: 1,
        equipment: {},
        quickSlots: [null, null, null, null]
      },
      progression: {
        level: this.level,
        xp: this.xp,
        skillPoints: 0,
        unlockedSkills: [],
        attributes: { strength: 10, agility: 10, intelligence: 10 },
        titles: [],
        reputation: {}
      },
      stats: {
        totalDistance: this.totalDistanceTraveled,
        playTimeSeconds: this.playTimeSeconds,
        mapsDiscovered: this.mapsDiscovered.size,
        npcsMet: Array.from(this.npcsMet),
        interactions: this.totalInteractions
      },
      questProgress: this.questProgress,
      completedQuests: this.completedQuests,
      activeQuests: this.activeQuests,
      relationships: this.relationships,
      relationshipStages: this.relationshipStages,
      flags: this.flags,
      importantFlags: this.importantFlags,
      farming: this.farmingData,
      crafting: this.craftingData,
      equipment: this.equipmentData,
      combat: this.combatData
    };
  }

  loadSaveData(data: any): void {
    if (!data) return;
    try {
      this.x = typeof data.x === 'number' ? data.x : this.x;
      this.y = typeof data.y === 'number' ? data.y : this.y;
      this.direction = data.direction ?? this.direction;
      this.state = data.state ?? this.state;
      this.health = typeof data.health === 'number' ? data.health : 100;
      this.maxHealth = typeof data.maxHealth === 'number' ? data.maxHealth : 100;
      this.stamina = typeof data.stamina === 'number' ? data.stamina : 100;
      this.maxStamina = typeof data.maxStamina === 'number' ? data.maxStamina : 100;
      this.money = typeof data.money === 'number' ? data.money : 50;
      this.level = typeof data.level === 'number' ? data.level : (data.progression?.level ?? 1);
      this.xp = typeof data.xp === 'number' ? data.xp : (data.progression?.xp ?? 0);

      // Inventory
      if (data.inventory) {
        this.inventoryItems = Array.isArray(data.inventory.items) ? data.inventory.items : [];
        this.inventoryCapacity = typeof data.inventory.capacity === 'number' ? data.inventory.capacity : 20;
        this.money = typeof data.inventory.coins === 'number' ? data.inventory.coins : this.money;
      } else if (Array.isArray(data.inventoryItems)) {
        this.inventoryItems = data.inventoryItems;
      }

      // Stats
      if (data.stats) {
        this.totalDistanceTraveled = typeof data.stats.totalDistance === 'number' ? data.stats.totalDistance : this.totalDistanceTraveled;
        this.playTimeSeconds = typeof data.stats.playTimeSeconds === 'number' ? data.stats.playTimeSeconds : 0;
        this.totalInteractions = typeof data.stats.interactions === 'number' ? data.stats.interactions : 0;
        if (Array.isArray(data.stats.npcsMet)) {
          this.npcsMet = new Set(data.stats.npcsMet);
        }
        // mapsDiscovered handled via flags
      }

      // Progression
      if (data.progression) {
        this.level = typeof data.progression.level === 'number' ? data.progression.level : this.level;
        this.xp = typeof data.progression.xp === 'number' ? data.progression.xp : this.xp;
      }

      this.questProgress = data.questProgress ?? {};
      this.completedQuests = Array.isArray(data.completedQuests) ? data.completedQuests : [];
      this.activeQuests = Array.isArray(data.activeQuests) ? data.activeQuests : [];
      this.relationships = data.relationships ?? {};
      this.relationshipStages = data.relationshipStages ?? {};
      this.flags = data.flags ?? {};
      this.importantFlags = data.importantFlags ?? {};

      this.farmingData = data.farming ?? {};
      this.craftingData = data.crafting ?? {};
      this.equipmentData = data.equipment ?? {};
      this.combatData = data.combat ?? {};

      // Rebuild sets
      if (data.stats?.mapsDiscovered && typeof data.stats.mapsDiscovered === 'number') {
        // Keep existing set, mapsDiscovered count is informational
      }
      if (data.mapId) {
        this.mapsDiscovered.add(data.mapId);
      }

      console.log(`[Player] Loaded save data: pos ${this.x.toFixed(0)},${this.y.toFixed(0)} map ${data.mapId} health ${this.health} money ${this.money}`);
    } catch (e) {
      console.error('[Player] Failed to load save data:', e);
    }
  }

  updatePlayTime(deltaTime: number): void {
    this.playTimeSeconds += deltaTime;
  }

  // For Phase 14 inventory placeholder
  addItem(itemId: string, quantity: number = 1): boolean {
    const existing = this.inventoryItems.find(i => i.id === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      if (this.inventoryItems.length >= this.inventoryCapacity) return false;
      this.inventoryItems.push({ id: itemId, quantity });
    }
    return true;
  }

  hasItem(itemId: string, quantity: number = 1): boolean {
    const item = this.inventoryItems.find(i => i.id === itemId);
    return item ? item.quantity >= quantity : false;
  }

  getItemQuantity(itemId: string): number {
    const item = this.inventoryItems.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  }

  removeItem(itemId: string, quantity: number = 1): boolean {
    const idx = this.inventoryItems.findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    if (this.inventoryItems[idx].quantity < quantity) return false;
    this.inventoryItems[idx].quantity -= quantity;
    if (this.inventoryItems[idx].quantity <= 0) {
      this.inventoryItems.splice(idx, 1);
    }
    return true;
  }
}
