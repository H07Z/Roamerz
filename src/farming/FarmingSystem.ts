/**
 * FarmingSystem - Phase 15 Farming System
 * Manages all farm plots, growth, tilling, planting, watering, harvesting
 * Reusable functions: createPlot, tillPlot, plantSeed, waterPlot, harvestPlot, etc.
 */

import { FarmPlot } from './FarmPlot';
import { CropDatabase } from './CropDatabase';
import { FarmPlotData, FarmingSaveData, PlotState, GrowthStage } from './Crop';
import { WorldMap } from '../world/WorldMap';
import { TerrainType } from '../world/TerrainType';

export class FarmingSystem {
  private plots: Map<string, FarmPlot> = new Map();
  private cropDatabase: CropDatabase;
  private totalPlotsCreated: number = 0;
  private totalHarvested: number = 0;
  private totalPlanted: number = 0;
  private version: number = 1;

  constructor(cropDatabase?: CropDatabase) {
    this.cropDatabase = cropDatabase ?? CropDatabase.getInstance();
  }

  initialize(maps: { mapId: string; width: number; height: number }[]): void {
    // For now, don't auto-create plots; plots created on demand via tilling
    // But we can log farmland tiles for debug
    console.log(`[FarmingSystem] Initialized for ${maps.length} maps, ${this.cropDatabase.getCount()} crops: ${this.cropDatabase.getDebugString()}`);
  }

  // --- Core API (required) ---

  /**
   * Create a tilled plot at tile position if valid
   * Valid if: within map bounds, terrain is FARMLAND or GRASS, not already a plot, walkable
   */
  createPlot(x: number, y: number, mapId: string, totalSeconds: number, worldMap?: WorldMap | null): FarmPlot | null {
    const id = `plot_${x}_${y}_${mapId}`;
    if (this.plots.has(id)) {
      // Already exists, return existing if tilled?
      return this.plots.get(id) ?? null;
    }

    // Validate against world map if provided
    if (worldMap) {
      if (x < 0 || y < 0 || x >= worldMap.width || y >= worldMap.height) {
        console.warn(`[FarmingSystem] createPlot out of bounds ${x},${y} map ${mapId}`);
        return null;
      }
      const terrain = worldMap.getTile(x, y);
      // Allow farmland and grass as tillable (ROAD allowed for testing)
      if (terrain !== TerrainType.FARMLAND && terrain !== TerrainType.GRASS && terrain !== TerrainType.ROAD) {
        console.warn(`[FarmingSystem] Tile ${x},${y} terrain ${terrain} not tillable (need FARMLAND or GRASS)`);
        return null;
      }
    }

    const plot = new FarmPlot(x, y, mapId, totalSeconds, this.cropDatabase);
    this.plots.set(id, plot);
    this.totalPlotsCreated++;
    console.log(`[FarmingSystem] Created plot ${id} at ${x},${y} ${mapId} total ${this.totalPlotsCreated}`);
    return plot;
  }

  /**
   * Till plot - creates if not exists, or re-tills if withered/harvested
   */
  tillPlot(x: number, y: number, mapId: string, totalSeconds: number, worldMap?: WorldMap | null): boolean {
    const id = `plot_${x}_${y}_${mapId}`;
    let plot: FarmPlot | undefined = this.plots.get(id);
    if (!plot) {
      const newPlot = this.createPlot(x, y, mapId, totalSeconds, worldMap);
      if (!newPlot) return false;
      return true; // newly created is already tilled
    }
    return plot.till(totalSeconds);
  }

  /**
   * Plant seed at plot - requires tilled plot and seed item
   * seedItemId e.g. wheat_seed, returns true if planted
   */
  plantSeed(x: number, y: number, mapId: string, seedItemId: string, totalSeconds: number): boolean {
    const id = `plot_${x}_${y}_${mapId}`;
    const plot = this.plots.get(id);
    if (!plot) {
      console.warn(`[FarmingSystem] plantSeed no plot at ${x},${y} ${mapId}`);
      return false;
    }
    const success = plot.plantBySeed(seedItemId, totalSeconds);
    if (success) this.totalPlanted++;
    return success;
  }

  /**
   * Plant by crop id directly
   */
  plantCrop(x: number, y: number, mapId: string, cropId: string, totalSeconds: number): boolean {
    const id = `plot_${x}_${y}_${mapId}`;
    const plot = this.plots.get(id);
    if (!plot) return false;
    const success = plot.plant(cropId, totalSeconds);
    if (success) this.totalPlanted++;
    return success;
  }

  /**
   * Water plot
   */
  waterPlot(x: number, y: number, mapId: string, totalSeconds: number): boolean {
    const id = `plot_${x}_${y}_${mapId}`;
    const plot = this.plots.get(id);
    if (!plot) return false;
    return plot.water(totalSeconds);
  }

  /**
   * Harvest plot - returns yield info
   */
  harvestPlot(x: number, y: number, mapId: string, totalSeconds: number): { success: boolean; cropId: string | null; yield: number; bonusSeeds: number; bonusSeedId: string | null } {
    const id = `plot_${x}_${y}_${mapId}`;
    const plot = this.plots.get(id);
    if (!plot) return { success: false, cropId: null, yield: 0, bonusSeeds: 0, bonusSeedId: null };
    const result = plot.harvest(totalSeconds);
    if (result.success) this.totalHarvested++;
    return result;
  }

