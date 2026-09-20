/**
 * AnimalSystem - Phase 16.1 Animals / Livestock System
 * Manages all animals, feeding, petting, produce, wandering
 */

import { AnimalInstance } from './AnimalInstance';
import { AnimalDatabase } from './AnimalDatabase';
import { AnimalData, AnimalSaveData, AnimalState } from './Animal';
import { WorldMap } from '../world/WorldMap';
import { NavigationGrid } from '../pathfinding/NavigationGrid';

export class AnimalSystem {
  private animals: Map<string, AnimalInstance> = new Map();
  private database: AnimalDatabase;
  private totalCreated: number = 0;
  private totalCollected: number = 0;
  private totalFed: number = 0;
  private totalPetted: number = 0;
  private version: number = 2;

  constructor(database?: AnimalDatabase) {
    this.database = database ?? AnimalDatabase.getInstance();
  }

  initialize(maps: { mapId: string; width: number; height: number }[]): void {
    console.log(`[AnimalSystem] Initialized for ${maps.length} maps, ${this.database.getCount()} animal types: ${this.database.getDebugString()}`);
  }

  // Create animal at tile position
  createAnimal(
    x: number,
    y: number,
    mapId: string,
    animalType: string,
    totalSeconds: number,
    worldMap?: WorldMap | null,
    navigationGrid?: NavigationGrid | null
  ): AnimalInstance | null {
    if (!this.database.hasAnimal(animalType)) {
      console.warn(`[AnimalSystem] Unknown animal type ${animalType}`);
      return null;
    }

    if (worldMap) {
      if (x < 0 || y < 0 || x >= worldMap.width || y >= worldMap.height) {
        console.warn(`[AnimalSystem] createAnimal out of bounds ${x},${y} ${mapId}`);
        return null;
      }
    }

    if (navigationGrid) {
      if (!navigationGrid.isWalkable(x, y)) {
        console.warn(`[AnimalSystem] createAnimal not walkable ${x},${y} ${mapId}`);
        // Allow anyway for now, but warn
      }
    }

    const id = `animal_${x}_${y}_${mapId}_${this.totalCreated}_${animalType}`;
    if (this.animals.has(id)) {
      return this.animals.get(id) ?? null;
    }

    const animal = new AnimalInstance(id, animalType, x, y, mapId, totalSeconds, this.database);
    this.animals.set(id, animal);
    this.totalCreated++;
    console.log(`[AnimalSystem] Created ${animalType} ${id} at ${x},${y} ${mapId} total ${this.totalCreated}`);
    return animal;
  }

  // Quick create without checks (for testing)
  createAnimalSimple(x: number, y: number, mapId: string, animalType: string, totalSeconds: number): AnimalInstance | null {
    return this.createAnimal(x, y, mapId, animalType, totalSeconds);
  }

  getAnimal(id: string): AnimalInstance | null {
    return this.animals.get(id) ?? null;
  }

  getAnimalAt(x: number, y: number, mapId: string): AnimalInstance | null {
    for (const animal of this.animals.values()) {
      if (animal.getMapId() === mapId && animal.getX() === x && animal.getY() === y) {
        return animal;
      }
    }
    return null;
  }

  hasAnimal(id: string): boolean {
    return this.animals.has(id);
  }

  getAnimalsForMap(mapId: string): AnimalInstance[] {
    const result: AnimalInstance[] = [];
    for (const animal of this.animals.values()) {
      if (animal.getMapId() === mapId) result.push(animal);
    }
    return result;
  }

  getAllAnimals(): AnimalInstance[] {
    return Array.from(this.animals.values());
  }

  getAnimalCount(mapId?: string): number {
    if (mapId) return this.getAnimalsForMap(mapId).length;
    return this.animals.size;
  }

