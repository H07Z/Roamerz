/**
 * Renderer - Phase 1
 * Handles canvas setup, resizing, background rendering.
 * Separated from game logic.
 */

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  // Logical size vs actual canvas pixel size
  private devicePixelRatio: number = 1;

  // Background pattern animation offset
  private bgOffset: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.resize();
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  resize(): void {
    // Use container size, with max limits for Phase 1
    const container = this.canvas.parentElement;
    const containerWidth = container ? container.clientWidth : window.innerWidth;
    const containerHeight = container ? container.clientHeight : window.innerHeight;

    // Phase 1: Use 90% of window or fixed 800x600 min, but responsive
    // We want it to handle resizing correctly
    const displayWidth = Math.max(320, containerWidth);
    const displayHeight = Math.max(240, containerHeight);

    // Set canvas CSS size
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    // Set actual pixel size considering DPR for crisp rendering
    // For Phase 1 simplicity, we don't upscale by DPR heavily, keep 1:1
    this.canvas.width = displayWidth;
    this.canvas.height = displayHeight;

    this.width = displayWidth;
    this.height = displayHeight;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  update(deltaTime: number): void {
    this.bgOffset += deltaTime * 10;
    if (this.bgOffset > 40) this.bgOffset -= 40;
  }

  renderBackground(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Base gradient - dark greenish night-ish but pleasant
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#1a2e1a');
    gradient.addColorStop(0.5, '#1e3a1e');
    gradient.addColorStop(1, '#152a15');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid pattern to prove rendering works and show movement
    ctx.save();
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.06)';
    ctx.lineWidth = 1;

    const gridSize = 40;
    const offset = this.bgOffset % gridSize;

    // Vertical lines
    for (let x = -gridSize + offset; x < w + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = -gridSize + offset; y < h + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.restore();

    // Center crosshair to show center
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.restore();

    // Four corner markers to visualize boundaries
    ctx.save();
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.2)';
    ctx.lineWidth = 2;
    const markerSize = 20;
    const inset = 20;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(inset, inset + markerSize);
    ctx.lineTo(inset, inset);
    ctx.lineTo(inset + markerSize, inset);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - inset - markerSize, inset);
    ctx.lineTo(w - inset, inset);
    ctx.lineTo(w - inset, inset + markerSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(inset, h - inset - markerSize);
    ctx.lineTo(inset, h - inset);
    ctx.lineTo(inset + markerSize, h - inset);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - inset - markerSize, h - inset);
    ctx.lineTo(w - inset, h - inset);
    ctx.lineTo(w - inset, h - inset - markerSize);
    ctx.stroke();

    ctx.restore();
  }

  // For future phases: world-to-screen, screen-to-world transforms
  // Placeholder for camera integration in Phase 5
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    // Phase 1: identity (no camera)
    return { x: worldX, y: worldY };
  }
}
