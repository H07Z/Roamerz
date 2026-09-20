/**
 * Game - Phase 8 NPC Homes & Buildings
 * - Buildings with doors, owners, types, interiors
 * - NPC homes linked, goHome, AT_HOME, INSIDE states
 * - Building rendering with doors, labels, ownership
 * - Debug building view
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
import { NavigationGrid } from '../pathfinding/NavigationGrid';
import { Pathfinder } from '../pathfinding/Pathfinder';
import { BuildingManager } from '../building/BuildingManager';
import { BuildingRenderer } from '../building/BuildingRenderer';

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
  private navigationGrid: NavigationGrid | null = null;
  private pathfinder: Pathfinder | null = null;
  private buildingManager: BuildingManager;
  private buildingRenderer: BuildingRenderer;

  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  private animationFrameId: number = 0;

  private resizeObserver: ResizeObserver | null = null;
  private boundResizeHandler: () => void;

  private showHelp: boolean = true;
  private showNPCPaths: boolean = true;
  private showNavigationGrid: boolean = false;
  private showBuildingDoors: boolean = true;
  private showBuildingLabels: boolean = false;
  private showBuildingOwnership: boolean = false;
  private showBuildingFronts: boolean = false;

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
    this.buildingManager = new BuildingManager();
    this.buildingRenderer = new BuildingRenderer();

    this.boundResizeHandler = this.handleResize.bind(this);
  }

  initialize(): void {
    console.log('[Game] Initializing Phase 8 - NPC Homes & Buildings...');

    this.input.initialize(this.canvas);

    try {
      this.world.initialize();
      const map = this.world.getCurrentMap();
      if (map) {
        console.log(`[Game] World map: ${map.mapId} - ${map.name}`);

        // Collision
        this.collisionSystem.initializeFromWorldMap(map);
        const collisionMap = this.collisionSystem.getCollisionMap();
        console.log(`[Game] Collision:`, collisionMap?.getCounts());

        // Navigation Grid separate from visual
        if (collisionMap) {
          this.navigationGrid = NavigationGrid.fromCollisionMap(collisionMap);
        } else {
          this.navigationGrid = NavigationGrid.fromWorldMap(map);
        }
        console.log(`[Game] NavigationGrid:`, this.navigationGrid.getCounts());

        // Pathfinder with A*
        this.pathfinder = new Pathfinder(false);
        this.pathfinder.setNavigationGrid(this.navigationGrid);
        this.pathfinder.setRecalculationCooldown(2000);
        console.log(`[Game] Pathfinder: A* with 4-dir, cooldown 2000ms`);

        // Buildings (Phase 8)
        this.buildingManager.initialize(map);
        console.log(`[Game] Buildings:`, this.buildingManager.getCounts());
        const validation = this.buildingManager.validate();
        if (!validation.valid) {
          console.warn('[Game] Building validation errors:', validation.errors);
        } else {
          console.log('[Game] Building validation PASS');
        }

        this.camera.setWorldMap(map);

        const tileSize = WorldRenderer.TILE_SIZE;
        const startX = 25 * tileSize + tileSize / 2;
        const startY = 20 * tileSize + tileSize / 2;
        this.player = new Player(startX, startY, 150);

        // NPCs with pathfinding and homes
        this.npcManager.initialize(map, collisionMap, this.navigationGrid, this.pathfinder, this.buildingManager);
        console.log(`[Game] NPCs: ${this.npcManager.getCount()} with pathfinding and homes`);

        console.log(`[Game] Phase 8: Homes & Buildings - doors, owners, goHome, AT_HOME, INSIDE, occupancy`);
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

    if (this.player && map) {
      this.player.update(deltaTime, this.input, map, this.collisionSystem);
      this.playerRenderer.update(deltaTime, this.player);
      this.camera.follow(this.player.x, this.player.y);
      this.camera.update(deltaTime);
      const camOffset = this.camera.getOffset();
      this.worldRenderer.setOffset(camOffset.x, camOffset.y);
      this.worldRenderer.setZoom(this.camera.getZoom());

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

      // Pathfinding debug
      if (this.pathfinder && this.navigationGrid) {
        const stats = this.pathfinder.getStats();
        this.debug.setPathfindingInfo({
          gridCounts: this.navigationGrid.getCounts(),
          totalRequests: stats.total,
          successful: stats.successful,
          failed: stats.failed,
          successRate: stats.successRate,
          showPaths: this.showNPCPaths,
          showNavGrid: this.showNavigationGrid
        });

        // NPC path details
        const npcPaths = this.npcManager.getAllNPCs().map(n => {
          const path = n.getPath();
          return {
            id: n.id,
            pathLength: path ? path.getLength() : 0,
            currentNode: path ? path.getCurrentIndex() : -1,
            status: path ? path.status : 'NO_PATH',
            destination: n.getDestinationTile(),
            start: n.getStartTile(),
            stats: n.getStats()
          };
        });
        this.debug.setNPCPathInfo(npcPaths);
      }

      // Building debug (Phase 8)
      if (this.buildingManager) {
        const counts = this.buildingManager.getCounts();
        this.debug.setBuildingInfo({
          counts,
          showDoors: this.showBuildingDoors,
          showLabels: this.showBuildingLabels,
          showOwnership: this.showBuildingOwnership,
          showFronts: this.showBuildingFronts
        });

        const buildingDetails = this.buildingManager.getAllBuildings().map(b => ({
          id: b.id,
          name: b.name,
          type: b.type,
          x: b.x,
          y: b.y,
          doorX: b.door.x,
          doorY: b.door.y,
          ownerId: b.ownerId ?? null,
          occupied: b.getIsOccupied(),
          occupantId: b.getOccupantId()
        }));
        this.debug.setBuildingDetails(buildingDetails);
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

    if (this.input.isKeyJustPressed('z')) {
      const newZoom = this.camera.getZoom() === 1 ? 1.5 : this.camera.getZoom() === 1.5 ? 0.75 : 1;
      this.camera.setZoom(newZoom);
    }

    if (this.input.isKeyJustPressed('x')) {
      const newSmooth = this.camera.getSmoothing() === 5 ? 0 : this.camera.getSmoothing() === 0 ? 10 : 5;
      this.camera.setSmoothing(newSmooth);
    }

    // Phase 7: Pathfinding debug
    if (this.input.isKeyJustPressed('n')) {
      this.showNPCPaths = !this.showNPCPaths;
      console.log(`[Pathfinding] Paths debug: ${this.showNPCPaths ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('m')) {
      this.showNavigationGrid = !this.showNavigationGrid;
      console.log(`[Pathfinding] Nav grid debug: ${this.showNavigationGrid ? 'ON' : 'OFF'}`);
    }

    // Phase 8: Building debug
    if (this.input.isKeyJustPressed('j')) {
      this.showBuildingDoors = !this.showBuildingDoors;
      console.log(`[Building] Doors debug: ${this.showBuildingDoors ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('l')) {
      this.showBuildingLabels = !this.showBuildingLabels;
      console.log(`[Building] Labels debug: ${this.showBuildingLabels ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('u')) {
      this.showBuildingOwnership = !this.showBuildingOwnership;
      console.log(`[Building] Ownership debug: ${this.showBuildingOwnership ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('i')) {
      this.showBuildingFronts = !this.showBuildingFronts;
      console.log(`[Building] Front-of-door debug: ${this.showBuildingFronts ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('y')) {
      // Test Phase 8: All NPCs go home
      console.log('[Phase8 Test] All NPCs go home');
      for (const npc of this.npcManager.getAllNPCs()) {
        npc.goHome();
      }
    }

    if (this.input.isKeyJustPressed('p')) {
      console.log('[NPC] States and Paths and Homes:');
      for (const npc of this.npcManager.getAllNPCs()) {
        const path = npc.getPath();
        const home = npc.getHomeBuilding();
        console.log(`  ${npc.id} ${npc.name} ${npc.state} at ${npc.getTilePosition().x},${npc.getTilePosition().y} -> dest ${npc.getDestinationTile()?.x},${npc.getDestinationTile()?.y} pathLen ${path?.getLength()??0} status ${path?.status} home ${home?.id} door ${home?.door.x},${home?.door.y} visits ${npc.getStats().homeVisits}`);
      }
      if (this.pathfinder) {
        console.log('[Pathfinder] Stats:', this.pathfinder.getStats());
      }
      console.log('[Buildings]:', this.buildingManager.getCounts());
      for (const b of this.buildingManager.getAllBuildings()) {
        console.log(`  ${b.id} ${b.name} ${b.x},${b.y} ${b.width}x${b.height} door ${b.door.x},${b.door.y} owner ${b.ownerId} occupied ${b.getIsOccupied()} occupant ${b.getOccupantId()}`);
      }
    }

    // Phase 7 Tests - hotkeys for testing pathfinding scenarios
    if (this.input.isKeyJustPressed('t')) {
      console.log('[Phase7+8 Test] Running pathfinding and building tests...');
      this.runPhase7Tests();
      this.runPhase8Tests();
    }

    if (this.input.isKeyJustPressed('o')) {
      // Test 6: Add obstacle to route
      if (this.navigationGrid) {
        const testX = 24, testY = 18;
        const wasWalkable = this.navigationGrid.isWalkable(testX, testY);
        this.navigationGrid.setWalkable(testX, testY, !wasWalkable);
        console.log(`[Phase7 Test6] Toggled obstacle at ${testX},${testY} walkable=${!wasWalkable} (was ${wasWalkable}) - NPCs should recalculate`);
      }
    }

    // Teleports
    if (this.input.isKeyJustPressed('1') && this.player) this.player.setPosition(3*32+16, 3*32+16);
    if (this.input.isKeyJustPressed('2') && this.player) this.player.setPosition(38*32+16, 10*32+16);
    if (this.input.isKeyJustPressed('3') && this.player) this.player.setPosition(36*32+16, 19*32+16);
    if (this.input.isKeyJustPressed('4') && this.player) this.player.setPosition(12*32+16, 10*32+16);

    // Phase 7: Request NPC to specific destinations for testing
    if (this.input.isKeyJustPressed('5')) {
      const npc = this.npcManager.getNPC('NPC001');
      if (npc) {
        const tile = npc.getTilePosition();
        npc.requestPath({ x: tile.x + 2, y: tile.y });
        console.log(`[Test1] NPC001 nearby destination ${tile.x+2},${tile.y}`);
      }
    }
    if (this.input.isKeyJustPressed('6')) {
      const npc = this.npcManager.getNPC('NPC002');
      if (npc) {
        npc.requestPath({ x: 10, y: 10 });
        console.log(`[Test2] NPC002 around building to 10,10`);
      }
    }
    if (this.input.isKeyJustPressed('7')) {
      const npc = this.npcManager.getNPC('NPC003');
      if (npc) {
        npc.requestPath({ x: 42, y: 19 });
        console.log(`[Test3] NPC003 across bridge to 42,19`);
      }
    }
    if (this.input.isKeyJustPressed('8')) {
      const npc = this.npcManager.getNPC('NPC004');
      if (npc) {
        npc.requestPath({ x: 38, y: 10 });
        console.log(`[Test4] NPC004 blocked destination water 38,10`);
      }
    }
    if (this.input.isKeyJustPressed('9')) {
      const npc = this.npcManager.getNPC('NPC005');
      if (npc) {
        npc.requestPath({ x: 0, y: 0 });
        console.log(`[Test5] NPC005 no path to 0,0 (tree border)`);
      }
    }

    // Phase 8: NPC go home tests (F1-F5 for NPC1-5)
    if (this.input.isKeyJustPressed('f5')) {
      const npc = this.npcManager.getNPC('NPC001');
      if (npc) npc.goHome();
    }
    if (this.input.isKeyJustPressed('f6')) {
      const npc = this.npcManager.getNPC('NPC002');
      if (npc) npc.goHome();
    }
    if (this.input.isKeyJustPressed('f7')) {
      const npc = this.npcManager.getNPC('NPC003');
      if (npc) npc.goHome();
    }
    if (this.input.isKeyJustPressed('f8')) {
      const npc = this.npcManager.getNPC('NPC004');
      if (npc) npc.goHome();
    }
  }

  private runPhase7Tests(): void {
    if (!this.pathfinder || !this.navigationGrid) {
      console.log('No pathfinder/grid');
      return;
    }

    console.log('=== PHASE 7 TESTS ===');

    let result = this.pathfinder.requestPath({ x: 25, y: 20 }, { x: 27, y: 20 }, 'TEST1');
    console.log(`Test1 nearby: ${result.success ? 'PASS' : 'FAIL'} length=${result.path?.getLength()}`);

    result = this.pathfinder.requestPath({ x: 10, y: 10 }, { x: 18, y: 10 }, 'TEST2');
    console.log(`Test2 around building: ${result.success ? 'PASS' : 'FAIL'} length=${result.path?.getLength()}`);

    result = this.pathfinder.requestPath({ x: 24, y: 19 }, { x: 42, y: 19 }, 'TEST3');
    console.log(`Test3 across bridge: ${result.success ? 'PASS' : 'FAIL'} length=${result.path?.getLength()}`);

    result = this.pathfinder.requestPath({ x: 25, y: 20 }, { x: 38, y: 10 }, 'TEST4');
    console.log(`Test4 blocked dest (water): ${!result.success ? 'PASS (correctly no path)' : 'FAIL (should be no path)'} status=${result.path?.status}`);

    result = this.pathfinder.requestPath({ x: 25, y: 20 }, { x: 0, y: 0 }, 'TEST5');
    console.log(`Test5 no path (0,0 tree): ${!result.success ? 'PASS' : 'FAIL'} status=${result.path?.status}`);

    console.log(`Test7 multiple NPCs: ${this.npcManager.getCount()} NPCs pathfinding simultaneously - PASS if all moving`);

    console.log('=== END PHASE 7 TESTS ===');
  }

  private runPhase8Tests(): void {
    if (!this.buildingManager) {
      console.log('No building manager');
      return;
    }

    console.log('=== PHASE 8 TESTS ===');

    // Test1: Building counts
    const counts = this.buildingManager.getCounts();
    console.log(`Test1 building counts: total=${counts.total} residential=${counts.residential} withInterior=${counts.withInterior} byType=${JSON.stringify(counts.byType)} -> ${counts.total >= 5 ? 'PASS' : 'FAIL'}`);

    // Test2: Each building has door walkable
    let doorsWalkable = true;
    for (const b of this.buildingManager.getAllBuildings()) {
      if (this.navigationGrid) {
        const walkable = this.navigationGrid.isWalkable(b.door.x, b.door.y);
        console.log(`  Building ${b.id} door ${b.door.x},${b.door.y} walkable=${walkable}`);
        if (!walkable) doorsWalkable = false;
      }
    }
    console.log(`Test2 doors walkable: ${doorsWalkable ? 'PASS' : 'FAIL'}`);

    // Test3: Each NPC has home
    let homesValid = true;
    for (const npc of this.npcManager.getAllNPCs()) {
      const home = npc.getHomeBuilding();
      const hasHome = home !== null;
      console.log(`  NPC ${npc.id} homeId=${npc.getHomeId()} homeBuilding=${home?.id ?? 'none'} -> ${hasHome ? 'PASS' : 'FAIL'}`);
      if (!hasHome) homesValid = false;
    }
    console.log(`Test3 NPC homes valid: ${homesValid ? 'PASS' : 'FAIL'}`);

    // Test4: Path to home for each NPC
    let pathsToHome = true;
    if (this.pathfinder) {
      for (const npc of this.npcManager.getAllNPCs()) {
        const home = npc.getHomeBuilding();
        if (!home) continue;
        const front = home.getFrontOfDoorPosition();
        const start = npc.getTilePosition();
        const result = this.pathfinder.requestPath(start, { x: front.tileX, y: front.tileY }, `HOME_${npc.id}`);
        console.log(`  Path to home ${npc.id} -> ${home.id} front ${front.tileX},${front.tileY}: ${result.success ? 'PASS' : 'FAIL'} len=${result.path?.getLength()}`);
        if (!result.success) pathsToHome = false;
      }
    }
    console.log(`Test4 paths to home: ${pathsToHome ? 'PASS' : 'FAIL'}`);

    // Test5: Building validation
    const validation = this.buildingManager.validate();
    console.log(`Test5 building validation: ${validation.valid ? 'PASS' : 'FAIL'} errors=${validation.errors.length}`);
    if (!validation.valid) console.log('  Errors:', validation.errors);

    // Test6: Door tiles are INTERACTABLE in collision map
    const collisionMap = this.collisionSystem.getCollisionMap();
    let doorsInteractable = true;
    if (collisionMap) {
      for (const b of this.buildingManager.getAllBuildings()) {
        const type = collisionMap.getCollisionType(b.door.x, b.door.y);
        // Door should be WALKABLE or INTERACTABLE (not BLOCKED)
        const isWalkable = type !== null && type !== 1; // 1 = BLOCKED
        console.log(`  Door ${b.id} ${b.door.x},${b.door.y} collisionType=${type} walkable=${isWalkable}`);
        if (!isWalkable) doorsInteractable = false;
      }
    }
    console.log(`Test6 doors collision walkable: ${doorsInteractable ? 'PASS' : 'FAIL'}`);

    // Test7: Front-of-door positions walkable
    let frontsWalkable = true;
    for (const b of this.buildingManager.getAllBuildings()) {
      const front = b.getFrontOfDoorPosition();
      if (this.navigationGrid) {
        const walkable = this.navigationGrid.isWalkable(front.tileX, front.tileY);
        console.log(`  Front ${b.id} ${front.tileX},${front.tileY} walkable=${walkable}`);
        if (!walkable) frontsWalkable = false;
      }
    }
    console.log(`Test7 front-of-door walkable: ${frontsWalkable ? 'PASS' : 'FAIL'}`);

    // Test8: Ownership linkage
    let ownershipOk = true;
    for (const b of this.buildingManager.getAllBuildings()) {
      if (b.ownerId) {
        const owner = this.npcManager.getNPC(b.ownerId);
        const ownerExists = owner !== undefined;
        const ownerHomeMatches = owner?.getHomeBuilding()?.id === b.id;
        console.log(`  Building ${b.id} owner ${b.ownerId} exists=${ownerExists} homeMatches=${ownerHomeMatches}`);
        if (!ownerExists || !ownerHomeMatches) ownershipOk = false;
      }
    }
    console.log(`Test8 ownership linkage: ${ownershipOk ? 'PASS' : 'FAIL'}`);

    console.log('=== END PHASE 8 TESTS ===');
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

      // Navigation grid debug
      if (this.showNavigationGrid && this.navigationGrid) {
        this.renderNavigationGridDebug(ctx, w, h);
      }

      // Buildings (Phase 8) - render doors, labels, etc. after world but before NPCs
      if (this.buildingManager) {
        const buildings = this.buildingManager.getAllBuildings();
        this.buildingRenderer.renderAll(ctx, buildings, this.worldRenderer, this.camera, {
          showDoors: this.showBuildingDoors,
          showLabels: this.showBuildingLabels,
          showOwnership: this.showBuildingOwnership,
          showBlocked: false
        });

        if (this.showBuildingFronts) {
          this.buildingRenderer.renderAllFrontOfDoors(ctx, buildings, this.worldRenderer, this.camera);
        }
      }
    } else {
      this.renderer.renderBackground();
    }

    if (this.npcManager.getCount() > 0) {
      this.npcRenderer.renderAll(ctx, this.npcManager.getAllNPCs(), this.worldRenderer, this.camera);
      if (this.showNPCPaths) {
        this.npcRenderer.renderAllDebugPaths(ctx, this.npcManager.getAllNPCs(), this.worldRenderer, this.camera);
      }
    }

    if (this.player) {
      this.playerRenderer.render(ctx, this.player, this.worldRenderer);
    }

    this.debug.render(ctx);

    if (this.showHelp && this.debug.isEnabled()) {
      this.renderHelp(ctx, w, h);
    }
  }

  private renderNavigationGridDebug(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    if (!this.navigationGrid) return;

    const tileSize = this.worldRenderer.getTileSize();
    const zoom = this.worldRenderer.getZoom();
    const offset = this.camera.getOffset();
    const scaledTileSize = tileSize * zoom;
    const scaledScreenWidth = screenWidth / zoom;
    const scaledScreenHeight = screenHeight / zoom;

    const startCol = Math.floor(offset.x / tileSize);
    const endCol = Math.ceil((offset.x + scaledScreenWidth) / tileSize);
    const startRow = Math.floor(offset.y / tileSize);
    const endRow = Math.ceil((offset.y + scaledScreenHeight) / tileSize);

    const clampedStartCol = Math.max(0, startCol);
    const clampedEndCol = Math.min(this.navigationGrid.width, endCol);
    const clampedStartRow = Math.max(0, startRow);
    const clampedEndRow = Math.min(this.navigationGrid.height, endRow);

    ctx.save();

    for (let y = clampedStartRow; y < clampedEndRow; y++) {
      for (let x = clampedStartCol; x < clampedEndCol; x++) {
        const screenX = (x * tileSize - offset.x) * zoom;
        const screenY = (y * tileSize - offset.y) * zoom;

        if (this.navigationGrid.isBlocked(x, y)) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
          ctx.fillRect(screenX, screenY, scaledTileSize, scaledTileSize);
        } else {
          ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
          ctx.fillRect(screenX, screenY, scaledTileSize, scaledTileSize);
        }
      }
    }

    ctx.restore();
  }

  private renderHelp(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    ctx.save();
    ctx.font = '10px monospace';
    ctx.textBaseline = 'top';

    const lines = [
      'PHASE 8 - NPC HOMES & BUILDINGS',
      'Player: WASD/Arrows move, C center',
      'Camera: Z zoom, X smoothing, V village',
      'Collision: K overlay, 1-4 teleport',
      'Pathfinding:',
      '  N - Toggle NPC paths (● nodes)',
      '  M - Toggle nav grid (red blocked)',
      'Buildings (Phase 8):',
      '  J - Toggle doors (⌂ door)',
      '  L - Toggle building labels',
      '  U - Toggle ownership',
      '  I - Toggle front-of-door (yellow)',
      '  Y - All NPCs go home',
      '  F5-F8 - NPC1-4 go home',
      '  T - Run all tests (Phase7+8)',
      '  O - Toggle obstacle at 24,18',
      '  P - Print NPC + building states',
      'Tests Phase7:',
      '  5 - nearby, 6 - around building',
      '  7 - across bridge, 8 - blocked dest',
      '  9 - no path (0,0)',
      'General: G grid, B coords, ` F2 debug',
      'H help, R reset',
      '',
      `Player: ${this.player ? `${Math.floor(this.player.x)},${Math.floor(this.player.y)} ${this.player.state}` : 'N/A'}`,
      `Camera: ${Math.floor(this.camera.x)},${Math.floor(this.camera.y)} zoom ${this.camera.getZoom()}`,
      `NPCs: ${this.npcManager.getCount()} | Paths:${this.showNPCPaths?'ON':'OFF'} Nav:${this.showNavigationGrid?'ON':'OFF'}`,
      `Buildings: ${this.buildingManager ? this.buildingManager.getCount() : 0} | Doors:${this.showBuildingDoors?'ON':'OFF'} Labels:${this.showBuildingLabels?'ON':'OFF'} Own:${this.showBuildingOwnership?'ON':'OFF'}`,
      `Pathfinder: ${this.pathfinder ? `${this.pathfinder.getStats().successful}/${this.pathfinder.getStats().total} success` : 'N/A'}`,
      ...this.npcManager.getAllNPCs().map(n => {
        const path = n.getPath();
        const home = n.getHomeBuilding();
        const stats = n.getStats();
        return `${n.id} ${n.state} ${n.getTilePosition().x},${n.getTilePosition().y}->${n.getDestinationTile()?.x},${n.getDestinationTile()?.y} len:${path?.getLength()??0} home:${home?.id} visits:${stats.homeVisits} ${n.state==='INSIDE'?'⌂ INSIDE':''}`;
      }),
      ...this.buildingManager.getAllBuildings().map(b => {
        return `${b.id} ${b.name} ${b.x},${b.y} door ${b.door.x},${b.door.y} owner ${b.ownerId ?? 'none'} ${b.getIsOccupied() ? `OCCUPIED by ${b.getOccupantId()}` : ''}`;
      })
    ];

    const padding = 10;
    const lineHeight = 11;
    const boxWidth = 380;
    const boxHeight = lines.length * lineHeight + 20;
    const x = screenWidth - boxWidth - padding;
    const y = padding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = '#ddd';
    lines.forEach((line, i) => {
      if (i === 0) {
        ctx.fillStyle = '#8f8';
        ctx.fillText(line, x + 10, y + 10 + i * lineHeight);
        ctx.fillStyle = '#ddd';
      } else if (line.endsWith(':') || line.startsWith('Pathfinding') || line.startsWith('Buildings') || line.startsWith('Tests')) {
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
      this.worldRenderer.setZoom(this.camera.getZoom());
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
  getNavigationGrid(): NavigationGrid | null { return this.navigationGrid; }
  getPathfinder(): Pathfinder | null { return this.pathfinder; }
  getBuildingManager(): BuildingManager { return this.buildingManager; }
  getBuildingRenderer(): BuildingRenderer { return this.buildingRenderer; }
  isGameRunning(): boolean { return this.isRunning; }
}
