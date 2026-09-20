/**
 * WorldRenderer - Phase 2
 * Renders world map tiles with placeholder graphics
 * Separate from world logic and game logic
 */

import { WorldMap } from './WorldMap';
import { TerrainType, TERRAIN_PROPERTIES } from './TerrainType';

export class WorldRenderer {
  public static readonly TILE_SIZE = 32;

  private tileSize: number = WorldRenderer.TILE_SIZE;
  private offsetX: number = 0;
  private offsetY: number = 0;

  // For subtle water animation
  private animTime: number = 0;

  // Debug options
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

  centerOn(tileX: number, tileY: number, screenWidth: number, screenHeight: number): void {
    const worldPixelX = tileX * this.tileSize + this.tileSize / 2;
    const worldPixelY = tileY * this.tileSize + this.tileSize / 2;
    this.offsetX = worldPixelX - screenWidth / 2;
    this.offsetY = worldPixelY - screenHeight / 2;
  }

  // Clamp offset to map boundaries
  clampToMap(map: WorldMap, screenWidth: number, screenHeight: number): void {
    const mapPixelWidth = map.width * this.tileSize;
    const mapPixelHeight = map.height * this.tileSize;

    // If map smaller than screen, center it
    if (mapPixelWidth <= screenWidth) {
      this.offsetX = (mapPixelWidth - screenWidth) / 2;
    } else {
      this.offsetX = Math.max(0, Math.min(this.offsetX, mapPixelWidth - screenWidth));
    }

    if (mapPixelHeight <= screenHeight) {
      this.offsetY = (mapPixelHeight - screenHeight) / 2;
    } else {
      this.offsetY = Math.max(0, Math.min(this.offsetY, mapPixelHeight - screenHeight));
    }
  }

  update(deltaTime: number): void {
    this.animTime += deltaTime;
  }

  render(ctx: CanvasRenderingContext2D, map: WorldMap, screenWidth: number, screenHeight: number): void {
    // Calculate visible tile range
    const startCol = Math.floor(this.offsetX / this.tileSize);
    const endCol = Math.ceil((this.offsetX + screenWidth) / this.tileSize);
    const startRow = Math.floor(this.offsetY / this.tileSize);
    const endRow = Math.ceil((this.offsetY + screenHeight) / this.tileSize);

    const clampedStartCol = Math.max(0, startCol);
    const clampedEndCol = Math.min(map.width, endCol);
    const clampedStartRow = Math.max(0, startRow);
    const clampedEndRow = Math.min(map.height, endRow);

    // Render tiles
    for (let y = clampedStartRow; y < clampedEndRow; y++) {
      for (let x = clampedStartCol; x < clampedEndCol; x++) {
        const terrain = map.getTile(x, y);
        if (terrain === null) continue;

        const screenX = x * this.tileSize - this.offsetX;
        const screenY = y * this.tileSize - this.offsetY;

        this.renderTile(ctx, terrain, screenX, screenY, this.tileSize, x, y);
      }
    }

    // Optional grid
    if (this.showGrid) {
      this.renderGrid(ctx, clampedStartCol, clampedEndCol, clampedStartRow, clampedEndRow);
    }

    // Render map border to show boundaries exist
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
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '8px monospace';
      ctx.fillText(`${tileX},${tileY}`, x + 2, y + 10);
    }

