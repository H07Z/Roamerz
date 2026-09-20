/**
 * Camera - Phase 5
 * Follows player, handles world boundaries, clamping, smooth movement, optional zoom
 * Separate from WorldRenderer - Camera manages offset, WorldRenderer renders
 */

import { WorldMap } from '../world/WorldMap';
import { WorldRenderer } from '../world/WorldRenderer';

export interface CameraConfig {
  smoothing: number; // 0 = instant, 1 = very smooth (lerp factor per second)
  zoom: number; // 1 = normal, >1 zoom in, <1 zoom out
  deadZone: number; // pixels around center where camera doesn't move
}

export class Camera {
  public x: number = 0; // offset X (world pixel)
  public y: number = 0; // offset Y
  public targetX: number = 0;
  public targetY: number = 0;

  private smoothing: number;
  private zoom: number;
  private deadZone: number;

  private screenWidth: number = 0;
  private screenHeight: number = 0;

  private worldMap: WorldMap | null = null;
  private tileSize: number = WorldRenderer.TILE_SIZE;

  // For shake prevention and debugging
  private lastOffsetX: number = 0;
  private lastOffsetY: number = 0;

  constructor(config: Partial<CameraConfig> = {}) {
    this.smoothing = config.smoothing ?? 5.0; // 5 = fairly smooth, higher = faster follow
    this.zoom = config.zoom ?? 1.0;
    this.deadZone = config.deadZone ?? 0; // 0 = always follow, >0 = dead zone
  }

  setWorldMap(map: WorldMap): void {
    this.worldMap = map;
  }

  setScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  setSmoothing(smoothing: number): void {
    this.smoothing = Math.max(0, smoothing);
  }

  getSmoothing(): number {
    return this.smoothing;
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(0.1, Math.min(zoom, 3.0));
  }

  getZoom(): number {
    return this.zoom;
  }

  setDeadZone(deadZone: number): void {
    this.deadZone = Math.max(0, deadZone);
  }

  /**
   * Follow a world position (e.g., player)
   */
  follow(worldX: number, worldY: number): void {
    this.targetX = worldX - this.screenWidth / 2 / this.zoom;
    this.targetY = worldY - this.screenHeight / 2 / this.zoom;
  }

  /**
   * Instantly center on world position (no smoothing)
   */
  centerOn(worldX: number, worldY: number): void {
    this.targetX = worldX - this.screenWidth / 2 / this.zoom;
    this.targetY = worldY - this.screenHeight / 2 / this.zoom;
    this.x = this.targetX;
    this.y = this.targetY;
    this.clampToMap();
  }

  /**
   * Center on tile coordinates
   */
  centerOnTile(tileX: number, tileY: number): void {
    const worldX = tileX * this.tileSize + this.tileSize / 2;
    const worldY = tileY * this.tileSize + this.tileSize / 2;
    this.centerOn(worldX, worldY);
  }

  /**
   * Update camera with smoothing and clamping
   */
  update(deltaTime: number): void {
    // Apply dead zone - if target is within deadZone of current, don't move
    if (this.deadZone > 0) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.deadZone) {
        // Inside dead zone, don't update
        this.clampToMap();
        return;
      }
    }

    if (this.smoothing === 0) {
      // Instant follow
      this.x = this.targetX;
      this.y = this.targetY;
    } else {
      // Smooth follow using lerp with deltaTime
      // Formula: x += (target - x) * (1 - exp(-smoothing * dt))
      // This is frame-rate independent smoothing
      const lerpFactor = 1 - Math.exp(-this.smoothing * deltaTime);
      this.x += (this.targetX - this.x) * lerpFactor;
      this.y += (this.targetY - this.y) * lerpFactor;

      // Snap if very close to prevent micro-jitter
      if (Math.abs(this.targetX - this.x) < 0.1) this.x = this.targetX;
      if (Math.abs(this.targetY - this.y) < 0.1) this.y = this.targetY;
    }

    this.clampToMap();

    // Store last offset for shake detection
    this.lastOffsetX = this.x;
    this.lastOffsetY = this.y;
  }

  /**
   * Clamp camera to map boundaries - never show outside world
   */
  clampToMap(): void {
    if (!this.worldMap) return;

    const mapPixelWidth = this.worldMap.width * this.tileSize;
    const mapPixelHeight = this.worldMap.height * this.tileSize;

    const scaledScreenWidth = this.screenWidth / this.zoom;
    const scaledScreenHeight = this.screenHeight / this.zoom;

    if (mapPixelWidth <= scaledScreenWidth) {
      this.x = (mapPixelWidth - scaledScreenWidth) / 2;
      this.targetX = this.x;
    } else {
      this.x = Math.max(0, Math.min(this.x, mapPixelWidth - scaledScreenWidth));
      this.targetX = Math.max(0, Math.min(this.targetX, mapPixelWidth - scaledScreenWidth));
    }

    if (mapPixelHeight <= scaledScreenHeight) {
      this.y = (mapPixelHeight - scaledScreenHeight) / 2;
      this.targetY = this.y;
    } else {
      this.y = Math.max(0, Math.min(this.y, mapPixelHeight - scaledScreenHeight));
      this.targetY = Math.max(0, Math.min(this.targetY, mapPixelHeight - scaledScreenHeight));
    }
  }

  getOffset(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  setOffset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.clampToMap();
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.x) * this.zoom,
      y: (worldY - this.y) * this.zoom
    };
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX / this.zoom + this.x,
      y: screenY / this.zoom + this.y
    };
  }

  screenToTile(screenX: number, screenY: number): { x: number; y: number } {
    const world = this.screenToWorld(screenX, screenY);
    return {
      x: Math.floor(world.x / this.tileSize),
      y: Math.floor(world.y / this.tileSize)
    };
  }

  getScreenSize(): { width: number; height: number } {
    return { width: this.screenWidth, height: this.screenHeight };
  }

  getWorldBounds(): { left: number; top: number; right: number; bottom: number } {
    return {
      left: this.x,
      top: this.y,
      right: this.x + this.screenWidth / this.zoom,
      bottom: this.y + this.screenHeight / this.zoom
    };
  }

  isWorldPositionVisible(worldX: number, worldY: number, margin: number = 0): boolean {
    const bounds = this.getWorldBounds();
    return worldX >= bounds.left - margin && worldX <= bounds.right + margin &&
           worldY >= bounds.top - margin && worldY <= bounds.bottom + margin;
  }

  // For debugging camera shake
  getLastOffset(): { x: number; y: number } {
    return { x: this.lastOffsetX, y: this.lastOffsetY };
  }
}
