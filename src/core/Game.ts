/**
 * Game - Phase 4
 * Core game class with Collision System
 * - World Map
 * - Player Movement with collision
 * - Collision types: WALKABLE, BLOCKED, INTERACTABLE
 * - Prevents walking through trees, rocks, water, houses
 * - Bridge remains walkable
 */

import { Renderer } from './Renderer';
import { InputManager } from './InputManager';
import { DebugManager } from './DebugManager';
import { World } from '../world/World';
import { WorldRenderer } from '../world/WorldRenderer';
import { Player } from '../player/Player';
import { PlayerRenderer } from '../player/PlayerRenderer';
import { CollisionSystem } from '../collision/CollisionSystem';
import { CollisionType } from '../collision/CollisionType';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: InputManager;
  private debug: DebugManager;
  private world: World;
  private worldRenderer: WorldRenderer;
  private player: Player | null = null;
  private playerRenderer: PlayerRenderer;
  private collisionSystem: CollisionSystem;

  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  private animationFrameId: number = 0;

  private resizeObserver: ResizeObserver | null = null;
  private boundResizeHandler: () => void;

  private showHelp: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.debug = new DebugManager();
    this.world = new World();
    this.worldRenderer = new WorldRenderer();
    this.playerRenderer = new PlayerRenderer();
    this.collisionSystem = new CollisionSystem();

    this.boundResizeHandler = this.handleResize.bind(this);
  }

  initialize(): void {
    console.log('[Game] Initializing Phase 4 - Collision System...');

    this.input.initialize(this.canvas);

    try {
      this.world.initialize();
      const map = this.world.getCurrentMap();
      if (map) {
        console.log(`[Game] World map loaded: ${map.mapId} - ${map.name}`);

        // Initialize collision system from world map (Phase 4)
        this.collisionSystem.initializeFromWorldMap(map);
        console.log(`[Game] Collision map generated:`, this.collisionSystem.getCollisionMap()?.getCounts());

        // Initialize player at village square
        const tileSize = WorldRenderer.TILE_SIZE;
        const startX = 25 * tileSize + tileSize / 2;
        const startY = 20 * tileSize + tileSize / 2;
        this.player = new Player(startX, startY, 150);

        console.log(`[Game] Player created at (${startX}, ${startY})`);
        console.log(`[Game] Collision: GRASS/ROAD/BRIDGE/FARMLAND=WALKABLE, WATER/TREE/ROCK/HOUSE=BLOCKED, Door=INTERACTABLE`);
      }
    } catch (e) {
      console.error('[Game] Initialization failed:', e);
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
    this.centerOnPlayer();

    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    console.log('[Game] Initialized. Screen:', this.renderer.getWidth(), 'x', this.renderer.getHeight());
    console.log('[Game] Phase 4 Controls: WASD/Arrows move, K toggle collision debug, C center, G grid');
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

    const map = this.world.getCurrentMap();
    if (this.player && map) {
      // Update player with collision system (Phase 4)
      this.player.update(deltaTime, this.input, map, this.collisionSystem);
      this.playerRenderer.update(deltaTime, this.player);

      this.updateCameraFollow();

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

      const boundary = this.player.isAtBoundary(map);
      this.debug.setPlayerAtBoundary(boundary.atBoundary, boundary.side);

      // Collision debug info
      const collisionMap = this.collisionSystem.getCollisionMap();
      if (collisionMap) {
        this.debug.setCollisionInfo({
          counts: collisionMap.getCounts(),
          isColliding: this.player.getIsColliding(),
          lastCollision: this.player.getLastCollision(),
          showCollision: this.collisionSystem.isShowCollision()
        });

        // Check current tile collision type
        const tilePos = this.player.getTilePosition();
        const collType = collisionMap.getCollisionType(tilePos.x, tilePos.y);
        this.debug.setCurrentTileCollision(collType);
      }
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

    this.handleDebugToggles();
  }

  private updateCameraFollow(): void {
    if (!this.player) return;
    const map = this.world.getCurrentMap();
    if (!map) return;
    this.worldRenderer.centerOnTilePixel(this.player.x, this.player.y, this.renderer.getWidth(), this.renderer.getHeight());
    this.worldRenderer.clampToMap(map, this.renderer.getWidth(), this.renderer.getHeight());
  }

  private centerOnPlayer(): void {
    if (!this.player) {
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
    if (this.input.isKeyJustPressed('`') || this.input.isKeyJustPressed('f1') || this.input.isKeyJustPressed('f3') || this.input.isKeyJustPressed('f2')) {
      this.debug.setEnabled(!this.debug.isEnabled());
    }

    if (this.input.isKeyJustPressed('d')) {
      const onlyD = this.input.isKeyDown('d') && !this.input.isKeyDown('a') && !this.input.isKeyDown('w') && !this.input.isKeyDown('s') && !this.input.isKeyDown('arrowup') && !this.input.isKeyDown('arrowdown') && !this.input.isKeyDown('arrowleft') && !this.input.isKeyDown('arrowright');
      if (onlyD || this.input.isKeyDown('shift')) {
        this.debug.setEnabled(!this.debug.isEnabled());
      }
    }

    if (this.input.isKeyJustPressed('r')) {
      (this.debug as any).gameTimeSeconds = 0;
      if (this.player) {
        const tileSize = WorldRenderer.TILE_SIZE;
        const startX = 25 * tileSize + tileSize / 2;
        const startY = 20 * tileSize + tileSize / 2;
        this.player.setPosition(startX, startY);
      }
      this.centerOnPlayer();
    }

    if (this.input.isKeyJustPressed('g')) {
      const current = (this.worldRenderer as any).showGrid;
      this.worldRenderer.setShowGrid(!current);
    }

    if (this.input.isKeyJustPressed('c')) {
      this.centerOnPlayer();
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
    }

    // Phase 4: Toggle collision debug
    if (this.input.isKeyJustPressed('k')) {
      const current = this.collisionSystem.isShowCollision();
      this.collisionSystem.setShowCollision(!current);
      console.log('[Debug] Collision overlay:', !current ? 'ON' : 'OFF');
    }

    // Phase 4: Test positions for collision tests
    if (this.input.isKeyJustPressed('1')) {
      // Teleport near tree for testing
      if (this.player) {
        this.player.setPosition(3 * 32 + 16, 3 * 32 + 16);
        console.log('[Debug] Teleported to tree test area (3,3)');
      }
    }
    if (this.input.isKeyJustPressed('2')) {
      if (this.player) {
        this.player.setPosition(38 * 32 + 16, 10 * 32 + 16);
        console.log('[Debug] Teleported to water test area (38,10)');
      }
    }
    if (this.input.isKeyJustPressed('3')) {
      if (this.player) {
        this.player.setPosition(36 * 32 + 16, 19 * 32 + 16);
        console.log('[Debug] Teleported to bridge test area (36,19)');
      }
    }
    if (this.input.isKeyJustPressed('4')) {
      if (this.player) {
        this.player.setPosition(12 * 32 + 16, 10 * 32 + 16);
        console.log('[Debug] Teleported to house test area (12,10)');
      }
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
      // Render collision debug overlay (Phase 4)
      this.collisionSystem.renderDebug(ctx, this.worldRenderer, w, h);
    } else {
      this.renderer.renderBackground();
    }

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
      'PHASE 4 - COLLISION SYSTEM',
      'Controls:',
      '  WASD / Arrows - Move player',
      '  C - Center on player',
      '  K - Toggle collision overlay',
      '    Red=Blocked, Yellow=Interact',
      '  G - Toggle grid',
      '  B - Toggle tile coords',
      '  ` / F2 - Toggle debug',
      '  H - Toggle help',
      '  R - Reset to square',
      '  1 - Teleport to tree test',
      '  2 - Teleport to water test',
      '  3 - Teleport to bridge test',
      '  4 - Teleport to house test',
      '',
      'Collision:',
      '  Grass/Road/Bridge/Farm=WALKABLE',
      '  Water/Tree/Rock/House=BLOCKED',
      '  Door=INTERACTABLE (walkable)',
      '',
      'Tests:',
      '  Tree → Stop',
      '  Rock → Stop',
      '  Water → Stop',
      '  House → Stop',
      '  Bridge → Cross',
      '  Corners/diagonal handled',
      '',
      `Player: ${this.player ? `${Math.floor(this.player.x)},${Math.floor(this.player.y)} tile ${this.player.getTilePosition().x},${this.player.getTilePosition().y}` : 'N/A'}`,
      `Colliding: ${this.player?.getIsColliding() ? 'YES' : 'NO'}`
    ];

    const padding = 10;
    const lineHeight = 12;
    const boxWidth = 260;
    const boxHeight = lines.length * lineHeight + 20;
    const x = screenWidth - boxWidth - padding;
    const y = padding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = '#ddd';
    lines.forEach((line, i) => {
      if (i === 0) {
        ctx.fillStyle = '#8f8';
        ctx.fillText(line, x + 10, y + 10 + i * lineHeight);
        ctx.fillStyle = '#ddd';
      } else if (line === 'Collision:' || line === 'Tests:') {
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
  }

  getRenderer(): Renderer { return this.renderer; }
  getInput(): InputManager { return this.input; }
  getDebug(): DebugManager { return this.debug; }
  getWorld(): World { return this.world; }
  getWorldRenderer(): WorldRenderer { return this.worldRenderer; }
  getPlayer(): Player | null { return this.player; }
  getPlayerRenderer(): PlayerRenderer { return this.playerRenderer; }
  getCollisionSystem(): CollisionSystem { return this.collisionSystem; }
  isGameRunning(): boolean { return this.isRunning; }
}
