/**
 * CropDatabase - Phase 15 Farming System
 * Data-driven crop definitions, similar to ItemDatabase
 */

import { CropDefinition, GrowthStage } from './Crop';

export class CropDatabase {
  private static instance: CropDatabase | null = null;
  private crops: Map<string, CropDefinition> = new Map();

  constructor() {
    this.initialize();
  }

  static getInstance(): CropDatabase {
    if (!CropDatabase.instance) {
      CropDatabase.instance = new CropDatabase();
    }
    return CropDatabase.instance;
  }

  static resetInstance(): void {
    CropDatabase.instance = null;
  }

  private initialize(): void {
    // Clear existing
    this.crops.clear();

    // Register default crops - data-driven, easy to extend
    const defaultCrops: CropDefinition[] = [
      {
        id: 'wheat',
        name: 'Wheat',
        seedItemId: 'wheat_seed',
        harvestItemId: 'wheat', // will be added to ItemDatabase in Phase15
        bonusSeedItemId: 'wheat_seed',
        growthTimeSeconds: 2 * 24 * 60 * 60, // 2 in-game days = 2*86400
        stages: [GrowthStage.PLANTED, GrowthStage.SPROUT, GrowthStage.GROWING, GrowthStage.MATURE, GrowthStage.READY],
        stageThresholds: [0, 0.25, 0.5, 0.75, 1.0],
        yieldMin: 2,
        yieldMax: 4,
        bonusSeedChance: 0.5,
        bonusSeedMin: 1,
        bonusSeedMax: 2,
        waterBoost: 1.5,
        witherTimeSeconds: 1 * 24 * 60 * 60, // 1 day to wither after ready
        icon: '🌾',
        color: '#d4a017',
        description: 'Wheat grows in 2 days, yields flour for bread. Water to grow faster.',
        requiredTool: 'sickle',
        tags: ['grain', 'food', 'farmable']
      },
      {
        id: 'carrot',
        name: 'Carrot',
        seedItemId: 'carrot_seed',
        harvestItemId: 'carrot',
        bonusSeedItemId: 'carrot_seed',
        growthTimeSeconds: 1.5 * 24 * 60 * 60, // 1.5 days
        stages: [GrowthStage.PLANTED, GrowthStage.SPROUT, GrowthStage.GROWING, GrowthStage.MATURE, GrowthStage.READY],
        stageThresholds: [0, 0.25, 0.5, 0.75, 1.0],
        yieldMin: 1,
        yieldMax: 3,
        bonusSeedChance: 0.3,
        bonusSeedMin: 1,
        bonusSeedMax: 1,
        waterBoost: 1.5,
        witherTimeSeconds: 1 * 24 * 60 * 60,
        icon: '🥕',
        color: '#ff8c00',
        description: 'Carrot grows in 1.5 days, crunchy and nutritious. Water to grow faster.',
        requiredTool: 'sickle',
        tags: ['vegetable', 'food', 'farmable']
      },
      {
        id: 'berry_bush',
        name: 'Berry Bush',
        seedItemId: 'berry', // berry can be planted as seed too for simplicity
        harvestItemId: 'berry',
        bonusSeedItemId: 'berry',
        growthTimeSeconds: 1 * 24 * 60 * 60, // 1 day
        stages: [GrowthStage.PLANTED, GrowthStage.SPROUT, GrowthStage.GROWING, GrowthStage.READY],
        stageThresholds: [0, 0.3, 0.6, 1.0],
        yieldMin: 2,
        yieldMax: 5,
        bonusSeedChance: 0.4,
        bonusSeedMin: 1,
        bonusSeedMax: 2,
        waterBoost: 1.3,
        witherTimeSeconds: 2 * 24 * 60 * 60,
        icon: '🫐',
        color: '#8a2be2',
        description: 'Berry bush regrows quickly, yields berries.',
        tags: ['fruit', 'food', 'farmable', 'fast']
      },
      {
        id: 'herb',
        name: 'Herb Garden',
        seedItemId: 'herb',
        harvestItemId: 'herb',
        bonusSeedItemId: 'herb',
        growthTimeSeconds: 0.8 * 24 * 60 * 60, // 0.8 days ~ 19 hours
        stages: [GrowthStage.PLANTED, GrowthStage.SPROUT, GrowthStage.READY],
        stageThresholds: [0, 0.5, 1.0],
        yieldMin: 1,
        yieldMax: 3,
        bonusSeedChance: 0.6,
        bonusSeedMin: 1,
        bonusSeedMax: 2,
        waterBoost: 1.4,
        witherTimeSeconds: 1.5 * 24 * 60 * 60,
        icon: '🌿',
        color: '#228b22',
        description: 'Herbs grow fast, used for potions.',
        tags: ['herb', 'potion', 'farmable', 'fast']
      }
    ];

    for (const crop of defaultCrops) {
      this.crops.set(crop.id, crop);
    }

    console.log(`[CropDatabase] Loaded ${this.crops.size} crops`);
  }

  getCrop(id: string): CropDefinition | undefined {
    return this.crops.get(id);
  }

  getAllCrops(): CropDefinition[] {
    return Array.from(this.crops.values());
  }

  getCropBySeed(seedItemId: string): CropDefinition | undefined {
    for (const crop of this.crops.values()) {
      if (crop.seedItemId === seedItemId) return crop;
    }
    return undefined;
  }

  getCount(): number {
    return this.crops.size;
  }

  hasCrop(id: string): boolean {
    return this.crops.has(id);
  }

  registerCrop(definition: CropDefinition): boolean {
    if (this.crops.has(definition.id)) {
      console.warn(`[CropDatabase] Crop ${definition.id} already exists, overwriting`);
    }
    this.crops.set(definition.id, definition);
    return true;
  }

  unregisterCrop(id: string): boolean {
    return this.crops.delete(id);
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const crop of this.crops.values()) {
      if (!crop.id) errors.push(`Crop missing id`);
      if (!crop.seedItemId) errors.push(`Crop ${crop.id} missing seedItemId`);
      if (!crop.harvestItemId) errors.push(`Crop ${crop.id} missing harvestItemId`);
      if (crop.growthTimeSeconds <= 0) errors.push(`Crop ${crop.id} invalid growthTime`);
      if (crop.stages.length !== crop.stageThresholds.length) errors.push(`Crop ${crop.id} stages/thresholds length mismatch`);
      if (crop.yieldMin > crop.yieldMax) errors.push(`Crop ${crop.id} yieldMin > yieldMax`);
    }
    return { valid: errors.length === 0, errors };
  }

  getDebugString(): string {
    return `${this.crops.size} crops: ${Array.from(this.crops.keys()).join(', ')}`;
  }
}
