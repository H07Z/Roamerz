/**
 * Game - Phase 5 + 6
 * Phase 5: Camera System (follow, boundaries, clamping, smooth, zoom)
 * Phase 6: NPC Foundation (5 NPCs, IDLE/WALK, movement between points)
 */

import { Renderer } from './Renderer';
import { InputManager } from './InputManager';
import { DebugManager } from './DebugManager';
import { World } from '../world/World';
import { WorldRenderer } from '../world/WorldRenderer';
import { Player } from '../player/Player';
import { PlayerRenderer } from '../player/PlayerRenderer';
import { CollisionSystem } from '../collision/CollisionSystem';
import { Camera } from '../camera/Camera';
import { NPCManager } from '../npc/NPCManager';
import { NPCRenderer } from '../npc/NPCRenderer';

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
  private camera: Camera;
  private npcManager: NPCManager;
  private npcRenderer: NPCRenderer;

  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  private animationFrameId: number = 0;

  private resizeObserver: ResizeObserver | null = null;
  private boundResizeHandler: () => void;

  private showHelp: boolean = true;
  private showNPCPaths: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.debug = new DebugManager();
    this.world = new World();
    this.worldRenderer = new WorldRenderer();
    this.playerRenderer = new PlayerRenderer();
    this.collisionSystem = new CollisionSystem();
    this.camera = new Camera({ smoothing: 5.0, zoom: 1.0, deadZone: 0 });
    this.npcManager = new NPCManager();
    this.npcRenderer = new NPCRenderer();

    this.boundResizeHandler = this.handleResize.bind(this);
  }

  initialize(): void {
    console.log('[Game] Initializing Phase 5+6 - Camera + NPC Foundation...');

    this.input.initialize(this.canvas);

    try {
      this.world.initialize();
      const map = this.world.getCurrentMap();
      if (map) {
        console.log(`[Game] World map: ${map.mapId} - ${map.name}`);

        this.collisionSystem.initializeFromWorldMap(map);
        console.log(`[Game] Collision:`, this.collisionSystem.getCollisionMap()?.getCounts());

        this.camera.setWorldMap(map);

        const tileSize = WorldRenderer.TILE_SIZE;
        const startX = 25 * tileSize + tileSize / 2;
        const startY = 20 * tileSize + tileSize / 2;
        this.player = new Player(startX, startY, 150);

        // Initialize NPCs (Phase 6)
        this.npcManager.initialize(map);
        console.log(`[Game] NPCs: ${this.npcManager.getCount()} created`);

        console.log(`[Game] Camera: smoothing=${this.camera.getSmoothing()}, zoom=${this.camera.getZoom()}`);
        console.log(`[Game] Player at ${startX},${startY}, NPCs moving between points`);
      }
    } catch (e) {
      console.error('[Game] Init failed:', e);
    }

    window.addEventListener('resize', this.boundResizeHandler);

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      const container = this.canvas.parentElement;
      if (container) this.resizeObserver.observe(container);
    }

    this.handleResize();
    this.camera.centerOn(this.player?.x ?? 25 * 32, this.player?.y ?? 20 * 32);

    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    console.log('[Game] Initialized. Screen:', this.renderer.getWidth(), 'x', this.renderer.getHeight());
    console.log('[Game] Phase 5: Camera follow, clamp, smooth, zoom | Phase 6: 5 NPCs IDLE/WALK A↔B');
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.accumulatedTime = 0;
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

    // Update player
    if (this.player && map) {
      this.player.update(deltaTime, this.input, map, this.collisionSystem);
      this.playerRenderer.update(deltaTime, this.player);

      // Camera follow player (Phase 5)
      this.camera.follow(this.player.x, this.player.y);
      this.camera.update(deltaTime);

      // Sync WorldRenderer offset from Camera (preserve previous functionality)
      const camOffset = this.camera.getOffset();
      this.worldRenderer.setOffset(camOffset.x, camOffset.y);

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

      const collisionMap = this.collisionSystem.getCollisionMap();
      if (collisionMap) {
        this.debug.setCollisionInfo({
          counts: collisionMap.getCounts(),
          isColliding: this.player.getIsColliding(),
          lastCollision: this.player.getLastCollision(),
          showCollision: this.collisionSystem.isShowCollision()
        });
        const tilePos = this.player.getTilePosition();
        this.debug.setCurrentTileCollision(collisionMap.getCollisionType(tilePos.x, tilePos.y));
      }
    }

    // Update NPCs (Phase 6)
    if (map) {
      this.npcManager.update(deltaTime, map, this.collisionSystem);
      this.npcRenderer.update(deltaTime, this.npcManager.getAllNPCs());

      this.debug.setNPCInfo({
        count: this.npcManager.getCount(),
        npcs: this.npcManager.getAllNPCs().map(n => ({
          id: n.id,
          name: n.name,
          role: n.role,
          x: Math.floor(n.x),
          y: Math.floor(n.y),
          tileX: n.getTilePosition().x,
          tileY: n.getTilePosition().y,
          state: n.state,
          direction: n.direction,
          targetX: Math.floor(n.getTarget().x),
          targetY: Math.floor(n.getTarget().y)
        }))
      });
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
      this.debug.setWorldOffset(this.camera.x, this.camera.y);
      this.debug.setCameraInfo({
        x: this.camera.x,
        y: this.camera.y,
        targetX: this.camera.targetX,
        targetY: this.camera.targetY,
        zoom: this.camera.getZoom(),
        smoothing: this.camera.getSmoothing()
      });
    }

    this.handleDebugToggles(deltaTime);
  }

  private handleDebugToggles(_deltaTime: number): void {
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
        this.player.setPosition(25 * tileSize + 16, 20 * tileSize + 16);
      }
      this.camera.centerOn(this.player?.x ?? 25 * 32, this.player?.y ?? 20 * 32);
    }

    if (this.input.isKeyJustPressed('g')) {
      this.worldRenderer.setShowGrid(!this.worldRenderer['showGrid']);
    }

    if (this.input.isKeyJustPressed('c')) {
      this.camera.centerOn(this.player?.x ?? 25 * 32, this.player?.y ?? 20 * 32);
    }

    if (this.input.isKeyJustPressed('h')) {
      this.showHelp = !this.showHelp;
    }

    if (this.input.isKeyJustPressed('b')) {
      this.worldRenderer.setShowTileCoords(!this.worldRenderer['showTileCoords']);
    }

    if (this.input.isKeyJustPressed('v')) {
      this.camera.centerOnTile(25, 20);
    }

    if (this.input.isKeyJustPressed('k')) {
      this.collisionSystem.setShowCollision(!this.collisionSystem.isShowCollision());
    }

    // Phase 5: Camera controls
    if (this.input.isKeyJustPressed('z')) {
      const newZoom = this.camera.getZoom() === 1 ? 1.5 : this.camera.getZoom() === 1.5 ? 0.75 : 1;
      this.camera.setZoom(newZoom);
      console.log(`[Camera] Zoom: ${newZoom}`);
    }

    if (this.input.isKeyJustPressed('x')) {
      const newSmooth = this.camera.getSmoothing() === 5 ? 0 : this.camera.getSmoothing() === 0 ? 10 : 5;
      this.camera.setSmoothing(newSmooth);
      console.log(`[Camera] Smoothing: ${newSmooth} (0=instant)`);
    }

    // Phase 6: NPC debug
    if (this.input.isKeyJustPressed('n')) {
      this.showNPCPaths = !this.showNPCPaths;
      console.log(`[NPC] Paths debug: ${this.showNPCPaths ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('p')) {
      // Print NPC states
      console.log('[NPC] States:');
      for (const npc of this.npcManager.getAllNPCs()) {
        console.log(`  ${npc.id} ${npc.name} ${npc.state} at ${Math.floor(npc.x)},${Math.floor(npc.y)} -> ${Math.floor(npc.getTarget().x)},${Math.floor(npc.getTarget().y)}`);
      }
    }

    // Teleports
    if (this.input.isKeyJustPressed('1') && this.player) this.player.setPosition(3*32+16, 3*32+16);
    if (this.input.isKeyJustPressed('2') && this.player) this.player.setPosition(38*32+16, 10*32+16);
    if (this.input.isKeyJustPressed('3') && this.player) this.player.setPosition(36*32+16, 19*32+16);
    if (this.input.isKeyJustPressed('4') && this.player) this.player.setPosition(12*32+16, 10*32+16);
  }

  private render(): void {
    this.renderer.clear();
    const ctx = this.renderer.getContext();
    const w = this.renderer.getWidth();
    const h = this.renderer.getHeight();
    const map = this.world.getCurrentMap();

    if (map) {
      this.worldRenderer.render(ctx, map, w, h);
      this.collisionSystem.renderDebug(ctx, this.worldRenderer, w, h);
    } else {
      this.renderer.renderBackground();
    }

    // Render NPCs (Phase 6) - before player so player on top, but sorted by Y in renderer
    if (this.npcManager.getCount() > 0) {
      this.npcRenderer.renderAll(ctx, this.npcManager.getAllNPCs(), this.worldRenderer, this.camera);
      if (this.showNPCPaths) {
        this.npcRenderer.renderAllDebugPaths(ctx, this.npcManager.getAllNPCs(), this.worldRenderer, this.camera);
      }
    }

    if (this.player) {
      this.playerRenderer.render(ctx, this.player, this.worldRenderer);
      // Also render with camera for consistency
      // PlayerRenderer uses worldRenderer offset, which is synced from camera
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
      'PHASE 5+6 - CAMERA + NPC FOUNDATION',
      'Player:',
      '  WASD/Arrows - Move',
      '  C - Center on player',
      'Camera (Phase5):',
      '  Z - Toggle zoom (1/1.5/0.75)',
      '  X - Toggle smoothing (5/0/10)',
      '  V - Center on village',
      '  Clamp + follow + smooth + zoom',
      'Collision (Phase4):',
      '  K - Collision overlay',
      '  1-4 - Teleport tests',
      'NPC (Phase6):',
      '  N - Toggle NPC paths A↔B',
      '  P - Print NPC states',
      '  5 NPCs: Farmer, Shop, Blacksmith,',
      '  Villager, Child - IDLE/WALK',
      'General:',
      '  G - Grid, B - Tile coords',
      '  ` / F2 - Debug, H - Help, R - Reset',
      '',
      `Player: ${this.player ? `${Math.floor(this.player.x)},${Math.floor(this.player.y)} ${this.player.state}` : 'N/A'}`,
      `Camera: ${Math.floor(this.camera.x)},${Math.floor(this.camera.y)} zoom ${this.camera.getZoom()} smooth ${this.camera.getSmoothing()}`,
      `NPCs: ${this.npcManager.getCount()} - ${this.npcManager.getAllNPCs().map(n=>`${n.id}:${n.state}`).join(' ')}`
    ];

    const padding = 10;
    const lineHeight = 12;
    const boxWidth = 280;
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
      } else if (line.endsWith(':')) {
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
    const w = this.renderer.getWidth();
    const h = this.renderer.getHeight();
    this.camera.setScreenSize(w, h);
    const map = this.world.getCurrentMap();
    if (map) {
      this.camera.clampToMap();
      const camOffset = this.camera.getOffset();
      this.worldRenderer.setOffset(camOffset.x, camOffset.y);
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
  getCamera(): Camera { return this.camera; }
  getNPCManager(): NPCManager { return this.npcManager; }
  getNPCRenderer(): NPCRenderer { return this.npcRenderer; }
  isGameRunning(): boolean { return this.isRunning; }
}
