/**
 * BuildingRenderer - Phase 8 NPC Homes & Buildings
 * Renders building overlays, doors, labels, ownership
 */

import { Building } from './Building';
import { BuildingType } from './BuildingType';
import { WorldRenderer } from '../world/WorldRenderer';
import { Camera } from '../camera/Camera';

export class BuildingRenderer {
  constructor() {}

  render(
    ctx: CanvasRenderingContext2D,
    buildings: Building[],
    worldRenderer: WorldRenderer,
    camera?: Camera,
    options: {
      showDoors?: boolean;
      showLabels?: boolean;
      showOwnership?: boolean;
      showBlocked?: boolean;
    } = {}
  ): void {
    const showDoors = options.showDoors ?? true;
    const showLabels = options.showLabels ?? false;
    const showOwnership = options.showOwnership ?? false;
    const showBlocked = options.showBlocked ?? false;

    for (const building of buildings) {
      if (showBlocked) {
        this.renderBlockedOverlay(ctx, building, worldRenderer, camera);
      }
      if (showDoors) {
        this.renderDoor(ctx, building, worldRenderer, camera);
      }
      if (showLabels) {
        this.renderLabel(ctx, building, worldRenderer, camera);
      }
      if (showOwnership) {
        this.renderOwnership(ctx, building, worldRenderer, camera);
      }
    }
  }

  renderDoor(
    ctx: CanvasRenderingContext2D,
    building: Building,
    worldRenderer: WorldRenderer,
    camera?: Camera
  ): void {
    const tileSize = worldRenderer.getTileSize();
    const zoom = camera ? camera.getZoom() : worldRenderer.getZoom();

    let screenPos: { x: number; y: number };
    const worldX = building.door.worldX;
    const worldY = building.door.worldY;

    if (camera) {
      screenPos = camera.worldToScreen(worldX, worldY);
    } else {
      screenPos = worldRenderer.worldToScreen(worldX, worldY);
    }

    const s = zoom;
    const size = tileSize * s;

    // Check if off-screen
    if (screenPos.x < -size || screenPos.y < -size ||
        screenPos.x > ctx.canvas.width + size || screenPos.y > ctx.canvas.height + size) {
      return;
    }

    ctx.save();

    // Door background - brown rectangle
    const doorWidth = size * 0.6;
    const doorHeight = size * 0.8;
    const doorX = screenPos.x - doorWidth / 2;
    const doorY = screenPos.y - doorHeight / 2;

    // Different color per building type
    const typeColor = building.getTypeProperties().doorColor;
    ctx.fillStyle = typeColor;
    ctx.fillRect(doorX, doorY, doorWidth, doorHeight);

    // Door frame
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(doorX, doorY, doorWidth, doorHeight);

    // Door knob
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(
      doorX + (building.door.facing === 'west' ? doorWidth * 0.2 : doorWidth * 0.8),
      doorY + doorHeight * 0.5,
      2 * s,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Door open indicator if open
    if (building.getIsDoorOpen()) {
      ctx.fillStyle = 'rgba(100, 255, 100, 0.6)';
      ctx.fillRect(doorX - 2, doorY - 2, doorWidth + 4, doorHeight + 4);
    }

    // Small arrow showing facing direction
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const arrowSize = 4 * s;
    let arrowX = screenPos.x;
    let arrowY = screenPos.y;
    switch (building.door.facing) {
      case 'north':
        arrowY = doorY - arrowSize - 2;
        break;
      case 'south':
        arrowY = doorY + doorHeight + arrowSize + 2;
        break;
      case 'east':
        arrowX = doorX + doorWidth + arrowSize + 2;
        break;
      case 'west':
        arrowX = doorX - arrowSize - 2;
        break;
    }
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY - arrowSize);
    ctx.lineTo(arrowX - arrowSize, arrowY + arrowSize);
    ctx.lineTo(arrowX + arrowSize, arrowY + arrowSize);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  renderLabel(
    ctx: CanvasRenderingContext2D,
    building: Building,
    worldRenderer: WorldRenderer,
    camera?: Camera
  ): void {
    const tileSize = worldRenderer.getTileSize();
    const zoom = camera ? camera.getZoom() : worldRenderer.getZoom();
    const s = zoom;

    const center = building.getCenterWorldPosition(tileSize);
    let screenPos: { x: number; y: number };
    if (camera) {
      screenPos = camera.worldToScreen(center.x, center.y);
    } else {
      screenPos = worldRenderer.worldToScreen(center.x, center.y);
    }

    // Off-screen culling
    if (screenPos.x < -100 || screenPos.y < -100 ||
        screenPos.x > ctx.canvas.width + 100 || screenPos.y > ctx.canvas.height + 100) {
      return;
    }

    ctx.save();

    // Building name label above building
    const labelY = screenPos.y - (building.height * tileSize * s) / 2 - 10 * s;

    // Background
    const text = `${building.id} ${building.name}`;
    ctx.font = `${Math.max(8, 9 * s)}px monospace`;
    const metrics = ctx.measureText(text);
    const padding = 4 * s;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 12 * s + padding;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(screenPos.x - bgWidth / 2, labelY - bgHeight, bgWidth, bgHeight);

    // Border color by type
    const typeColor = building.getTypeProperties().color;
    ctx.strokeStyle = typeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(screenPos.x - bgWidth / 2, labelY - bgHeight, bgWidth, bgHeight);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, screenPos.x, labelY - bgHeight / 2);

    // Type indicator
    ctx.fillStyle = typeColor;
    ctx.font = `${Math.max(7, 8 * s)}px monospace`;
    ctx.fillText(BuildingType[building.type], screenPos.x, labelY - bgHeight - 6 * s);

    ctx.restore();
  }

