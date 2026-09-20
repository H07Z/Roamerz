/**
 * AnimalInstance - Phase 16.1 Animals / Livestock System
 * Single animal logic: feed, pet, produce, wander, hunger/happiness
 */

import { AnimalDatabase } from './AnimalDatabase';
import {
  AnimalData,
  AnimalDefinition,
  AnimalState,
  createEmptyAnimalData,
  getAnimalStateFromNeeds
} from './Animal';

export class AnimalInstance {
  private data: AnimalData;
  private database: AnimalDatabase;

  constructor(
    id: string,
    type: string,
    x: number,
    y: number,
    mapId: string,
    totalSeconds: number,
    database?: AnimalDatabase,
    pixelX?: number,
    pixelY?: number
  ) {
    this.database = database ?? AnimalDatabase.getInstance();
    this.data = createEmptyAnimalData(id, type, x, y, mapId, totalSeconds, pixelX, pixelY);
  }

  static fromSaveData(saveData: AnimalData, database?: AnimalDatabase): AnimalInstance {
    const inst = new AnimalInstance(
      saveData.id,
      saveData.type,
      saveData.x,
      saveData.y,
      saveData.mapId,
      saveData.lastUpdateAt,
      database,
      saveData.pixelX,
      saveData.pixelY
    );
    inst.data = { ...saveData };
    return inst;
  }

  getData(): AnimalData {
    return { ...this.data };
  }

  getId(): string { return this.data.id; }
  getType(): string { return this.data.type; }
  getX(): number { return this.data.x; }
  getY(): number { return this.data.y; }
  getPixelX(): number { return this.data.pixelX; }
  getPixelY(): number { return this.data.pixelY; }
  getMapId(): string { return this.data.mapId; }
  getState(): AnimalState { return this.data.state; }
  getHunger(): number { return this.data.hunger; }
  getHappiness(): number { return this.data.happiness; }
  getHealth(): number { return this.data.health; }
  isProduceReady(): boolean { return this.data.produceReady; }
  getHomeX(): number { return this.data.homeX; }
  getHomeY(): number { return this.data.homeY; }

  getDefinition(): AnimalDefinition | undefined {
    return this.database.getAnimal(this.data.type);
  }

  isHungry(): boolean { return this.data.hunger < 30; }
  isHappy(): boolean { return this.data.happiness > 70; }

  // Feed animal with feedItemId
  feed(feedItemId: string, totalSeconds: number): boolean {
    const def = this.getDefinition();
    if (!def) return false;
    if (!def.feedItems.includes(feedItemId)) {
      console.warn(`[Animal] ${this.data.type} cannot eat ${feedItemId}, allowed: ${def.feedItems.join(',')}`);
      return false;
    }
    this.data.hunger = Math.min(def.maxHunger, this.data.hunger + def.feedValue);
    this.data.happiness = Math.min(def.maxHappiness, this.data.happiness + def.happinessOnFeed);
    this.data.lastFedAt = totalSeconds;
    this.data.feedCount++;
    this.data.state = AnimalState.EATING;
    console.log(`[Animal] Fed ${this.data.type} ${this.data.id} with ${feedItemId} hunger ${this.data.hunger.toFixed(0)}% happy ${this.data.happiness.toFixed(0)}%`);
    return true;
  }

  // Pet animal
  pet(totalSeconds: number): boolean {
    const def = this.getDefinition();
    if (!def) return false;
    this.data.happiness = Math.min(def.maxHappiness, this.data.happiness + def.happinessOnPet);
    this.data.petCount++;
    this.data.state = AnimalState.HAPPY;
    console.log(`[Animal] Petted ${this.data.type} ${this.data.id} happy ${this.data.happiness.toFixed(0)}%`);
    return true;
  }

  // Collect produce
  collectProduce(totalSeconds: number): { success: boolean; itemId: string | null; quantity: number } {
    if (!this.data.produceReady) {
      return { success: false, itemId: null, quantity: 0 };
    }
    const def = this.getDefinition();
    if (!def) return { success: false, itemId: null, quantity: 0 };

    // Chance check
    if (Math.random() > def.produceChance) {
      // Failed chance, but still reset timer to try again later
      this.data.produceReady = false;
      this.data.lastProduceAt = totalSeconds;
      console.log(`[Animal] ${this.data.type} ${this.data.id} produce chance failed`);
      return { success: false, itemId: null, quantity: 0 };
    }

    const quantity = Math.floor(Math.random() * (def.produceMax - def.produceMin + 1)) + def.produceMin;
    this.data.produceReady = false;
    this.data.lastProduceAt = totalSeconds;
    this.data.produceCount++;
    this.data.state = AnimalState.IDLE;
    console.log(`[Animal] Collected ${quantity}x ${def.produceItemId} from ${this.data.type} ${this.data.id}`);
    return { success: true, itemId: def.produceItemId, quantity };
  }

