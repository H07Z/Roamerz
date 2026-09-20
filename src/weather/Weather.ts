/**
 * Weather.ts - Phase 16.4 Weather System
 * Defines weather types, effects, visuals, save data
 */

export enum WeatherType {
  SUNNY = 'SUNNY',
  CLOUDY = 'CLOUDY',
  RAINY = 'RAINY',
  STORMY = 'STORMY',
  FOGGY = 'FOGGY',
  SNOWY = 'SNOWY'
}

export interface WeatherEffects {
  farmingGrowthMultiplier?: number; // 1.0 normal, >1 faster
  animalHappinessModifier?: number; // +/- per day? small
  playerStaminaDrain?: number; // multiplier 1.0 normal
  visionRadiusModifier?: number; // +/- tiles
  movementSpeedModifier?: number; // 1.0 normal
}

export interface WeatherVisual {
  overlayColor: string; // rgba e.g. 'rgba(0,0,0,0.1)'
  particleType: 'none' | 'rain' | 'heavy_rain' | 'snow' | 'fog';
  particleCount?: number; // number of particles to draw
  brightnessModifier?: number; // 0.8-1.2
}

export interface WeatherDefinition {
  id: string; // lowercase e.g. 'sunny'
  type: WeatherType;
  name: string;
  icon: string;
  description: string;
  effects: WeatherEffects;
  visual: WeatherVisual;
  minDurationSeconds: number; // game seconds
  maxDurationSeconds: number;
  weight: number; // for random selection
  intensityMin: number; // 0-1
  intensityMax: number; // 0-1
  tags?: string[];
}

export interface WeatherSaveData {
  current: string; // id e.g. 'sunny'
  intensity: number; // 0-1
  nextChange: number; // game totalSeconds when next change
  totalChanges: number;
  version: number;
}

export function createDefaultWeatherSaveData(): WeatherSaveData {
  return {
    current: 'sunny',
    intensity: 0,
    nextChange: 0,
    totalChanges: 0,
    version: 1
  };
}
