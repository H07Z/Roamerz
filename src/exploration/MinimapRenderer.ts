/**
 * MinimapRenderer - Phase 12 Exploration & World Expansion
 * Renders minimap showing explored tiles, player, NPCs, buildings
 */

import { WorldMap } from '../world/WorldMap';
import { ExplorationSystem } from './ExplorationSystem';
import { TerrainType } from '../world/TerrainType';

export class MinimapRenderer {
  private showMinimap: boolean = true;
  private minimapSize: number = 150;
  private minimapX: number = 10;
  private minimapY: number = 10;
  private scale: number = 3; // pixels per tile

  constructor() {}

  setShowMinimap(show: boolean): void {
    this.showMinimap = show;
  }

  isShowMinimap(): boolean {
    return this.showMinimap;
  }

  setSize(size: number): void {
    this.minimapSize = size;
  }

  setPosition(x: number, y: number): void {
    this.minimapX = x;
    this.minimapY = y;
  }

  render(
    ctx: CanvasRenderingContext2D,
    map: WorldMap,
    explorationSystem: ExplorationSystem,
    player: { x: number; y: number; getTilePosition: () => { x: number; y: number } } | null,
    npcs: { id: string; x: number; y: number; getTilePosition: () => { x: number; y: number }; role: string }[],
    buildings: { id: string; x: number; y: number; type: any }[],
    screenWidth: number,
    screenHeight: number
  ): void {
    if (!this.showMinimap) return;
    if (!map) return;

    const data = explorationSystem.getExploredData(map.mapId);
    if (!data) return;

    ctx.save();

    // Position at top-right by default
    const padding = 10;
    const boxWidth = this.minimapSize;
    const boxHeight = this.minimapSize;
    const x = screenWidth - boxWidth - padding;
    const y = padding;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${map.name} (${explorationSystem.getExplorationPercentage(map.mapId).toFixed(0)}%)`, x + 5, y + 5);

    // Calculate scale to fit map into minimap
    const mapWidth = map.width;
    const mapHeight = map.height;
    const scaleX = (boxWidth - 10) / mapWidth;
    const scaleY = (boxHeight - 20) / mapHeight;
    const scale = Math.min(scaleX, scaleY, 3);

    const offsetX = x + 5;
    const offsetY = y + 15;

    // Render explored tiles
    for (let ty = 0; ty < mapHeight; ty++) {
      for (let tx = 0; tx < mapWidth; tx++) {
        const idx = ty * mapWidth + tx;
        const explored = data.explored[idx];
        const visible = data.visible[idx];

        if (!explored) {
          // Unexplored - black
          continue;
        }

        const terrain = map.getTile(tx, ty);
        if (terrain === null) continue;

        let color: string;
        switch (terrain) {
          case TerrainType.GRASS:
            color = visible ? '#2d5a2d' : '#1a3a1a';
            break;
          case TerrainType.ROAD:
            color = visible ? '#8B7355' : '#5a4a3a';
            break;
          case TerrainType.WATER:
            color = visible ? '#2a5a8a' : '#1a3a5a';
            break;
          case TerrainType.BRIDGE:
            color = visible ? '#6b4c2a' : '#4a3a2a';
            break;
          case TerrainType.TREE:
            color = visible ? '#1a4a1a' : '#0a2a0a';
            break;
          case TerrainType.ROCK:
            color = visible ? '#5a5a5a' : '#3a3a3a';
            break;
          case TerrainType.HOUSE:
            color = visible ? '#8a5a3a' : '#5a3a2a';
            break;
          case TerrainType.FARMLAND:
            color = visible ? '#5a6b2a' : '#3a4a1a';
            break;
          default:
            color = '#000';
        }

        ctx.fillStyle = color;
        ctx.fillRect(offsetX + tx * scale, offsetY + ty * scale, scale, scale);
      }
    }

    // Render buildings as small squares
    for (const building of buildings) {
      const idx = building.y * mapWidth + building.x;
      if (idx < 0 || idx >= data.explored.length) continue;
      if (!data.explored[idx]) continue;

      ctx.fillStyle = '#a0a0a0';
      ctx.fillRect(offsetX + building.x * scale, offsetY + building.y * scale, scale * 2, scale * 2);
    }

    // Render NPCs as colored dots
    for (const npc of npcs) {
      const tile = npc.getTilePosition();
      const idx = tile.y * mapWidth + tile.x;
      if (idx < 0 || idx >= data.explored.length) continue;
      if (!data.explored[idx]) continue;

      let color = '#ff0';
      switch (npc.role) {
        case 'FARMER': color = '#8f8'; break;
        case 'SHOPKEEPER': color = '#ff8'; break;
        case 'BLACKSMITH': color = '#f88'; break;
        case 'VILLAGER': color = '#8ff'; break;
        case 'CHILD': color = '#f8f'; break;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(offsetX + tile.x * scale + scale/2, offsetY + tile.y * scale + scale/2, scale * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render player as white dot
    if (player) {
      const tile = player.getTilePosition();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(offsetX + tile.x * scale + scale/2, offsetY + tile.y * scale + scale/2, scale, 0, Math.PI * 2);
      ctx.fill();

      // Vision circle on minimap
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(
        offsetX + tile.x * scale + scale/2,
        offsetY + tile.y * scale + scale/2,
        explorationSystem.getVisionRadius() * scale,
        0, Math.PI * 2
      );
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, mapWidth * scale, mapHeight * scale);

    // Instructions
    ctx.fillStyle = '#aaa';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TAB minimap', x + boxWidth/2, y + boxHeight - 5);

    ctx.restore();
  }

  // Render full exploration overlay (optional large minimap)
  renderFullMap(
    ctx: CanvasRenderingContext2D,
    map: WorldMap,
    explorationSystem: ExplorationSystem,
    screenWidth: number,
    screenHeight: number
  ): void {
    const data = explorationSystem.getExploredData(map.mapId);
    if (!data) return;

    ctx.save();

    const padding = 20;
    const boxWidth = Math.min(screenWidth - padding * 2, 400);
    const boxHeight = Math.min(screenHeight - padding * 2, 400);
    const x = screenWidth / 2 - boxWidth / 2;
    const y = screenHeight / 2 - boxHeight / 2;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${map.name} - Exploration ${explorationSystem.getExplorationPercentage(map.mapId).toFixed(1)}%`, x + boxWidth/2, y + 10);

