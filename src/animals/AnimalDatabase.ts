/**
 * AnimalDatabase - Phase 16.1 Animals / Livestock System
 * Data-driven animal definitions
 */

import { AnimalDefinition, AnimalType } from './Animal';

export class AnimalDatabase {
  private static instance: AnimalDatabase | null = null;
  private animals: Map<string, AnimalDefinition> = new Map();

  constructor() {
    this.initialize();
  }

  static getInstance(): AnimalDatabase {
    if (!AnimalDatabase.instance) {
      AnimalDatabase.instance = new AnimalDatabase();
    }
    return AnimalDatabase.instance;
  }

  static resetInstance(): void {
    AnimalDatabase.instance = null;
  }

  private initialize(): void {
    this.animals.clear();

    const defaultAnimals: AnimalDefinition[] = [
      {
        id: 'chicken',
        type: AnimalType.CHICKEN,
        name: 'Chicken',
        icon: '🐔',
        color: '#ffeb3b',
        description: 'Chicken lays eggs every 0.5 days. Loves seeds and grain.',
        produceItemId: 'egg',
        produceIntervalSeconds: 0.5 * 24 * 60 * 60, // 0.5 days
        produceMin: 1,
        produceMax: 2,
        produceChance: 0.9,
        feedItems: ['wheat_seed', 'carrot_seed', 'wheat', 'animal_feed', 'hay'],
        feedValue: 30,
        happinessOnFeed: 10,
        happinessOnPet: 5,
        hungerDecayPerDay: 30,
        happinessDecayPerDay: 10,
        minHungerForProduce: 30,
        minHappinessForProduce: 20,
        wanderRadius: 3,
        wanderIntervalSeconds: 10,
        speed: 20,
        maxHunger: 100,
        maxHappiness: 100,
        maxHealth: 100,
        tags: ['poultry', 'egg', 'farm', 'small']
      },
      {
        id: 'cow',
        type: AnimalType.COW,
        name: 'Cow',
        icon: '🐄',
        color: '#8d6e63',
        description: 'Cow produces milk every 1 day. Needs hay and loves being petted.',
        produceItemId: 'milk',
        produceIntervalSeconds: 1 * 24 * 60 * 60, // 1 day
        produceMin: 1,
        produceMax: 2,
        produceChance: 0.8,
        feedItems: ['hay', 'wheat', 'animal_feed', 'carrot'],
        feedValue: 40,
        happinessOnFeed: 15,
        happinessOnPet: 10,
        hungerDecayPerDay: 25,
        happinessDecayPerDay: 8,
        minHungerForProduce: 40,
        minHappinessForProduce: 30,
        wanderRadius: 4,
        wanderIntervalSeconds: 15,
        speed: 15,
        maxHunger: 100,
        maxHappiness: 100,
        maxHealth: 100,
        tags: ['cattle', 'milk', 'farm', 'large']
      },
      {
        id: 'sheep',
        type: AnimalType.SHEEP,
        name: 'Sheep',
        icon: '🐑',
        color: '#e0e0e0',
        description: 'Sheep produces wool every 1.5 days. Loves hay and grass.',
        produceItemId: 'wool',
        produceIntervalSeconds: 1.5 * 24 * 60 * 60, // 1.5 days
        produceMin: 1,
        produceMax: 3,
        produceChance: 0.85,
        feedItems: ['hay', 'wheat', 'animal_feed', 'carrot', 'berry'],
        feedValue: 35,
        happinessOnFeed: 12,
        happinessOnPet: 8,
        hungerDecayPerDay: 20,
        happinessDecayPerDay: 7,
        minHungerForProduce: 35,
        minHappinessForProduce: 25,
        wanderRadius: 3,
        wanderIntervalSeconds: 12,
        speed: 18,
        maxHunger: 100,
        maxHappiness: 100,
        maxHealth: 100,
        tags: ['wool', 'farm', 'medium']
      },
      {
        id: 'pig',
        type: AnimalType.PIG,
        name: 'Pig',
        icon: '🐖',
        color: '#f48fb1',
        description: 'Pig is happy and finds truffles sometimes. Loves everything!',
        produceItemId: 'truffle',
        produceIntervalSeconds: 2 * 24 * 60 * 60, // 2 days
        produceMin: 1,
        produceMax: 1,
        produceChance: 0.5,
        feedItems: ['wheat', 'carrot', 'berry', 'apple', 'animal_feed', 'hay', 'mushroom'],
        feedValue: 45,
        happinessOnFeed: 20,
        happinessOnPet: 12,
        hungerDecayPerDay: 35,
        happinessDecayPerDay: 12,
        minHungerForProduce: 50,
        minHappinessForProduce: 40,
        wanderRadius: 5,
        wanderIntervalSeconds: 8,
        speed: 22,
        maxHunger: 100,
        maxHappiness: 100,
        maxHealth: 100,
        tags: ['pig', 'truffle', 'farm', 'medium']
      }
    ];

    for (const animal of defaultAnimals) {
      this.animals.set(animal.id, animal);
    }

    console.log(`[AnimalDatabase] Loaded ${this.animals.size} animals`);
  }

  getAnimal(id: string): AnimalDefinition | undefined {
    return this.animals.get(id);
  }

  getAllAnimals(): AnimalDefinition[] {
    return Array.from(this.animals.values());
  }

  getCount(): number {
    return this.animals.size;
  }

  hasAnimal(id: string): boolean {
    return this.animals.has(id);
  }

  registerAnimal(definition: AnimalDefinition): boolean {
    if (this.animals.has(definition.id)) {
      console.warn(`[AnimalDatabase] Animal ${definition.id} already exists, overwriting`);
    }
    this.animals.set(definition.id, definition);
    return true;
  }

  unregisterAnimal(id: string): boolean {
    return this.animals.delete(id);
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const animal of this.animals.values()) {
      if (!animal.id) errors.push(`Animal missing id`);
      if (!animal.produceItemId) errors.push(`Animal ${animal.id} missing produceItemId`);
      if (animal.produceIntervalSeconds <= 0) errors.push(`Animal ${animal.id} invalid produceInterval`);
      if (animal.feedItems.length === 0) errors.push(`Animal ${animal.id} no feedItems`);
      if (animal.produceMin > animal.produceMax) errors.push(`Animal ${animal.id} produceMin > produceMax`);
    }
    return { valid: errors.length === 0, errors };
  }

  getDebugString(): string {
    return `${this.animals.size} animals: ${Array.from(this.animals.keys()).join(', ')}`;
  }
}
