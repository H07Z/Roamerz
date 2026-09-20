/**
 * WeatherSystem - Phase 16.4 Weather System
 * Manages current weather, transitions, intensity, persistence
 */

import { WeatherDatabase } from './WeatherDatabase';
import { WeatherDefinition, WeatherSaveData, createDefaultWeatherSaveData } from './Weather';

export class WeatherSystem {
  private database: WeatherDatabase;
  private currentWeatherId: string = 'sunny';
  private intensity: number = 0;
  private nextChangeSeconds: number = 0;
  private totalChanges: number = 0;
  private version: number = 1;

  // For particle animation time
  private timeAccum: number = 0;

  constructor(database?: WeatherDatabase) {
    this.database = database ?? WeatherDatabase.getInstance();
  }

  initialize(totalSeconds: number = 0): void {
    const def = this.database.getWeather(this.currentWeatherId);
    if (!def) {
      this.currentWeatherId = 'sunny';
    }
    const currentDef = this.database.getWeather(this.currentWeatherId)!;
    this.intensity = this.randomRange(currentDef.intensityMin, currentDef.intensityMax);
    this.nextChangeSeconds = totalSeconds + this.randomRange(currentDef.minDurationSeconds, currentDef.maxDurationSeconds);
    this.totalChanges = 0;
    this.timeAccum = 0;
    console.log(`[WeatherSystem] Initialized with ${currentDef.name} ${currentDef.icon} intensity ${this.intensity.toFixed(2)} nextChange in ${((this.nextChangeSeconds - totalSeconds)/3600).toFixed(1)}h game`);
  }

  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private pickRandomWeather(excludeId?: string): WeatherDefinition {
    const all = this.database.getAllWeathers();
    const candidates = excludeId ? all.filter(w => w.id !== excludeId) : all;
    if (candidates.length === 0) return all[0];

    const totalWeight = candidates.reduce((sum, w) => sum + w.weight, 0);
    let r = Math.random() * totalWeight;
    for (const w of candidates) {
      r -= w.weight;
      if (r <= 0) return w;
    }
    return candidates[candidates.length - 1];
  }

  update(totalSeconds: number, _deltaTime: number = 0): { changed: boolean; oldId?: string; newId?: string } {
    this.timeAccum += _deltaTime;

    if (totalSeconds >= this.nextChangeSeconds) {
      const oldId = this.currentWeatherId;
      const newDef = this.pickRandomWeather(oldId);
      this.currentWeatherId = newDef.id;
      this.intensity = this.randomRange(newDef.intensityMin, newDef.intensityMax);
      this.nextChangeSeconds = totalSeconds + this.randomRange(newDef.minDurationSeconds, newDef.maxDurationSeconds);
      this.totalChanges++;
      console.log(`[WeatherSystem] Weather changed ${oldId} -> ${newDef.id} ${newDef.icon} intensity ${this.intensity.toFixed(2)} totalChanges ${this.totalChanges}`);
      return { changed: true, oldId, newId: newDef.id };
    }
    return { changed: false };
  }

  getCurrentWeatherId(): string {
    return this.currentWeatherId;
  }

  getCurrentWeather(): WeatherDefinition | null {
    return this.database.getWeather(this.currentWeatherId);
  }

  getIntensity(): number {
    return this.intensity;
  }

  getNextChange(): number {
    return this.nextChangeSeconds;
  }

  getTotalChanges(): number {
    return this.totalChanges;
  }

  getTimeUntilNextChange(totalSeconds: number): number {
    return Math.max(0, this.nextChangeSeconds - totalSeconds);
  }

  isRaining(): boolean {
    const def = this.getCurrentWeather();
    if (!def) return false;
    return def.visual.particleType === 'rain' || def.visual.particleType === 'heavy_rain';
  }

  isSnowing(): boolean {
    const def = this.getCurrentWeather();
    if (!def) return false;
    return def.visual.particleType === 'snow';
  }