  getNearbyAnimals(tileX: number, tileY: number, mapId: string, radius: number = 2): AnimalInstance[] {
    const result: AnimalInstance[] = [];
    for (const animal of this.animals.values()) {
      if (animal.getMapId() !== mapId) continue;
      const dx = animal.getX() - tileX;
      const dy = animal.getY() - tileY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radius * radius) result.push(animal);
    }
    return result;
  }

  // Feed animal
  feedAnimal(id: string, feedItemId: string, totalSeconds: number): boolean {
    const animal = this.animals.get(id);
    if (!animal) return false;
    const success = animal.feed(feedItemId, totalSeconds);
    if (success) this.totalFed++;
    return success;
  }

  feedAnimalAt(x: number, y: number, mapId: string, feedItemId: string, totalSeconds: number): boolean {
    const animal = this.getAnimalAt(x, y, mapId) ?? this.getNearbyAnimals(x, y, mapId, 2)[0];
    if (!animal) return false;
    return this.feedAnimal(animal.getId(), feedItemId, totalSeconds);
  }

  // Pet animal
  petAnimal(id: string, totalSeconds: number): boolean {
    const animal = this.animals.get(id);
    if (!animal) return false;
    const success = animal.pet(totalSeconds);
    if (success) this.totalPetted++;
    return success;
  }

  petAnimalAt(x: number, y: number, mapId: string, totalSeconds: number): boolean {
    const animal = this.getAnimalAt(x, y, mapId) ?? this.getNearbyAnimals(x, y, mapId, 2)[0];
    if (!animal) return false;
    return this.petAnimal(animal.getId(), totalSeconds);
  }

  // Collect produce
  collectProduce(id: string, totalSeconds: number): { success: boolean; itemId: string | null; quantity: number } {
    const animal = this.animals.get(id);
    if (!animal) return { success: false, itemId: null, quantity: 0 };
    const result = animal.collectProduce(totalSeconds);
    if (result.success) this.totalCollected++;
    return result;
  }

  collectProduceAt(x: number, y: number, mapId: string, totalSeconds: number): { success: boolean; itemId: string | null; quantity: number; animalId?: string } {
    const nearby = this.getNearbyAnimals(x, y, mapId, 2);
    // Prefer produce ready
    for (const animal of nearby) {
      if (animal.isProduceReady()) {
        const res = this.collectProduce(animal.getId(), totalSeconds);
        return { ...res, animalId: animal.getId() };
      }
    }
    // Otherwise first nearby
    if (nearby.length > 0) {
      const res = this.collectProduce(nearby[0].getId(), totalSeconds);
      return { ...res, animalId: nearby[0].getId() };
    }
    return { success: false, itemId: null, quantity: 0 };
  }

  // Update all animals
  update(totalSeconds: number, deltaTime: number = 0, navigationGrid?: NavigationGrid | null): void {
    const isWalkable = navigationGrid ? (x: number, y: number) => navigationGrid.isWalkable(x, y) : undefined;
    for (const animal of this.animals.values()) {
      animal.update(totalSeconds, deltaTime, isWalkable);
    }
  }

  // Save/Load
  getSaveData(): AnimalSaveData {
    const animals: Record<string, AnimalData> = {};
    for (const [id, animal] of this.animals.entries()) {
      animals[id] = animal.getSaveData();
    }
    return {
      animals,
      totalCreated: this.totalCreated,
      totalCollected: this.totalCollected,
      totalFed: this.totalFed,
      totalPetted: this.totalPetted,
      version: this.version
    };
  }

  loadSaveData(data: AnimalSaveData | any): void {
    if (!data) return;
    try {
      this.animals.clear();
      const animalsData = data.animals ?? {};
      for (const animalId of Object.keys(animalsData)) {
        const save = animalsData[animalId];
        if (!save) continue;
        const animal = AnimalInstance.fromSaveData(save, this.database);
        this.animals.set(animalId, animal);
      }
      this.totalCreated = typeof data.totalCreated === 'number' ? data.totalCreated : this.animals.size;
      this.totalCollected = typeof data.totalCollected === 'number' ? data.totalCollected : 0;
      this.totalFed = typeof data.totalFed === 'number' ? data.totalFed : 0;
      this.totalPetted = typeof data.totalPetted === 'number' ? data.totalPetted : 0;
      this.version = typeof data.version === 'number' ? data.version : 2;
      console.log(`[AnimalSystem] Loaded ${this.animals.size} animals, created ${this.totalCreated}, collected ${this.totalCollected}, fed ${this.totalFed}, petted ${this.totalPetted}`);
    } catch (e) {
      console.error('[AnimalSystem] Failed to load save data:', e);
    }
  }

  clear(): void {
    this.animals.clear();
    this.totalCreated = 0;
    this.totalCollected = 0;
    this.totalFed = 0;
    this.totalPetted = 0;
    console.log('[AnimalSystem] Cleared all animals');
  }

  clearMap(mapId: string): void {
    for (const [id, animal] of this.animals.entries()) {
      if (animal.getMapId() === mapId) {
        this.animals.delete(id);
      }
    }
    console.log(`[AnimalSystem] Cleared animals for map ${mapId}`);
  }

  // Debug
  getDebugString(): string {
    const ready = Array.from(this.animals.values()).filter(a => a.isProduceReady()).length;
    const hungry = Array.from(this.animals.values()).filter(a => a.isHungry()).length;
    const happy = Array.from(this.animals.values()).filter(a => a.isHappy()).length;
    return `${this.animals.size} animals (Ready:${ready} Hungry:${hungry} Happy:${happy}) created ${this.totalCreated} collected ${this.totalCollected} fed ${this.totalFed} petted ${this.totalPetted}`;
  }

  getMapDebugString(mapId: string): string {
    const animals = this.getAnimalsForMap(mapId);
    const ready = animals.filter(a => a.isProduceReady()).length;
    return `${mapId}: ${animals.length} animals Ready:${ready}`;
  }

  debugPrint(): void {
    console.log(`[AnimalSystem] ${this.getDebugString()}`);
    for (const animal of this.animals.values()) {
      console.log(`  ${animal.getDebugString()}`);
    }
  }

  // For testing
  fillWithTestAnimals(mapId: string, totalSeconds: number, count: number = 4): void {
    const types = ['chicken', 'cow', 'sheep', 'pig'];
    const baseX = 12;
    const baseY = 32;
    for (let i = 0; i < count; i++) {
      const x = baseX + (i % 4);
      const y = baseY + Math.floor(i / 4);
      const type = types[i % types.length];
      this.createAnimal(x, y, mapId, type, totalSeconds);
    }
  }
}