  /**
   * Get plot at position
   */
  getPlot(x: number, y: number, mapId: string): FarmPlot | null {
    const id = `plot_${x}_${y}_${mapId}`;
    return this.plots.get(id) ?? null;
  }

  /**
   * Check if has plot
   */
  hasPlot(x: number, y: number, mapId: string): boolean {
    const id = `plot_${x}_${y}_${mapId}`;
    return this.plots.has(id);
  }

  /**
   * Get all plots for map
   */
  getPlotsForMap(mapId: string): FarmPlot[] {
    const result: FarmPlot[] = [];
    for (const plot of this.plots.values()) {
      if (plot.getMapId() === mapId) result.push(plot);
    }
    return result;
  }

  getAllPlots(): FarmPlot[] {
    return Array.from(this.plots.values());
  }

  getPlotCount(mapId?: string): number {
    if (mapId) return this.getPlotsForMap(mapId).length;
    return this.plots.size;
  }

  /**
   * Get nearby plots within radius tiles
   */
  getNearbyPlots(tileX: number, tileY: number, mapId: string, radius: number = 2): FarmPlot[] {
    const result: FarmPlot[] = [];
    for (const plot of this.plots.values()) {
      if (plot.getMapId() !== mapId) continue;
      const dx = plot.getX() - tileX;
      const dy = plot.getY() - tileY;
      const distSq = dx*dx + dy*dy;
      if (distSq <= radius*radius) result.push(plot);
    }
    return result;
  }

  /**
   * Update all plots growth
   */
  update(totalSeconds: number, _deltaTime: number = 0): void {
    for (const plot of this.plots.values()) {
      plot.update(totalSeconds);
    }
  }

  // --- Save/Load ---

  getSaveData(): FarmingSaveData {
    const plots: Record<string, FarmPlotData> = {};
    for (const [id, plot] of this.plots.entries()) {
      plots[id] = plot.getSaveData();
    }
    return {
      plots,
      totalPlotsCreated: this.totalPlotsCreated,
      totalHarvested: this.totalHarvested,
      totalPlanted: this.totalPlanted,
      version: this.version
    };
  }

  loadSaveData(data: FarmingSaveData | any): void {
    if (!data) return;
    try {
      this.plots.clear();
      const plotsData = data.plots ?? {};
      for (const plotId of Object.keys(plotsData)) {
        const plotSave = plotsData[plotId];
        if (!plotSave) continue;
        const plot = FarmPlot.fromSaveData(plotSave, this.cropDatabase);
        this.plots.set(plotId, plot);
      }
      this.totalPlotsCreated = typeof data.totalPlotsCreated === 'number' ? data.totalPlotsCreated : this.plots.size;
      this.totalHarvested = typeof data.totalHarvested === 'number' ? data.totalHarvested : 0;
      this.totalPlanted = typeof data.totalPlanted === 'number' ? data.totalPlanted : 0;
      this.version = typeof data.version === 'number' ? data.version : 1;
      console.log(`[FarmingSystem] Loaded ${this.plots.size} plots, created ${this.totalPlotsCreated}, harvested ${this.totalHarvested}, planted ${this.totalPlanted}`);
    } catch (e) {
      console.error('[FarmingSystem] Failed to load save data:', e);
    }
  }

  clear(): void {
    this.plots.clear();
    this.totalPlotsCreated = 0;
    this.totalHarvested = 0;
    this.totalPlanted = 0;
    console.log('[FarmingSystem] Cleared all plots');
  }

  clearMap(mapId: string): void {
    for (const [id, plot] of this.plots.entries()) {
      if (plot.getMapId() === mapId) {
        this.plots.delete(id);
      }
    }
    console.log(`[FarmingSystem] Cleared plots for map ${mapId}`);
  }

  // --- Debug ---

  getDebugString(): string {
    const ready = Array.from(this.plots.values()).filter(p => p.isReady()).length;
    const growing = Array.from(this.plots.values()).filter(p => p.getState() === PlotState.GROWING).length;
    const tilled = Array.from(this.plots.values()).filter(p => p.isTilled()).length;
    const withered = Array.from(this.plots.values()).filter(p => p.isWithered()).length;
    return `${this.plots.size} plots (T:${tilled} G:${growing} R:${ready} W:${withered}) created ${this.totalPlotsCreated} planted ${this.totalPlanted} harvested ${this.totalHarvested}`;
  }

  getMapDebugString(mapId: string): string {
    const plots = this.getPlotsForMap(mapId);
    const ready = plots.filter(p => p.isReady()).length;
    const growing = plots.filter(p => p.getState() === PlotState.GROWING).length;
    return `${mapId}: ${plots.length} plots R:${ready} G:${growing}`;
  }

  debugPrint(): void {
    console.log(`[FarmingSystem] ${this.getDebugString()}`);
    for (const plot of this.plots.values()) {
      console.log(`  ${plot.getDebugString()}`);
    }
  }

  // For testing - fill with test plots
  fillWithTestPlots(mapId: string, totalSeconds: number, count: number = 5): void {
    const baseX = 10;
    const baseY = 30;
    for (let i = 0; i < count; i++) {
      const x = baseX + (i % 5);
      const y = baseY + Math.floor(i / 5);
      this.createPlot(x, y, mapId, totalSeconds);
    }
  }
}
