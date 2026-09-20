/**
 * ExplorationRenderer - Phase 12 Exploration & World Expansion
 * Renders fog of war: unexplored black, explored but not visible dim
 */

import { WorldRenderer } from '../world/WorldRenderer';
import { ExplorationSystem } from './ExplorationSystem';
import { Camera } from '../camera/Camera';

export class ExplorationRenderer {
  private showFog: boolean = true;
  private showExploredDim: boolean = true;

  constructor() {}

  setShowFog(show: boolean): void {
    this.showFog = show;
  }

  setShowExploredDim(show: boolean): void {
    this.showExploredDim = show;
  }

  isShowFog(): boolean {
    return this.showFog;
  }

  renderFog(
    ctx: CanvasRenderingContext2D,
    worldRenderer: WorldRenderer,
    camera: Camera,
    explorationSystem: ExplorationSystem,
    mapId: string,
    screenWidth: number,
    screenHeight: number
  ): void {
    if (!this.showFog) return;

    const data = explorationSystem.getExploredData(mapId);
    if (!data) return;

    const tileSize = worldRenderer.getTileSize();
    const zoom = worldRenderer.getZoom();
    const offset = camera.getOffset();
    const scaledTileSize = tileSize * zoom;
    const scaledScreenWidth = screenWidth / zoom;
    const scaledScreenHeight = screenHeight / zoom;

    const startCol = Math.floor(offset.x / tileSize);
    const endCol = Math.ceil((offset.x + scaledScreenWidth) / tileSize);
    const startRow = Math.floor(offset.y / tileSize);
    const endRow = Math.ceil((offset.y + scaledScreenHeight) / tileSize);

    const clampedStartCol = Math.max(0, startCol);
    const clampedEndCol = Math.min(data.width, endCol);
    const clampedStartRow = Math.max(0, startRow);
    const clampedEndRow = Math.min(data.height, endRow);

    ctx.save();

    for (let y = clampedStartRow; y < clampedEndRow; y++) {
      for (let x = clampedStartCol; x < clampedEndCol; x++) {
        const idx = y * data.width + x;
        const explored = data.explored[idx];
        const visible = data.visible[idx];

        const screenX = (x * tileSize - offset.x) * zoom;
        const screenY = (y * tileSize - offset.y) * zoom;

        if (!explored) {
          // Unexplored - full black fog
          ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
          ctx.fillRect(screenX, screenY, scaledTileSize + 1, scaledTileSize + 1);
        } else if (!visible && this.showExploredDim) {
          // Explored but not currently visible - dim
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(screenX, screenY, scaledTileSize + 1, scaledTileSize + 1);
        }
        // If visible, no fog
      }
    }

    ctx.restore();
  }

  // Render vision circle debug (optional)
  renderVisionDebug(
    ctx: CanvasRenderingContext2D,
    worldRenderer: WorldRenderer,
    camera: Camera,
    playerX: number,
    playerY: number,
    visionRadius: number
  ): void {
    ctx.save();
    const screenPos = worldRenderer.worldToScreen(playerX, playerY);
    // Apply camera offset already in worldToScreen? WorldRenderer worldToScreen uses offset and zoom
    // Actually worldToScreen does (world - offset)*zoom
    const radiusPixels = visionRadius * worldRenderer.getTileSize() * worldRenderer.getZoom();

    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, radiusPixels, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
