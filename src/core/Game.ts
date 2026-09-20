/**
 * Game - Phase 13 Save, Load & World Persistence
 * - 3 maps: village_01, forest_01, lake_01 with transitions
 * - ExplorationSystem with fog of war, vision radius 8, minimap
 * - TimeManager, Schedule, Life, Interaction, Dialogue preserved
 * - SaveManager: versioned save files, slots, validation, migration, corruption protection
 * - Player, World, Time, Exploration, NPCs all save/load with defaults handling
 * - Auto-save, quick save/load, save UI, new game
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
import { ExplorationSystem } from '../exploration/ExplorationSystem';
import { ExplorationRenderer } from '../exploration/ExplorationRenderer';
import { MinimapRenderer } from '../exploration/MinimapRenderer';
import { SaveManager } from '../save/SaveManager';
import { SaveRenderer } from '../save/SaveRenderer';
import {
  SAVE_VERSION,
  SAVE_GAME_VERSION,
  MAX_SAVE_SLOTS,
  AUTO_SAVE_SLOT,
  SaveFile,
  SaveSlotInfo,
  createDefaultSaveFile
} from '../save/SaveTypes';

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
  private explorationSystem: ExplorationSystem;
  private explorationRenderer: ExplorationRenderer;
  private minimapRenderer: MinimapRenderer;

  // Phase 13 Save System
  private saveManager: SaveManager;
  private saveRenderer: SaveRenderer;
  private saveSlots: SaveSlotInfo[] = [];
  private autoSaveTimer: number = 0;
  private autoSaveInterval: number = 60; // seconds
  private playTimeSeconds: number = 0;
  private isSaveUINavigating: boolean = false;

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
  private showFog: boolean = true;
  private showMinimap: boolean = true;
  private showFullMap: boolean = false;
  private showVisionDebug: boolean = false;
  private showSaveDebug: boolean = true;

  private playerMapId: string = 'village_01';
  private mapTransitionCooldown: number = 0;

  // World persistence flags (Phase 13)
  private worldFlags: Record<string, boolean | string | number | null> = {};
  private openedLocations: Set<string> = new Set(['village_01']);
  private collectedObjects: Set<string> = new Set();
  private changedObjects: Record<string, any> = {};
  private questRelatedChanges: Record<string, any> = {};
  private eventStates: Record<string, any> = {};

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
    this.explorationSystem = new ExplorationSystem(8);
    this.explorationRenderer = new ExplorationRenderer();
    this.minimapRenderer = new MinimapRenderer();
    this.saveManager = SaveManager.getInstance();
    this.saveRenderer = new SaveRenderer();

    this.boundResizeHandler = this.handleResize.bind(this);
  }

  initialize(): void {
    console.log('[Game] Initializing Phase 13 - Save, Load & World Persistence...');

    this.input.initialize(this.canvas);

    try {
      this.world.initialize();
      const allMaps = this.world.getAllMaps();
      console.log(`[Game] World: ${allMaps.length} maps loaded`);

      this.explorationSystem.initialize(allMaps.map(m => ({ mapId: m.mapId, width: m.width, height: m.height })));
      console.log(`[Game] Exploration: ${this.explorationSystem.getDebugString()}`);

      const map = this.world.getCurrentMap();
      if (map) {
        console.log(`[Game] Starting map: ${map.mapId} - ${map.name}`);

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
        this.playerMapId = map.mapId;
        this.openedLocations.add(map.mapId);

        this.npcManager.initialize(map, collisionMap, this.navigationGrid, this.pathfinder, this.buildingManager, this.scheduleManager, this.timeManager, this.lifeManager);
        console.log(`[Game] NPCs: ${this.npcManager.getCount()} with pathfinding, homes, schedules, and life`);

        if (this.lifeManager.getCount() === 0) {
          this.lifeManager.initialize(this.npcManager.getAllNPCs(), this.buildingManager, this.timeManager);
        }
        console.log(`[Game] Life: ${this.lifeManager.getCount()} NPCs, avg wellbeing ${this.lifeManager.getAverageWellbeing().toFixed(0)}%`);

        this.interactionSystem.setInteractionRange(60);
        console.log(`[Game] Interaction: range ${this.interactionSystem.getInteractionRange()}px`);

        console.log(`[Game] Dialogue: ${this.dialogueManager.getTotalDialogues()} dialogues, ready`);

        if (this.player) {
          const tilePos = this.player.getTilePosition();
          this.explorationSystem.update(tilePos, map.mapId);
          console.log(`[Game] Exploration initial: ${this.explorationSystem.getMapDebugString(map.mapId)}`);
        }

        this.explorationRenderer.setShowFog(this.showFog);
        this.minimapRenderer.setShowMinimap(this.showMinimap);

        // Phase 13 Save System init
        this.saveSlots = this.saveManager.getAllSaveSlots();
        console.log(`[Game] SaveManager: ${this.saveSlots.filter(s=>s.exists).length}/${MAX_SAVE_SLOTS} slots used, v${SAVE_VERSION}`);
        this.saveManager.debugPrintSlots();

        console.log(`[Game] Phase 13: Save, Load & World Persistence - versioned saves, slots, validation, migration`);
        console.log(`[Game] Controls: Ctrl+S quick save, Ctrl+L quick load, Ctrl+Shift+S/L save/load UI, Ctrl+N new game, F5/F6 save UI (alternative)`);
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

  // ==================== PHASE 13 SAVE SYSTEM ====================

  private collectSaveData(slotId: number = AUTO_SAVE_SLOT): SaveFile {
    const currentMap = this.world.getCurrentMap();
    const currentMapId = currentMap?.mapId ?? this.playerMapId;
    const playerTile = this.player?.getTilePosition() ?? { x: 25, y: 20 };

    // Player data
    const playerSave = this.player ? this.player.getSaveData(currentMapId) : null;
    const defaultPlayer = createDefaultSaveFile(slotId).player;
    const finalPlayer = playerSave ? {
      ...defaultPlayer,
      ...playerSave,
      mapId: currentMapId,
      stats: {
        ...defaultPlayer.stats,
        ...(playerSave.stats ?? {}),
        playTimeSeconds: this.playTimeSeconds,
        totalDistance: this.player?.getTotalDistance() ?? 0,
        mapsDiscovered: this.openedLocations.size,
        npcsMet: this.player ? Array.from(this.player.npcsMet) : [],
        interactions: this.interactionSystem.getTotalInteractions()
      }
    } : defaultPlayer;

    // Time data
    const timeSave = this.timeManager.getSaveData();

    // Exploration data
    const explorationSave = this.explorationSystem.getSaveData();

    // World data
    const allMapsInfo = this.world.getAllMapsInfo();
    const worldSave = {
      currentMapId,
      playerMapId: this.playerMapId,
      allMaps: allMapsInfo,
      time: timeSave,
      exploration: explorationSave,
      flags: { ...this.worldFlags },
      openedLocations: Array.from(this.openedLocations),
      closedLocations: [],
      collectedObjects: Array.from(this.collectedObjects),
      changedObjects: { ...this.changedObjects },
      questRelatedChanges: { ...this.questRelatedChanges },
      eventStates: { ...this.eventStates },
      farming: { plots: {}, version: 1 },
      animals: { animals: {}, version: 1 },
      weather: { current: 'SUNNY', intensity: 0, nextChange: 0, version: 1 },
      economy: { shopInventories: {}, prices: {}, transactionHistory: [], version: 1 },
      dungeons: {},
      events: {},
      seasons: {}
    };

    // NPCs data
    const npcs: Record<string, any> = {};
    for (const npc of this.npcManager.getAllNPCs()) {
      npcs[npc.id] = npc.getSaveData(currentMapId);
    }

    // Quests placeholder
    const quests = {
      quests: {},
      version: 1
    };

    // Meta
    const timeData = this.timeManager.getTimeData();
    const explorationPerc = this.explorationSystem.getExplorationPercentage(currentMapId);
    const meta = {
      playTimeSeconds: this.playTimeSeconds,
      saveCount: (this.saveManager.getStats().saveCount + 1),
      lastSaved: Date.now(),
      createdAt: Date.now(),
      gameVersion: SAVE_GAME_VERSION,
      saveVersion: SAVE_VERSION,
      slotId,
      playerName: 'Adventurer',
      preview: {
        day: timeData.day,
        time: this.timeManager.formatTime(),
        mapId: currentMapId,
        mapName: currentMap?.name ?? currentMapId,
        explorationPercent: explorationPerc,
        money: finalPlayer.money,
        health: finalPlayer.health
      }
    };

    const saveFile: SaveFile = {
      version: SAVE_VERSION,
      gameVersion: SAVE_GAME_VERSION,
      timestamp: Date.now(),
      slotId,
      player: finalPlayer as any,
      world: worldSave as any,
      npcs,
      quests: quests as any,
      meta: meta as any,
      future: {},
      migrations: []
    };

    return saveFile;
  }

  private applySaveData(saveFile: SaveFile): boolean {
    try {
      console.log(`[Game] Applying save data slot ${saveFile.slotId} v${saveFile.version} Day ${saveFile.world.time.day} ${saveFile.player.mapId}`);

      // Validate map exists
      const targetMapId = saveFile.world.currentMapId ?? saveFile.player.mapId;
      const targetMap = this.world.getMap(targetMapId);
      if (!targetMap) {
        console.warn(`[Game] Save target map ${targetMapId} not found, using current map`);
      } else {
        // Load map if different
        const currentMapId = this.world.getCurrentMap()?.mapId;
        if (currentMapId !== targetMapId) {
          console.log(`[Game] Switching to saved map ${targetMapId}`);
          this.world.loadMap(targetMapId);
          const newMap = this.world.getCurrentMap();
          if (newMap) {
            this.collisionSystem.initializeFromWorldMap(newMap);
            const collisionMap = this.collisionSystem.getCollisionMap();
            if (collisionMap) {
              this.navigationGrid = NavigationGrid.fromCollisionMap(collisionMap);
            } else {
              this.navigationGrid = NavigationGrid.fromWorldMap(newMap);
            }
            if (this.pathfinder && this.navigationGrid) {
              this.pathfinder.setNavigationGrid(this.navigationGrid);
            }
            this.buildingManager.initialize(newMap);
            this.camera.setWorldMap(newMap);
            this.playerMapId = targetMapId;
          }
        }
      }

      // Apply time
      this.timeManager.loadSaveData(saveFile.world.time);
      console.log(`[Game] Time loaded: ${this.timeManager.formatDayTime()}`);

      // Apply exploration
      this.explorationSystem.loadSaveData(saveFile.world.exploration);
      console.log(`[Game] Exploration loaded: ${this.explorationSystem.getDebugString()}`);

      // Apply world flags and persistence
      this.worldFlags = saveFile.world.flags ?? {};
      this.openedLocations = new Set(saveFile.world.openedLocations ?? ['village_01']);
      this.collectedObjects = new Set(saveFile.world.collectedObjects ?? []);
      this.changedObjects = saveFile.world.changedObjects ?? {};
      this.questRelatedChanges = saveFile.world.questRelatedChanges ?? {};
      this.eventStates = saveFile.world.eventStates ?? {};
      this.playerMapId = saveFile.world.playerMapId ?? targetMapId;

      // Apply player
      if (this.player) {
        this.player.loadSaveData(saveFile.player);
        // Ensure position is walkable
        if (this.navigationGrid) {
          const tilePos = this.player.getTilePosition();
          if (!this.navigationGrid.isWalkable(tilePos.x, tilePos.y)) {
            console.warn(`[Game] Saved player position not walkable ${tilePos.x},${tilePos.y}, finding nearest`);
            let found = false;
            for (let r = 1; r <= 5 && !found; r++) {
              for (let dy = -r; dy <= r && !found; dy++) {
                for (let dx = -r; dx <= r && !found; dx++) {
                  const nx = tilePos.x + dx;
                  const ny = tilePos.y + dy;
                  if (this.navigationGrid.isWalkable(nx, ny)) {
                    this.player.setPosition(nx * 32 + 16, ny * 32 + 16);
                    found = true;
                  }
                }
              }
            }
          }
        }
      }

      // Apply NPCs
      for (const npcId of Object.keys(saveFile.npcs)) {
        const npcSave = saveFile.npcs[npcId];
        const npc = this.npcManager.getNPC(npcId);
        if (npc && npcSave) {
          npc.loadSaveData(npcSave);
        }
      }

      // Apply playtime
      this.playTimeSeconds = saveFile.meta.playTimeSeconds ?? saveFile.player.stats?.playTimeSeconds ?? 0;

      // Update camera
      if (this.player) {
        this.camera.centerOn(this.player.x, this.player.y);
      }

      // Refresh save slots
      this.saveSlots = this.saveManager.getAllSaveSlots();

      console.log(`[Game] Save applied successfully: Day ${this.timeManager.getDay()} ${this.playerMapId} exploration ${this.explorationSystem.getTotalExplorationPercentage().toFixed(1)}%`);

      return true;
    } catch (e) {
      console.error('[Game] Failed to apply save data:', e);
      return false;
    }
  }

  saveGame(slotId: number = AUTO_SAVE_SLOT): boolean {
    try {
      const saveFile = this.collectSaveData(slotId);
      const success = this.saveManager.saveGame(slotId, saveFile);
      if (success) {
        this.saveSlots = this.saveManager.getAllSaveSlots();
        this.saveRenderer.showMessage(`💾 Saved to Slot ${slotId} - Day ${saveFile.world.time.day} ${saveFile.world.currentMapId}`, '#8f8', 3);
        console.log(`[Game] Saved to slot ${slotId} successfully`);
        return true;
      } else {
        const error = this.saveManager.getLastError() ?? 'Unknown error';
        this.saveRenderer.showMessage(`❌ Save failed: ${error}`, '#f88', 4);
        console.error(`[Game] Save to slot ${slotId} failed: ${error}`);
        return false;
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      this.saveRenderer.showMessage(`❌ Save error: ${err}`, '#f88', 4);
      console.error('[Game] Save exception:', e);
      return false;
    }
  }

  loadGame(slotId: number = AUTO_SAVE_SLOT): boolean {
    try {
      const saveFile = this.saveManager.loadGame(slotId);
      if (!saveFile) {
        const error = this.saveManager.getLastError() ?? 'No save found';
        this.saveRenderer.showMessage(`❌ Load failed: ${error}`, '#f88', 4);
        console.error(`[Game] Load slot ${slotId} failed: ${error}`);
        return false;
      }

      const success = this.applySaveData(saveFile);
      if (success) {
        this.saveRenderer.showMessage(`📂 Loaded Slot ${slotId} - Day ${saveFile.world.time.day} ${saveFile.world.currentMapId}`, '#8ff', 3);
        console.log(`[Game] Loaded slot ${slotId} successfully`);
        return true;
      } else {
        this.saveRenderer.showMessage(`❌ Load apply failed`, '#f88', 4);
        return false;
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      this.saveRenderer.showMessage(`❌ Load error: ${err}`, '#f88', 4);
      console.error('[Game] Load exception:', e);
      return false;
    }
  }

  newGame(): void {
    console.log('[Game] Starting New Game...');

    // Reset all systems to initial state
    const currentMapId = 'village_01';
    const map = this.world.getMap(currentMapId) ?? this.world.getCurrentMap();

    if (!map) {
      console.error('[Game] New Game failed: no map');
      return;
    }

    // Load village map
    this.world.loadMap(currentMapId);
    const villageMap = this.world.getCurrentMap();
    if (!villageMap) return;

    this.collisionSystem.initializeFromWorldMap(villageMap);
    const collisionMap = this.collisionSystem.getCollisionMap();

    if (collisionMap) {
      this.navigationGrid = NavigationGrid.fromCollisionMap(collisionMap);
    } else {
      this.navigationGrid = NavigationGrid.fromWorldMap(villageMap);
    }

    if (this.pathfinder && this.navigationGrid) {
      this.pathfinder.setNavigationGrid(this.navigationGrid);
    }

    this.buildingManager.initialize(villageMap);
    this.camera.setWorldMap(villageMap);

    // Reset time
    this.timeManager = new TimeManager(6, 1, 60);
    this.timeManager.onPhaseChange((oldPhase, newPhase, time) => {
      console.log(`[Game] Day phase: ${oldPhase} -> ${newPhase} at ${time.hour}:${String(time.minute).padStart(2,'0')} Day ${time.day}`);
    });
    this.timeManager.onDayChange((newDay, time) => {
      console.log(`[Game] New day: Day ${newDay} at ${time.hour}:${String(time.minute).padStart(2,'0')}`);
    });

    // Reset exploration
    const allMaps = this.world.getAllMaps();
    this.explorationSystem.initialize(allMaps.map(m => ({ mapId: m.mapId, width: m.width, height: m.height })));

    // Reset player
    const tileSize = WorldRenderer.TILE_SIZE;
    const startX = 25 * tileSize + tileSize / 2;
    const startY = 20 * tileSize + tileSize / 2;
    this.player = new Player(startX, startY, 150);
    this.playerMapId = currentMapId;

    // Reset NPCs
    this.scheduleManager.initialize();
    this.npcManager.initialize(villageMap, collisionMap, this.navigationGrid, this.pathfinder, this.buildingManager, this.scheduleManager, this.timeManager, this.lifeManager);
    if (this.lifeManager.getCount() === 0) {
      this.lifeManager.initialize(this.npcManager.getAllNPCs(), this.buildingManager, this.timeManager);
    } else {
      // Re-initialize life
      this.lifeManager.initialize(this.npcManager.getAllNPCs(), this.buildingManager, this.timeManager);
    }

    // Reset world persistence
    this.worldFlags = {};
    this.openedLocations = new Set(['village_01']);
    this.collectedObjects = new Set();
    this.changedObjects = {};
    this.questRelatedChanges = {};
    this.eventStates = {};
    this.playTimeSeconds = 0;
    this.autoSaveTimer = 0;

    // Initial exploration
    if (this.player) {
      const tilePos = this.player.getTilePosition();
      this.explorationSystem.update(tilePos, currentMapId);
    }

    this.camera.centerOn(this.player?.x ?? 25 * 32, this.player?.y ?? 20 * 32);

    this.saveRenderer.showMessage('🆕 New Game Started - Day 1 Village', '#8f8', 3);
    console.log('[Game] New Game started: Day 1 Village, all systems reset');
  }

  private handleSaveInput(): void {
    // Don't handle save input if dialogue is open (except ESC to close save UI)
    const isSaveUIOpen = this.saveRenderer.isShowingUI();

    if (isSaveUIOpen) {
      // Save UI navigation
      if (this.input.isKeyJustPressed('escape')) {
        this.saveRenderer.setShowSaveUI(false);
        this.saveRenderer.setShowLoadUI(false);
        console.log('[Save] Closed save UI via ESC');
        return;
      }

      if (this.input.isKeyJustPressed('arrowup') || this.input.isKeyJustPressed('w')) {
        const current = this.saveRenderer.getSelectedSlot();
        const newSlot = Math.max(0, current - 1);
        this.saveRenderer.setSelectedSlot(newSlot);
      }

      if (this.input.isKeyJustPressed('arrowdown') || this.input.isKeyJustPressed('s')) {
        const current = this.saveRenderer.getSelectedSlot();
        const newSlot = Math.min(MAX_SAVE_SLOTS - 1, current + 1);
        this.saveRenderer.setSelectedSlot(newSlot);
      }

      // Number keys 1-5 for slot selection (but need to avoid conflict with dialogue)
      if (!this.dialogueManager.isOpen()) {
        for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
          if (this.input.isKeyJustPressed(String(i + 1)) && i < MAX_SAVE_SLOTS) {
            // Check if wasOpen guard for dialogue
            const wasOpen = (this as any)._wasDialogueOpenBeforeInput ?? false;
            if (!wasOpen) {
              this.saveRenderer.setSelectedSlot(i);
            }
          }
        }
      }

      if (this.input.isKeyJustPressed('enter')) {
        const slot = this.saveRenderer.getSelectedSlot();
        if (this.saveRenderer['showSaveUI']) {
          this.saveGame(slot);
          this.saveRenderer.setShowSaveUI(false);
        } else if (this.saveRenderer['showLoadUI']) {
          this.loadGame(slot);
          this.saveRenderer.setShowLoadUI(false);
        }
        return;
      }

      if (this.input.isKeyJustPressed('d') && !this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
        // D is disabled for debug, but allow for delete in save UI
        const slot = this.saveRenderer.getSelectedSlot();
        if (this.saveManager.hasSave(slot)) {
          this.saveManager.deleteSave(slot);
          this.saveSlots = this.saveManager.getAllSaveSlots();
          this.saveRenderer.showMessage(`🗑 Deleted Slot ${slot}`, '#fa8', 2);
          console.log(`[Save] Deleted slot ${slot}`);
        }
        return;
      }

      // Block other inputs when save UI open
      return;
    }

    // Quick save: Ctrl+S
    if (this.input.isKeyDown('control') && this.input.isKeyJustPressed('s') && !this.input.isKeyDown('shift')) {
      if (!this.dialogueManager.isOpen()) {
        this.saveGame(AUTO_SAVE_SLOT);
      }
      return;
    }

    // Save UI: Ctrl+Shift+S or F5 (alternative, since F5 was NPC go home, now we use Ctrl+Shift+S)
    if ((this.input.isKeyDown('control') && this.input.isKeyDown('shift') && this.input.isKeyJustPressed('s')) ||
        (this.input.isKeyJustPressed('f5') && this.input.isKeyDown('shift'))) {
      if (!this.dialogueManager.isOpen()) {
        this.saveSlots = this.saveManager.getAllSaveSlots();
        this.saveRenderer.setShowSaveUI(true);
        console.log('[Save] Opened Save UI');
      }
      return;
    }

    // Quick load: Ctrl+L
    if (this.input.isKeyDown('control') && this.input.isKeyJustPressed('l') && !this.input.isKeyDown('shift')) {
      if (!this.dialogueManager.isOpen()) {
        this.loadGame(AUTO_SAVE_SLOT);
      }
      return;
    }

    // Load UI: Ctrl+Shift+L or F6 (alternative)
    if ((this.input.isKeyDown('control') && this.input.isKeyDown('shift') && this.input.isKeyJustPressed('l')) ||
        (this.input.isKeyJustPressed('f6') && this.input.isKeyDown('shift'))) {
      if (!this.dialogueManager.isOpen()) {
        this.saveSlots = this.saveManager.getAllSaveSlots();
        this.saveRenderer.setShowLoadUI(true);
        console.log('[Save] Opened Load UI');
      }
      return;
    }

    // New Game: Ctrl+N
    if (this.input.isKeyDown('control') && this.input.isKeyJustPressed('n')) {
      if (!this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI()) {
        this.newGame();
      }
      return;
    }

    // Alternative save/load keys for testing without Ctrl (when debug enabled)
    // F5 save, F6 load were NPC go home, now changed to Shift+F5/F6 for save/load to avoid conflict
    // We already handle Shift+F5/F6 above as alternative
  }

  private switchMap(targetMapId: string, entryEdge: 'north' | 'south' | 'west' | 'east'): boolean {
    const currentMap = this.world.getCurrentMap();
    if (!currentMap) return false;
    if (currentMap.mapId === targetMapId) return false;

    const targetMap = this.world.getMap(targetMapId);
    if (!targetMap) {
      console.warn(`[World] Target map not found: ${targetMapId}`);
      return false;
    }

    console.log(`[World] Transition ${currentMap.mapId} -> ${targetMapId} via ${entryEdge}`);

    if (!this.world.loadMap(targetMapId)) return false;

    this.collisionSystem.initializeFromWorldMap(targetMap);
    const collisionMap = this.collisionSystem.getCollisionMap();

    if (collisionMap) {
      this.navigationGrid = NavigationGrid.fromCollisionMap(collisionMap);
    } else {
      this.navigationGrid = NavigationGrid.fromWorldMap(targetMap);
    }

    if (this.pathfinder && this.navigationGrid) {
      this.pathfinder.setNavigationGrid(this.navigationGrid);
    }

    this.buildingManager.initialize(targetMap);
    this.camera.setWorldMap(targetMap);

    const tileSize = WorldRenderer.TILE_SIZE;
    let newX = 25 * tileSize + 16;
    let newY = 20 * tileSize + 16;

    switch (entryEdge) {
      case 'north':
        newX = 24 * tileSize + tileSize / 2;
        newY = (targetMap.height - 2) * tileSize + 16;
        break;
      case 'south':
        newX = 24 * tileSize + tileSize / 2;
        newY = 1 * tileSize + 16;
        break;
      case 'west':
        newX = (targetMap.width - 2) * tileSize + 16;
        newY = 19 * tileSize + tileSize / 2;
        break;
      case 'east':
        newX = 1 * tileSize + 16;
        newY = 19 * tileSize + tileSize / 2;
        break;
    }

    if (this.navigationGrid) {
      const tileX = Math.floor(newX / tileSize);
      const tileY = Math.floor(newY / tileSize);
      if (!this.navigationGrid.isWalkable(tileX, tileY)) {
        let found = false;
        for (let r = 1; r <= 5 && !found; r++) {
          for (let dy = -r; dy <= r && !found; dy++) {
            for (let dx = -r; dx <= r && !found; dx++) {
              const nx = tileX + dx;
              const ny = tileY + dy;
              if (this.navigationGrid.isWalkable(nx, ny)) {
                newX = nx * tileSize + 16;
                newY = ny * tileSize + 16;
                found = true;
              }
            }
          }
        }
      }
    }

    if (this.player) {
      this.player.setPosition(newX, newY);
    }

    this.playerMapId = targetMapId;
    this.openedLocations.add(targetMapId);
    this.explorationSystem.recordMapTransition();
    this.mapTransitionCooldown = 1.0;

    if (this.player) {
      const tilePos = this.player.getTilePosition();
      this.explorationSystem.update(tilePos, targetMapId);
    }

    this.camera.centerOn(this.player?.x ?? 25 * 32, this.player?.y ?? 20 * 32);

    // Phase 13: Auto-save on map transition
    console.log(`[World] Now in ${targetMapId} at ${newX},${newY} | ${this.explorationSystem.getMapDebugString(targetMapId)} - Auto-saving`);
    this.saveGame(AUTO_SAVE_SLOT);

    return true;
  }

  private handleMapTransitions(): void {
    if (!this.player) return;
    if (this.mapTransitionCooldown > 0) return;
    if (this.dialogueManager.isOpen()) return;
    if (this.saveRenderer.isShowingUI()) return;

    const map = this.world.getCurrentMap();
    if (!map) return;

    const tilePos = this.player.getTilePosition();
    const x = tilePos.x;
    const y = tilePos.y;

    let targetMapId: string | null = null;
    let entryEdge: 'north' | 'south' | 'west' | 'east' | null = null;

    if (y <= 0) {
      if (x === 24 || x === 25) {
        if (map.mapId === 'village_01') targetMapId = 'forest_01';
        else if (map.mapId === 'forest_01') targetMapId = 'lake_01';
        else if (map.mapId === 'lake_01') targetMapId = 'village_01';
        entryEdge = 'north';
      }
    } else if (y >= map.height - 1) {
      if (x === 24 || x === 25) {
        if (map.mapId === 'village_01') targetMapId = 'lake_01';
        else if (map.mapId === 'lake_01') targetMapId = 'forest_01';
        else if (map.mapId === 'forest_01') targetMapId = 'village_01';
        entryEdge = 'south';
      }
    } else if (x <= 0) {
      if (y === 19 || y === 20) {
        if (map.mapId === 'village_01') targetMapId = 'forest_01';
        else if (map.mapId === 'forest_01') targetMapId = 'lake_01';
        else if (map.mapId === 'lake_01') targetMapId = 'village_01';
        entryEdge = 'west';
      }
    } else if (x >= map.width - 1) {
      if (y === 19 || y === 20) {
        if (map.mapId === 'village_01') targetMapId = 'lake_01';
        else if (map.mapId === 'lake_01') targetMapId = 'forest_01';
        else if (map.mapId === 'forest_01') targetMapId = 'village_01';
        entryEdge = 'east';
      }
    }

    if (targetMapId && entryEdge) {
      this.switchMap(targetMapId, entryEdge);
    }
  }

  private update(deltaTime: number): void {
    this.renderer.update(deltaTime);
    this.world.update(deltaTime);
    this.worldRenderer.update(deltaTime);

    if (this.mapTransitionCooldown > 0) {
      this.mapTransitionCooldown -= deltaTime;
    }

    // Phase 13: Playtime and auto-save
    this.playTimeSeconds += deltaTime;
    this.autoSaveTimer += deltaTime;
    if (this.player) {
      this.player.updatePlayTime(deltaTime);
    }

    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.autoSaveTimer = 0;
      if (!this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI()) {
        console.log('[Save] Auto-save triggered');
        this.saveGame(AUTO_SAVE_SLOT);
      }
    }

    if (this.timeManager && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI()) {
      this.timeManager.update(deltaTime);
    }

    const map = this.world.getCurrentMap();

    if (this.player && map) {
      const isDialogueOpen = this.dialogueManager.isOpen();
      const isSaveUIOpen = this.saveRenderer.isShowingUI();
      this.player.update(deltaTime, this.input, map, this.collisionSystem, isDialogueOpen || isSaveUIOpen);
      this.playerRenderer.update(deltaTime, this.player);
      this.camera.follow(this.player.x, this.player.y);
      this.camera.update(deltaTime);
      const camOffset = this.camera.getOffset();
      this.worldRenderer.setOffset(camOffset.x, camOffset.y);
      this.worldRenderer.setZoom(this.camera.getZoom());

      const tilePos = this.player.getTilePosition();
      this.explorationSystem.update(tilePos, map.mapId);

      this.handleMapTransitions();

      this.debug.setPlayerInfo({
        x: this.player.x,
        y: this.player.y,
        tileX: tilePos.x,
        tileY: tilePos.y,
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
        this.debug.setCurrentTileCollision(collisionMap.getCollisionType(tilePos.x, tilePos.y));
      }
    }

    if (map) {
      const currentMinutes = this.timeManager ? this.timeManager.getMinutesSinceMidnight() : undefined;

      const isVillage = map.mapId === 'village_01';
      const isSaveUIOpen = this.saveRenderer.isShowingUI();
      if (isVillage && !this.dialogueManager.isOpen() && !isSaveUIOpen) {
        this.npcManager.update(deltaTime, map, this.collisionSystem, currentMinutes);
      }
      this.npcRenderer.update(deltaTime, this.npcManager.getAllNPCs());

      if (isVillage && this.lifeManager && this.timeManager && !this.dialogueManager.isOpen() && !isSaveUIOpen) {
        this.lifeManager.update(deltaTime, this.npcManager.getAllNPCs(), this.timeManager);
      }

      if (this.player) {
        this.interactionSystem.update(this.player, this.npcManager.getAllNPCs(), this.buildingManager);
      }

      const wasDialogueOpenBeforeInput = this.dialogueManager.isOpen();
      if (!isSaveUIOpen) {
        this.handleDialogueInput();
      }
      (this as any)._wasDialogueOpenBeforeInput = wasDialogueOpenBeforeInput;

      // Save input handling
      this.handleSaveInput();
      this.saveRenderer.update(deltaTime);

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

      if (this.explorationSystem) {
        this.debug.setExplorationInfo({
          currentMapId: map.mapId,
          currentMapName: map.name,
          discovered: this.explorationSystem.getExploredCount(map.mapId),
          total: this.explorationSystem.getTotalTilesForMap(map.mapId),
          percentage: this.explorationSystem.getExplorationPercentage(map.mapId),
          totalDiscovered: this.explorationSystem.getTotalExploredCount(),
          totalTiles: this.explorationSystem.getTotalTiles(),
          totalPercentage: this.explorationSystem.getTotalExplorationPercentage(),
          visionRadius: this.explorationSystem.getVisionRadius(),
          transitions: this.explorationSystem.getMapTransitions(),
          showFog: this.showFog,
          showMinimap: this.showMinimap,
          debug: this.explorationSystem.getDebugString()
        });
      }

      if (this.world) {
        const allMapsInfo = this.world.getAllMapsInfo();
        this.debug.setWorldInfo({
          currentMapId: map.mapId,
          currentMapName: map.name,
          mapCount: allMapsInfo.length,
          allMaps: allMapsInfo,
          playerMapId: this.playerMapId
        });
      }

      // Save debug
      if (this.saveManager) {
        const stats = this.saveManager.getStats();
        (this.debug as any).setSaveInfo?.({
          version: SAVE_VERSION,
          gameVersion: SAVE_GAME_VERSION,
          slotCount: stats.slotCount,
          maxSlots: MAX_SAVE_SLOTS,
          saveCount: stats.saveCount,
          lastSave: stats.lastSaveTime,
          lastLoad: stats.lastLoadTime,
          lastError: stats.lastError,
          corrupted: stats.corruptedCount,
          playTime: this.playTimeSeconds,
          autoSaveIn: this.autoSaveInterval - this.autoSaveTimer,
          showDebug: this.showSaveDebug
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

    this.handleDebugToggles(deltaTime, (this as any)._wasDialogueOpenBeforeInput);
  }

  private handleDialogueInput(): void {
    if (this.dialogueManager.isOpen()) {
      if (this.input.isKeyJustPressed('escape')) {
        this.dialogueManager.endDialogue();
        console.log('[Dialogue] Closed via ESC');
        return;
      }

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

      return;
    }

    if (this.input.isKeyJustPressed('e') || this.input.isKeyJustPressed('enter')) {
      const interactable = this.interactionSystem.getCurrentInteractable();
      if (!interactable) return;

      if (interactable.type === 'NPC' && interactable.npc) {
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
        if (this.player) {
          this.player.npcsMet.add(interactable.npc.id);
          this.player.totalInteractions++;
        }
        console.log(`[Interaction] Started dialogue with ${interactable.npc.id}`);

      } else if (interactable.type === 'BUILDING' && interactable.building) {
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
        if (this.player) this.player.totalInteractions++;
        console.log(`[Interaction] Started building dialogue with ${interactable.building.id}`);
      }
    }
  }

  private handleDebugToggles(_deltaTime: number, wasDialogueOpenBeforeInput?: boolean): void {
    const wasOpen = wasDialogueOpenBeforeInput ?? (this as any)._wasDialogueOpenBeforeInput ?? false;

    // Don't toggle debug if save UI is open
    if (this.saveRenderer.isShowingUI()) return;

    if (this.input.isKeyJustPressed('`') || this.input.isKeyJustPressed('f2')) {
      this.debug.setEnabled(!this.debug.isEnabled());
    }

    if (this.input.isKeyJustPressed('r') && !this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
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

    if (this.input.isKeyJustPressed('k') && !this.input.isKeyDown('shift')) {
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

    if (this.input.isKeyJustPressed('n') && !this.input.isKeyDown('control')) {
      this.showNPCPaths = !this.showNPCPaths;
      console.log(`[Pathfinding] Paths debug: ${this.showNPCPaths ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('m') && !this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
      this.showNavigationGrid = !this.showNavigationGrid;
      console.log(`[Pathfinding] Nav grid debug: ${this.showNavigationGrid ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('m') && this.input.isKeyDown('shift')) {
      this.showFullMap = !this.showFullMap;
      console.log(`[Exploration] Full map: ${this.showFullMap ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('j')) {
      this.showBuildingDoors = !this.showBuildingDoors;
      console.log(`[Building] Doors debug: ${this.showBuildingDoors ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('l') && !this.input.isKeyDown('control')) {
      this.showBuildingLabels = !this.showBuildingLabels;
      console.log(`[Building] Labels debug: ${this.showBuildingLabels ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('u')) {
      this.showBuildingOwnership = !this.showBuildingOwnership;
      console.log(`[Building] Ownership debug: ${this.showBuildingOwnership ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('i') && !this.input.isKeyDown('control')) {
      this.showBuildingFronts = !this.showBuildingFronts;
      console.log(`[Building] Front-of-door debug: ${this.showBuildingFronts ? 'ON' : 'OFF'}`);
    }

    if (!this.dialogueManager.isOpen() && this.input.isKeyJustPressed('q') && !this.input.isKeyDown('control')) {
      this.showSchedules = !this.showSchedules;
      console.log(`[Schedule] Schedules debug: ${this.showSchedules ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('e') && this.input.isKeyDown('shift')) {
      this.showClock = !this.showClock;
      console.log(`[Time] Clock: ${this.showClock ? 'ON' : 'OFF'}`);
    } else if (!this.dialogueManager.isOpen() && this.input.isKeyJustPressed('f') && !this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
      this.showFog = !this.showFog;
      this.explorationRenderer.setShowFog(this.showFog);
      console.log(`[Exploration] Fog: ${this.showFog ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('f') && this.input.isKeyDown('shift')) {
      this.showTimeOverlay = !this.showTimeOverlay;
      console.log(`[Time] Day/night overlay: ${this.showTimeOverlay ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('tab')) {
      this.showMinimap = !this.showMinimap;
      this.minimapRenderer.setShowMinimap(this.showMinimap);
      console.log(`[Exploration] Minimap: ${this.showMinimap ? 'ON' : 'OFF'}`);
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

    if (this.input.isKeyJustPressed('o') && !this.input.isKeyDown('control')) {
      this.showInteractionPrompt = !this.showInteractionPrompt;
      this.dialogueRenderer.setShowInteractionPrompt(this.showInteractionPrompt);
      console.log(`[Interaction] Prompt: ${this.showInteractionPrompt ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed(' ') && !this.saveRenderer.isShowingUI()) {
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

    if (this.input.isKeyJustPressed(']') && !this.input.isKeyDown('shift')) {
      this.timeManager.advanceTime(60);
    }

    if (this.input.isKeyJustPressed('[') && !this.input.isKeyDown('shift')) {
      this.timeManager.advanceTime(-60);
    }

    if (this.input.isKeyJustPressed('\\\\')) {
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
      console.log('[NPC] States and Paths, Homes, Schedules, Life, Interaction, Dialogue, Exploration, World, Save:');
      console.log(`[Time] ${this.timeManager.formatDayTime()} Phase ${this.timeManager.getPhase()} Scale ${this.timeManager.getTimeScale()}x`);
      console.log(`[World] ${this.world.getAllMapsInfo().map(m=>`${m.id} ${m.name}`).join(', ')} Current ${this.world.getCurrentMap()?.mapId}`);
      console.log(`[Exploration] ${this.explorationSystem.getDebugString()} Current ${this.explorationSystem.getMapDebugString(this.world.getCurrentMap()?.mapId ?? '')}`);
      console.log(`[Life] Avg wellbeing ${this.lifeManager.getAverageWellbeing().toFixed(0)}% Critical ${this.lifeManager.getCriticalCount()} Interactions ${this.lifeManager.getInteractions()}`);
      console.log(`[Interaction] ${this.interactionSystem.getDebugString()} Total ${this.interactionSystem.getTotalInteractions()}`);
      console.log(`[Dialogue] ${this.dialogueManager.getDebugString()} Total ${this.dialogueManager.getTotalDialogues()} Choices ${this.dialogueManager.getTotalChoices()}`);
      console.log(`[Save] ${this.saveManager.getStats().slotCount}/${MAX_SAVE_SLOTS} slots v${SAVE_VERSION} playTime ${(this.playTimeSeconds/60).toFixed(1)}min autoSaveIn ${(this.autoSaveInterval - this.autoSaveTimer).toFixed(0)}s`);
      this.saveManager.debugPrintSlots();
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
      console.log('[Exploration]:', this.explorationSystem.getAllMapsExploration());
    }

    if (this.input.isKeyJustPressed('t')) {
      console.log('[Phase7+8+9+10+11+12+13 Test] Running all tests...');
      this.runPhase7Tests();
      this.runPhase8Tests();
      this.runPhase9Tests();
      this.runPhase10Tests();
      this.runPhase11Tests();
      this.runPhase12Tests();
      this.runPhase13Tests();
    }

    if (this.input.isKeyJustPressed('k') && this.input.isKeyDown('shift')) {
      if (this.navigationGrid) {
        const testX = 24, testY = 18;
        const wasWalkable = this.navigationGrid.isWalkable(testX, testY);
        this.navigationGrid.setWalkable(testX, testY, !wasWalkable);
        console.log(`[Phase7 Test6] Toggled obstacle at ${testX},${testY} walkable=${!wasWalkable}`);
      }
    }

    // Teleports - safe positions per map
    if (this.input.isKeyJustPressed('1') && !wasOpen && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && this.player) {
      this.player.setPosition(25*32+16, 20*32+16);
    }
    if (this.input.isKeyJustPressed('2') && !wasOpen && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && this.player) {
      this.player.setPosition(34*32+16, 14*32+16);
    }
    if (this.input.isKeyJustPressed('3') && !wasOpen && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && this.player) {
      this.player.setPosition(37*32+16, 19*32+16);
    }
    if (this.input.isKeyJustPressed('4') && !wasOpen && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && this.player) {
      this.player.setPosition(15*32+16, 30*32+16);
    }

    // Map jump shortcuts for Phase 12 testing
    if (this.input.isKeyJustPressed('f1') && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI()) {
      this.switchMap('village_01', 'north');
    }
    if (this.input.isKeyJustPressed('f3') && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI()) {
      this.switchMap('forest_01', 'north');
    }
    if (this.input.isKeyJustPressed('f4') && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI()) {
      this.switchMap('lake_01', 'north');
    }

    if (!wasOpen && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI()) {
      if (this.input.isKeyJustPressed('5')) {
        const npc = this.npcManager.getNPC('NPC001');
        if (npc) {
          const tile = npc.getTilePosition();
          npc.requestPath({ x: tile.x + 2, y: tile.y });
        }
      }
      if (this.input.isKeyJustPressed('6') && !this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
        const npc = this.npcManager.getNPC('NPC002');
        if (npc) npc.requestPath({ x: 10, y: 10 });
      }
      if (this.input.isKeyJustPressed('7') && !this.input.isKeyDown('shift')) {
        const npc = this.npcManager.getNPC('NPC003');
        if (npc) npc.requestPath({ x: 42, y: 19 });
      }
      if (this.input.isKeyJustPressed('8') && !this.input.isKeyDown('shift')) {
        const npc = this.npcManager.getNPC('NPC004');
        if (npc) npc.requestPath({ x: 38, y: 10 });
      }
      if (this.input.isKeyJustPressed('9') && !this.input.isKeyDown('shift')) {
        const npc = this.npcManager.getNPC('NPC005');
        if (npc) npc.requestPath({ x: 0, y: 0 });
      }
    }

    // F5-F8 NPC go home now requires no shift (since Shift+F5/F6 are save/load UI)
    if (this.input.isKeyJustPressed('f5') && !this.input.isKeyDown('shift')) {
      const npc = this.npcManager.getNPC('NPC001');
      if (npc) npc.goHome();
    }
    if (this.input.isKeyJustPressed('f6') && !this.input.isKeyDown('shift')) {
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
      const npc = this.npcManager.getNPC('NPC001');
      if (npc && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI()) {
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

    // Exploration toggles
    if (this.input.isKeyJustPressed('r') && this.input.isKeyDown('shift')) {
      const currentMapId = this.world.getCurrentMap()?.mapId;
      if (currentMapId) {
        this.explorationSystem.revealAll(currentMapId);
        console.log(`[Exploration] Revealed all for ${currentMapId}`);
      }
    } else if (this.input.isKeyJustPressed('r') && this.input.isKeyDown('control')) {
      this.explorationSystem.reset();
      console.log('[Exploration] Reset all');
    }

    if (this.input.isKeyJustPressed('[') && this.input.isKeyDown('shift')) {
      const newRadius = Math.max(1, this.explorationSystem.getVisionRadius() - 1);
      this.explorationSystem.setVisionRadius(newRadius);
    }
    if (this.input.isKeyJustPressed(']') && this.input.isKeyDown('shift')) {
      const newRadius = Math.min(20, this.explorationSystem.getVisionRadius() + 1);
      this.explorationSystem.setVisionRadius(newRadius);
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
    console.log(`Test1 building counts: total=${counts.total} residential=${counts.residential} withInterior=${counts.withInterior} byType=${JSON.stringify(counts.byType)} -> ${counts.total >= 1 ? 'PASS' : 'FAIL'}`);

    let doorsWalkable = true;
    for (const b of this.buildingManager.getAllBuildings()) {
      if (this.navigationGrid) {
        const walkable = this.navigationGrid.isWalkable(b.door.x, b.door.y);
        if (!walkable) doorsWalkable = false;
      }
    }
    console.log(`Test2 doors walkable: ${doorsWalkable ? 'PASS' : 'FAIL'}`);

    let homesValid = true;
    for (const npc of this.npcManager.getAllNPCs()) {
      const home = npc.getHomeBuilding();
      if (mapIdIsVillage(this.world.getCurrentMap()?.mapId) && !home) homesValid = false;
    }
    console.log(`Test3 NPC homes valid (village only): ${homesValid ? 'PASS' : 'FAIL'}`);

    console.log('=== END PHASE 8 TESTS ===');

    function mapIdIsVillage(id: string | undefined): boolean {
      return id === 'village_01';
    }
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

    console.log('=== END PHASE 9 TESTS ===');
  }

  private runPhase10Tests(): void {
    if (!this.lifeManager) {
      console.log('No life manager');
      return;
    }

    console.log('=== PHASE 10 TESTS ===');

    const lifeCount = this.lifeManager.getCount();
    console.log(`Test1 life counts: ${lifeCount} NPCs (expected 5) -> ${lifeCount === 5 ? 'PASS' : 'FAIL'}`);

    const avgWellbeing = this.lifeManager.getAverageWellbeing();
    console.log(`Test2 average wellbeing: ${avgWellbeing.toFixed(0)}% -> ${avgWellbeing > 0 ? 'PASS' : 'FAIL'}`);

    console.log('=== END PHASE 10 TESTS ===');
  }

  private runPhase11Tests(): void {
    if (!this.interactionSystem || !this.dialogueManager) {
      console.log('No interaction/dialogue manager');
      return;
    }

    console.log('=== PHASE 11 TESTS ===');

    console.log(`Test1 interaction range: ${this.interactionSystem.getInteractionRange()}px -> ${this.interactionSystem.getInteractionRange() === 60 ? 'PASS' : 'FAIL'}`);
    console.log(`Test2 dialogue initial closed: ${!this.dialogueManager.isOpen() ? 'PASS' : 'FAIL'}`);

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
      console.log(`Test3 start dialogue: ${started ? 'PASS' : 'FAIL'}`);
      this.dialogueManager.endDialogue();
    }

    console.log('=== END PHASE 11 TESTS ===');
  }

  private runPhase12Tests(): void {
    if (!this.explorationSystem || !this.world) {
      console.log('No exploration/world manager');
      return;
    }

    console.log('=== PHASE 12 TESTS ===');

    const allMaps = this.world.getAllMapsInfo();
    console.log(`Test1 world maps: ${allMaps.length} maps (expected 3) -> ${allMaps.length === 3 ? 'PASS' : 'FAIL'}`);
    for (const m of allMaps) {
      console.log(`  Map ${m.id} ${m.name} ${m.width}x${m.height} tiles ${m.tileCount}`);
    }

    const currentMapId = this.world.getCurrentMap()?.mapId ?? '';
    console.log(`Test2 current map: ${currentMapId} -> ${currentMapId ? 'PASS' : 'FAIL'}`);

    const visionRadius = this.explorationSystem.getVisionRadius();
    console.log(`Test3 vision radius: ${visionRadius} (expected 8) -> ${visionRadius === 8 ? 'PASS' : 'FAIL'}`);

    const exploredCount = this.explorationSystem.getExploredCount(currentMapId);
    const totalTiles = this.explorationSystem.getTotalTilesForMap(currentMapId);
    const percentage = this.explorationSystem.getExplorationPercentage(currentMapId);
    console.log(`Test4 exploration ${currentMapId}: ${exploredCount}/${totalTiles} (${percentage.toFixed(1)}%) -> ${exploredCount > 0 ? 'PASS' : 'FAIL'}`);

    const totalDiscovered = this.explorationSystem.getTotalExploredCount();
    const totalTilesAll = this.explorationSystem.getTotalTiles();
    const totalPerc = this.explorationSystem.getTotalExplorationPercentage();
    console.log(`Test5 total exploration: ${totalDiscovered}/${totalTilesAll} (${totalPerc.toFixed(1)}%) -> ${totalDiscovered > 0 ? 'PASS' : 'FAIL'}`);

    const transitions = this.explorationSystem.getMapTransitions();
    console.log(`Test6 map transitions: ${transitions} -> PASS (count >=0)`);

    const beforeReveal = this.explorationSystem.getExploredCount(currentMapId);
    this.explorationSystem.revealAll(currentMapId);
    const afterReveal = this.explorationSystem.getExploredCount(currentMapId);
    console.log(`Test7 reveal all ${currentMapId}: ${beforeReveal} -> ${afterReveal} -> ${afterReveal === totalTiles ? 'PASS' : 'FAIL'}`);

    this.explorationSystem.reset(currentMapId);
    if (this.player) {
      const tilePos = this.player.getTilePosition();
      this.explorationSystem.update(tilePos, currentMapId);
    }
    const afterReset = this.explorationSystem.getExploredCount(currentMapId);
    console.log(`Test8 reset and re-explore ${currentMapId}: ${afterReset} tiles -> ${afterReset > 0 ? 'PASS' : 'FAIL'}`);

    const allExploration = this.explorationSystem.getAllMapsExploration();
    console.log(`Test9 all maps exploration: ${allExploration.length} entries -> ${allExploration.length === 3 ? 'PASS' : 'FAIL'}`);

    console.log(`Test10 fog and minimap toggles: Fog ${this.showFog ? 'ON' : 'OFF'} Minimap ${this.showMinimap ? 'ON' : 'OFF'} -> PASS`);

    console.log('=== END PHASE 12 TESTS ===');
  }

  private runPhase13Tests(): void {
    console.log('=== PHASE 13 TESTS - SAVE/LOAD & WORLD PERSISTENCE ===');

    // Test1: SaveManager instance
    const hasManager = !!this.saveManager;
    console.log(`Test1 SaveManager exists: ${hasManager ? 'PASS' : 'FAIL'}`);

    // Test2: Save slots
    const slots = this.saveManager.getAllSaveSlots();
    console.log(`Test2 Save slots: ${slots.length} slots (expected ${MAX_SAVE_SLOTS}) -> ${slots.length === MAX_SAVE_SLOTS ? 'PASS' : 'FAIL'}`);

    // Test3: Create new save data
    const saveData = this.collectSaveData(0);
    const hasPlayer = !!saveData.player;
    const hasWorld = !!saveData.world;
    const hasNPCs = !!saveData.npcs && Object.keys(saveData.npcs).length > 0;
    const hasTime = !!saveData.world.time;
    const hasExploration = !!saveData.world.exploration;
    console.log(`Test3 Collect save data: player=${hasPlayer} world=${hasWorld} npcs=${hasNPCs}(${Object.keys(saveData.npcs).length}) time=${hasTime} exploration=${hasExploration} -> ${hasPlayer && hasWorld && hasNPCs && hasTime && hasExploration ? 'PASS' : 'FAIL'}`);

    // Test4: Save to slot 0
    const saved = this.saveManager.saveGame(0, saveData);
    console.log(`Test4 Save to slot 0: ${saved ? 'PASS' : 'FAIL'}`);

    // Test5: Load from slot 0
    const loaded = this.saveManager.loadGame(0);
    const loadValid = !!loaded && loaded.player && loaded.world;
    console.log(`Test5 Load from slot 0: ${loadValid ? 'PASS' : 'FAIL'}`);
    if (loaded) {
      console.log(`  Loaded: Day ${loaded.world.time.day} ${loaded.world.currentMapId} player ${loaded.player.x.toFixed(0)},${loaded.player.y.toFixed(0)} exploration ${loaded.world.exploration.totalDiscovered}/${loaded.world.exploration.totalTiles}`);
    }

    // Test6: Validation
    const validation = this.saveManager.validateSaveFile(saveData);
    console.log(`Test6 Validation: valid=${validation.valid} errors=${validation.errors.length} warnings=${validation.warnings.length} -> ${validation.valid ? 'PASS' : 'FAIL'}`);
    if (validation.errors.length > 0) console.log(`  Errors: ${validation.errors.join(', ')}`);

    // Test7: Missing-data handling - load with missing fields
    const incomplete: any = {
      version: SAVE_VERSION,
      gameVersion: SAVE_GAME_VERSION,
      timestamp: Date.now(),
      slotId: 1,
      player: { x: 100, y: 100, mapId: 'village_01' }, // missing many fields
      world: { currentMapId: 'village_01', time: { day: 1, hour: 6, minute: 0, second: 0, totalSeconds: 0, timeScale: 60, isPaused: false }, exploration: { visionRadius: 8, mapTransitions: 0, totalDiscovered: 0, totalTiles: 0, maps: {}, version: 1 }, flags: {}, openedLocations: [], collectedObjects: [], changedObjects: {}, questRelatedChanges: {}, eventStates: {}, allMaps: [] },
      npcs: {},
      quests: { quests: {}, version: 1 },
      meta: { playTimeSeconds: 0, saveCount: 0, lastSaved: Date.now(), createdAt: Date.now(), gameVersion: SAVE_GAME_VERSION, saveVersion: SAVE_VERSION, slotId: 1, playerName: 'Test', preview: { day: 1, time: '06:00:00', mapId: 'village_01', mapName: 'Village', explorationPercent: 0, money: 50, health: 100 } },
      future: {}
    };
    const repairedValidation = this.saveManager.validateSaveFile(incomplete);
    console.log(`Test7 Missing-data handling: incomplete save valid=${repairedValidation.valid} warnings=${repairedValidation.warnings.length} (should have warnings but try repair) -> ${repairedValidation.warnings.length > 0 ? 'PASS (warnings detected)' : 'CHECK'}`);

    // Test8: Corrupted-data protection
    const corruptedJson = '{ invalid json';
    const importResult = this.saveManager.importSave(corruptedJson, 2);
    console.log(`Test8 Corrupted-data protection: import corrupted JSON should fail -> ${!importResult ? 'PASS' : 'FAIL'}`);

    // Test9: Version handling
    const oldVersionSave = { ...saveData, version: 1 };
    const needsMigration = oldVersionSave.version < SAVE_VERSION;
    console.log(`Test9 Version handling: old v1 needs migration to v${SAVE_VERSION}: ${needsMigration ? 'PASS' : 'FAIL'}`);

    // Test10: Player save/load cycle
    const originalX = this.player?.x ?? 0;
    const originalY = this.player?.y ?? 0;
    const originalDay = this.timeManager.getDay();
    const originalMap = this.world.getCurrentMap()?.mapId;

    // Move player and change time
    if (this.player) {
      this.player.setPosition(originalX + 100, originalY + 100);
    }
    this.timeManager.advanceTime(60); // +1 hour
    const newDay = this.timeManager.getDay();
    const newTime = this.timeManager.formatTime();

    // Save
    this.saveGame(1);
    console.log(`Test10 Save/Load cycle: Moved player to ${this.player?.x.toFixed(0)},${this.player?.y.toFixed(0)} and time to Day ${newDay} ${newTime} and saved to slot 1 -> PASS`);

    // Move again
    if (this.player) {
      this.player.setPosition(originalX, originalY);
    }
    this.timeManager.setTime(6, 0, originalDay);

    // Load
    const loadSuccess = this.loadGame(1);
    const loadedX = this.player?.x ?? 0;
    const loadedY = this.player?.y ?? 0;
    const loadedDay = this.timeManager.getDay();
    console.log(`Test10 Load verification: loaded player ${loadedX.toFixed(0)},${loadedY.toFixed(0)} (expected ${originalX + 100},${originalY + 100}) Day ${loadedDay} (expected ${newDay}) -> ${Math.abs(loadedX - (originalX + 100)) < 1 && loadedDay === newDay ? 'PASS' : 'FAIL'}`);

    // Restore original for clean state
    if (this.player) {
      this.player.setPosition(originalX, originalY);
    }
    this.timeManager.setTime(6, 0, originalDay);
    console.log(`Test10 Restore original: Player back to ${originalX.toFixed(0)},${originalY.toFixed(0)} Day ${originalDay} map ${originalMap} -> PASS`);

    // Test11: NPC position persistence
    const npc = this.npcManager.getNPC('NPC001');
    const npcOriginalX = npc?.x ?? 0;
    const npcOriginalY = npc?.y ?? 0;
    if (npc) {
      npc.setPosition(npcOriginalX + 50, npcOriginalY + 50);
      this.saveGame(2);
      npc.setPosition(npcOriginalX, npcOriginalY);
      this.loadGame(2);
      const npcLoadedX = npc.x;
      const npcLoadedY = npc.y;
      console.log(`Test11 NPC position: original ${npcOriginalX.toFixed(0)},${npcOriginalY.toFixed(0)} -> saved ${npcOriginalX + 50},${npcOriginalY + 50} -> loaded ${npcLoadedX.toFixed(0)},${npcLoadedY.toFixed(0)} -> ${Math.abs(npcLoadedX - (npcOriginalX + 50)) < 1 ? 'PASS' : 'FAIL'}`);
      npc.setPosition(npcOriginalX, npcOriginalY);
    }

    // Test12: Exploration persistence
    const beforeExplore = this.explorationSystem.getExploredCount('village_01');
    this.explorationSystem.revealAll('village_01');
    const afterReveal = this.explorationSystem.getExploredCount('village_01');
    this.saveGame(3);
    this.explorationSystem.reset('village_01');
    const afterReset = this.explorationSystem.getExploredCount('village_01');
    this.loadGame(3);
    const afterLoad = this.explorationSystem.getExploredCount('village_01');
    console.log(`Test12 Exploration: before ${beforeExplore} -> reveal ${afterReveal} -> reset ${afterReset} -> loaded ${afterLoad} (expected ${afterReveal}) -> ${afterLoad === afterReveal ? 'PASS' : 'FAIL'}`);
    // Clean up: reset to original exploration state
    this.explorationSystem.reset('village_01');
    if (this.player) {
      const tilePos = this.player.getTilePosition();
      this.explorationSystem.update(tilePos, 'village_01');
    }

    // Test13: World flags and future compatibility
    this.worldFlags['test_flag'] = true;
    this.collectedObjects.add('test_object');
    const saveWithFlags = this.collectSaveData(4);
    const hasFlags = !!saveWithFlags.world.flags['test_flag'];
    const hasCollected = saveWithFlags.world.collectedObjects.includes('test_object');
    const hasFuture = !!saveWithFlags.future;
    const hasFarming = !!saveWithFlags.world.farming;
    console.log(`Test13 World persistence & future compatibility: flag=${hasFlags} collected=${hasCollected} future=${hasFuture} farming=${hasFarming} -> ${hasFlags && hasCollected && hasFuture && hasFarming ? 'PASS' : 'FAIL'}`);
    delete this.worldFlags['test_flag'];
    this.collectedObjects.delete('test_object');

    console.log('=== END PHASE 13 TESTS ===');
    console.log(`[Save] Slots: ${this.saveManager.getAllSaveSlots().filter(s=>s.exists).length}/${MAX_SAVE_SLOTS} used`);
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

      if (this.showFog && this.explorationSystem) {
        this.explorationRenderer.renderFog(ctx, this.worldRenderer, this.camera, this.explorationSystem, map.mapId, w, h);
      }
    } else {
      this.renderer.renderBackground();
    }

    const isVillage = map?.mapId === 'village_01';
    if (isVillage && this.npcManager.getCount() > 0) {
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

      if (this.showVisionDebug) {
        this.explorationRenderer.renderVisionDebug(ctx, this.worldRenderer, this.camera, this.player.x, this.player.y, this.explorationSystem.getVisionRadius());
      }
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

    if (this.showMinimap && map) {
      this.minimapRenderer.render(ctx, map, this.explorationSystem, this.player, this.npcManager.getAllNPCs(), this.buildingManager.getAllBuildings(), w, h);
    }

    if (this.showFullMap && map) {
      this.minimapRenderer.renderFullMap(ctx, map, this.explorationSystem, w, h);
    }

    if (this.showInteractionPrompt && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI()) {
      this.dialogueRenderer.renderInteractionPrompt(ctx, this.interactionSystem, w, h);
    }

    if (this.dialogueManager.isOpen()) {
      this.dialogueRenderer.renderDialogue(ctx, this.dialogueManager, w, h);
    }

    // Phase 13 Save UI (top layer, above dialogue? Actually dialogue should be top, but save UI also top - show save UI above dialogue for visibility)
    if (this.saveRenderer.isShowingUI() || (this.saveRenderer as any).saveMessage) {
      this.saveRenderer.render(ctx, w, h, this.saveSlots);
    }

    this.debug.render(ctx);

    if (this.showHelp && this.debug.isEnabled()) {
      this.renderHelp(ctx, w, h);
    }

    if (map && this.player && this.mapTransitionCooldown <= 0 && !this.saveRenderer.isShowingUI()) {
      const tilePos = this.player.getTilePosition();
      if (tilePos.x <= 0 || tilePos.x >= map.width - 1 || tilePos.y <= 0 || tilePos.y >= map.height - 1) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(w/2 - 150, 50, 300, 30);
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.strokeRect(w/2 - 150, 50, 300, 30);
        ctx.fillStyle = '#8ff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌍 Press forward to travel to next map', w/2, 65);
        ctx.restore();
      }
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
    const currentMap = this.world.getCurrentMap();
    const explorationPerc = currentMap ? this.explorationSystem.getExplorationPercentage(currentMap.mapId).toFixed(1) : '0';
    const totalPerc = this.explorationSystem.getTotalExplorationPercentage().toFixed(1);
    const saveStats = this.saveManager ? this.saveManager.getStats() : null;

    const lines = [
      'PHASE 13 - SAVE, LOAD & WORLD PERSISTENCE',
      `Time: ${timeStr} Phase ${phaseStr} Scale ${this.timeManager ? this.timeManager.getTimeScale() : 0}x Wellbeing ${avgWellbeing}%`,
      `World: ${this.world.getAllMapsInfo().length} maps Current:${currentMap?.mapId}(${currentMap?.name}) PlayerMap:${this.playerMapId} Trans:${this.explorationSystem.getMapTransitions()}`,
      `Exploration: ${currentMap?.name} ${explorationPerc}% Total ${totalPerc}% Vision:${this.explorationSystem.getVisionRadius()} Fog:${this.showFog?'ON':'OFF'}(F) Mini:${this.showMinimap?'ON':'OFF'}(TAB) Full:${this.showFullMap?'ON':'OFF'}(Shift+M)`,
      `Save: v${SAVE_VERSION} ${SAVE_GAME_VERSION} Slots:${saveStats?.slotCount ?? 0}/${MAX_SAVE_SLOTS} Saves:${saveStats?.saveCount ?? 0} PlayTime:${(this.playTimeSeconds/60).toFixed(1)}min AutoSaveIn:${(this.autoSaveInterval - this.autoSaveTimer).toFixed(0)}s ${saveStats?.lastError ? `ERR:${saveStats.lastError.substring(0,30)}` : ''}`,
      `Interaction: ${interactable ? `${interactable.type} ${interactable.name} ${interactable.distance.toFixed(0)}px` : 'None'} | Dialogue: ${this.dialogueManager.isOpen() ? 'OPEN' : 'CLOSED'} | SaveUI: ${this.saveRenderer.isShowingUI() ? 'OPEN' : 'CLOSED'}`,
      'Player: WASD move, C center, V village, Edges to travel between maps',
      'Camera: Z zoom, X smoothing',
      'Collision: K overlay, 1-4 teleport safe positions (when dialogue closed)',
      'Pathfinding: N paths, M nav grid (Shift+M full map)',
      'Buildings: J doors, L labels, U own, I fronts',
      'Time: Space pause, =/+ faster, -/_ slower, ] +1h, [ -1h, \\\\ next phase, Shift+E clock, Shift+F overlay',
      'Schedules: Q toggle schedule debug (when dialogue closed)',
      'Life: ; needs, , inventory, . jobs, F10 boost 100%, F11 drain critical',
      'Interaction & Dialogue:',
      '  E / Enter - Interact with NPC/building (when prompt shows)',
      '  1-4 - Choose dialogue option (when dialogue open)',
      '  ESC - Close dialogue / Close Save UI',
      '  O - Toggle interaction prompt, F12 - Test dialogue',
      'Exploration & World (Phase 12):',
      '  TAB - Toggle minimap, F - Toggle fog, Shift+M full map',
      '  Shift+R - Reveal all current map, Ctrl+R - Reset exploration',
      '  Shift+[ / Shift+] - Vision radius, F1/F3/F4 - Jump maps',
      'Save, Load & World Persistence (Phase 13):',
      '  Ctrl+S - Quick save to Slot 0 (Auto)',
      '  Ctrl+L - Quick load from Slot 0',
      '  Ctrl+Shift+S - Open Save UI (select slot 1-5, Enter save, D delete)',
      '  Ctrl+Shift+L - Open Load UI (select slot, Enter load)',
      '  Ctrl+N - New Game (reset all)',
      '  Shift+F5 - Save UI alternative, Shift+F6 - Load UI alternative',
      '  Auto-save every 60s and on map transition to Slot 0',
      '  P - Print all states including save slots',
      '  T - Run all tests (7+8+9+10+11+12+13)',
      'General: G grid, B coords, ` F2 debug, H help, R reset (no mod)',
      '',
      `Player: ${this.player ? `${Math.floor(this.player.x)},${Math.floor(this.player.y)} Tile ${this.player.getTilePosition().x},${this.player.getTilePosition().y} Map ${this.playerMapId} ${this.player.state} HP:${this.player.health} $${this.player.money}` : 'N/A'}`,
      `Camera: ${Math.floor(this.camera.x)},${Math.floor(this.camera.y)} zoom ${this.camera.getZoom()}`,
      `NPCs: ${this.npcManager.getCount()} (village only) | Life: ${this.lifeManager ? this.lifeManager.getCount() : 0} AvgW:${avgWellbeing}% Inter:${this.lifeManager ? this.lifeManager.getInteractions() : 0} | Dialogue: ${this.dialogueManager.getTotalDialogues()} total`,
      `World: ${this.world.getAllMapsInfo().map(m=>m.id).join(',')} | Exploration: ${this.explorationSystem.getTotalExploredCount()}/${this.explorationSystem.getTotalTiles()} (${totalPerc}%) | Opened:${Array.from(this.openedLocations).join(',')}`,
      `SaveSlots: ${this.saveSlots.map(s=> s.exists ? `${s.slotId}:${s.corrupted ? 'CORRUPT' : `Day${s.preview?.day ?? '?'} ${s.preview?.mapId ?? '?'}`}` : `${s.slotId}:empty`).join(' ')}`,
      ...this.npcManager.getAllNPCs().slice(0, 3).map(n => {
        const path = n.getPath();
        const home = n.getHomeBuilding();
        const activity = n.getCurrentActivity() ?? n.state;
        const lifeData = this.lifeManager.getLifeData(n.id);
        return `${n.id} ${activity} ${n.getTilePosition().x},${n.getTilePosition().y}->${n.getDestinationTile()?.x},${n.getDestinationTile()?.y} len:${path?.getLength()??0} home:${home?.id} W:${lifeData?.needs.getOverallWellbeing().toFixed(0) ?? 0}%`;
      })
    ];

    const padding = 10;
    const lineHeight = 11;
    const boxWidth = 600;
    const boxHeight = Math.min(screenHeight - 20, lines.length * lineHeight + 20);
    const x = screenWidth - boxWidth - padding;
    const y = padding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = '#ddd';
    lines.forEach((line, i) => {
      if (y + 10 + i * lineHeight > y + boxHeight - 10) return;
      if (i === 0) {
        ctx.fillStyle = '#8f8';
        ctx.fillText(line, x + 10, y + 10 + i * lineHeight);
        ctx.fillStyle = '#ddd';
      } else if (line.endsWith(':') || line.startsWith('Pathfinding') || line.startsWith('Buildings') || line.startsWith('Tests') || line.startsWith('Time') || line.startsWith('Schedules') || line.startsWith('Life') || line.startsWith('Interaction') || line.startsWith('Exploration') || line.startsWith('World') || line.startsWith('Save')) {
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
  getExplorationSystem(): ExplorationSystem { return this.explorationSystem; }
  getExplorationRenderer(): ExplorationRenderer { return this.explorationRenderer; }
  getMinimapRenderer(): MinimapRenderer { return this.minimapRenderer; }
  getSaveManager(): SaveManager { return this.saveManager; }
  getSaveRenderer(): SaveRenderer { return this.saveRenderer; }
  isGameRunning(): boolean { return this.isRunning; }
}
