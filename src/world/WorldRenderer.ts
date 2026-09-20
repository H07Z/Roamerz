/**
 * WorldRenderer - Phase 7 (updated with zoom support)
 * Renders world map tiles with placeholder graphics
 * Supports zoom from Camera system (Phase 5)
 */

import { WorldMap } from './WorldMap';
import { TerrainType, TERRAIN_PROPERTIES } from './TerrainType';

export class WorldRenderer {
  public static readonly TILE_SIZE = 32;

  private tileSize: number = WorldRenderer.TILE_SIZE;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private zoom: number = 1;

  private animTime: number = 0;

  private showGrid: boolean = false;
  private showTileCoords: boolean = false;

  constructor() {}

  setTileSize(size: number): void {
    this.tileSize = size;
  }

  getTileSize(): number {
    return this.tileSize;
  }

  setOffset(x: number, y: number): void {
    this.offsetX = x;
    this.offsetY = y;
  }

  getOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(0.1, Math.min(zoom, 3));
  }

  getZoom(): number {
    return this.zoom;
  }

  centerOn(tileX: number, tileY: number, screenWidth: number, screenHeight: number): void {
    const worldPixelX = tileX * this.tileSize + this.tileSize / 2;
    const worldPixelY = tileY * this.tileSize + this.tileSize / 2;
    this.offsetX = worldPixelX - screenWidth / 2 / this.zoom;
    this.offsetY = worldPixelY - screenHeight / 2 / this.zoom;
  }

  centerOnTilePixel(worldPixelX: number, worldPixelY: number, screenWidth: number, screenHeight: number): void {
    this.offsetX = worldPixelX - screenWidth / 2 / this.zoom;
    this.offsetY = worldPixelY - screenHeight / 2 / this.zoom;
  }

  clampToMap(map: WorldMap, screenWidth: number, screenHeight: number): void {
    const mapPixelWidth = map.width * this.tileSize;
    const mapPixelHeight = map.height * this.tileSize;

    const scaledScreenWidth = screenWidth / this.zoom;
    const scaledScreenHeight = screenHeight / this.zoom;

    if (mapPixelWidth <= scaledScreenWidth) {
      this.offsetX = (mapPixelWidth - scaledScreenWidth) / 2;
    } else {
      this.offsetX = Math.max(0, Math.min(this.offsetX, mapPixelWidth - scaledScreenWidth));
    }

    if (mapPixelHeight <= scaledScreenHeight) {
      this.offsetY = (mapPixelHeight - scaledScreenHeight) / 2;
    } else {
      this.offsetY = Math.max(0, Math.min(this.offsetY, mapPixelHeight - scaledScreenHeight));
    }
  }

  update(deltaTime: number): void {
    this.animTime += deltaTime;
  }

  render(ctx: CanvasRenderingContext2D, map: WorldMap, screenWidth: number, screenHeight: number): void {
    const scaledTileSize = this.tileSize * this.zoom;
    const scaledScreenWidth = screenWidth / this.zoom;
    const scaledScreenHeight = screenHeight / this.zoom;

    const startCol = Math.floor(this.offsetX / this.tileSize);
    const endCol = Math.ceil((this.offsetX + scaledScreenWidth) / this.tileSize);
    const startRow = Math.floor(this.offsetY / this.tileSize);
    const endRow = Math.ceil((this.offsetY + scaledScreenHeight) / this.tileSize);

    const clampedStartCol = Math.max(0, startCol);
    const clampedEndCol = Math.min(map.width, endCol);
    const clampedStartRow = Math.max(0, startRow);
    const clampedEndRow = Math.min(map.height, endRow);

    for (let y = clampedStartRow; y < clampedEndRow; y++) {
      for (let x = clampedStartCol; x < clampedEndCol; x++) {
        const terrain = map.getTile(x, y);
        if (terrain === null) continue;

        const screenX = (x * this.tileSize - this.offsetX) * this.zoom;
        const screenY = (y * this.tileSize - this.offsetY) * this.zoom;

        this.renderTile(ctx, terrain, screenX, screenY, scaledTileSize, x, y);
      }
    }

    if (this.showGrid) {
      this.renderGrid(ctx, clampedStartCol, clampedEndCol, clampedStartRow, clampedEndRow);
    }

    this.renderMapBorder(ctx, map, screenWidth, screenHeight);
  }

  private renderTile(
    ctx: CanvasRenderingContext2D,
    terrain: TerrainType,
    x: number,
    y: number,
    size: number,
    tileX: number,
    tileY: number
  ): void {
    const props = TERRAIN_PROPERTIES[terrain];

    ctx.save();

    switch (terrain) {
      case TerrainType.GRASS:
        this.renderGrass(ctx, x, y, size, tileX, tileY);
        break;
      case TerrainType.ROAD:
        this.renderRoad(ctx, x, y, size);
        break;
      case TerrainType.WATER:
        this.renderWater(ctx, x, y, size);
        break;
      case TerrainType.BRIDGE:
        this.renderBridge(ctx, x, y, size);
        break;
      case TerrainType.TREE:
        this.renderTree(ctx, x, y, size);
        break;
      case TerrainType.ROCK:
        this.renderRock(ctx, x, y, size);
        break;
      case TerrainType.HOUSE:
        this.renderHouse(ctx, x, y, size, tileX, tileY);
        break;
      case TerrainType.FARMLAND:
        this.renderFarmland(ctx, x, y, size);
        break;
      default:
        ctx.fillStyle = props.color;
        ctx.fillRect(x, y, size, size);
    }

    if (this.showTileCoords) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `${Math.max(8, size * 0.25)}px monospace`;
      ctx.fillText(`${tileX},${tileY}`, x + 2, y + size * 0.35);
    }

    ctx.restore();
  }

  private renderGrass(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, tileX: number, tileY: number): void {
    const isDark = (tileX + tileY) % 2 === 0;
    ctx.fillStyle = isDark ? '#2d5a2d' : '#3a6b3a';
    ctx.fillRect(x, y, size, size);

    ctx.fillStyle = 'rgba(80, 140, 80, 0.3)';
    const tuftCount = ((tileX * 7 + tileY * 13) % 3) + 1;
    for (let i = 0; i < tuftCount; i++) {
      const ox = (tileX * 17 + i * 23) % (size - 6) + 3;
      const oy = (tileY * 19 + i * 29) % (size - 6) + 3;
      ctx.fillRect(x + ox, y + oy, size * 0.06, size * 0.06);
    }
  }

  private renderRoad(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = 'rgba(160, 138, 106, 0.5)';
    ctx.fillRect(x + size * 0.06, y + size * 0.06, size * 0.88, size * 0.88);
    ctx.fillStyle = 'rgba(100, 80, 50, 0.2)';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderWater(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const wave = Math.sin(this.animTime * 2 + x * 0.1) * 0.1 + 0.9;
    const r = Math.floor(42 * wave);
    const g = Math.floor(90 * wave);
    const b = Math.floor(138 * wave);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = 'rgba(100, 160, 200, 0.4)';
    ctx.lineWidth = Math.max(1, size * 0.03);
    ctx.beginPath();
    const waveOffset = Math.sin(this.animTime * 3 + y * 0.2) * size * 0.09;
    ctx.moveTo(x, y + size / 2 + waveOffset);
    ctx.lineTo(x + size, y + size / 2 + waveOffset);
    ctx.stroke();

    ctx.fillStyle = 'rgba(60, 120, 180, 0.6)';
    ctx.fillRect(x + size * 0.12, y + size / 2 + waveOffset - size * 0.03, size * 0.76, size * 0.06);
  }

  private renderBridge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#2a5a8a';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#6b4c2a';
    ctx.fillRect(x, y + size * 0.06, size, size * 0.88);
    ctx.fillStyle = '#8a6a4a';
    for (let i = 0; i < 3; i++) {
      const py = y + size * 0.18 + i * size * 0.25;
      ctx.fillRect(x + size * 0.03, py, size * 0.94, size * 0.09);
    }
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(x, y + size * 0.03, size, size * 0.06);
    ctx.fillRect(x, y + size - size * 0.09, size, size * 0.06);
  }

  private renderTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#2d5a2d';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#4a2a1a';
    const trunkW = size * 0.25;
    const trunkH = size * 0.375;
    ctx.fillRect(x + size / 2 - trunkW / 2, y + size / 2, trunkW, trunkH);
    ctx.fillStyle = '#1a4a1a';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2 - size * 0.06, size * 0.375, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2d6a2d';
    ctx.beginPath();
    ctx.arc(x + size / 2 - size * 0.06, y + size / 2 - size * 0.12, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a7a3a';
    ctx.beginPath();
    ctx.arc(x + size / 2 + size * 0.06, y + size / 2 - size * 0.18, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderRock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#3a6b3a';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.31, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.arc(x + size / 2 - size * 0.06, y + size / 2 - size * 0.06, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9a9a9a';
    ctx.beginPath();
    ctx.arc(x + size / 2 + size * 0.03, y + size / 2 - size * 0.09, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderHouse(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, tileX: number, tileY: number): void {
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(x, y, size, size);
    const isRoof = (tileX + tileY) % 2 === 0;
    if (isRoof) {
      ctx.fillStyle = '#8a3a2a';
      ctx.fillRect(x + size * 0.06, y + size * 0.06, size * 0.88, size * 0.88);
      ctx.strokeStyle = '#6a2a1a';
      ctx.lineWidth = Math.max(1, size * 0.03);
      ctx.beginPath();
      ctx.moveTo(x + size * 0.06, y + size / 2);
      ctx.lineTo(x + size * 0.94, y + size / 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#a84a3a';
      ctx.fillRect(x + size * 0.06, y + size * 0.06, size * 0.88, size * 0.88);
    }
    if ((tileX * 3 + tileY * 5) % 7 === 0) {
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(x + size / 2 - size * 0.09, y + size / 2, size * 0.18, size * 0.25);
    }
  }

  private renderFarmland(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#5a6b2a';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#4a5a1a';
    ctx.lineWidth = Math.max(1, size * 0.03);
    for (let i = size * 0.12; i < size; i += size * 0.18) {
      ctx.beginPath();
      ctx.moveTo(x, y + i);
      ctx.lineTo(x + size, y + i);
      ctx.stroke();
    }
    ctx.fillStyle = '#7a8a3a';
    ctx.fillRect(x + size * 0.18, y + size * 0.25, size * 0.09, size * 0.09);
    ctx.fillRect(x + size * 0.56, y + size * 0.43, size * 0.09, size * 0.09);
    ctx.fillRect(x + size * 0.31, y + size * 0.68, size * 0.09, size * 0.09);
  }

  private renderGrid(ctx: CanvasRenderingContext2D, startCol: number, endCol: number, startRow: number, endRow: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;

    for (let x = startCol; x <= endCol; x++) {
      const screenX = (x * this.tileSize - this.offsetX) * this.zoom;
      ctx.beginPath();
      ctx.moveTo(screenX, (startRow * this.tileSize - this.offsetY) * this.zoom);
      ctx.lineTo(screenX, (endRow * this.tileSize - this.offsetY) * this.zoom);
      ctx.stroke();
    }

    for (let y = startRow; y <= endRow; y++) {
      const screenY = (y * this.tileSize - this.offsetY) * this.zoom;
      ctx.beginPath();
      ctx.moveTo((startCol * this.tileSize - this.offsetX) * this.zoom, screenY);
      ctx.lineTo((endCol * this.tileSize - this.offsetX) * this.zoom, screenY);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderMapBorder(ctx: CanvasRenderingContext2D, map: WorldMap, screenWidth: number, screenHeight: number): void {
    ctx.save();
    const mapPixelWidth = map.width * this.tileSize;
    const mapPixelHeight = map.height * this.tileSize;

    const borderLeft = -this.offsetX * this.zoom;
    const borderTop = -this.offsetY * this.zoom;
    const borderRight = (mapPixelWidth - this.offsetX) * this.zoom;
    const borderBottom = (mapPixelHeight - this.offsetY) * this.zoom;

    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);

    if (borderTop >= 0 && borderTop <= screenHeight) {
      ctx.beginPath();
      ctx.moveTo(Math.max(0, borderLeft), borderTop);
      ctx.lineTo(Math.min(screenWidth, borderRight), borderTop);
      ctx.stroke();
    }
    if (borderBottom >= 0 && borderBottom <= screenHeight) {
      ctx.beginPath();
      ctx.moveTo(Math.max(0, borderLeft), borderBottom);
      ctx.lineTo(Math.min(screenWidth, borderRight), borderBottom);
      ctx.stroke();
    }
    if (borderLeft >= 0 && borderLeft <= screenWidth) {
      ctx.beginPath();
      ctx.moveTo(borderLeft, Math.max(0, borderTop));
      ctx.lineTo(borderLeft, Math.min(screenHeight, borderBottom));
      ctx.stroke();
    }
    if (borderRight >= 0 && borderRight <= screenWidth) {
      ctx.beginPath();
      ctx.moveTo(borderRight, Math.max(0, borderTop));
      ctx.lineTo(borderRight, Math.min(screenHeight, borderBottom));
      ctx.stroke();
    }

    ctx.restore();
  }

  setShowGrid(show: boolean): void {
    this.showGrid = show;
  }

  setShowTileCoords(show: boolean): void {
    this.showTileCoords = show;
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.offsetX) * this.zoom,
      y: (worldY - this.offsetY) * this.zoom
    };
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX / this.zoom + this.offsetX,
      y: screenY / this.zoom + this.offsetY
    };
  }

  screenToTile(screenX: number, screenY: number): { x: number; y: number } {
    const world = this.screenToWorld(screenX, screenY);
    return {
      x: Math.floor(world.x / this.tileSize),
      y: Math.floor(world.y / this.tileSize)
    };
  }
}
