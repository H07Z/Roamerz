/**
 * World - Phase 2
 * Manages current map and world state
 * Separated from rendering and game logic
 */

import { WorldMap, WorldMapData } from './WorldMap';
import { createVillageMap } from './maps/village_01';

export class World {
  private currentMap: WorldMap | null = null;
  private maps: Map<string, WorldMap> = new Map();

  constructor() {}

  initialize(): void {
    console.log('[World] Initializing...');

    // Load village_01 as starting map
    try {
      const villageData = createVillageMap();
      const villageMap = new WorldMap(villageData);
      this.maps.set(villageMap.mapId, villageMap);
      this.currentMap = villageMap;

      console.log(`[World] Loaded map: ${villageMap.mapId} (${villageMap.name})`);
      console.log('[World] Tile counts:', villageMap.getTileCounts());
    } catch (e) {
      console.error('[World] Failed to load maps:', e);
      throw e;
    }
  }

  getCurrentMap(): WorldMap | null {
    return this.currentMap;
  }

  getMap(mapId: string): WorldMap | undefined {
    return this.maps.get(mapId);
  }

  loadMap(mapId: string): boolean {
    const map = this.maps.get(mapId);
    if (!map) {
      console.warn(`[World] Map not found: ${mapId}`);
      return false;
    }
    this.currentMap = map;
    console.log(`[World] Switched to map: ${mapId}`);
    return true;
  }

  // For future phases - register external maps
  registerMap(data: WorldMapData): WorldMap {
    const map = new WorldMap(data);
    this.maps.set(map.mapId, map);
    return map;
  }

  update(_deltaTime: number): void {
    // Phase 2: No world simulation yet
    // Future: time, weather, NPCs, etc.
  }

  getMapInfo(): { id: string; name: string; width: number; height: number; tileCount: number } | null {
    if (!this.currentMap) return null;
    return {
      id: this.currentMap.mapId,
      name: this.currentMap.name,
      width: this.currentMap.width,
      height: this.currentMap.height,
      tileCount: this.currentMap.width * this.currentMap.height
    };
  }
}
