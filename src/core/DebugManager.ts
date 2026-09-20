/**
 * DebugManager - Phase 3
 * Tracks FPS, game time, screen dimensions, world info, player info, and renders debug overlay.
 */

export interface MapDebugInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  tileCounts: Record<string, number>;
}

export interface PlayerDebugInfo {
  x: number;
  y: number;
  tileX: number;
  tileY: number;
  speed: number;
  direction: string;
  state: string;
  distance: number;
}

export class DebugManager {
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private fpsAccumulator: number = 0;
  private fpsSamples: number = 0;

  private gameTimeSeconds: number = 0;
  private totalFrames: number = 0;

  private screenWidth: number = 0;
  private screenHeight: number = 0;

  private enabled: boolean = true;

  // Phase 2
  private mapInfo: MapDebugInfo | null = null;
  private worldOffset: { x: number; y: number } = { x: 0, y: 0 };
  // Phase 3
  private playerInfo: PlayerDebugInfo | null = null;
  private playerAtBoundary: boolean = false;
  private playerBoundarySide: string | null = null;
  private currentPhase: number = 3;

  constructor() {
    this.lastFpsUpdate = performance.now();
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    this.gameTimeSeconds += deltaTime;
    this.totalFrames++;

    this.screenWidth = canvasWidth;
    this.screenHeight = canvasHeight;

    this.frameCount++;
    this.fpsAccumulator += deltaTime;
    this.fpsSamples++;

    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      if (this.fpsAccumulator > 0) {
        this.fps = Math.round(this.fpsSamples / this.fpsAccumulator);
      }
      this.lastFpsUpdate = now;
      this.fpsAccumulator = 0;
      this.fpsSamples = 0;
    }
  }

  setMapInfo(info: MapDebugInfo): void {
    this.mapInfo = info;
  }

  setWorldOffset(x: number, y: number): void {
    this.worldOffset.x = x;
    this.worldOffset.y = y;
  }

  setPlayerInfo(info: PlayerDebugInfo): void {
    this.playerInfo = info;
  }

  setPlayerAtBoundary(atBoundary: boolean, side: string | null): void {
    this.playerAtBoundary = atBoundary;
    this.playerBoundarySide = side;
  }

  getFps(): number {
    return this.fps;
  }

  getGameTime(): number {
    return this.gameTimeSeconds;
  }

  getScreenSize(): { width: number; height: number } {
    return { width: this.screenWidth, height: this.screenHeight };
  }

  getTotalFrames(): number {
    return this.totalFrames;
  }

  formatGameTime(): string {
    const total = Math.floor(this.gameTimeSeconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled) return;

    const padding = 10;
    const lineHeight = 14;
    const boxWidth = 320;
    // Dynamic height: base + map + player
    const baseHeight = 100;
    const mapHeight = this.mapInfo ? 90 : 0;
    const playerHeight = this.playerInfo ? 110 : 0;
    const boxHeight = baseHeight + mapHeight + playerHeight + 10;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(padding, padding, boxWidth, boxHeight);

    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, boxWidth, boxHeight);

    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#8f8';
    ctx.fillText(`─ PHASE ${this.currentPhase} DEBUG ─`, padding + 10, padding + 8);

    ctx.fillStyle = '#ddd';
    let y = padding + 24;
    const x = padding + 10;

    ctx.fillText(`FPS            : ${this.fps}`, x, y);
    y += lineHeight;
    ctx.fillText(`Game Time      : ${this.formatGameTime()}`, x, y);
    y += lineHeight;
    ctx.fillText(`Screen W/H     : ${this.screenWidth} x ${this.screenHeight}`, x, y);
    y += lineHeight;
    ctx.fillText(`Total Frames   : ${this.totalFrames}`, x, y);
    y += lineHeight;
    ctx.fillText(`World Offset   : ${Math.floor(this.worldOffset.x)}, ${Math.floor(this.worldOffset.y)}`, x, y);
    y += lineHeight;
    ctx.fillText(`Status         : RUNNING`, x, y);
    y += lineHeight + 6;

    // Player info (Phase 3)
    if (this.playerInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`─ PLAYER ─`, x, y);
      y += lineHeight;

      ctx.fillStyle = '#ddd';
      ctx.fillText(`Pos            : ${Math.floor(this.playerInfo.x)}, ${Math.floor(this.playerInfo.y)}`, x, y);
      y += lineHeight;
      ctx.fillText(`Tile           : ${this.playerInfo.tileX}, ${this.playerInfo.tileY}`, x, y);
      y += lineHeight;
      ctx.fillText(`Speed          : ${this.playerInfo.speed} px/s`, x, y);
      y += lineHeight;
      ctx.fillText(`Dir            : ${this.playerInfo.direction}`, x, y);
      y += lineHeight;
      ctx.fillText(`State          : ${this.playerInfo.state}`, x, y);
      y += lineHeight;
      ctx.fillText(`Distance       : ${Math.floor(this.playerInfo.distance)} px`, x, y);
      y += lineHeight;

      // Boundary check
      if (this.playerAtBoundary) {
        ctx.fillStyle = '#ff8';
        ctx.fillText(`Boundary       : YES (${this.playerBoundarySide})`, x, y);
      } else {
        ctx.fillStyle = '#8f8';
        ctx.fillText(`Boundary       : NO (inside world)`, x, y);
      }
      ctx.fillStyle = '#ddd';
      y += lineHeight + 6;
    }

    // Map info
    if (this.mapInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`─ MAP: ${this.mapInfo.id} ─`, x, y);
      y += lineHeight;

      ctx.fillStyle = '#ddd';
      ctx.font = '10px monospace';
      ctx.fillText(`Name: ${this.mapInfo.name} | ${this.mapInfo.width}x${this.mapInfo.height} | ${this.mapInfo.width * this.mapInfo.height} tiles`, x, y);
      y += lineHeight;

      const counts = this.mapInfo.tileCounts;
      const countStr = Object.entries(counts)
        .map(([k, v]) => `${k[0]}:${v}`)
        .join(' ');
      ctx.fillStyle = '#aaa';
      ctx.fillText(countStr, x, y);
      y += lineHeight;

      const expected = this.mapInfo.width * this.mapInfo.height;
      const actual = Object.values(counts).reduce((a, b) => a + b, 0);
      const valid = expected === actual ? 'OK' : 'CORRUPT';
      ctx.fillStyle = valid === 'OK' ? '#8f8' : '#f88';
      ctx.fillText(`Validation: ${valid} | Types: ${Object.keys(counts).length}/8`, x, y);
      y += lineHeight;
      ctx.font = '11px monospace';
    }

    // FPS indicator
    let fpsColor = '#8f8';
    if (this.fps < 30) fpsColor = '#f88';
    else if (this.fps < 50) fpsColor = '#ff8';
    ctx.fillStyle = fpsColor;
    ctx.fillRect(padding + boxWidth - 22, padding + 24, 10, 10);

    ctx.restore();
  }

  renderCenterLabel(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.enabled) return;

    ctx.save();
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ROAMERZ', canvasWidth / 2, canvasHeight / 2 - 30);

    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(180,255,180,0.8)';
    ctx.fillText(`Phase ${this.currentPhase} - Player Movement`, canvasWidth / 2, canvasHeight / 2);

    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Use WASD / Arrows to move | Diagonal supported', canvasWidth / 2, canvasHeight / 2 + 25);
    ctx.fillText('Press ` / F2 to toggle debug | R to reset', canvasWidth / 2, canvasHeight / 2 + 45);

    ctx.restore();
  }
}
