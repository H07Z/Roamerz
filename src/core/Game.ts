/**
 * Game - Phase 1
 * Core game class implementing:
 * - Initialization
 * - Game Loop (UPDATE -> RENDER)
 * - Delta time handling
 * - Module orchestration
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

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: InputManager;
  private debug: DebugManager;

  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;

  private animationFrameId: number = 0;

  // For Phase 1 testing
  private resizeObserver: ResizeObserver | null = null;
  private boundResizeHandler: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.debug = new DebugManager();

    this.boundResizeHandler = this.handleResize.bind(this);
  }

  /**
   * INITIALIZE phase
   */
  initialize(): void {
    console.log('[Game] Initializing Phase 1...');

    // Initialize subsystems
    this.input.initialize(this.canvas);

    // Setup resize handling
    window.addEventListener('resize', this.boundResizeHandler);

    // Use ResizeObserver for container changes if available
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

    // Hide loading indicator
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }

    console.log('[Game] Initialized. Screen:', this.renderer.getWidth(), 'x', this.renderer.getHeight());
    console.log('[Game] Game Loop ready: INITIALIZE → UPDATE → RENDER');
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

    // Calculate delta time in seconds
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1); // cap at 100ms to prevent spiral
    this.lastFrameTime = currentTime;
    this.accumulatedTime += deltaTime;

    // UPDATE
    this.update(deltaTime);

    // RENDER
    this.render();

    // End of frame housekeeping
    this.input.endFrame();

    // Next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * UPDATE phase - game logic
   */
  private update(deltaTime: number): void {
    // Update renderer (background animation)
    this.renderer.update(deltaTime);

    // Update debug stats
    this.debug.update(deltaTime, this.renderer.getWidth(), this.renderer.getHeight());

    // Handle debug toggles - Phase 1 input test
    if (this.input.isKeyJustPressed('d')) {
      this.debug.setEnabled(!this.debug.isEnabled());
      console.log('[Debug] Toggled:', this.debug.isEnabled() ? 'ON' : 'OFF');
    }

    if (this.input.isKeyJustPressed('r')) {
      // Reset timer for testing
      (this.debug as any).gameTimeSeconds = 0;
      console.log('[Debug] Timer reset');
    }

    // Future phases will update:
    // - Player
    // - NPCs
    // - World
    // - Time system
  }

  /**
   * RENDER phase - drawing
   */
  private render(): void {
    this.renderer.clear();
    this.renderer.renderBackground();

    const ctx = this.renderer.getContext();
    const w = this.renderer.getWidth();
    const h = this.renderer.getHeight();

    // Phase 1: Render debug overlay
    this.debug.render(ctx);
    this.debug.renderCenterLabel(ctx, w, h);

    // Future phases will render:
    // - World map
    // - Player
    // - NPCs
    // - UI
  }

  private handleResize(): void {
    this.renderer.resize();
    console.log(`[Renderer] Resized to ${this.renderer.getWidth()} x ${this.renderer.getHeight()}`);
  }

  // Getters for debugging / external access
  getRenderer(): Renderer {
    return this.renderer;
  }

  getInput(): InputManager {
    return this.input;
  }

  getDebug(): DebugManager {
    return this.debug;
  }

  isGameRunning(): boolean {
    return this.isRunning;
  }
}
