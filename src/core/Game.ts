/**
 * Game - Phase 3
 * Core game class implementing:
 * - Initialization
 * - Game Loop (UPDATE -> RENDER) with deltaTime
 * - Module orchestration
 * - World Map integration (Phase 2)
 * - Player Movement (Phase 3)
 *
 * Loop:
 * START → INITIALIZE → UPDATE → RENDER → loop
 */

import { Renderer } from './Renderer';
import { InputManager } from './InputManager';
import { DebugManager } from './DebugManager';
import { World } from '../world/World';
import { WorldRenderer } from '../world/WorldRenderer';
import { Player } from '../player/Player';
import { PlayerRenderer } from '../player/PlayerRenderer';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: InputManager;
  private debug: DebugManager;
  private world: World;
  private worldRenderer: WorldRenderer;
  private player: Player | null = null;
  private playerRenderer: PlayerRenderer;

  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  private animationFrameId: number = 0;

  private resizeObserver: ResizeObserver | null = null;
  private boundResizeHandler: () => void;

  private showHelp: boolean = true;

  // Phase 3: Player speed consistent test - track FPS vs speed
  private lastPlayerPos: { x: number; y: number } = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.debug = new DebugManager();
    this.world = new World();
    this.worldRenderer = new WorldRenderer();
    this.playerRenderer = new PlayerRenderer();

    this.boundResizeHandler = this.handleResize.bind(this);
  }

  initialize(): void {
    console.log('[Game] Initializing Phase 3 - Player Movement...');

    this.input.initialize(this.canvas);

    try {
      this.world.initialize();
      const map = this.world.getCurrentMap();
      if (map) {
        console.log(`[Game] World map loaded: ${map.mapId} - ${map.name}`);

        // Initialize player at village square (25,20) - center of map
        const tileSize = WorldRenderer.TILE_SIZE;
        const startX = 25 * tileSize + tileSize / 2;
        const startY = 20 * tileSize + tileSize / 2;
        this.player = new Player(startX, startY, 150); // 150 px/s
        this.lastPlayerPos = { x: startX, y: startY };

        console.log(`[Game] Player created at (${startX}, ${startY}) speed=${this.player.speed} px/s`);
        console.log(`[Game] Player data: x=${this.player.x}, y=${this.player.y}, speed=${this.player.speed}, dir=${this.player.direction}, state=${this.player.state}`);
      }
    } catch (e) {
      console.error('[Game] World initialization failed:', e);
    }

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

    this.handleResize();

    // Center camera on player after resize
    this.centerOnPlayer();

    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }

    console.log('[Game] Initialized. Screen:', this.renderer.getWidth(), 'x', this.renderer.getHeight());
    console.log('[Game] Phase 3 Controls: WASD/Arrows to move player, C to center, G grid, D debug, H help');
  }

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
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    console.log('[Game] Stopped.');
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.boundResizeHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.input.destroy();
  }

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

  private update(deltaTime: number): void {
    this.renderer.update(deltaTime);
    this.world.update(deltaTime);
    this.worldRenderer.update(deltaTime);

    // Update player (Phase 3)
    const map = this.world.getCurrentMap();
    if (this.player && map) {
      this.player.update(deltaTime, this.input, map);
      this.playerRenderer.update(deltaTime, this.player);

      // Simple camera follow - keep player centered (Phase 3 minimal camera, expanded in Phase 5)
      this.updateCameraFollow();

      // Update debug with player info
      this.debug.setPlayerInfo({
        x: this.player.x,
        y: this.player.y,
        tileX: this.player.getTilePosition().x,
        tileY: this.player.getTilePosition().y,
        speed: this.player.speed,
        direction: this.player.direction,
        state: this.player.state,
        distance: this.player.getTotalDistance()
      });

      // Check boundary for testing
      const boundary = this.player.isAtBoundary(map);
      this.debug.setPlayerAtBoundary(boundary.atBoundary, boundary.side);
    }

    this.debug.update(deltaTime, this.renderer.getWidth(), this.renderer.getHeight());

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

    // Input handling
    this.handleDebugToggles();
  }

  private updateCameraFollow(): void {
    if (!this.player) return;
    const map = this.world.getCurrentMap();
    if (!map) return;

    // Center camera on player (simple follow, no smoothing yet - Phase 5 will add smoothing)
    this.worldRenderer.centerOnTilePixel(this.player.x, this.player.y, this.renderer.getWidth(), this.renderer.getHeight());
    this.worldRenderer.clampToMap(map, this.renderer.getWidth(), this.renderer.getHeight());
  }

  private centerOnPlayer(): void {
    if (!this.player) {
      // Fallback to village square
      const map = this.world.getCurrentMap();
      if (!map) return;
      this.worldRenderer.centerOn(25, 20, this.renderer.getWidth(), this.renderer.getHeight());
      this.worldRenderer.clampToMap(map, this.renderer.getWidth(), this.renderer.getHeight());
      return;
    }
    this.updateCameraFollow();
  }

  private centerOnVillage(): void {
    const map = this.world.getCurrentMap();
    if (!map) return;
    this.worldRenderer.centerOn(25, 20, this.renderer.getWidth(), this.renderer.getHeight());
    this.worldRenderer.clampToMap(map, this.renderer.getWidth(), this.renderer.getHeight());
  }

  private handleDebugToggles(): void {
    // Debug toggle - D or Backquote or F3
    if (this.input.isKeyJustPressed('d') && !this.input.isKeyDown('shift')) {
      // Only toggle if not holding shift (shift+D is for right pan alternative, but now player uses D)
      // To avoid conflict, we toggle on just pressed but player movement will still happen
      // For Phase 3, we also support backquote as alternative
      // We'll toggle debug but still allow player to move right
    }
    // Better: Use backquote and F1-F3 for debug to avoid WASD conflict
    if (this.input.isKeyJustPressed('`') || this.input.isKeyJustPressed('f1') || this.input.isKeyJustPressed('f3')) {
      this.debug.setEnabled(!this.debug.isEnabled());
      console.log('[Debug] Toggled:', this.debug.isEnabled() ? 'ON' : 'OFF');
    }
    // Keep D toggle as well for backward compat, but only when not moving? We'll keep it simple: D toggles
    if (this.input.isKeyJustPressed('d') && this.input.isKeyDown('shift') === false) {
      // Check if player is not trying to move right exclusively? Actually we want D to both move and toggle
      // For Phase 3, we allow D to toggle debug - it's okay if player moves a bit when toggling
      // But to reduce conflict, require Ctrl+D or just use backquote as primary
      // Let's keep D toggle but only if player is idle (not moving)
      if (this.player && this.player.state === 'IDLE') {
        // If idle and D pressed, toggle debug and don't move (player will stay idle this frame)
        // The player update already happened before this, so movement for this frame already processed
        // We need to toggle now
        // Actually player update already used isKeyDown, so if D pressed, player would have moved
        // To avoid, we toggle only on Shift+D or Backquote
      }
    }

    // For Phase 3, primary debug toggle is backquote and F3, plus we keep D as secondary but with condition
    // Let's implement: Backquote, F3, and also plain D when pressed alone (not with WASD movement) - we already handled
    // Simplest: Keep D toggle for now, but also allow backquote
    if (this.input.isKeyJustPressed('d')) {
      // If player is moving, don't toggle? Or do toggle? Let's toggle only if Shift is held to avoid conflict
      // Actually for testing, we want easy toggle, so we will toggle on D press but also move
      // We'll check if input has only D pressed and no other movement keys, then toggle
      const onlyD = this.input.isKeyDown('d') && !this.input.isKeyDown('a') && !this.input.isKeyDown('w') && !this.input.isKeyDown('s') && !this.input.isKeyDown('arrowup') && !this.input.isKeyDown('arrowdown') && !this.input.isKeyDown('arrowleft') && !this.input.isKeyDown('arrowright');
      if (onlyD || this.input.isKeyDown('shift')) {
        this.debug.setEnabled(!this.debug.isEnabled());
        console.log('[Debug] Toggled via D:', this.debug.isEnabled() ? 'ON' : 'OFF');
      }
    }

    // Alternative toggles that don't conflict
    if (this.input.isKeyJustPressed('f2')) {
      this.debug.setEnabled(!this.debug.isEnabled());
    }

    if (this.input.isKeyJustPressed('r')) {
      (this.debug as any).gameTimeSeconds = 0;
      if (this.player) {
        const tileSize = WorldRenderer.TILE_SIZE;
        const startX = 25 * tileSize + tileSize / 2;
        const startY = 20 * tileSize + tileSize / 2;
        this.player.setPosition(startX, startY);
        console.log('[Debug] Player reset to village square');
      }
      this.centerOnPlayer();
    }

    if (this.input.isKeyJustPressed('g')) {
      const current = (this.worldRenderer as any).showGrid;
      this.worldRenderer.setShowGrid(!current);
    }

    if (this.input.isKeyJustPressed('c')) {
      this.centerOnPlayer();
      console.log('[Debug] Centered on player');
    }

    if (this.input.isKeyJustPressed('h')) {
      this.showHelp = !this.showHelp;
    }

    if (this.input.isKeyJustPressed('b')) {
      const current = (this.worldRenderer as any).showTileCoords;
      this.worldRenderer.setShowTileCoords(!current);
    }

    if (this.input.isKeyJustPressed('v')) {
      this.centerOnVillage();
      console.log('[Debug] Centered on village (not player)');
    }
  }

  private render(): void {
    this.renderer.clear();
    const ctx = this.renderer.getContext();
    const w = this.renderer.getWidth();
    const h = this.renderer.getHeight();
    const map = this.world.getCurrentMap();

    if (map) {
      this.worldRenderer.render(ctx, map, w, h);
    } else {
      this.renderer.renderBackground();
    }

    // Render player (Phase 3)
    if (this.player) {
      this.playerRenderer.render(ctx, this.player, this.worldRenderer);
    }

    this.debug.render(ctx);

    if (this.showHelp && this.debug.isEnabled()) {
      this.renderHelp(ctx, w, h);
    }
  }

  private renderHelp(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    ctx.save();
    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';

    const lines = [
      'PHASE 3 - PLAYER MOVEMENT',
      'Controls:',
      '  WASD / Arrows - Move player',
      '  (Diagonal supported)',
      '  C - Center on player',
      '  V - Center on village',
      '  G - Toggle grid',
      '  B - Toggle tile coords',
      '  ` / F2 / Shift+D - Toggle debug',
      '  H - Toggle help',
      '  R - Reset player to square',
      '',
      'Player:',
      `  Pos: ${this.player ? `${Math.floor(this.player.x)},${Math.floor(this.player.y)}` : 'N/A'}`,
      `  Tile: ${this.player ? `${this.player.getTilePosition().x},${this.player.getTilePosition().y}` : 'N/A'}`,
      `  State: ${this.player?.state ?? 'N/A'}`,
      `  Dir: ${this.player?.direction ?? 'N/A'}`,
      `  Speed: ${this.player?.speed ?? 0} px/s`,
      '',
      'Tests:',
      '  Move Up/Down/Left/Right',
      '  Diagonal (W+A etc)',
      '  Speed consistent (deltaTime)',
      '  Cannot leave world bounds',
      '',
      'Map: village_01 50x40',
      'Player start @ 25,20 square'
    ];

    const padding = 10;
    const lineHeight = 13;
    const boxWidth = 240;
    const boxHeight = lines.length * lineHeight + 20;
    const x = screenWidth - boxWidth - padding;
    const y = padding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = '#ddd';
    lines.forEach((line, i) => {
      if (i === 0) {
        ctx.fillStyle = '#8f8';
        ctx.fillText(line, x + 10, y + 10 + i * lineHeight);
        ctx.fillStyle = '#ddd';
      } else if (line === 'Player:' || line === 'Tests:') {
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
      if (this.player) {
        this.updateCameraFollow();
      } else {
        this.worldRenderer.clampToMap(map, this.renderer.getWidth(), this.renderer.getHeight());
      }
    }
    console.log(`[Renderer] Resized to ${this.renderer.getWidth()} x ${this.renderer.getHeight()}`);
  }

  // Getters
  getRenderer(): Renderer { return this.renderer; }
  getInput(): InputManager { return this.input; }
  getDebug(): DebugManager { return this.debug; }
  getWorld(): World { return this.world; }
  getWorldRenderer(): WorldRenderer { return this.worldRenderer; }
  getPlayer(): Player | null { return this.player; }
  getPlayerRenderer(): PlayerRenderer { return this.playerRenderer; }
  isGameRunning(): boolean { return this.isRunning; }
}
