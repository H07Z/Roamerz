/**
 * ExplorationSystem - Phase 12 Exploration & World Expansion
 * Tracks explored tiles per map, vision radius, fog of war
 * Vision: circular radius 8 tiles reveals tiles
 * Explored persists, visible is per-frame
 */

export interface ExplorationData {
  explored: boolean[]; // flat array width*height
  visible: boolean[];   // current frame visible
  width: number;
  height: number;
  discoveredCount: number;
  totalTiles: number;
}

export class ExplorationSystem {
  private explorationMap: Map<string, ExplorationData> = new Map();
  private visionRadius: number = 8;
  private totalDiscovered: number = 0;
  private totalTiles: number = 0;
  private mapTransitions: number = 0;

  constructor(visionRadius: number = 8) {
    this.visionRadius = visionRadius;
  }

  initialize(maps: { mapId: string; width: number; height: number }[]): void {
    this.explorationMap.clear();
    this.totalDiscovered = 0;
    this.totalTiles = 0;

    for (const map of maps) {
      const total = map.width * map.height;
      const data: ExplorationData = {
        explored: new Array(total).fill(false),
        visible: new Array(total).fill(false),
        width: map.width,
        height: map.height,
        discoveredCount: 0,
        totalTiles: total
      };
      this.explorationMap.set(map.mapId, data);
      this.totalTiles += total;
    }

    console.log(`[Exploration] Initialized ${maps.length} maps, total tiles ${this.totalTiles}, vision ${this.visionRadius}`);
  }

  getVisionRadius(): number {
    return this.visionRadius;
  }

  setVisionRadius(radius: number): void {
    this.visionRadius = Math.max(1, Math.min(radius, 20));
    console.log(`[Exploration] Vision radius set to ${this.visionRadius}`);
  }

  // Reveal tiles around player
  update(playerTile: { x: number; y: number }, mapId: string): void {
    const data = this.explorationMap.get(mapId);
    if (!data) return;

    // Clear visible for this map
    data.visible.fill(false);

    const radius = this.visionRadius;
    const radiusSq = radius * radius;

    let newlyDiscovered = 0;

    // Iterate over square containing circle
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distSq = dx * dx + dy * dy;
        if (distSq > radiusSq) continue;

        const x = playerTile.x + dx;
        const y = playerTile.y + dy;

        if (x < 0 || y < 0 || x >= data.width || y >= data.height) continue;

        const idx = y * data.width + x;
        data.visible[idx] = true;

        if (!data.explored[idx]) {
          data.explored[idx] = true;
          data.discoveredCount++;
          this.totalDiscovered++;
          newlyDiscovered++;
        }
      }
    }

    if (newlyDiscovered > 0) {
      // Optional: log occasional discovery
      // console.log(`[Exploration] ${mapId} discovered +${newlyDiscovered} total ${data.discoveredCount}/${data.totalTiles} (${this.getExplorationPercentage(mapId).toFixed(1)}%)`);
    }
  }

  isExplored(x: number, y: number, mapId: string): boolean {
    const data = this.explorationMap.get(mapId);
    if (!data) return false;
    if (x < 0 || y < 0 || x >= data.width || y >= data.height) return false;
    return data.explored[y * data.width + x];
  }

  isVisible(x: number, y: number, mapId: string): boolean {
    const data = this.explorationMap.get(mapId);
    if (!data) return false;
    if (x < 0 || y < 0 || x >= data.width || y >= data.height) return false;
    return data.visible[y * data.width + x];
  }

  getExploredData(mapId: string): ExplorationData | undefined {
    return this.explorationMap.get(mapId);
  }

  getExploredCount(mapId: string): number {
    return this.explorationMap.get(mapId)?.discoveredCount ?? 0;
  }

  getTotalExploredCount(): number {
    return this.totalDiscovered;
  }

  getTotalTiles(): number {
    return this.totalTiles;
  }

  getTotalTilesForMap(mapId: string): number {
    return this.explorationMap.get(mapId)?.totalTiles ?? 0;
  }

  getExplorationPercentage(mapId: string): number {
    const data = this.explorationMap.get(mapId);
    if (!data || data.totalTiles === 0) return 0;
    return (data.discoveredCount / data.totalTiles) * 100;
  }

  getTotalExplorationPercentage(): number {
    if (this.totalTiles === 0) return 0;
    return (this.totalDiscovered / this.totalTiles) * 100;
  }

  getAllMapsExploration(): { mapId: string; discovered: number; total: number; percentage: number }[] {
    const result: { mapId: string; discovered: number; total: number; percentage: number }[] = [];
    for (const [mapId, data] of this.explorationMap.entries()) {
      result.push({
        mapId,
        discovered: data.discoveredCount,
        total: data.totalTiles,
        percentage: this.getExplorationPercentage(mapId)
      });
    }
    return result;
  }

  // For testing: reveal all
  revealAll(mapId: string): void {
    const data = this.explorationMap.get(mapId);
    if (!data) return;
    for (let i = 0; i < data.explored.length; i++) {
      if (!data.explored[i]) {
        data.explored[i] = true;
        data.discoveredCount++;
        this.totalDiscovered++;
      }
      data.visible[i] = true;
    }
    console.log(`[Exploration] Revealed all for ${mapId}: ${data.discoveredCount}/${data.totalTiles}`);
  }

  revealAllMaps(): void {
    for (const mapId of this.explorationMap.keys()) {
      this.revealAll(mapId);
    }
  }

  // Reset
  reset(mapId?: string): void {
    if (mapId) {
      const data = this.explorationMap.get(mapId);
      if (data) {
        data.explored.fill(false);
        data.visible.fill(false);
        this.totalDiscovered -= data.discoveredCount;
        data.discoveredCount = 0;
      }
    } else {
      for (const data of this.explorationMap.values()) {
        data.explored.fill(false);
        data.visible.fill(false);
        data.discoveredCount = 0;
      }
      this.totalDiscovered = 0;
    }
    console.log(`[Exploration] Reset ${mapId ?? 'all maps'}`);
  }

  recordMapTransition(): void {
    this.mapTransitions++;
  }

  getMapTransitions(): number {
    return this.mapTransitions;
  }

  getDebugString(): string {
    return `Explored ${this.totalDiscovered}/${this.totalTiles} (${this.getTotalExplorationPercentage().toFixed(1)}%) Vision ${this.visionRadius} Trans ${this.mapTransitions}`;
  }

  getMapDebugString(mapId: string): string {
    const data = this.explorationMap.get(mapId);
    if (!data) return `${mapId} not found`;
    return `${mapId}: ${data.discoveredCount}/${data.totalTiles} (${this.getExplorationPercentage(mapId).toFixed(1)}%)`;
  }
}
