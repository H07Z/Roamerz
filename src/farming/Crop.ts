/**
 * Crop - Phase 15 Farming System
 * Data-driven crop definitions, growth stages, plot states
 */

export enum GrowthStage {
  TILLED = 'TILLED',       // Just tilled soil
  PLANTED = 'PLANTED',     // Seed planted
  SPROUT = 'SPROUT',       // 25% growth
  GROWING = 'GROWING',     // 50% growth
  MATURE = 'MATURE',       // 75% growth
  READY = 'READY',         // 100% ready to harvest
  WITHERED = 'WITHERED',   // Failed/withered after too long
  HARVESTED = 'HARVESTED'  // Just harvested, needs till again
}

export enum PlotState {
  UNTILLED = 'UNTILLED',   // Natural ground, needs till
  TILLED = 'TILLED',       // Tilled ready for planting
  PLANTED = 'PLANTED',     // Has seed
  WATERED = 'WATERED',     // Watered (boost)
  GROWING = 'GROWING',     // Growing
  READY = 'READY',         // Ready to harvest
  WITHERED = 'WITHERED'
}

export interface CropDefinition {
  id: string; // crop id, e.g. wheat, carrot
  name: string;
  seedItemId: string; // item id required to plant, e.g. wheat_seed
  harvestItemId: string; // item id yielded on harvest, e.g. wheat or bread
  bonusSeedItemId?: string; // optional bonus seed on harvest
  growthTimeSeconds: number; // total game seconds to grow from planted to ready (e.g. 2 in-game days = 2*86400)
  stages: GrowthStage[]; // ordered stages
  stageThresholds: number[]; // percentage thresholds for each stage (0-1)
  yieldMin: number; // min harvest quantity
  yieldMax: number; // max harvest quantity
  bonusSeedChance: number; // 0-1 chance to get bonus seed
  bonusSeedMin: number;
  bonusSeedMax: number;
  waterBoost: number; // multiplier when watered (e.g. 1.5 = 50% faster)
  witherTimeSeconds: number; // time after ready before withers (e.g. 1 day)
  icon: string; // emoji
  color: string;
  description: string;
  requiredTool?: string; // e.g. sickle for harvest, not enforced yet
  tags?: string[];
}

export interface FarmPlotData {
  id: string; // unique plot id e.g. "plot_15_31_village_01"
  x: number; // tile x
  y: number; // tile y
  mapId: string;
  state: PlotState;
  growthStage: GrowthStage;
  cropId: string | null; // planted crop id or null
  plantedAt: number; // game totalSeconds when planted
  wateredAt: number | null; // last watered totalSeconds
  isWatered: boolean;
  growthProgress: number; // 0-1
  readyAt: number | null; // totalSeconds when became ready
  witherAt: number | null; // totalSeconds when will wither
  tilledAt: number; // totalSeconds when tilled
  harvestCount: number; // times harvested
  version: number;
}

export interface FarmingSaveData {
  plots: Record<string, FarmPlotData>; // plotId -> data
  totalPlotsCreated: number;
  totalHarvested: number;
  totalPlanted: number;
  version: number;
}

export function createEmptyPlot(x: number, y: number, mapId: string, totalSeconds: number): FarmPlotData {
  return {
    id: `plot_${x}_${y}_${mapId}`,
    x,
    y,
    mapId,
    state: PlotState.TILLED,
    growthStage: GrowthStage.TILLED,
    cropId: null,
    plantedAt: 0,
    wateredAt: null,
    isWatered: false,
    growthProgress: 0,
    readyAt: null,
    witherAt: null,
    tilledAt: totalSeconds,
    harvestCount: 0,
    version: 1
  };
}

export function getGrowthStageFromProgress(progress: number, definition: CropDefinition): GrowthStage {
  // progress 0-1
  if (progress <= 0) return GrowthStage.PLANTED;
  // Find stage based on thresholds
  for (let i = definition.stageThresholds.length - 1; i >= 0; i--) {
    if (progress >= definition.stageThresholds[i]) {
      return definition.stages[i] ?? GrowthStage.READY;
    }
  }
  return GrowthStage.PLANTED;
}

export function getPlotStateFromGrowthStage(stage: GrowthStage): PlotState {
  switch (stage) {
    case GrowthStage.TILLED: return PlotState.TILLED;
    case GrowthStage.PLANTED:
    case GrowthStage.SPROUT:
    case GrowthStage.GROWING:
    case GrowthStage.MATURE: return PlotState.GROWING;
    case GrowthStage.READY: return PlotState.READY;
    case GrowthStage.WITHERED: return PlotState.WITHERED;
    case GrowthStage.HARVESTED: return PlotState.TILLED;
    default: return PlotState.TILLED;
  }
}
