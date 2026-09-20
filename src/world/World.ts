/**
 * World - Phase 12 Exploration & World Expansion
 * Manages current map and world state, multiple maps, transitions
 * Separated from rendering and game logic
 */

import { WorldMap, WorldMapData } from './WorldMap';
import { createVillageMap } from './maps/village_01';
import { createForestMap } from './maps/forest_01';
import { createLakeMap } from './maps/lake_01';

export class World {
  private currentMap: WorldMap | null = null;
  private maps: Map<string, WorldMap> = new Map();

  constructor() {}

  initialize(): void {
    console.log('[World] Initializing Phase 12...');

    // Load all maps
    try {
      const villageData = createVillageMap();
      const villageMap = new WorldMap(villageData);
      this.maps.set(villageMap.mapId, villageMap);
      this.currentMap = villageMap;
      console.log(`[World] Loaded map: ${villageMap.mapId} (${villageMap.name}) ${villageMap.width}x${villageMap.height}`);

      const forestData = createForestMap();
      const forestMap = new WorldMap(forestData);
      this.maps.set(forestMap.mapId, forestMap);
      console.log(`[World] Loaded map: ${forestMap.mapId} (${forestMap.name}) ${forestMap.width}x${forestMap.height}`);

      const lakeData = createLakeMap();
      const lakeMap = new WorldMap(lakeData);
      this.maps.set(lakeMap.mapId, lakeMap);
      console.log(`[World] Loaded map: ${lakeMap.mapId} (${lakeMap.name}) ${lakeMap.width}x${lakeMap.height}`);

      // Fix village entrances to point to actual maps
      // village north -> forest, south -> lake, west/east -> forest/lake for exploration
      const village = this.maps.get('village_01');
      if (village) {
        // Override entrances for Phase 12
        (village as any).entrances = [
          { x: 24, y: 0, targetMap: 'forest_01' },
          { x: 25, y: 0, targetMap: 'forest_01' },
          { x: 24, y: village.height - 1, targetMap: 'lake_01' },
          { x: 25, y: village.height - 1, targetMap: 'lake_01' },
          { x: 0, y: 19, targetMap: 'forest_01' },
          { x: 0, y: 20, targetMap: 'forest_01' },
          { x: village.width - 1, y: 19, targetMap: 'lake_01' },
          { x: village.width - 1, y: 20, targetMap: 'lake_01' }
        ];
      }

      console.log(`[World] Total ${this.maps.size} maps loaded`);
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

  getAllMaps(): WorldMap[] {
    return Array.from(this.maps.values());
  }

  loadMap(mapId: string): boolean {
    const map = this.maps.get(mapId);
    if (!map) {
      console.warn(`[World] Map not found: ${mapId}`);
      return false;
    }
    this.currentMap = map;
    console.log(`[World] Switched to map: ${mapId} (${map.name})`);
    return true;
  }

  // For future phases - register external maps
  registerMap(data: WorldMapData): WorldMap {
    const map = new WorldMap(data);
    this.maps.set(map.mapId, map);
    return map;
  }

  update(_deltaTime: number): void {
    // Phase 12: No world simulation yet beyond maps
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

  getAllMapsInfo(): { id: string; name: string; width: number; height: number; tileCount: number }[] {
    return Array.from(this.maps.values()).map(m => ({
      id: m.mapId,
      name: m.name,
      width: m.width,
      height: m.height,
      tileCount: m.width * m.height
    }));
  }
}
