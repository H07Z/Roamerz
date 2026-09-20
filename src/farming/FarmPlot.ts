/**
 * FarmPlot - Phase 15 Farming System
 * Single plot logic: till, plant, water, grow, harvest, wither
 */

import { CropDatabase } from './CropDatabase';
import { FarmPlotData, GrowthStage, PlotState, createEmptyPlot, getGrowthStageFromProgress, getPlotStateFromGrowthStage, CropDefinition } from './Crop';

export class FarmPlot {
  private data: FarmPlotData;
  private cropDatabase: CropDatabase;

  constructor(x: number, y: number, mapId: string, totalSeconds: number, cropDatabase?: CropDatabase) {
    this.cropDatabase = cropDatabase ?? CropDatabase.getInstance();
    this.data = createEmptyPlot(x, y, mapId, totalSeconds);
  }

  // For loading from save
  static fromSaveData(saveData: FarmPlotData, cropDatabase?: CropDatabase): FarmPlot {
    const plot = new FarmPlot(saveData.x, saveData.y, saveData.mapId, saveData.tilledAt, cropDatabase);
    plot.data = { ...saveData };
    return plot;
  }

  getData(): FarmPlotData {
    return { ...this.data };
  }

  getId(): string { return this.data.id; }
  getX(): number { return this.data.x; }
  getY(): number { return this.data.y; }
  getMapId(): string { return this.data.mapId; }
  getState(): PlotState { return this.data.state; }
  getGrowthStage(): GrowthStage { return this.data.growthStage; }
  getCropId(): string | null { return this.data.cropId; }
  getProgress(): number { return this.data.growthProgress; }
  isWatered(): boolean { return this.data.isWatered; }
  isReady(): boolean { return this.data.state === PlotState.READY && this.data.growthStage === GrowthStage.READY; }
  isWithered(): boolean { return this.data.state === PlotState.WITHERED; }
  isTilled(): boolean { return this.data.state === PlotState.TILLED; }
  isPlanted(): boolean { return this.data.cropId !== null && this.data.state !== PlotState.TILLED; }

  getCropDefinition(): CropDefinition | undefined {
    if (!this.data.cropId) return undefined;
    return this.cropDatabase.getCrop(this.data.cropId);
  }

  // Till the plot (from untilled to tilled)
  till(totalSeconds: number): boolean {
    if (this.data.state !== PlotState.TILLED && this.data.state !== PlotState.UNTILLED) {
      // Can re-till only if harvested or withered
      if (this.data.state !== PlotState.WITHERED && this.data.growthStage !== GrowthStage.HARVESTED) {
        return false;
      }
    }
    this.data.state = PlotState.TILLED;
    this.data.growthStage = GrowthStage.TILLED;
    this.data.cropId = null;
    this.data.plantedAt = 0;
    this.data.wateredAt = null;
    this.data.isWatered = false;
    this.data.growthProgress = 0;
    this.data.readyAt = null;
    this.data.witherAt = null;
    this.data.tilledAt = totalSeconds;
    return true;
  }

  // Plant seed
  plant(cropId: string, totalSeconds: number): boolean {
    if (this.data.state !== PlotState.TILLED) {
      console.warn(`[FarmPlot] Cannot plant at ${this.data.x},${this.data.y} state ${this.data.state} not TILLED`);
      return false;
    }
    const cropDef = this.cropDatabase.getCrop(cropId);
    if (!cropDef) {
      console.warn(`[FarmPlot] Crop ${cropId} not found`);
      return false;
    }
    this.data.cropId = cropId;
    this.data.state = PlotState.PLANTED;
    this.data.growthStage = GrowthStage.PLANTED;
    this.data.plantedAt = totalSeconds;
    this.data.growthProgress = 0;
    this.data.isWatered = false;
    this.data.wateredAt = null;
    this.data.readyAt = null;
    this.data.witherAt = null;
    console.log(`[FarmPlot] Planted ${cropId} at ${this.data.x},${this.data.y} map ${this.data.mapId}`);
    return true;
  }

  // Plant by seed item id (looks up crop)
  plantBySeed(seedItemId: string, totalSeconds: number): boolean {
    const crop = this.cropDatabase.getCropBySeed(seedItemId);
    if (!crop) {
      console.warn(`[FarmPlot] No crop for seed ${seedItemId}`);
      return false;
    }
    return this.plant(crop.id, totalSeconds);
  }

  // Water plot - boosts growth
  water(totalSeconds: number): boolean {
    if (!this.data.cropId) return false;
    if (this.data.state === PlotState.READY || this.data.state === PlotState.WITHERED || this.data.state === PlotState.TILLED) {
      return false;
    }
    this.data.isWatered = true;
    this.data.wateredAt = totalSeconds;
    // If was PLANTED, move to WATERED state? For simplicity keep GROWING but flag watered
    if (this.data.state === PlotState.PLANTED) {
      this.data.state = PlotState.WATERED;
    }
    console.log(`[FarmPlot] Watered ${this.data.cropId} at ${this.data.x},${this.data.y}`);
    return true;
  }