  // Update animal - called every frame with totalSeconds
  update(totalSeconds: number, deltaTime: number = 0, isWalkable?: (x: number, y: number) => boolean): boolean {
    const def = this.getDefinition();
    if (!def) return false;

    const dt = totalSeconds - this.data.lastUpdateAt;
    if (dt <= 0 && deltaTime === 0) return false;

    const daysPassed = dt / (24 * 60 * 60);
    let stateChanged = false;

    // Decay hunger
    const hungerLoss = def.hungerDecayPerDay * daysPassed;
    const oldHunger = this.data.hunger;
    this.data.hunger = Math.max(0, this.data.hunger - hungerLoss);
    if (this.data.hunger < 10) {
      this.data.health = Math.max(0, this.data.health - daysPassed * 20);
      if (this.data.health < 20) this.data.state = AnimalState.SICK;
    }

    // Decay happiness if hungry or over time
    let happinessLoss = def.happinessDecayPerDay * daysPassed;
    if (this.data.hunger < 30) happinessLoss += 20 * daysPassed;
    const oldHappiness = this.data.happiness;
    this.data.happiness = Math.max(0, this.data.happiness - happinessLoss);

    // Age
    this.data.ageDays += daysPassed;

    // Check produce
    if (!this.data.produceReady) {
      const timeSinceProduce = totalSeconds - this.data.lastProduceAt;
      if (
        timeSinceProduce >= def.produceIntervalSeconds &&
        this.data.hunger >= def.minHungerForProduce &&
        this.data.happiness >= def.minHappinessForProduce &&
        this.data.health > 20
      ) {
        this.data.produceReady = true;
        this.data.state = AnimalState.PRODUCING;
        stateChanged = true;
        console.log(`[Animal] ${this.data.type} ${this.data.id} produce ready ${def.produceItemId}`);
      }
    }

    // Wander logic - simple random movement
    if (this.data.state !== AnimalState.EATING && this.data.state !== AnimalState.SICK) {
      const timeSinceWander = totalSeconds - this.data.lastWanderAt;
      if (timeSinceWander >= def.wanderIntervalSeconds) {
        // 50% chance to wander
        if (Math.random() < 0.5) {
          // Pick random target within wander radius from home
          const rx = Math.floor((Math.random() * 2 - 1) * def.wanderRadius);
          const ry = Math.floor((Math.random() * 2 - 1) * def.wanderRadius);
          const tx = this.data.homeX + rx;
          const ty = this.data.homeY + ry;
          if (!isWalkable || isWalkable(tx, ty)) {
            this.data.targetX = tx;
            this.data.targetY = ty;
            this.data.isMoving = true;
            this.data.state = AnimalState.WANDERING;
            this.data.lastWanderAt = totalSeconds;
            stateChanged = true;
          }
        } else {
          this.data.lastWanderAt = totalSeconds;
        }
      }

      // Move towards target if has one
      if (this.data.targetX !== null && this.data.targetY !== null && this.data.isMoving) {
        const targetPixelX = this.data.targetX * 32 + 16;
        const targetPixelY = this.data.targetY * 32 + 16;
        const dx = targetPixelX - this.data.pixelX;
        const dy = targetPixelY - this.data.pixelY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5) {
          // Reached target
          this.data.x = this.data.targetX;
          this.data.y = this.data.targetY;
          this.data.pixelX = targetPixelX;
          this.data.pixelY = targetPixelY;
          this.data.targetX = null;
          this.data.targetY = null;
          this.data.isMoving = false;
          this.data.state = AnimalState.IDLE;
          stateChanged = true;
        } else {
          const moveDist = def.speed * deltaTime;
          if (moveDist > 0) {
            const nx = this.data.pixelX + (dx / dist) * moveDist;
            const ny = this.data.pixelY + (dy / dist) * moveDist;
            this.data.pixelX = nx;
            this.data.pixelY = ny;
            // Update tile pos from pixel
            this.data.x = Math.floor(nx / 32);
            this.data.y = Math.floor(ny / 32);
          }
        }
      }
    }

    // Update state from needs if not producing/eating
    if (this.data.state !== AnimalState.PRODUCING && this.data.state !== AnimalState.EATING && this.data.state !== AnimalState.SICK) {
      const newState = getAnimalStateFromNeeds(this.data.hunger, this.data.happiness, this.data.produceReady, this.data.isMoving);
      if (newState !== this.data.state) {
        this.data.state = newState;
        stateChanged = true;
      }
    }

    this.data.lastUpdateAt = totalSeconds;
    return stateChanged || Math.abs(oldHunger - this.data.hunger) > 0.5 || Math.abs(oldHappiness - this.data.happiness) > 0.5;
  }

  getSaveData(): AnimalData {
    return { ...this.data };
  }

  getDebugString(): string {
    const def = this.getDefinition();
    const icon = def?.icon ?? '🐾';
    return `${icon} ${this.data.id} ${this.data.type} ${this.data.state} at ${this.data.x},${this.data.y} ${this.data.mapId} H:${this.data.hunger.toFixed(0)}% Happy:${this.data.happiness.toFixed(0)}% HP:${this.data.health.toFixed(0)}% ${this.data.produceReady ? '🥚 READY' : ''} fed ${this.data.feedCount}x petted ${this.data.petCount}x produced ${this.data.produceCount}x`;
  }

  getDetailedString(): string {
    const def = this.getDefinition();
    const icon = def?.icon ?? '🐾';
    return `${icon} ${def?.name ?? this.data.type} ${this.data.x},${this.data.y} ${this.data.mapId} ${this.data.state} hunger ${this.data.hunger.toFixed(0)}% happy ${this.data.happiness.toFixed(0)}% health ${this.data.health.toFixed(0)}% age ${this.data.ageDays.toFixed(1)}d ${this.data.produceReady ? `READY ${def?.produceItemId}` : `next ${(def ? def.produceIntervalSeconds - (this.data.lastUpdateAt - this.data.lastProduceAt) : 0) / 3600}h`} moves ${this.data.isMoving ? `to ${this.data.targetX},${this.data.targetY}` : 'idle'}`;
  }
}