  isFoggy(): boolean {
    const def = this.getCurrentWeather();
    if (!def) return false;
    return def.visual.particleType === 'fog' || def.type === 'FOGGY' as any;
  }

  setWeather(id: string, intensity?: number, totalSeconds?: number): boolean {
    const def = this.database.getWeather(id);
    if (!def) {
      console.warn(`[WeatherSystem] setWeather unknown id ${id}`);
      return false;
    }
    const oldId = this.currentWeatherId;
    this.currentWeatherId = def.id;
    this.intensity = intensity !== undefined ? Math.max(0, Math.min(1, intensity)) : this.randomRange(def.intensityMin, def.intensityMax);
    const now = totalSeconds ?? 0;
    this.nextChangeSeconds = now + this.randomRange(def.minDurationSeconds, def.maxDurationSeconds);
    if (oldId !== def.id) this.totalChanges++;
    console.log(`[WeatherSystem] Manually set weather ${oldId} -> ${def.id} ${def.icon} intensity ${this.intensity.toFixed(2)}`);
    return true;
  }

  cycleWeather(totalSeconds?: number): string {
    const all = this.database.getAllWeathers();
    const idx = all.findIndex(w => w.id === this.currentWeatherId);
    const nextIdx = (idx + 1) % all.length;
    const next = all[nextIdx];
    this.setWeather(next.id, undefined, totalSeconds);
    return next.id;
  }

  getDatabase(): WeatherDatabase {
    return this.database;
  }

  getSaveData(): WeatherSaveData {
    return {
      current: this.currentWeatherId,
      intensity: this.intensity,
      nextChange: this.nextChangeSeconds,
      totalChanges: this.totalChanges,
      version: this.version
    };
  }

  loadSaveData(data: WeatherSaveData | any): void {
    if (!data) return;
    try {
      const id = typeof data.current === 'string' ? data.current.toLowerCase() : 'sunny';
      if (this.database.hasWeather(id)) {
        this.currentWeatherId = id;
      } else {
        console.warn(`[WeatherSystem] Loaded unknown weather ${id}, defaulting to sunny`);
        this.currentWeatherId = 'sunny';
      }
      this.intensity = typeof data.intensity === 'number' ? Math.max(0, Math.min(1, data.intensity)) : 0;
      this.nextChangeSeconds = typeof data.nextChange === 'number' ? data.nextChange : 0;
      this.totalChanges = typeof data.totalChanges === 'number' ? data.totalChanges : 0;
      this.version = typeof data.version === 'number' ? data.version : 1;
      console.log(`[WeatherSystem] Loaded ${this.currentWeatherId} intensity ${this.intensity.toFixed(2)} changes ${this.totalChanges} nextChange ${this.nextChangeSeconds.toFixed(0)}`);
    } catch (e) {
      console.error('[WeatherSystem] Failed to load save data:', e);
    }
  }

  clear(): void {
    this.currentWeatherId = 'sunny';
    this.intensity = 0;
    this.nextChangeSeconds = 0;
    this.totalChanges = 0;
    console.log('[WeatherSystem] Cleared to sunny');
  }

  getDebugString(): string {
    const def = this.getCurrentWeather();
    return `${def?.icon ?? '❓'} ${this.currentWeatherId} intensity ${this.intensity.toFixed(2)} changes ${this.totalChanges} next in ${this.nextChangeSeconds.toFixed(0)}s`;
  }

  debugPrint(): void {
    console.log(`[WeatherSystem] ${this.getDebugString()}`);
    for (const w of this.database.getAllWeathers()) {
      console.log(`  ${w.icon} ${w.id} ${w.name} ${w.type} dur ${ (w.minDurationSeconds/3600).toFixed(1)}-${(w.maxDurationSeconds/3600).toFixed(1)}h weight ${w.weight} intensity ${w.intensityMin}-${w.intensityMax} farming x${w.effects.farmingGrowthMultiplier}`);
    }
  }
}
