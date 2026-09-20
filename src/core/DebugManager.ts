/**
 * DebugManager - Phase 1
 * Tracks FPS, game time, screen dimensions, and renders debug overlay.
 */

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

  constructor() {
    this.lastFpsUpdate = performance.now();
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    this.gameTimeSeconds += deltaTime;
    this.totalFrames++;

    this.screenWidth = canvasWidth;
    this.screenHeight = canvasHeight;

    // FPS calculation - smoothed over 0.5s intervals
    this.frameCount++;
    this.fpsAccumulator += deltaTime;
    this.fpsSamples++;

    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      // average FPS over interval
      if (this.fpsAccumulator > 0) {
        this.fps = Math.round(this.fpsSamples / this.fpsAccumulator);
      }
      this.lastFpsUpdate = now;
      this.fpsAccumulator = 0;
      this.fpsSamples = 0;
    }
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
    const lineHeight = 18;
    const boxWidth = 260;
    const boxHeight = 120;

    // Background panel
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(padding, padding, boxWidth, boxHeight);

    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, boxWidth, boxHeight);

    ctx.font = '12px monospace';
    ctx.textBaseline = 'top';

    // Title
    ctx.fillStyle = '#8f8';
    ctx.fillText('─ PHASE 1 DEBUG ─', padding + 10, padding + 8);

    // Stats
    ctx.fillStyle = '#ddd';
    const startY = padding + 28;
    const x = padding + 10;

    ctx.fillText(`FPS            : ${this.fps}`, x, startY);
    ctx.fillText(`Game Time      : ${this.formatGameTime()}`, x, startY + lineHeight);
    ctx.fillText(`Screen W/H     : ${this.screenWidth} x ${this.screenHeight}`, x, startY + lineHeight * 2);
    ctx.fillText(`Total Frames   : ${this.totalFrames}`, x, startY + lineHeight * 3);
    ctx.fillText(`Status         : RUNNING`, x, startY + lineHeight * 4);

    // FPS color indicator
    let fpsColor = '#8f8';
    if (this.fps < 30) fpsColor = '#f88';
    else if (this.fps < 50) fpsColor = '#ff8';
    ctx.fillStyle = fpsColor;
    ctx.fillRect(padding + boxWidth - 30, padding + 28, 12, 12);

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
    ctx.fillText('Phase 1 - Project Foundation', canvasWidth / 2, canvasHeight / 2);

    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Game Loop: INITIALIZE → UPDATE → RENDER', canvasWidth / 2, canvasHeight / 2 + 25);
    ctx.fillText('Press D to toggle debug | R to reset timer', canvasWidth / 2, canvasHeight / 2 + 45);

    ctx.restore();
  }
}
