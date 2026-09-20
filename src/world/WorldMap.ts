/**
 * WorldMap - Phase 2
 * Holds tile data for a single map/area
 * Data-driven design: map data separate from logic
 */

import { TerrainType } from './TerrainType';

export interface WorldMapData {
  mapId: string;
  name: string;
  width: number;
  height: number;
  tiles: number[]; // Flat array: y * width + x = TerrainType
  // Optional metadata
  description?: string;
  // For future phases
  entrances?: { x: number; y: number; targetMap: string }[];
  houses?: { id: string; x: number; y: number; width: number; height: number }[];
}

export class WorldMap {
  public readonly mapId: string;
  public readonly name: string;
  public readonly width: number;
  public readonly height: number;
  public readonly description: string;

  private tiles: TerrainType[];
  public readonly houses: { id: string; x: number; y: number; width: number; height: number }[];
  public readonly entrances: { x: number; y: number; targetMap: string }[];

  constructor(data: WorldMapData) {
    this.mapId = data.mapId;
    this.name = data.name;
    this.width = data.width;
    this.height = data.height;
    this.description = data.description ?? '';
    this.tiles = data.tiles as TerrainType[];
    this.houses = data.houses ?? [];
    this.entrances = data.entrances ?? [];

    this.validate();
  }

  private validate(): void {
    const expected = this.width * this.height;
    if (this.tiles.length !== expected) {
      throw new Error(
        `Map ${this.mapId} corrupted: expected ${expected} tiles (${this.width}x${this.height}), got ${this.tiles.length}`
      );
    }

    // Check for invalid terrain types
    for (let i = 0; i < this.tiles.length; i++) {
      const t = this.tiles[i];
      if (t < 0 || t > 7 || !Number.isInteger(t)) {
        const x = i % this.width;
        const y = Math.floor(i / this.width);
        throw new Error(`Map ${this.mapId} corrupted: invalid terrain ${t} at (${x},${y})`);
      }
    }

    console.log(`[WorldMap] Loaded ${this.mapId}: ${this.width}x${this.height} = ${this.tiles.length} tiles`);
  }

  getTile(x: number, y: number): TerrainType | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    return this.tiles[y * this.width + x];
  }

  setTile(x: number, y: number, type: TerrainType): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    this.tiles[y * this.width + x] = type;
    return true;
  }

  getTiles(): TerrainType[] {
    return [...this.tiles];
  }

  getData(): WorldMapData {
    return {
      mapId: this.mapId,
      name: this.name,
      width: this.width,
      height: this.height,
      tiles: [...this.tiles],
      description: this.description,
      houses: [...this.houses],
      entrances: [...this.entrances]
    };
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  getTileCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const tile of this.tiles) {
      const key = TerrainType[tile];
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  // Debug: get ASCII representation of a region
  getAsciiRegion(startX: number, startY: number, w: number, h: number): string {
    let out = '';
    for (let y = startY; y < startY + h && y < this.height; y++) {
      for (let x = startX; x < startX + w && x < this.width; x++) {
        const t = this.getTile(x, y);
        if (t === null) out += '?';
        else {
          const chars = ['.', '=', '~', '#', 'T', 'O', 'H', 'F'];
          out += chars[t] ?? '?';
        }
      }
      out += '\n';
    }
    return out;
  }
}