    // Map
    const mapWidth = map.width;
    const mapHeight = map.height;
    const scaleX = (boxWidth - 20) / mapWidth;
    const scaleY = (boxHeight - 40) / mapHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = x + (boxWidth - mapWidth * scale) / 2;
    const offsetY = y + 25;

    for (let ty = 0; ty < mapHeight; ty++) {
      for (let tx = 0; tx < mapWidth; tx++) {
        const idx = ty * mapWidth + tx;
        const explored = data.explored[idx];
        if (!explored) {
          ctx.fillStyle = '#000';
          ctx.fillRect(offsetX + tx * scale, offsetY + ty * scale, scale, scale);
          continue;
        }

        const terrain = map.getTile(tx, ty);
        if (terrain === null) continue;

        let color: string;
        switch (terrain) {
          case TerrainType.GRASS: color = '#2d5a2d'; break;
          case TerrainType.ROAD: color = '#8B7355'; break;
          case TerrainType.WATER: color = '#2a5a8a'; break;
          case TerrainType.BRIDGE: color = '#6b4c2a'; break;
          case TerrainType.TREE: color = '#1a4a1a'; break;
          case TerrainType.ROCK: color = '#5a5a5a'; break;
          case TerrainType.HOUSE: color = '#8a5a3a'; break;
          case TerrainType.FARMLAND: color = '#5a6b2a'; break;
          default: color = '#000';
        }

        ctx.fillStyle = color;
        ctx.fillRect(offsetX + tx * scale, offsetY + ty * scale, scale, scale);
      }
    }

    ctx.fillStyle = '#aaa';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press M to close full map', x + boxWidth/2, y + boxHeight - 10);

    ctx.restore();
  }
}