    ctx.restore();
  }

  private renderGrass(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, tileX: number, tileY: number): void {
    // Checker pattern for visual distinction
    const isDark = (tileX + tileY) % 2 === 0;
    ctx.fillStyle = isDark ? '#2d5a2d' : '#3a6b3a';
    ctx.fillRect(x, y, size, size);

    // Small grass tufts
    ctx.fillStyle = 'rgba(80, 140, 80, 0.3)';
    const tuftCount = ((tileX * 7 + tileY * 13) % 3) + 1;
    for (let i = 0; i < tuftCount; i++) {
      const ox = (tileX * 17 + i * 23) % (size - 6) + 3;
      const oy = (tileY * 19 + i * 29) % (size - 6) + 3;
      ctx.fillRect(x + ox, y + oy, 2, 2);
    }
  }

  private renderRoad(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x, y, size, size);

    // Dirt texture
    ctx.fillStyle = 'rgba(160, 138, 106, 0.5)';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

    // Center line dots for path
    ctx.fillStyle = 'rgba(100, 80, 50, 0.2)';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderWater(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    // Animated water color
    const wave = Math.sin(this.animTime * 2 + x * 0.1) * 0.1 + 0.9;
    const r = Math.floor(42 * wave);
    const g = Math.floor(90 * wave);
    const b = Math.floor(138 * wave);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, size, size);

    // Wave lines
    ctx.strokeStyle = 'rgba(100, 160, 200, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const waveOffset = Math.sin(this.animTime * 3 + y * 0.2) * 3;
    ctx.moveTo(x, y + size / 2 + waveOffset);
    ctx.lineTo(x + size, y + size / 2 + waveOffset);
    ctx.stroke();

    ctx.fillStyle = 'rgba(60, 120, 180, 0.6)';
    ctx.fillRect(x + 4, y + size / 2 + waveOffset - 1, size - 8, 2);
  }

  private renderBridge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    // Water underneath
    ctx.fillStyle = '#2a5a8a';
    ctx.fillRect(x, y, size, size);

    // Bridge planks
    ctx.fillStyle = '#6b4c2a';
    ctx.fillRect(x, y + 2, size, size - 4);

    ctx.fillStyle = '#8a6a4a';
    // Plank lines
    for (let i = 0; i < 3; i++) {
      const py = y + 6 + i * 8;
      ctx.fillRect(x + 1, py, size - 2, 3);
    }

    // Rope / rail
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(x, y + 1, size, 2);
    ctx.fillRect(x, y + size - 3, size, 2);
  }

  private renderTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    // Grass base
    ctx.fillStyle = '#2d5a2d';
    ctx.fillRect(x, y, size, size);

    // Trunk
    ctx.fillStyle = '#4a2a1a';
    const trunkW = 8;
    const trunkH = 12;
    ctx.fillRect(x + size / 2 - trunkW / 2, y + size / 2, trunkW, trunkH);

    // Leaves - layered circles for distinguishable look
    ctx.fillStyle = '#1a4a1a';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2 - 2, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2d6a2d';
    ctx.beginPath();
    ctx.arc(x + size / 2 - 2, y + size / 2 - 4, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3a7a3a';
    ctx.beginPath();
    ctx.arc(x + size / 2 + 2, y + size / 2 - 6, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderRock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#3a6b3a';
    ctx.fillRect(x, y, size, size);

    // Rock
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.arc(x + size / 2 - 2, y + size / 2 - 2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#9a9a9a';
    ctx.beginPath();
    ctx.arc(x + size / 2 + 1, y + size / 2 - 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderHouse(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, tileX: number, tileY: number): void {
    // House wall
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(x, y, size, size);

    // Roof / wall pattern - darker if edge to show building shape
    // For simplicity, check if neighbor is also house to determine if interior or wall
    // Since we don't have neighbor info here, use visual pattern based on tile position modulo
    const isRoof = (tileX + tileY) % 2 === 0; // simple checker to indicate house tiles

    if (isRoof) {
      ctx.fillStyle = '#8a3a2a';
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

      // Roof tiles line
      ctx.strokeStyle = '#6a2a1a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + size / 2);
      ctx.lineTo(x + size - 2, y + size / 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#a84a3a';
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    }

    // Door/window hint - small dark rect occasionally
    if ((tileX * 3 + tileY * 5) % 7 === 0) {
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(x + size / 2 - 3, y + size / 2, 6, 8);
    }
  }

  private renderFarmland(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#5a6b2a';
    ctx.fillRect(x, y, size, size);

    // Furrows
    ctx.strokeStyle = '#4a5a1a';
    ctx.lineWidth = 1;
    for (let i = 4; i < size; i += 6) {
      ctx.beginPath();
      ctx.moveTo(x, y + i);
      ctx.lineTo(x + size, y + i);
      ctx.stroke();
    }

    // Crops dots
    ctx.fillStyle = '#7a8a3a';
    ctx.fillRect(x + 6, y + 8, 3, 3);
    ctx.fillRect(x + 18, y + 14, 3, 3);
    ctx.fillRect(x + 10, y + 22, 3, 3);
  }

  private renderGrid(ctx: CanvasRenderingContext2D, startCol: number, endCol: number, startRow: number, endRow: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;

    for (let x = startCol; x <= endCol; x++) {
      const screenX = x * this.tileSize - this.offsetX;
      ctx.beginPath();
      ctx.moveTo(screenX, startRow * this.tileSize - this.offsetY);
      ctx.lineTo(screenX, endRow * this.tileSize - this.offsetY);
      ctx.stroke();
    }

    for (let y = startRow; y <= endRow; y++) {
      const screenY = y * this.tileSize - this.offsetY;
      ctx.beginPath();
      ctx.moveTo(startCol * this.tileSize - this.offsetX, screenY);
      ctx.lineTo(endCol * this.tileSize - this.offsetX, screenY);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderMapBorder(ctx: CanvasRenderingContext2D, map: WorldMap, screenWidth: number, screenHeight: number): void {
    ctx.save();
    const mapPixelWidth = map.width * this.tileSize;
    const mapPixelHeight = map.height * this.tileSize;

    const borderLeft = -this.offsetX;
    const borderTop = -this.offsetY;
    const borderRight = mapPixelWidth - this.offsetX;
    const borderBottom = mapPixelHeight - this.offsetY;

    // Only render if visible
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);

    // Top
    if (borderTop >= 0 && borderTop <= screenHeight) {
      ctx.beginPath();
      ctx.moveTo(Math.max(0, borderLeft), borderTop);
      ctx.lineTo(Math.min(screenWidth, borderRight), borderTop);
      ctx.stroke();
    }
    // Bottom
    if (borderBottom >= 0 && borderBottom <= screenHeight) {
      ctx.beginPath();
      ctx.moveTo(Math.max(0, borderLeft), borderBottom);
      ctx.lineTo(Math.min(screenWidth, borderRight), borderBottom);
      ctx.stroke();
    }
    // Left
    if (borderLeft >= 0 && borderLeft <= screenWidth) {
      ctx.beginPath();
      ctx.moveTo(borderLeft, Math.max(0, borderTop));
      ctx.lineTo(borderLeft, Math.min(screenHeight, borderBottom));
      ctx.stroke();
    }
    // Right
    if (borderRight >= 0 && borderRight <= screenWidth) {
      ctx.beginPath();
      ctx.moveTo(borderRight, Math.max(0, borderTop));
      ctx.lineTo(borderRight, Math.min(screenHeight, borderBottom));
      ctx.stroke();
    }

    ctx.restore();
  }

  // Debug helpers
  setShowGrid(show: boolean): void {
    this.showGrid = show;
  }

  setShowTileCoords(show: boolean): void {
    this.showTileCoords = show;
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX - this.offsetX,
      y: worldY - this.offsetY
    };
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX + this.offsetX,
      y: screenY + this.offsetY
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