  // Update growth based on current totalSeconds
  update(totalSeconds: number): boolean {
    // Returns true if state changed
    if (!this.data.cropId) return false;
    if (this.data.state === PlotState.TILLED || this.data.state === PlotState.READY || this.data.state === PlotState.WITHERED) {
      // Check wither if ready
      if (this.data.state === PlotState.READY && this.data.witherAt !== null && totalSeconds >= this.data.witherAt) {
        this.data.state = PlotState.WITHERED;
        this.data.growthStage = GrowthStage.WITHERED;
        console.log(`[FarmPlot] Withered ${this.data.cropId} at ${this.data.x},${this.data.y}`);
        return true;
      }
      return false;
    }

    const cropDef = this.cropDatabase.getCrop(this.data.cropId);
    if (!cropDef) return false;

    const elapsed = totalSeconds - this.data.plantedAt;
    let effectiveElapsed = elapsed;
    if (this.data.isWatered) {
      effectiveElapsed *= cropDef.waterBoost;
    }

    const progress = Math.min(1, effectiveElapsed / cropDef.growthTimeSeconds);
    const oldProgress = this.data.growthProgress;
    const oldStage = this.data.growthStage;

    this.data.growthProgress = progress;

    const newStage = getGrowthStageFromProgress(progress, cropDef);
    this.data.growthStage = newStage;

    if (newStage === GrowthStage.READY && oldStage !== GrowthStage.READY) {
      this.data.state = PlotState.READY;
      this.data.readyAt = totalSeconds;
      this.data.witherAt = totalSeconds + cropDef.witherTimeSeconds;
      console.log(`[FarmPlot] Ready ${this.data.cropId} at ${this.data.x},${this.data.y} after ${elapsed.toFixed(0)}s`);
      return true;
    } else if (progress > 0 && this.data.state === PlotState.PLANTED) {
      this.data.state = PlotState.GROWING;
    }

    // Water effect expires after 0.5 days? For simplicity, water lasts 0.5 days
    if (this.data.isWatered && this.data.wateredAt !== null) {
      const waterElapsed = totalSeconds - this.data.wateredAt;
      if (waterElapsed > 0.5 * 24 * 60 * 60) {
        this.data.isWatered = false;
        console.log(`[FarmPlot] Water dried at ${this.data.x},${this.data.y}`);
      }
    }

    return oldStage !== newStage || Math.abs(oldProgress - progress) > 0.01;
  }

  // Harvest - returns yield info
  harvest(totalSeconds: number): { success: boolean; cropId: string | null; yield: number; bonusSeeds: number; bonusSeedId: string | null } {
    if (this.data.state !== PlotState.READY) {
      return { success: false, cropId: null, yield: 0, bonusSeeds: 0, bonusSeedId: null };
    }
    const cropDef = this.data.cropId ? this.cropDatabase.getCrop(this.data.cropId) : undefined;
    if (!cropDef) {
      return { success: false, cropId: null, yield: 0, bonusSeeds: 0, bonusSeedId: null };
    }

    // Calculate yield
    const yieldAmount = Math.floor(Math.random() * (cropDef.yieldMax - cropDef.yieldMin + 1)) + cropDef.yieldMin;
    let bonusSeeds = 0;
    if (Math.random() < cropDef.bonusSeedChance) {
      bonusSeeds = Math.floor(Math.random() * (cropDef.bonusSeedMax - cropDef.bonusSeedMin + 1)) + cropDef.bonusSeedMin;
    }

    const harvestedCropId = this.data.cropId;
    this.data.harvestCount++;
    // Reset to tilled after harvest
    this.data.state = PlotState.TILLED;
    this.data.growthStage = GrowthStage.HARVESTED;
    this.data.cropId = null;
    this.data.plantedAt = 0;
    this.data.growthProgress = 0;
    this.data.isWatered = false;
    this.data.wateredAt = null;
    this.data.readyAt = null;
    this.data.witherAt = null;
    this.data.tilledAt = totalSeconds;

    console.log(`[FarmPlot] Harvested ${harvestedCropId} at ${this.data.x},${this.data.y} yield ${yieldAmount} bonusSeeds ${bonusSeeds}`);

    return {
      success: true,
      cropId: harvestedCropId,
      yield: yieldAmount,
      bonusSeeds,
      bonusSeedId: cropDef.bonusSeedItemId ?? null
    };
  }

  // Clear withered
  clearWithered(totalSeconds: number): boolean {
    if (this.data.state !== PlotState.WITHERED) return false;
    this.data.state = PlotState.TILLED;
    this.data.growthStage = GrowthStage.TILLED;
    this.data.cropId = null;
    this.data.growthProgress = 0;
    this.data.plantedAt = 0;
    this.data.isWatered = false;
    this.data.tilledAt = totalSeconds;
    this.data.readyAt = null;
    this.data.witherAt = null;
    return true;
  }

  // For save
  getSaveData(): FarmPlotData {
    return { ...this.data };
  }

  // For debug
  getDebugString(): string {
    const crop = this.data.cropId ?? 'none';
    const stage = this.data.growthStage;
    const progress = (this.data.growthProgress * 100).toFixed(0);
    const watered = this.data.isWatered ? '💧' : '';
    return `${this.data.id} ${crop} ${stage} ${progress}% ${watered} state ${this.data.state} harvests ${this.data.harvestCount}`;
  }

  getDetailedString(): string {
    const def = this.getCropDefinition();
    const icon = def?.icon ?? '🌱';
    return `${icon} ${this.data.x},${this.data.y} ${this.data.mapId} ${this.data.state} ${this.data.growthStage} ${this.data.cropId ?? 'empty'} ${(this.data.growthProgress*100).toFixed(0)}% ${this.data.isWatered ? 'watered' : ''} harvested ${this.data.harvestCount}x`;
  }
}
