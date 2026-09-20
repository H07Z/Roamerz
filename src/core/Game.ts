/**
 * Game - Phase 2
 * Core game class implementing:
 * - Initialization
 * - Game Loop (UPDATE -> RENDER)
 * - Delta time handling
 * - Module orchestration
 * - World Map integration (Phase 2)
 *
 * Loop conceptually:
 * START
 *  ↓
 * INITIALIZE
 *  ↓
 * UPDATE
 *  ↓
 * RENDER
 *  ↓
 * (loop)
 */

import { Renderer } from './Renderer';
import { InputManager } from './InputManager';
import { DebugManager } from './DebugManager';
import { World } from '../world/World';
import { WorldRenderer } from '../world/WorldRenderer';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: InputManager;
  private debug: DebugManager;
  private world: World;
  private worldRenderer: WorldRenderer;

  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;

  private animationFrameId: number = 0;

  private resizeObserver: ResizeObserver | null = null;
  private boundResizeHandler: () => void;

  // Phase 2: Debug panning for map inspection (temporary, before camera system)
  private debugPanSpeed: number = 300; // pixels per second
  private showHelp: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.debug = new DebugManager();
    this.world = new World();
    this.worldRenderer = new WorldRenderer();

    this.boundResizeHandler = this.handleResize.bind(this);
  }

  /**
   * INITIALIZE phase
   */
  initialize(): void {
    console.log('[Game] Initializing Phase 2 - World Map...');

    // Initialize subsystems
    this.input.initialize(this.canvas);

    // Initialize world (Phase 2)
    try {
      this.world.initialize();
      const map = this.world.getCurrentMap();
      if (map) {
        console.log(`[Game] World map loaded: ${map.mapId} - ${map.name}`);
        // Center view on village square (25,20)
        // Will be properly centered after first resize
      }
    } catch (e) {
      console.error('[Game] World initialization failed:', e);
      // Continue even if world fails - show error in debug
    }

    // Setup resize handling
    window.addEventListener('resize', this.boundResizeHandler);

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      const container = this.canvas.parentElement;
      if (container) {
        this.resizeObserver.observe(container);
      }
    }

    // Initial resize
    this.handleResize();

    // Center on village square after resize
    this.centerOnVillage();

    // Hide loading indicator
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }

    console.log('[Game] Initialized. Screen:', this.renderer.getWidth(), 'x', this.renderer.getHeight());
    console.log('[Game] Game Loop ready: INITIALIZE → UPDATE → RENDER');
    console.log('[Game] Phase 2 Controls: WASD/Arrows to pan map, G to toggle grid, C to center, D to toggle debug');
  }

  /**
   * START the game loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.accumulatedTime = 0;

    console.log('[Game] Starting game loop...');
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    console.log('[Game] Stopped.');
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.boundResizeHandler);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.input.destroy();
  }

  /**
   * Main game loop with delta time
   */
  private gameLoop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;
    this.accumulatedTime += deltaTime;

    this.update(deltaTime);
    this.render();

    this.input.endFrame();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * UPDATE phase
   */
  private update(deltaTime: number): void {
    this.renderer.update(deltaTime);
    this.world.update(deltaTime);
    this.worldRenderer.update(deltaTime);

    this.debug.update(deltaTime, this.renderer.getWidth(), this.renderer.getHeight());

    // Update debug with world info
    const map = this.world.getCurrentMap();
    if (map) {
      this.debug.setMapInfo({
        id: map.mapId,
        name: map.name,
        width: map.width,
        height: map.height,
        tileCounts: map.getTileCounts()
      });

      const offset = this.worldRenderer.getOffset();
      this.debug.setWorldOffset(offset.x, offset.y);
    }

    // Input handling - Phase 2 debug panning
    this.handleDebugInput(deltaTime);

    if (this.input.isKeyJustPressed('d')) {
      this.debug.setEnabled(!this.debug.isEnabled());
      console.log('[Debug] Toggled:', this.debug.isEnabled() ? 'ON' : 'OFF');
    }

    if (this.input.isKeyJustPressed('r')) {
      (this.debug as any).gameTimeSeconds = 0;
      this.centerOnVillage();
      console.log('[Debug] Timer reset + centered on village');
    }

    if (this.input.isKeyJustPressed('g')) {
      const current = (this.worldRenderer as any).showGrid;
      this.worldRenderer.setShowGrid(!current);
      console.log('[Debug] Grid:', !current ? 'ON' : 'OFF');
    }

    if (this.input.isKeyJustPressed('c')) {
      this.centerOnVillage();
      console.log('[Debug] Centered on village square');
    }

    if (this.input.isKeyJustPressed('h')) {
      this.showHelp = !this.showHelp;
    }

    if (this.input.isKeyJustPressed('b')) {
      // Toggle tile coords
      const current = (this.worldRenderer as any).showTileCoords;
      this.worldRenderer.setShowTileCoords(!current);
    }
  }

  private handleDebugInput(deltaTime: number): void {
    let dx = 0;
    let dy = 0;

    if (this.input.isKeyDown('w') || this.input.isKeyDown('arrowup')) dy -= 1;
    if (this.input.isKeyDown('s') || this.input.isKeyDown('arrowdown')) dy += 1;
    if (this.input.isKeyDown('a') || this.input.isKeyDown('arrowleft')) dx -= 1;
    if (this.input.isKeyDown('d') && !this.input.isKeyJustPressed('d')) {
      // D is also debug toggle, but we check if it's held after the just-pressed frame
      // To avoid conflict, we only pan with A, and use D for debug toggle on press
      // So we handle D separately - but for panning we use only A for left
    }
    // Use arrow keys already, plus WASD without D conflict
    // Let's use A for left, and for right we use E or D if not just pressed? Simpler: use A/W/S + Arrow keys + E for right
    if (this.input.isKeyDown('e') || this.input.isKeyDown('d') && this.input.isKeyDown('shift')) {
      // Alternative: Q and E for left/right to avoid D conflict, but keep A
    }

    // Actually, let's implement properly:
    // W/Up = up, S/Down = down, A/Left = left, D/Right = right BUT D is toggle on just pressed
    // So we allow D for panning only if it's held for more than one frame (not just pressed)
    // The isKeyDown will be true after just pressed, so we need to check
    // We'll allow D for panning when Shift is not pressed? Hmm.

    // Simplified: Use WASD for pan, but D toggle is still D press - it will both toggle and pan for one frame, acceptable for Phase 2 debug
    // Better: Use Q/E for horizontal to avoid conflict, plus arrows

    // Reset and recalc cleanly:
    dx = 0;
    dy = 0;
    if (this.input.isKeyDown('w') || this.input.isKeyDown('arrowup')) dy -= 1;
    if (this.input.isKeyDown('s') || this.input.isKeyDown('arrowdown')) dy += 1;
    if (this.input.isKeyDown('a') || this.input.isKeyDown('arrowleft')) dx -= 1;
    if (this.input.isKeyDown('e') || this.input.isKeyDown('arrowright')) dx += 1;
    // Also allow D for right if user holds it (will toggle debug once, then pan)
    if (this.input.isKeyDown('d') && !this.input.isKeyJustPressed('d')) {
      dx += 1;
    }

    if (dx !== 0 || dy !== 0) {
      const offset = this.worldRenderer.getOffset();
      const newX = offset.x + dx * this.debugPanSpeed * deltaTime;
      const newY = offset.y + dy * this.debugPanSpeed * deltaTime;
      this.worldRenderer.setOffset(newX, newY);

      // Clamp to map
      const map = this.world.getCurrentMap();
      if (map) {
        this.worldRenderer.clampToMap(map, this.renderer.getWidth(), this.renderer.getHeight());
      }
    }
  }

  private centerOnVillage(): void {
    const map = this.world.getCurrentMap();
    if (!map) return;

    // Center on village square at 25,20
    this.worldRenderer.centerOn(25, 20, this.renderer.getWidth(), this.renderer.getHeight());
    this.worldRenderer.clampToMap(map, this.renderer.getWidth(), this.renderer.getHeight());
  }

  /**
   * RENDER phase
   */
  private render(): void {
    this.renderer.clear();

    const ctx = this.renderer.getContext();
    const w = this.renderer.getWidth();
    const h = this.renderer.getHeight();

    const map = this.world.getCurrentMap();

    if (map) {
      // Render world map (Phase 2)
      this.worldRenderer.render(ctx, map, w, h);
    } else {
      // Fallback to Phase 1 background if no map
      this.renderer.renderBackground();
    }

    // Debug overlay
    this.debug.render(ctx);

    // Help text
    if (this.showHelp && this.debug.isEnabled()) {
      this.renderHelp(ctx, w, h);
    }

    // If no map, show Phase 1 center label
    if (!map) {
      this.debug.renderCenterLabel(ctx, w, h);
    }
  }

  private renderHelp(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    ctx.save();
    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';

    const lines = [
      'PHASE 2 - WORLD MAP',
      'Controls:',
      '  WASD / Arrows + E - Pan map',
      '  C - Center on village',
      '  G - Toggle grid',
      '  B - Toggle tile coords',
      '  D - Toggle debug',
      '  H - Toggle help',
      '  R - Reset + center',
      '',
      'Legend:',
      '  . Grass  = Road',
      '  ~ Water  # Bridge',
      '  T Tree   O Rock',
      '  H House  F Farm',
      '',
      'Map: village_01 50x40',
      'Village Square @ 25,20',
      'River @ 38-39 with bridge',
      '5 Houses + Farm + Forest'
    ];

    const padding = 10;
    const lineHeight = 14;
    const boxWidth = 220;
    const boxHeight = lines.length * lineHeight + 20;
    const x = screenWidth - boxWidth - padding;
    const y = padding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = '#ddd';
    lines.forEach((line, i) => {
      if (i === 0) {
        ctx.fillStyle = '#8f8';
        ctx.fillText(line, x + 10, y + 10 + i * lineHeight);
        ctx.fillStyle = '#ddd';
      } else if (line === 'Legend:') {
        ctx.fillStyle = '#ff8';
        ctx.fillText(line, x + 10, y + 10 + i * lineHeight);
        ctx.fillStyle = '#aaa';
      } else {
        ctx.fillText(line, x + 10, y + 10 + i * lineHeight);
      }
    });

    ctx.restore();
  }

  private handleResize(): void {
    this.renderer.resize();
    const map = this.world.getCurrentMap();
    if (map) {
      this.worldRenderer.clampToMap(map, this.renderer.getWidth(), this.renderer.getHeight());
    }
    console.log(`[Renderer] Resized to ${this.renderer.getWidth()} x ${this.renderer.getHeight()}`);
  }

  // Getters
  getRenderer(): Renderer {
    return this.renderer;
  }

  getInput(): InputManager {
    return this.input;
  }

  getDebug(): DebugManager {
    return this.debug;
  }

  getWorld(): World {
    return this.world;
  }

  getWorldRenderer(): WorldRenderer {
    return this.worldRenderer;
  }

  isGameRunning(): boolean {
    return this.isRunning;
  }
}
