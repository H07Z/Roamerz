/**
 * DebugManager - Phase 2
 * Tracks FPS, game time, screen dimensions, world info, and renders debug overlay.
 */

export interface MapDebugInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  tileCounts: Record<string, number>;
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

  // Phase 2 additions
  private mapInfo: MapDebugInfo | null = null;
  private worldOffset: { x: number; y: number } = { x: 0, y: 0 };
  private currentPhase: number = 2;

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
    const lineHeight = 16;
    const boxWidth = 300;
    // Dynamic height based on phase
    const baseHeight = 110;
    const mapHeight = this.mapInfo ? 130 : 0;
    const boxHeight = baseHeight + mapHeight;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(padding, padding, boxWidth, boxHeight);

    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, boxWidth, boxHeight);

    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#8f8';
    ctx.fillText(`─ PHASE ${this.currentPhase} DEBUG ─`, padding + 10, padding + 8);

    ctx.fillStyle = '#ddd';
    const startY = padding + 26;
    const x = padding + 10;

    ctx.fillText(`FPS            : ${this.fps}`, x, startY);
    ctx.fillText(`Game Time      : ${this.formatGameTime()}`, x, startY + lineHeight);
    ctx.fillText(`Screen W/H     : ${this.screenWidth} x ${this.screenHeight}`, x, startY + lineHeight * 2);
    ctx.fillText(`Total Frames   : ${this.totalFrames}`, x, startY + lineHeight * 3);
    ctx.fillText(`World Offset   : ${Math.floor(this.worldOffset.x)}, ${Math.floor(this.worldOffset.y)}`, x, startY + lineHeight * 4);
    ctx.fillText(`Status         : RUNNING`, x, startY + lineHeight * 5);

    // Map info
    if (this.mapInfo) {
      const mapY = startY + lineHeight * 6 + 8;
      ctx.fillStyle = '#8f8';
      ctx.fillText(`─ MAP: ${this.mapInfo.id} ─`, x, mapY);

      ctx.fillStyle = '#ddd';
      ctx.fillText(`Name           : ${this.mapInfo.name}`, x, mapY + lineHeight);
      ctx.fillText(`Size           : ${this.mapInfo.width} x ${this.mapInfo.height}`, x, mapY + lineHeight * 2);
      ctx.fillText(`Tiles          : ${this.mapInfo.width * this.mapInfo.height}`, x, mapY + lineHeight * 3);

      // Tile counts compact
      const counts = this.mapInfo.tileCounts;
      const countStr = Object.entries(counts)
        .map(([k, v]) => `${k[0]}:${v}`)
        .join(' ');
      ctx.font = '10px monospace';
      ctx.fillStyle = '#aaa';
      ctx.fillText(countStr, x, mapY + lineHeight * 4);

      // Validation status
      const expected = this.mapInfo.width * this.mapInfo.height;
      const actual = Object.values(counts).reduce((a, b) => a + b, 0);
      const valid = expected === actual ? 'OK' : 'CORRUPT';
      const validColor = valid === 'OK' ? '#8f8' : '#f88';
      ctx.fillStyle = validColor;
      ctx.font = '10px monospace';
      ctx.fillText(`Validation: ${valid} (${actual}/${expected})`, x, mapY + lineHeight * 5 + 2);

      // Distinguishable check
      const distinctTypes = Object.keys(counts).length;
      ctx.fillStyle = distinctTypes >= 5 ? '#8f8' : '#ff8';
      ctx.fillText(`Types: ${distinctTypes}/7 distinct`, x, mapY + lineHeight * 6 + 2);
    }

    // FPS indicator
    let fpsColor = '#8f8';
    if (this.fps < 30) fpsColor = '#f88';
    else if (this.fps < 50) fpsColor = '#ff8';
    ctx.fillStyle = fpsColor;
    ctx.fillRect(padding + boxWidth - 24, padding + 26, 10, 10);

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
    ctx.fillText(`Phase ${this.currentPhase} - World Map`, canvasWidth / 2, canvasHeight / 2);

    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Game Loop: INITIALIZE → UPDATE → RENDER', canvasWidth / 2, canvasHeight / 2 + 25);
    ctx.fillText('Press D to toggle debug | R to reset timer', canvasWidth / 2, canvasHeight / 2 + 45);

    ctx.restore();
  }
}