  renderOwnership(
    ctx: CanvasRenderingContext2D,
    building: Building,
    worldRenderer: WorldRenderer,
    camera?: Camera
  ): void {
    if (!building.ownerId) return;

    const tileSize = worldRenderer.getTileSize();
    const zoom = camera ? camera.getZoom() : worldRenderer.getZoom();
    const s = zoom;

    const center = building.getCenterWorldPosition(tileSize);
    let screenPos: { x: number; y: number };
    if (camera) {
      screenPos = camera.worldToScreen(center.x, center.y);
    } else {
      screenPos = worldRenderer.worldToScreen(center.x, center.y);
    }

    if (screenPos.x < -50 || screenPos.y < -50 ||
        screenPos.x > ctx.canvas.width + 50 || screenPos.y > ctx.canvas.height + 50) {
      return;
    }

    ctx.save();

    // Owner label
    const ownerText = `Owner: ${building.ownerId}`;
    ctx.font = `${Math.max(7, 8 * s)}px monospace`;
    const metrics = ctx.measureText(ownerText);
    const padding = 3 * s;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 10 * s + padding;

    const y = screenPos.y + (building.height * tileSize * s) / 2 + 5 * s;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(screenPos.x - bgWidth / 2, y, bgWidth, bgHeight);

    ctx.fillStyle = '#8f8';
    ctx.textAlign = 'center';
    ctx.fillText(ownerText, screenPos.x, y + bgHeight / 2 + 1 * s);

    // Occupied indicator
    if (building.getIsOccupied()) {
      ctx.fillStyle = '#ff8';
      ctx.beginPath();
      ctx.arc(screenPos.x + bgWidth / 2 + 5 * s, y + bgHeight / 2, 3 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderBlockedOverlay(
    ctx: CanvasRenderingContext2D,
    building: Building,
    worldRenderer: WorldRenderer,
    camera?: Camera
  ): void {
    const tileSize = worldRenderer.getTileSize();
    const zoom = camera ? camera.getZoom() : worldRenderer.getZoom();
    const s = zoom;

    ctx.save();

    const blockedTiles = building.getBlockedTiles();
    for (const tile of blockedTiles) {
      const worldX = tile.x * tileSize + tileSize / 2;
      const worldY = tile.y * tileSize + tileSize / 2;
      let screenPos: { x: number; y: number };
      if (camera) {
        screenPos = camera.worldToScreen(worldX, worldY);
      } else {
        screenPos = worldRenderer.worldToScreen(worldX, worldY);
      }

      const size = tileSize * s;
      const x = screenPos.x - size / 2;
      const y = screenPos.y - size / 2;

      if (x < -size || y < -size || x > ctx.canvas.width + size || y > ctx.canvas.height + size) {
        continue;
      }

      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(100, 100, 255, 0.1)';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = 'rgba(100, 100, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);
    }

    ctx.restore();
  }

  renderAll(
    ctx: CanvasRenderingContext2D,
    buildings: Building[],
    worldRenderer: WorldRenderer,
    camera?: Camera,
    options: {
      showDoors?: boolean;
      showLabels?: boolean;
      showOwnership?: boolean;
      showBlocked?: boolean;
    } = {}
  ): void {
    // Sort by Y for proper overlap
    const sorted = [...buildings].sort((a, b) => a.y - b.y);
    this.render(ctx, sorted, worldRenderer, camera, options);
  }

  // Render front-of-door positions for debugging pathfinding to homes
  renderFrontOfDoor(
    ctx: CanvasRenderingContext2D,
    building: Building,
    worldRenderer: WorldRenderer,
    camera?: Camera
  ): void {
    const tileSize = worldRenderer.getTileSize();
    const zoom = camera ? camera.getZoom() : worldRenderer.getZoom();
    const s = zoom;

    const front = building.getFrontOfDoorPosition(tileSize);
    let screenPos: { x: number; y: number };
    if (camera) {
      screenPos = camera.worldToScreen(front.x, front.y);
    } else {
      screenPos = worldRenderer.worldToScreen(front.x, front.y);
    }

    ctx.save();

    // Front tile indicator
    ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
    ctx.fillRect(screenPos.x - (tileSize * s) / 2, screenPos.y - (tileSize * s) / 2, tileSize * s, tileSize * s);

    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(screenPos.x - (tileSize * s) / 2, screenPos.y - (tileSize * s) / 2, tileSize * s, tileSize * s);

    // Label
    ctx.fillStyle = '#ff8';
    ctx.font = `${Math.max(7, 8 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('FRONT', screenPos.x, screenPos.y - 10 * s);

    // Line from door to front
    const doorScreen = camera
      ? camera.worldToScreen(building.door.worldX, building.door.worldY)
      : worldRenderer.worldToScreen(building.door.worldX, building.door.worldY);

    ctx.strokeStyle = 'rgba(255, 255, 100, 0.5)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(doorScreen.x, doorScreen.y);
    ctx.lineTo(screenPos.x, screenPos.y);
    ctx.stroke();

    ctx.restore();
  }

  renderAllFrontOfDoors(
    ctx: CanvasRenderingContext2D,
    buildings: Building[],
    worldRenderer: WorldRenderer,
    camera?: Camera
  ): void {
    for (const building of buildings) {
      this.renderFrontOfDoor(ctx, building, worldRenderer, camera);
    }
  }
}
