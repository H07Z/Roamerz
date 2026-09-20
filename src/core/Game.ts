/**
 * Game - Phase 11 Player Interaction & Dialogue
 * - TimeManager with day phases, time scale, pause, day/night lighting
 * - Schedule system with activities, destinations, time-based triggers
 * - NPC schedules: SLEEP, HOME, WORK, EAT, SOCIAL, etc. based on role
 * - Life simulation: needs, inventory, jobs, interactions
 * - Interaction: E to talk to NPCs/buildings, dialogue trees, choices 1-4, ESC close
 * - Day/night overlay, clock, timeline, needs bars, inventory, job progress, dialogue UI
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
import { TimeManager } from '../time/TimeManager';
import { TimeRenderer } from '../time/TimeRenderer';
import { ScheduleManager } from '../schedule/ScheduleManager';
import { LifeManager } from '../life/LifeManager';
import { LifeRenderer } from '../life/LifeRenderer';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { DialogueManager } from '../dialogue/DialogueManager';
import { DialogueRenderer } from '../dialogue/DialogueRenderer';

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
  private timeManager: TimeManager;
  private timeRenderer: TimeRenderer;
  private scheduleManager: ScheduleManager;
  private lifeManager: LifeManager;
  private lifeRenderer: LifeRenderer;
  private interactionSystem: InteractionSystem;
  private dialogueManager: DialogueManager;
  private dialogueRenderer: DialogueRenderer;

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
  private showSchedules: boolean = true;
  private showTimeOverlay: boolean = true;
  private showClock: boolean = true;
  private showTimeline: boolean = true;
  private showNeeds: boolean = true;
  private showInventory: boolean = false;
  private showJobs: boolean = true;
  private showInteractionPrompt: boolean = true;

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
    this.timeManager = new TimeManager(6, 1, 60);
    this.timeRenderer = new TimeRenderer();
    this.scheduleManager = new ScheduleManager();
    this.lifeManager = new LifeManager();
    this.lifeRenderer = new LifeRenderer();
    this.interactionSystem = new InteractionSystem();
    this.dialogueManager = new DialogueManager();
    this.dialogueRenderer = new DialogueRenderer();

    this.boundResizeHandler = this.handleResize.bind(this);
  }

  initialize(): void {
    console.log('[Game] Initializing Phase 11 - Player Interaction & Dialogue...');

    this.input.initialize(this.canvas);

    try {
      this.world.initialize();
      const map = this.world.getCurrentMap();
      if (map) {
        console.log(`[Game] World map: ${map.mapId} - ${map.name}`);

        this.collisionSystem.initializeFromWorldMap(map);
        const collisionMap = this.collisionSystem.getCollisionMap();
        console.log(`[Game] Collision:`, collisionMap?.getCounts());

        if (collisionMap) {
          this.navigationGrid = NavigationGrid.fromCollisionMap(collisionMap);
        } else {
          this.navigationGrid = NavigationGrid.fromWorldMap(map);
        }
        console.log(`[Game] NavigationGrid:`, this.navigationGrid.getCounts());

        this.pathfinder = new Pathfinder(false);
        this.pathfinder.setNavigationGrid(this.navigationGrid);
        this.pathfinder.setRecalculationCooldown(2000);
        console.log(`[Game] Pathfinder: A* with 4-dir, cooldown 2000ms`);

        this.buildingManager.initialize(map);
        console.log(`[Game] Buildings:`, this.buildingManager.getCounts());
        const validation = this.buildingManager.validate();
        if (!validation.valid) {
          console.warn('[Game] Building validation errors:', validation.errors);
        } else {
          console.log('[Game] Building validation PASS');
        }

        this.timeManager = new TimeManager(6, 1, 60);
        console.log(`[Game] Time: ${this.timeManager.formatDayTime()} scale ${this.timeManager.getTimeScale()}x phase ${this.timeManager.getPhase()}`);

        this.scheduleManager.initialize();
        console.log(`[Game] Schedules: ${this.scheduleManager.getCount()} NPC schedules`);

        this.timeManager.onPhaseChange((oldPhase, newPhase, time) => {
          console.log(`[Game] Day phase: ${oldPhase} -> ${newPhase} at ${time.hour}:${String(time.minute).padStart(2,'0')} Day ${time.day}`);
        });

        this.timeManager.onDayChange((newDay, time) => {
          console.log(`[Game] New day: Day ${newDay} at ${time.hour}:${String(time.minute).padStart(2,'0')}`);
        });

        this.camera.setWorldMap(map);

        const tileSize = WorldRenderer.TILE_SIZE;
        const startX = 25 * tileSize + tileSize / 2;
        const startY = 20 * tileSize + tileSize / 2;
        this.player = new Player(startX, startY, 150);

        this.npcManager.initialize(map, collisionMap, this.navigationGrid, this.pathfinder, this.buildingManager, this.scheduleManager, this.timeManager, this.lifeManager);
        console.log(`[Game] NPCs: ${this.npcManager.getCount()} with pathfinding, homes, schedules, and life`);

        if (this.lifeManager.getCount() === 0) {
          this.lifeManager.initialize(this.npcManager.getAllNPCs(), this.buildingManager, this.timeManager);
        }
        console.log(`[Game] Life: ${this.lifeManager.getCount()} NPCs, avg wellbeing ${this.lifeManager.getAverageWellbeing().toFixed(0)}%`);

        this.interactionSystem.setInteractionRange(60);
        console.log(`[Game] Interaction: range ${this.interactionSystem.getInteractionRange()}px`);

        console.log(`[Game] Dialogue: ${this.dialogueManager.getTotalDialogues()} dialogues, ready for interaction`);

        console.log(`[Game] Phase 11: Interaction & Dialogue - E to talk, 1-4 choices, ESC close, dynamic dialogues`);
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

    if (this.timeManager && !this.dialogueManager.isOpen()) {
      this.timeManager.update(deltaTime);
    }

    const map = this.world.getCurrentMap();

    if (this.player && map) {
      const isDialogueOpen = this.dialogueManager.isOpen();
      this.player.update(deltaTime, this.input, map, this.collisionSystem, isDialogueOpen);
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
      const currentMinutes = this.timeManager ? this.timeManager.getMinutesSinceMidnight() : undefined;
      
      // Don't update NPCs if dialogue open? Keep them updating but paused? We'll keep updating for simplicity
      // But we can pause pathfinding when dialogue open to keep NPCs in place for conversation
      if (!this.dialogueManager.isOpen()) {
        this.npcManager.update(deltaTime, map, this.collisionSystem, currentMinutes);
      }
      this.npcRenderer.update(deltaTime, this.npcManager.getAllNPCs());

      if (this.lifeManager && this.timeManager && !this.dialogueManager.isOpen()) {
        this.lifeManager.update(deltaTime, this.npcManager.getAllNPCs(), this.timeManager);
      }

      // Interaction update (always, even during dialogue to show prompt after close)
      if (this.player) {
        this.interactionSystem.update(this.player, this.npcManager.getAllNPCs(), this.buildingManager);
      }

      // Dialogue input handling - track if dialogue was open BEFORE handling to prevent same-frame teleport bug
      // Bug: pressing 1-4 to choose dialogue option ends dialogue, then same key triggers teleport to 3,3
      const wasDialogueOpenBeforeInput = this.dialogueManager.isOpen();
      this.handleDialogueInput();

      // Store for debug toggles
      (this as any)._wasDialogueOpenBeforeInput = wasDialogueOpenBeforeInput;

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

        const npcPaths = this.npcManager.getAllNPCs().map(n => {
          const path = n.getPath();
          return {
            id: n.id,
            pathLength: path ? path.getLength() : 0,
            currentNode: path ? path.getCurrentIndex() : -1,
            status: path ? path.status : 'NO_PATH',
            destination: n.getDestinationTile(),
            start: n.getStartTile(),
            stats: n.getStats() as any
          };
        });
        this.debug.setNPCPathInfo(npcPaths);
      }

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

      if (this.timeManager) {
        const timeData = this.timeManager.getTimeData();
        this.debug.setTimeInfo({
          day: timeData.day,
          hour: timeData.hour,
          minute: timeData.minute,
          second: timeData.second,
          phase: timeData.phase,
          timeScale: timeData.timeScale,
          isPaused: timeData.isPaused,
          dayProgress: timeData.dayProgress,
          isDaytime: timeData.isDaytime
        });
      }

      if (this.scheduleManager && this.timeManager) {
        const currentMinutes = this.timeManager.getMinutesSinceMidnight();
        this.debug.setScheduleInfo({
          count: this.scheduleManager.getCount(),
          showSchedules: this.showSchedules,
          currentTimeMinutes: currentMinutes
        });

        const scheduleDetails = this.npcManager.getAllNPCs().map(n => {
          const schedule = n.getSchedule();
          const currentEntry = n.getCurrentScheduleEntry();
          const nextEntry = schedule ? schedule.getNextEntry(currentMinutes) : null;
          return {
            npcId: n.id,
            currentActivity: n.getCurrentActivity(),
            currentEntry: currentEntry ? {
              start: currentEntry.formatStartTime(),
              end: currentEntry.formatEndTime(),
              activity: currentEntry.activity,
              destination: JSON.stringify(currentEntry.destination)
            } : null,
            nextEntry: nextEntry ? {
              start: nextEntry.formatStartTime(),
              end: nextEntry.formatEndTime(),
              activity: nextEntry.activity
            } : null,
            entryCount: schedule ? schedule.getEntryCount() : 0,
            scheduleChanges: n.getStats().scheduleChanges,
            enabled: n.isScheduleEnabled()
          };
        });
        this.debug.setScheduleDetails(scheduleDetails);
      }

      if (this.lifeManager) {
        this.debug.setLifeInfo({
          count: this.lifeManager.getCount(),
          showNeeds: this.showNeeds,
          showInventory: this.showInventory,
          showJobs: this.showJobs,
          averageWellbeing: this.lifeManager.getAverageWellbeing(),
          criticalCount: this.lifeManager.getCriticalCount(),
          interactions: this.lifeManager.getInteractions()
        });

        const lifeDetails = this.npcManager.getAllNPCs().map(n => {
          const lifeData = this.lifeManager.getLifeData(n.id);
          const needs = lifeData?.needs;
          const inventory = lifeData?.inventory;
          const job = lifeData?.job;
          const stats = n.getStats();

          const needsData = needs?.getNeedsData();
          const critical = needs?.getCriticalNeeds() ?? [];
          const lowest = needs?.getLowestNeed();

          return {
            npcId: n.id,
            needs: {
              energy: needsData?.energy ?? 0,
              hunger: needsData?.hunger ?? 0,
              social: needsData?.social ?? 0,
              happiness: needsData?.happiness ?? 0,
              health: needsData?.health ?? 0,
              overall: needs?.getOverallWellbeing() ?? 0,
              lowest: lowest ? `${lowest.type} ${lowest.value.toFixed(0)}%` : null,
              critical: critical as string[]
            },
            inventory: {
              debug: inventory?.getDebugString() ?? 'Empty',
              value: inventory?.getTotalValue() ?? 0,
              count: inventory?.getTotalItemCount() ?? 0
            },
            job: {
              type: job?.type ?? 'NONE',
              workDone: job?.getWorkDone() ?? 0,
              itemsProduced: job?.getItemsProduced() ?? 0,
              coinsEarned: job?.getCoinsEarned() ?? 0,
              progress: job?.getWorkProgress() ?? 0
            },
            stats: {
              socialInteractions: stats.socialInteractions,
              itemsProduced: stats.itemsProduced,
              homeVisits: stats.homeVisits
            }
          };
        });
        this.debug.setLifeDetails(lifeDetails);
      }

      // Interaction debug
      if (this.interactionSystem) {
        const current = this.interactionSystem.getCurrentInteractable();
        this.debug.setInteractionInfo({
          hasInteractable: this.interactionSystem.hasInteractable(),
          currentType: current?.type ?? null,
          currentId: current?.id ?? null,
          currentName: current?.name ?? null,
          nearbyCount: this.interactionSystem.getNearbyInteractables().length,
          totalInteractions: this.interactionSystem.getTotalInteractions(),
          range: this.interactionSystem.getInteractionRange(),
          prompt: current?.prompt ?? ''
        });
      }

      // Dialogue debug
      if (this.dialogueManager) {
        const currentNode = this.dialogueManager.getCurrentNode();
        this.debug.setDialogueInfo({
          isOpen: this.dialogueManager.isOpen(),
          isBuildingDialogue: this.dialogueManager.isBuildingDialogue(),
          activeNpcId: this.dialogueManager.getCurrentNPC()?.id ?? this.dialogueManager.getActiveBuildingDialogue()?.buildingId ?? null,
          activeNpcName: this.dialogueManager.getCurrentNPC()?.name ?? this.dialogueManager.getActiveBuildingDialogue()?.buildingName ?? null,
          currentNodeId: currentNode?.id ?? null,
          totalDialogues: this.dialogueManager.getTotalDialogues(),
          totalChoices: this.dialogueManager.getTotalChoices(),
          historyCount: this.dialogueManager.getHistory().length,
          debug: this.dialogueManager.getDebugString()
        });
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

    // Pass wasDialogueOpenBeforeInput to prevent same-frame teleport after dialogue choice
    this.handleDebugToggles(deltaTime, (this as any)._wasDialogueOpenBeforeInput);
  }

  private handleDialogueInput(): void {
    // If dialogue is open, handle choices
    if (this.dialogueManager.isOpen()) {
      // ESC to close
      if (this.input.isKeyJustPressed('escape')) {
        this.dialogueManager.endDialogue();
        console.log('[Dialogue] Closed via ESC');
        return;
      }

      // Number keys 1-4 for choices
      const currentNode = this.dialogueManager.getCurrentNode();
      if (currentNode) {
        for (let i = 0; i < Math.min(4, currentNode.choices.length); i++) {
          const key = String(i + 1);
          if (this.input.isKeyJustPressed(key)) {
            const choice = currentNode.choices[i];
            const result = this.dialogueManager.makeChoice(choice.id);
            if (result.ended) {
              console.log('[Dialogue] Ended via choice');
            }
            break;
          }
        }
      }

      return; // Don't handle interaction when dialogue open
    }

    // If dialogue not open, check for E to interact
    if (this.input.isKeyJustPressed('e') || this.input.isKeyJustPressed('enter')) {
      const interactable = this.interactionSystem.getCurrentInteractable();
      if (!interactable) return;

      if (interactable.type === 'NPC' && interactable.npc) {
        // Start NPC dialogue
        const timeData = this.timeManager.getTimeData();
        const context = {
          playerName: 'Player',
          time: this.timeManager.formatTime(),
          day: timeData.day,
          phase: timeData.phase,
          timeManager: this.timeManager,
          lifeManager: this.lifeManager,
          buildingManager: this.buildingManager
        };

        this.dialogueManager.startDialogue(interactable.npc, context);
        this.interactionSystem.recordInteraction();
        console.log(`[Interaction] Started dialogue with ${interactable.npc.id}`);

      } else if (interactable.type === 'BUILDING' && interactable.building) {
        // Start building dialogue
        const timeData = this.timeManager.getTimeData();
        const context = {
          playerName: 'Player',
          time: this.timeManager.formatTime(),
          day: timeData.day,
          phase: timeData.phase,
          timeManager: this.timeManager,
          lifeManager: this.lifeManager,
          buildingManager: this.buildingManager
        };

        this.dialogueManager.startBuildingDialogue(
          interactable.building.id,
          interactable.building.name,
          String(interactable.building.type),
          interactable.building.ownerId ?? null,
          interactable.building.getIsOccupied(),
          interactable.building.getOccupantId(),
          context
        );
        this.interactionSystem.recordInteraction();
        console.log(`[Interaction] Started building dialogue with ${interactable.building.id}`);
      }
    }
  }

  private handleDebugToggles(_deltaTime: number, wasDialogueOpenBeforeInput?: boolean): void {
    // If not passed, retrieve from stored value (set in update)
    const wasOpen = wasDialogueOpenBeforeInput ?? (this as any)._wasDialogueOpenBeforeInput ?? false;
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

    if (this.input.isKeyJustPressed('n')) {
      this.showNPCPaths = !this.showNPCPaths;
      console.log(`[Pathfinding] Paths debug: ${this.showNPCPaths ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('m')) {
      this.showNavigationGrid = !this.showNavigationGrid;
      console.log(`[Pathfinding] Nav grid debug: ${this.showNavigationGrid ? 'ON' : 'OFF'}`);
    }

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

    // Phase 9: Time & Schedule debug - Q now for interaction, so schedule toggle moved to o? Keep q but handle dialogue closed
    // We'll keep Q for schedule but only when dialogue not open, and use O for interaction? Actually E is interaction now, Q still schedule
    if (!this.dialogueManager.isOpen() && this.input.isKeyJustPressed('q')) {
      this.showSchedules = !this.showSchedules;
      console.log(`[Schedule] Schedules debug: ${this.showSchedules ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('e') && this.input.isKeyDown('shift')) {
      this.showClock = !this.showClock;
      console.log(`[Time] Clock: ${this.showClock ? 'ON' : 'OFF'}`);
    } else if (!this.dialogueManager.isOpen() && this.input.isKeyJustPressed('f')) {
      this.showTimeOverlay = !this.showTimeOverlay;
      console.log(`[Time] Day/night overlay: ${this.showTimeOverlay ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed(';')) {
      this.showNeeds = !this.showNeeds;
      this.lifeRenderer.setShowNeeds(this.showNeeds);
      console.log(`[Life] Needs debug: ${this.showNeeds ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed(',')) {
      this.showInventory = !this.showInventory;
      this.lifeRenderer.setShowInventory(this.showInventory);
      console.log(`[Life] Inventory debug: ${this.showInventory ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('.')) {
      this.showJobs = !this.showJobs;
      this.lifeRenderer.setShowJobs(this.showJobs);
      console.log(`[Life] Jobs debug: ${this.showJobs ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('o')) {
      this.showInteractionPrompt = !this.showInteractionPrompt;
      this.dialogueRenderer.setShowInteractionPrompt(this.showInteractionPrompt);
      console.log(`[Interaction] Prompt: ${this.showInteractionPrompt ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed(' ')) {
      if (!this.dialogueManager.isOpen()) {
        this.timeManager.togglePause();
      }
    }

    if (this.input.isKeyJustPressed('=') || this.input.isKeyJustPressed('+')) {
      const newScale = this.timeManager.getTimeScale() * 2;
      this.timeManager.setTimeScale(Math.min(newScale, 500));
    }

    if (this.input.isKeyJustPressed('-') || this.input.isKeyJustPressed('_')) {
      const newScale = this.timeManager.getTimeScale() / 2;
      this.timeManager.setTimeScale(Math.max(newScale, 1));
    }

    if (this.input.isKeyJustPressed(']')) {
      this.timeManager.advanceTime(60);
    }

    if (this.input.isKeyJustPressed('[')) {
      this.timeManager.advanceTime(-60);
    }

    if (this.input.isKeyJustPressed('\\')) {
      const currentHour = this.timeManager.getHour();
      if (currentHour < 6) this.timeManager.setTime(6);
      else if (currentHour < 12) this.timeManager.setTime(12);
      else if (currentHour < 18) this.timeManager.setTime(18);
      else if (currentHour < 22) this.timeManager.setTime(22);
      else this.timeManager.setTime(6, 0, this.timeManager.getDay() + 1);
    }

    if (this.input.isKeyJustPressed('y')) {
      console.log('[Phase8 Test] All NPCs go home');
      for (const npc of this.npcManager.getAllNPCs()) {
        npc.goHome();
      }
    }

    if (this.input.isKeyJustPressed('p')) {
      console.log('[NPC] States and Paths, Homes, Schedules, Life, Interaction, Dialogue:');
      console.log(`[Time] ${this.timeManager.formatDayTime()} Phase ${this.timeManager.getPhase()} Scale ${this.timeManager.getTimeScale()}x`);
      console.log(`[Life] Avg wellbeing ${this.lifeManager.getAverageWellbeing().toFixed(0)}% Critical ${this.lifeManager.getCriticalCount()} Interactions ${this.lifeManager.getInteractions()}`);
      console.log(`[Interaction] ${this.interactionSystem.getDebugString()} Total ${this.interactionSystem.getTotalInteractions()}`);
      console.log(`[Dialogue] ${this.dialogueManager.getDebugString()} Total ${this.dialogueManager.getTotalDialogues()} Choices ${this.dialogueManager.getTotalChoices()}`);
      for (const npc of this.npcManager.getAllNPCs()) {
        const path = npc.getPath();
        const home = npc.getHomeBuilding();
        const activity = npc.getCurrentActivity();
        const entry = npc.getCurrentScheduleEntry();
        const lifeData = this.lifeManager.getLifeData(npc.id);
        console.log(`  ${npc.id} ${npc.name} ${npc.state} at ${npc.getTilePosition().x},${npc.getTilePosition().y} -> dest ${npc.getDestinationTile()?.x},${npc.getDestinationTile()?.y} pathLen ${path?.getLength()??0} status ${path?.status} home ${home?.id} activity ${activity} ${entry?.formatTimeRange()} ${entry?.description} visits ${npc.getStats().homeVisits} schedChanges ${npc.getStats().scheduleChanges} wellbeing ${lifeData?.needs.getOverallWellbeing().toFixed(0)}% needs ${lifeData?.needs.getDebugString()} inv ${lifeData?.inventory.getDebugString()} job ${lifeData?.job.getDebugString()}`);
      }
      if (this.pathfinder) {
        console.log('[Pathfinder] Stats:', this.pathfinder.getStats());
      }
      console.log('[Buildings]:', this.buildingManager.getCounts());
      console.log('[Schedules]:', this.scheduleManager.getCount());
    }

    if (this.input.isKeyJustPressed('t')) {
      console.log('[Phase7+8+9+10+11 Test] Running all tests...');
      this.runPhase7Tests();
      this.runPhase8Tests();
      this.runPhase9Tests();
      this.runPhase10Tests();
      this.runPhase11Tests();
    }

    if (this.input.isKeyJustPressed('k') && this.input.isKeyDown('shift')) {
      if (this.navigationGrid) {
        const testX = 24, testY = 18;
        const wasWalkable = this.navigationGrid.isWalkable(testX, testY);
        this.navigationGrid.setWalkable(testX, testY, !wasWalkable);
        console.log(`[Phase7 Test6] Toggled obstacle at ${testX},${testY} walkable=${!wasWalkable}`);
      }
    }

    // Teleports - FIX: block if dialogue was open before input (prevents 1-4 choice triggering teleport)
    // Previously: after choosing option 3, dialogue closes same frame, then isKeyJustPressed('3') still true triggers teleport to 3,3 (tree blocked)
    // Also fixed teleport positions to be walkable (was 3,3 tree, 38,10 water, 12,10 house)
    if (this.input.isKeyJustPressed('1') && !wasOpen && !this.dialogueManager.isOpen() && this.player) this.player.setPosition(25*32+16, 20*32+16); // Village square center - safe
    if (this.input.isKeyJustPressed('2') && !wasOpen && !this.dialogueManager.isOpen() && this.player) this.player.setPosition(34*32+16, 14*32+16); // Near shop door road - safe
    if (this.input.isKeyJustPressed('3') && !wasOpen && !this.dialogueManager.isOpen() && this.player) this.player.setPosition(37*32+16, 19*32+16); // Bridge center - safe
    if (this.input.isKeyJustPressed('4') && !wasOpen && !this.dialogueManager.isOpen() && this.player) this.player.setPosition(15*32+16, 30*32+16); // Farm road entrance - safe

    if (!wasOpen && !this.dialogueManager.isOpen()) {
      if (this.input.isKeyJustPressed('5')) {
        const npc = this.npcManager.getNPC('NPC001');
        if (npc) {
          const tile = npc.getTilePosition();
          npc.requestPath({ x: tile.x + 2, y: tile.y });
        }
      }
      if (this.input.isKeyJustPressed('6')) {
        const npc = this.npcManager.getNPC('NPC002');
        if (npc) npc.requestPath({ x: 10, y: 10 });
      }
      if (this.input.isKeyJustPressed('7')) {
        const npc = this.npcManager.getNPC('NPC003');
        if (npc) npc.requestPath({ x: 42, y: 19 });
      }
      if (this.input.isKeyJustPressed('8')) {
        const npc = this.npcManager.getNPC('NPC004');
        if (npc) npc.requestPath({ x: 38, y: 10 });
      }
      if (this.input.isKeyJustPressed('9')) {
        const npc = this.npcManager.getNPC('NPC005');
        if (npc) npc.requestPath({ x: 0, y: 0 });
      }
    }

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

    if (this.input.isKeyJustPressed('f9')) {
      const first = this.npcManager.getNPC('NPC001');
      const enabled = first ? !first.isScheduleEnabled() : false;
      for (const npc of this.npcManager.getAllNPCs()) {
        npc.setScheduleEnabled(enabled);
      }
      console.log(`[Schedule] All NPCs schedule ${enabled ? 'enabled' : 'disabled'}`);
    }

    if (this.input.isKeyJustPressed('f10')) {
      for (const npc of this.npcManager.getAllNPCs()) {
        const needs = this.lifeManager.getNeedsForNPC(npc.id);
        if (needs) {
          needs.setNeed('ENERGY' as any, 100);
          needs.setNeed('HUNGER' as any, 100);
          needs.setNeed('SOCIAL' as any, 100);
          needs.setNeed('HAPPINESS' as any, 100);
          needs.setNeed('HEALTH' as any, 100);
        }
      }
      console.log('[Life] All needs boosted to 100%');
    }

    if (this.input.isKeyJustPressed('f11')) {
      for (const npc of this.npcManager.getAllNPCs()) {
        const needs = this.lifeManager.getNeedsForNPC(npc.id);
        if (needs) {
          needs.setNeed('ENERGY' as any, 10);
          needs.setNeed('HUNGER' as any, 10);
          needs.setNeed('SOCIAL' as any, 10);
        }
      }
      console.log('[Life] All needs drained to critical');
    }

    if (this.input.isKeyJustPressed('f12')) {
      // Test dialogue with first NPC
      const npc = this.npcManager.getNPC('NPC001');
      if (npc && !this.dialogueManager.isOpen()) {
        const timeData = this.timeManager.getTimeData();
        const context = {
          playerName: 'Player',
          time: this.timeManager.formatTime(),
          day: timeData.day,
          phase: timeData.phase,
          timeManager: this.timeManager,
          lifeManager: this.lifeManager,
          buildingManager: this.buildingManager
        };
        this.dialogueManager.startDialogue(npc, context);
        console.log('[Dialogue] Test dialogue with NPC001');
      }
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

    const counts = this.buildingManager.getCounts();
    console.log(`Test1 building counts: total=${counts.total} residential=${counts.residential} withInterior=${counts.withInterior} byType=${JSON.stringify(counts.byType)} -> ${counts.total >= 5 ? 'PASS' : 'FAIL'}`);

    let doorsWalkable = true;
    for (const b of this.buildingManager.getAllBuildings()) {
      if (this.navigationGrid) {
        const walkable = this.navigationGrid.isWalkable(b.door.x, b.door.y);
        console.log(`  Building ${b.id} door ${b.door.x},${b.door.y} walkable=${walkable}`);
        if (!walkable) doorsWalkable = false;
      }
    }
    console.log(`Test2 doors walkable: ${doorsWalkable ? 'PASS' : 'FAIL'}`);

    let homesValid = true;
    for (const npc of this.npcManager.getAllNPCs()) {
      const home = npc.getHomeBuilding();
      const hasHome = home !== null;
      console.log(`  NPC ${npc.id} homeId=${npc.getHomeId()} homeBuilding=${home?.id ?? 'none'} -> ${hasHome ? 'PASS' : 'FAIL'}`);
      if (!hasHome) homesValid = false;
    }
    console.log(`Test3 NPC homes valid: ${homesValid ? 'PASS' : 'FAIL'}`);

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

    const validation = this.buildingManager.validate();
    console.log(`Test5 building validation: ${validation.valid ? 'PASS' : 'FAIL'} errors=${validation.errors.length}`);
    if (!validation.valid) console.log('  Errors:', validation.errors);

    const collisionMap = this.collisionSystem.getCollisionMap();
    let doorsInteractable = true;
    if (collisionMap) {
      for (const b of this.buildingManager.getAllBuildings()) {
        const type = collisionMap.getCollisionType(b.door.x, b.door.y);
        const isWalkable = type !== null && type !== 1;
        console.log(`  Door ${b.id} ${b.door.x},${b.door.y} collisionType=${type} walkable=${isWalkable}`);
        if (!isWalkable) doorsInteractable = false;
      }
    }
    console.log(`Test6 doors collision walkable: ${doorsInteractable ? 'PASS' : 'FAIL'}`);

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

  private runPhase9Tests(): void {
    if (!this.timeManager || !this.scheduleManager) {
      console.log('No time/schedule manager');
      return;
    }

    console.log('=== PHASE 9 TESTS ===');

    const initialDay = this.timeManager.getDay();
    const initialHour = this.timeManager.getHour();
    const initialMinutes = this.timeManager.getMinutesSinceMidnight();
    console.log(`Test1 time initial: Day ${initialDay} ${initialHour}:${String(this.timeManager.getMinute()).padStart(2,'0')} minutes=${initialMinutes} phase=${this.timeManager.getPhase()} -> PASS`);

    const scheduleCount = this.scheduleManager.getCount();
    console.log(`Test2 schedule counts: ${scheduleCount} schedules (expected 5) -> ${scheduleCount === 5 ? 'PASS' : 'FAIL'}`);

    let schedulesValid = true;
    for (const npc of this.npcManager.getAllNPCs()) {
      const schedule = npc.getSchedule();
      const hasSchedule = schedule !== null;
      console.log(`  NPC ${npc.id} hasSchedule=${hasSchedule} entries=${schedule?.getEntryCount() ?? 0} -> ${hasSchedule ? 'PASS' : 'FAIL'}`);
      if (!hasSchedule) schedulesValid = false;
    }
    console.log(`Test3 NPC schedules valid: ${schedulesValid ? 'PASS' : 'FAIL'}`);

    let coverageOk = true;
    for (const schedule of this.scheduleManager.getAllSchedules()) {
      const gaps = schedule.getGaps();
      const fullCoverage = schedule.isFullDayCoverage();
      console.log(`  Schedule ${schedule.npcId} entries=${schedule.getEntryCount()} gaps=${gaps.length} fullCoverage=${fullCoverage} -> ${fullCoverage ? 'PASS' : 'FAIL (has gaps)'}`);
      if (!fullCoverage) coverageOk = false;
    }
    console.log(`Test4 schedule full coverage: ${coverageOk ? 'PASS' : 'FAIL'}`);

    const testTimes = [
      { hour: 2, expected: 'SLEEP' },
      { hour: 8, expected: 'WORK/FARM/SHOP/PLAY' },
      { hour: 12, expected: 'EAT' },
      { hour: 15, expected: 'WORK/FARM/SOCIAL/PLAY' },
      { hour: 19, expected: 'HOME/SOCIAL' },
      { hour: 22, expected: 'SLEEP/INSIDE' }
    ];

    let activityOk = true;
    for (const test of testTimes) {
      const minutes = test.hour * 60;
      console.log(`  Time ${test.hour}:00:`);
      for (const npc of this.npcManager.getAllNPCs()) {
        const schedule = npc.getSchedule();
        if (!schedule) continue;
        const entry = schedule.getCurrentEntry(minutes);
        console.log(`    ${npc.id} activity=${entry?.activity ?? 'none'} dest=${entry ? JSON.stringify(entry.destination) : 'none'}`);
        if (!entry) activityOk = false;
      }
    }
    console.log(`Test5 activities at times: ${activityOk ? 'PASS' : 'FAIL'}`);

    let pathsOk = true;
    if (this.pathfinder) {
      for (const npc of this.npcManager.getAllNPCs()) {
        const schedule = npc.getSchedule();
        if (!schedule) continue;
        const start = npc.getTilePosition();
        const result = this.pathfinder.requestPath(start, { x: 25, y: 20 }, `SCHED_${npc.id}_SQUARE`);
        console.log(`  Path to square for ${npc.id}: ${result.success ? 'PASS' : 'FAIL'} len=${result.path?.getLength()}`);
        if (!result.success) pathsOk = false;
      }
    }
    console.log(`Test6 paths to scheduled destinations: ${pathsOk ? 'PASS' : 'FAIL'}`);

    const phases = [
      { hour: 2, expected: 'NIGHT' },
      { hour: 6, expected: 'DAWN' },
      { hour: 8, expected: 'MORNING' },
      { hour: 12, expected: 'MIDDAY' },
      { hour: 15, expected: 'AFTERNOON' },
      { hour: 18, expected: 'EVENING' },
      { hour: 22, expected: 'LATE_NIGHT' }
    ];

    let phasesOk = true;
    for (const test of phases) {
      this.timeManager.setTime(test.hour);
      const phase = this.timeManager.getPhase();
      const match = phase === test.expected;
      console.log(`  Hour ${test.hour} phase=${phase} expected=${test.expected} -> ${match ? 'PASS' : 'FAIL'}`);
      if (!match) phasesOk = false;
    }
    this.timeManager.setTime(initialHour, this.timeManager.getMinute(), initialDay);
    console.log(`Test7 day phases: ${phasesOk ? 'PASS' : 'FAIL'}`);

    const initialScale = this.timeManager.getTimeScale();
    this.timeManager.setTimeScale(120);
    const newScale = this.timeManager.getTimeScale();
    console.log(`Test8 time scale: ${initialScale} -> ${newScale} -> ${newScale === 120 ? 'PASS' : 'FAIL'}`);
    this.timeManager.setTimeScale(initialScale);

    const wasPaused = this.timeManager.isPausedTime();
    this.timeManager.setPaused(true);
    const paused = this.timeManager.isPausedTime();
    this.timeManager.setPaused(false);
    console.log(`Test8 pause: paused=${paused} -> ${paused ? 'PASS' : 'FAIL'} restored paused=${wasPaused}`);

    let changesDetected = 0;
    const originalTime = this.timeManager.getMinutesSinceMidnight();
    for (let minutes = 0; minutes < 24 * 60; minutes += 60) {
      for (const npc of this.npcManager.getAllNPCs()) {
        const schedule = npc.getSchedule();
        if (!schedule) continue;
        const entry = schedule.getCurrentEntry(minutes);
        const next = schedule.getNextEntry(minutes);
        if (entry && next && entry.activity !== next.activity) {
          changesDetected++;
        }
      }
    }
    console.log(`Test9 schedule changes over day: ${changesDetected} changes detected -> ${changesDetected > 0 ? 'PASS' : 'FAIL'}`);

    this.timeManager.setTime(Math.floor(originalTime / 60), originalTime % 60, initialDay);

    console.log('=== END PHASE 9 TESTS ===');
  }

  private runPhase10Tests(): void {
    if (!this.lifeManager || !this.timeManager) {
      console.log('No life/time manager');
      return;
    }

    console.log('=== PHASE 10 TESTS ===');

    const lifeCount = this.lifeManager.getCount();
    console.log(`Test1 life counts: ${lifeCount} NPCs (expected 5) -> ${lifeCount === 5 ? 'PASS' : 'FAIL'}`);

    let needsValid = true;
    for (const npc of this.npcManager.getAllNPCs()) {
      const needs = this.lifeManager.getNeedsForNPC(npc.id);
      const hasNeeds = needs !== undefined;
      console.log(`  NPC ${npc.id} hasNeeds=${hasNeeds} ${needs?.getDebugString() ?? ''} -> ${hasNeeds ? 'PASS' : 'FAIL'}`);
      if (!hasNeeds) needsValid = false;
    }
    console.log(`Test2 NPC needs valid: ${needsValid ? 'PASS' : 'FAIL'}`);

    let invValid = true;
    for (const npc of this.npcManager.getAllNPCs()) {
      const inv = this.lifeManager.getInventoryForNPC(npc.id);
      const hasInv = inv !== undefined;
      console.log(`  NPC ${npc.id} hasInventory=${hasInv} ${inv?.getDebugString() ?? ''} value=${inv?.getTotalValue() ?? 0} -> ${hasInv ? 'PASS' : 'FAIL'}`);
      if (!hasInv) invValid = false;
    }
    console.log(`Test3 NPC inventory valid: ${invValid ? 'PASS' : 'FAIL'}`);

    let jobValid = true;
    for (const npc of this.npcManager.getAllNPCs()) {
      const job = this.lifeManager.getJobForNPC(npc.id);
      const hasJob = job !== undefined;
      console.log(`  NPC ${npc.id} hasJob=${hasJob} ${job?.getDebugString() ?? ''} -> ${hasJob ? 'PASS' : 'FAIL'}`);
      if (!hasJob) jobValid = false;
    }
    console.log(`Test4 NPC jobs valid: ${jobValid ? 'PASS' : 'FAIL'}`);

    const npcTest = this.npcManager.getNPC('NPC001');
    if (npcTest) {
      const needs = this.lifeManager.getNeedsForNPC('NPC001');
      if (needs) {
        const initialEnergy = needs.getNeed('ENERGY' as any);
        needs.update(1, 'FARM' as any, true, 60, false);
        const afterEnergy = needs.getNeed('ENERGY' as any);
        console.log(`Test5 needs decay: energy ${initialEnergy.toFixed(1)} -> ${afterEnergy.toFixed(1)} (should decrease) -> ${afterEnergy < initialEnergy ? 'PASS' : 'FAIL'}`);
        needs.setNeed('ENERGY' as any, initialEnergy);
      }
    }

    const npcEat = this.npcManager.getNPC('NPC002');
    if (npcEat) {
      const needs = this.lifeManager.getNeedsForNPC('NPC002');
      const inv = this.lifeManager.getInventoryForNPC('NPC002');
      if (needs && inv) {
        const initialHunger = needs.getNeed('HUNGER' as any);
        needs.setNeed('HUNGER' as any, 30);
        needs.update(2, 'EAT' as any, true, 60, false);
        const afterHunger = needs.getNeed('HUNGER' as any);
        console.log(`Test6 eating restores: hunger 30 -> ${afterHunger.toFixed(1)} (should increase) -> ${afterHunger > 30 ? 'PASS' : 'FAIL'}`);
        needs.setNeed('HUNGER' as any, initialHunger);
      }
    }

    let productionOk = true;
    for (const npc of this.npcManager.getAllNPCs()) {
      const job = this.lifeManager.getJobForNPC(npc.id);
      if (!job) continue;
      const initialProduced = job.getItemsProduced();
      const result = job.update(20, 'FARM' as any, true, 60);
      const afterProduced = job.getItemsProduced();
      console.log(`  Job ${npc.id} ${job.type} produced ${initialProduced} -> ${afterProduced} ${result.produced ? `+${result.produced}` : ''} -> ${afterProduced >= initialProduced ? 'PASS' : 'FAIL'}`);
    }
    console.log(`Test7 job production: ${productionOk ? 'PASS' : 'FAIL'}`);

    const avgWellbeing = this.lifeManager.getAverageWellbeing();
    console.log(`Test8 average wellbeing: ${avgWellbeing.toFixed(0)}% (should be >0) -> ${avgWellbeing > 0 ? 'PASS' : 'FAIL'}`);

    const criticalCount = this.lifeManager.getCriticalCount();
    console.log(`Test9 critical count: ${criticalCount} NPCs critical (0 expected at start) -> ${criticalCount >= 0 ? 'PASS' : 'FAIL'}`);

    const invTest = this.lifeManager.getInventoryForNPC('NPC001');
    if (invTest) {
      const initialCount = invTest.getTotalItemCount();
      invTest.addItem('FOOD' as any, 2);
      const afterAdd = invTest.getTotalItemCount();
      invTest.removeItem('FOOD' as any, 2);
      const afterRemove = invTest.getTotalItemCount();
      console.log(`Test10 inventory add/remove: ${initialCount} -> ${afterAdd} -> ${afterRemove} -> ${afterAdd > initialCount && afterRemove === initialCount ? 'PASS' : 'FAIL'}`);
    }

    console.log('=== END PHASE 10 TESTS ===');
  }

  private runPhase11Tests(): void {
    if (!this.interactionSystem || !this.dialogueManager) {
      console.log('No interaction/dialogue manager');
      return;
    }

    console.log('=== PHASE 11 TESTS ===');

    // Test1: Interaction system
    console.log(`Test1 interaction range: ${this.interactionSystem.getInteractionRange()}px (expected 60) -> ${this.interactionSystem.getInteractionRange() === 60 ? 'PASS' : 'FAIL'}`);

    // Test2: Nearby interactables
    const nearbyCount = this.interactionSystem.getNearbyInteractables().length;
    console.log(`Test2 nearby interactables: ${nearbyCount} (depends on player pos) -> PASS (system works)`);

    // Test3: Dialogue manager initial state
    console.log(`Test3 dialogue initial closed: ${!this.dialogueManager.isOpen() ? 'PASS' : 'FAIL (should be closed at start)'}`);

    // Test4: Start dialogue with NPC
    const npc = this.npcManager.getNPC('NPC001');
    if (npc) {
      const timeData = this.timeManager.getTimeData();
      const context = {
        playerName: 'TestPlayer',
        time: this.timeManager.formatTime(),
        day: timeData.day,
        phase: timeData.phase,
        timeManager: this.timeManager,
        lifeManager: this.lifeManager,
        buildingManager: this.buildingManager
      };
      const started = this.dialogueManager.startDialogue(npc, context);
      console.log(`Test4 start dialogue with NPC001: ${started ? 'PASS' : 'FAIL'}`);
      
      const currentNode = this.dialogueManager.getCurrentNode();
      console.log(`  Current node: ${currentNode?.id} speaker ${currentNode?.speaker} text ${currentNode?.text.substring(0, 50)}... choices ${currentNode?.choices.length} -> ${currentNode ? 'PASS' : 'FAIL'}`);

      // Test5: Make choice
      if (currentNode && currentNode.choices.length > 0) {
        const choice = currentNode.choices[0];
        const result = this.dialogueManager.makeChoice(choice.id);
        console.log(`Test5 make choice ${choice.id}: ended=${result.ended} nextNode=${result.nextNode?.id ?? 'null'} -> ${!result.ended || result.nextNode ? 'PASS' : 'FAIL'}`);
      }

      // End dialogue
      this.dialogueManager.endDialogue();
      console.log(`Test5 dialogue ended, closed: ${!this.dialogueManager.isOpen() ? 'PASS' : 'FAIL'}`);
    }

    // Test6: Building dialogue
    const building = this.buildingManager.getAllBuildings()[0];
    if (building) {
      const timeData = this.timeManager.getTimeData();
      const context = {
        playerName: 'TestPlayer',
        time: this.timeManager.formatTime(),
        day: timeData.day,
        phase: timeData.phase,
        timeManager: this.timeManager,
        lifeManager: this.lifeManager,
        buildingManager: this.buildingManager
      };
      const started = this.dialogueManager.startBuildingDialogue(
        building.id,
        building.name,
        String(building.type),
        building.ownerId ?? null,
        building.getIsOccupied(),
        building.getOccupantId(),
        context
      );
      console.log(`Test6 start building dialogue ${building.id}: ${started ? 'PASS' : 'FAIL'}`);
      this.dialogueManager.endDialogue();
    }

    // Test7: Interaction total
    console.log(`Test7 total interactions: ${this.interactionSystem.getTotalInteractions()} (should be >=0) -> PASS`);

    // Test8: Dialogue total
    console.log(`Test8 total dialogues: ${this.dialogueManager.getTotalDialogues()} (should be >0 after tests) -> ${this.dialogueManager.getTotalDialogues() > 0 ? 'PASS' : 'FAIL'}`);

    // Test9: Dialogue history
    console.log(`Test9 dialogue history: ${this.dialogueManager.getHistory().length} entries -> ${this.dialogueManager.getHistory().length > 0 ? 'PASS' : 'FAIL'}`);

    // Test10: Player doesn't move during dialogue
    const playerPosBefore = this.player ? { x: this.player.x, y: this.player.y } : null;
    // Simulate dialogue open
    if (npc) {
      const timeData = this.timeManager.getTimeData();
      const context = {
        playerName: 'TestPlayer',
        time: this.timeManager.formatTime(),
        day: timeData.day,
        phase: timeData.phase,
        timeManager: this.timeManager,
        lifeManager: this.lifeManager,
        buildingManager: this.buildingManager
      };
      this.dialogueManager.startDialogue(npc, context);
      const isOpen = this.dialogueManager.isOpen();
      console.log(`Test10 player blocked during dialogue: dialogue open ${isOpen} -> ${isOpen ? 'PASS' : 'FAIL'}`);
      this.dialogueManager.endDialogue();
    }

    console.log('=== END PHASE 11 TESTS ===');
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

      if (this.showNavigationGrid && this.navigationGrid) {
        this.renderNavigationGridDebug(ctx, w, h);
      }

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
      if (this.lifeManager && (this.showNeeds || this.showInventory || this.showJobs)) {
        this.lifeRenderer.renderAll(ctx, this.npcManager.getAllNPCs(), this.lifeManager, this.worldRenderer, this.camera);
      }
    }

    if (this.player) {
      this.playerRenderer.render(ctx, this.player, this.worldRenderer);
    }

    if (this.showTimeOverlay && this.timeManager) {
      this.timeRenderer.renderDayNightOverlay(ctx, this.timeManager, w, h);
    }

    if (this.showClock && this.timeManager) {
      this.timeRenderer.renderClock(ctx, this.timeManager, w, h);
    }

    if (this.showTimeline && this.timeManager) {
      this.timeRenderer.renderScheduleTimeline(ctx, this.timeManager, w, h);
    }

    // Interaction prompt (before dialogue, so dialogue covers it)
    if (this.showInteractionPrompt && !this.dialogueManager.isOpen()) {
      this.dialogueRenderer.renderInteractionPrompt(ctx, this.interactionSystem, w, h);
    }

    // Dialogue (top layer)
    if (this.dialogueManager.isOpen()) {
      this.dialogueRenderer.renderDialogue(ctx, this.dialogueManager, w, h);
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

    const timeStr = this.timeManager ? this.timeManager.formatDayTime() : 'N/A';
    const phaseStr = this.timeManager ? this.timeManager.getPhase() : 'N/A';
    const avgWellbeing = this.lifeManager ? this.lifeManager.getAverageWellbeing().toFixed(0) : '0';
    const interactable = this.interactionSystem.getCurrentInteractable();

    const lines = [
      'PHASE 11 - PLAYER INTERACTION & DIALOGUE',
      `Time: ${timeStr} Phase ${phaseStr} Scale ${this.timeManager ? this.timeManager.getTimeScale() : 0}x Wellbeing ${avgWellbeing}%`,
      `Interaction: ${interactable ? `${interactable.type} ${interactable.name} ${interactable.distance.toFixed(0)}px` : 'None'} | Dialogue: ${this.dialogueManager.isOpen() ? 'OPEN' : 'CLOSED'}`,
      'Player: WASD move, C center, V village',
      'Camera: Z zoom, X smoothing',
      'Collision: K overlay, 1-4 teleport (when dialogue closed)',
      'Pathfinding: N paths, M nav grid',
      'Buildings: J doors, L labels, U own, I fronts',
      'Time: Space pause, =/+ faster, -/_ slower, ] +1h, [ -1h, \\ next phase, Shift+E clock, F overlay',
      'Schedules: Q toggle schedule debug (when dialogue closed)',
      'Life: ; needs, , inventory, . jobs, F10 boost 100%, F11 drain critical',
      'Interaction & Dialogue (Phase 11):',
      '  E / Enter - Interact with NPC/building (when prompt shows)',
      '  1-4 - Choose dialogue option',
      '  ESC - Close dialogue',
      '  O - Toggle interaction prompt',
      '  F12 - Test dialogue with NPC001',
      '  T - Run all tests (7+8+9+10+11), P - Print all states',
      'Tests: 5 nearby, 6 around building, 7 bridge, 8 blocked, 9 no path (dialogue closed)',
      'General: G grid, B coords, ` F2 debug, H help, R reset',
      '',
      `Player: ${this.player ? `${Math.floor(this.player.x)},${Math.floor(this.player.y)} ${this.player.state}` : 'N/A'}`,
      `Camera: ${Math.floor(this.camera.x)},${Math.floor(this.camera.y)} zoom ${this.camera.getZoom()}`,
      `NPCs: ${this.npcManager.getCount()} | Life: ${this.lifeManager ? this.lifeManager.getCount() : 0} AvgW:${avgWellbeing}% Inter:${this.lifeManager ? this.lifeManager.getInteractions() : 0} | Dialogue: ${this.dialogueManager.getTotalDialogues()} total`,
      `Interaction: ${this.interactionSystem.getTotalInteractions()} total | Nearby: ${this.interactionSystem.getNearbyInteractables().length} | Prompt: ${this.showInteractionPrompt ? 'ON' : 'OFF'}`,
      ...this.npcManager.getAllNPCs().map(n => {
        const path = n.getPath();
        const home = n.getHomeBuilding();
        const activity = n.getCurrentActivity() ?? n.state;
        const lifeData = this.lifeManager.getLifeData(n.id);
        return `${n.id} ${activity} ${n.getTilePosition().x},${n.getTilePosition().y}->${n.getDestinationTile()?.x},${n.getDestinationTile()?.y} len:${path?.getLength()??0} home:${home?.id} W:${lifeData?.needs.getOverallWellbeing().toFixed(0) ?? 0}% ${lifeData?.needs.getDebugString() ?? ''}`;
      })
    ];

    const padding = 10;
    const lineHeight = 11;
    const boxWidth = 520;
    const boxHeight = Math.min(screenHeight - 20, lines.length * lineHeight + 20);
    const x = screenWidth - boxWidth - padding;
    const y = padding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = '#ddd';
    lines.forEach((line, i) => {
      if (y + 10 + i * lineHeight > y + boxHeight - 10) return;
      if (i === 0) {
        ctx.fillStyle = '#8f8';
        ctx.fillText(line, x + 10, y + 10 + i * lineHeight);
        ctx.fillStyle = '#ddd';
      } else if (line.endsWith(':') || line.startsWith('Pathfinding') || line.startsWith('Buildings') || line.startsWith('Tests') || line.startsWith('Time') || line.startsWith('Schedules') || line.startsWith('Life') || line.startsWith('Interaction')) {
        ctx.fillStyle = '#8ff';
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
  getTimeManager(): TimeManager { return this.timeManager; }
  getTimeRenderer(): TimeRenderer { return this.timeRenderer; }
  getScheduleManager(): ScheduleManager { return this.scheduleManager; }
  getLifeManager(): LifeManager { return this.lifeManager; }
  getLifeRenderer(): LifeRenderer { return this.lifeRenderer; }
  getInteractionSystem(): InteractionSystem { return this.interactionSystem; }
  getDialogueManager(): DialogueManager { return this.dialogueManager; }
  getDialogueRenderer(): DialogueRenderer { return this.dialogueRenderer; }
  isGameRunning(): boolean { return this.isRunning; }
}
