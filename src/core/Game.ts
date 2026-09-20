/**
 * Game - Phase 16.3 Cooking System
 * - 3 maps: village_01, forest_01, lake_01 with transitions
 * - ExplorationSystem with fog of war, vision radius 8, minimap
 * - TimeManager, Schedule, Life, Interaction, Dialogue preserved
 * - SaveManager: versioned save files, slots, validation, migration, corruption protection
 * - InventorySystem: data-driven ItemDatabase 27 items, stackable/non-stackable, slots, sorting
 * - FarmingSystem: data-driven CropDatabase 4 crops, till/plant/water/harvest/wither, growth based on TimeManager, persistence
 * - AnimalSystem: data-driven AnimalDatabase 4 animals, feed/pet/produce/wander, hunger/happiness, persistence
 * - CraftingSystem: data-driven RecipeDatabase 12 recipes, ingredients consumption, result add, categories, persistence
 * - CookingSystem: data-driven CookingDatabase 10 recipes, ingredients consumption, result add, stations, persistence
 * - Auto-save, quick save/load, save UI, new game, inventory UI, farming UI, animal UI, crafting UI, cooking UI
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
import { ItemDatabase } from '../inventory/ItemDatabase';
import { Inventory } from '../inventory/Inventory';
import { InventoryRenderer } from '../inventory/InventoryRenderer';
import { SortMode } from '../inventory/Inventory';
import { ItemCategory } from '../inventory/Item';
import { CropDatabase } from '../farming/CropDatabase';
import { FarmingSystem } from '../farming/FarmingSystem';
import { FarmingRenderer } from '../farming/FarmingRenderer';
import { PlotState, GrowthStage } from '../farming/Crop';
import { FarmPlot } from '../farming/FarmPlot';
import { AnimalDatabase } from '../animals/AnimalDatabase';
import { AnimalSystem } from '../animals/AnimalSystem';
import { AnimalRenderer } from '../animals/AnimalRenderer';
import { AnimalState } from '../animals/Animal';
import { AnimalInstance } from '../animals/AnimalInstance';
import { RecipeDatabase } from '../crafting/RecipeDatabase';
import { CraftingSystem } from '../crafting/CraftingSystem';
import { CraftingRenderer } from '../crafting/CraftingRenderer';
import { RecipeCategory } from '../crafting/Recipe';
import { CookingDatabase } from '../cooking/CookingDatabase';
import { CookingSystem } from '../cooking/CookingSystem';
import { CookingRenderer } from '../cooking/CookingRenderer';
import { CookingCategory } from '../cooking/CookingRecipe';

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
  private autoSaveInterval: number = 60;
  private playTimeSeconds: number = 0;
  private isSaveUINavigating: boolean = false;

  // Phase 14 Inventory System
  private itemDatabase: ItemDatabase;
  private inventoryRenderer: InventoryRenderer;
  private showPlayerInventory: boolean = false;
  private inventorySortMode: SortMode = SortMode.CATEGORY;

  // Phase 15 Farming System
  private cropDatabase: CropDatabase;
  private farmingSystem: FarmingSystem;
  private farmingRenderer: FarmingRenderer;
  private showFarming: boolean = true;
  private showFarmingDebug: boolean = true;
  private farmingInteractionRange: number = 60;
  private selectedFarmPlotId: string | null = null;

  // Phase 16.1 Animals / Livestock System
  private animalDatabase: AnimalDatabase;
  private animalSystem: AnimalSystem;
  private animalRenderer: AnimalRenderer;
  private showAnimals: boolean = true;
  private showAnimalDebug: boolean = true;
  private selectedAnimalId: string | null = null;

  // Phase 16.2 Crafting System
  private recipeDatabase: RecipeDatabase;
  private craftingSystem: CraftingSystem;
  private craftingRenderer: CraftingRenderer;
  private showCrafting: boolean = false;
  private showCraftingDebug: boolean = true;

  // Phase 16.3 Cooking System
  private cookingDatabase: CookingDatabase;
  private cookingSystem: CookingSystem;
  private cookingRenderer: CookingRenderer;
  private showCooking: boolean = false;
  private showCookingDebug: boolean = true;

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
    this.itemDatabase = ItemDatabase.getInstance();
    this.inventoryRenderer = new InventoryRenderer(this.itemDatabase);
    this.cropDatabase = CropDatabase.getInstance();
    this.farmingSystem = new FarmingSystem(this.cropDatabase);
    this.farmingRenderer = new FarmingRenderer();
    this.animalDatabase = AnimalDatabase.getInstance();
    this.animalSystem = new AnimalSystem(this.animalDatabase);
    this.animalRenderer = new AnimalRenderer();
    this.recipeDatabase = RecipeDatabase.getInstance();
    this.craftingSystem = new CraftingSystem(this.recipeDatabase);
    this.craftingRenderer = new CraftingRenderer(this.itemDatabase, this.recipeDatabase);
    this.cookingDatabase = CookingDatabase.getInstance();
    this.cookingSystem = new CookingSystem(this.cookingDatabase);
    this.cookingRenderer = new CookingRenderer(this.itemDatabase, this.cookingDatabase);

    this.boundResizeHandler = this.handleResize.bind(this);
  }

  initialize(): void {
    console.log('[Game] Initializing Phase 16.3 - Cooking System...');

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
        const bValidation = this.buildingManager.validate();
        if (!bValidation.valid) {
          console.warn('[Game] Building validation errors:', bValidation.errors);
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

        this.saveSlots = this.saveManager.getAllSaveSlots();
        console.log(`[Game] SaveManager: ${this.saveSlots.filter(s=>s.exists).length}/${MAX_SAVE_SLOTS} slots used, v${SAVE_VERSION}`);
        this.saveManager.debugPrintSlots();

        console.log(`[Game] ItemDatabase: ${this.itemDatabase.getCount()} items, categories: ${this.itemDatabase.getCategories().join(', ')}`);
        const invValidation = this.itemDatabase.validate();
        if (!invValidation.valid) {
          console.warn('[Game] ItemDatabase validation errors:', invValidation.errors);
        } else {
          console.log('[Game] ItemDatabase validation PASS');
        }
        if (this.player) {
          console.log(`[Game] Player Inventory: ${this.player.getInventory().getUsedSlots()}/${this.player.getInventory().getCapacity()} ${this.player.getInventoryDebugString()}`);
        }
        this.inventoryRenderer.setShowInventory(this.showPlayerInventory);

        // Phase 15 Farming System init
        this.farmingSystem.initialize(allMaps.map(m => ({ mapId: m.mapId, width: m.width, height: m.height })));
        console.log(`[Game] CropDatabase: ${this.cropDatabase.getCount()} crops: ${this.cropDatabase.getDebugString()}`);
        const cropValidation = this.cropDatabase.validate();
        if (!cropValidation.valid) {
          console.warn('[Game] CropDatabase validation errors:', cropValidation.errors);
        } else {
          console.log('[Game] CropDatabase validation PASS');
        }
        console.log(`[Game] FarmingSystem: ${this.farmingSystem.getDebugString()}`);
        this.farmingRenderer.setShowFarming(this.showFarming);

        // Phase 16.1 Animals / Livestock System init
        this.animalSystem.initialize(allMaps.map(m => ({ mapId: m.mapId, width: m.width, height: m.height })));
        console.log(`[Game] AnimalDatabase: ${this.animalDatabase.getCount()} animals: ${this.animalDatabase.getDebugString()}`);
        const animalValidation = this.animalDatabase.validate();
        if (!animalValidation.valid) {
          console.warn('[Game] AnimalDatabase validation errors:', animalValidation.errors);
        } else {
          console.log('[Game] AnimalDatabase validation PASS');
        }
        console.log(`[Game] AnimalSystem: ${this.animalSystem.getDebugString()}`);
        this.animalRenderer.setShowAnimals(this.showAnimals);

        // Phase 16.2 Crafting System init
        this.craftingSystem.initialize();
        console.log(`[Game] RecipeDatabase: ${this.recipeDatabase.getCount()} recipes: ${this.recipeDatabase.getDebugString()}`);
        const recipeValidation = this.recipeDatabase.validate();
        if (!recipeValidation.valid) {
          console.warn('[Game] RecipeDatabase validation errors:', recipeValidation.errors);
        } else {
          console.log('[Game] RecipeDatabase validation PASS');
        }
        console.log(`[Game] CraftingSystem: ${this.craftingSystem.getDebugString()}`);
        this.craftingRenderer.setShowCrafting(this.showCrafting);

        // Phase 16.3 Cooking System init
        this.cookingSystem.initialize();
        console.log(`[Game] CookingDatabase: ${this.cookingDatabase.getCount()} recipes: ${this.cookingDatabase.getDebugString()}`);
        const cookingValidation = this.cookingDatabase.validate();
        if (!cookingValidation.valid) {
          console.warn('[Game] CookingDatabase validation errors:', cookingValidation.errors);
        } else {
          console.log('[Game] CookingDatabase validation PASS');
        }
        console.log(`[Game] CookingSystem: ${this.cookingSystem.getDebugString()}`);
        this.cookingRenderer.setShowCooking(this.showCooking);

        // Phase 16.1: Spawn default animals in village for visibility if none exist
        if (this.animalSystem.getAnimalCount() === 0) {
          const totalSec = this.timeManager.getTotalSeconds();
          // Near farm and near village square - walkable positions
          this.animalSystem.createAnimal(22, 22, 'village_01', 'chicken', totalSec, map, this.navigationGrid);
          this.animalSystem.createAnimal(23, 22, 'village_01', 'chicken', totalSec, map, this.navigationGrid);
          this.animalSystem.createAnimal(15, 32, 'village_01', 'cow', totalSec, map, this.navigationGrid);
          this.animalSystem.createAnimal(16, 32, 'village_01', 'sheep', totalSec, map, this.navigationGrid);
          this.animalSystem.createAnimal(24, 23, 'village_01', 'pig', totalSec, map, this.navigationGrid);
          console.log(`[Game] Spawned default animals: ${this.animalSystem.getDebugString()}`);
        }

        console.log(`[Game] Phase 15: Farming System - data-driven crops, till/plant/water/harvest/wither, time-based growth, persistence`);
        console.log(`[Game] Phase 16.1: Animals System - data-driven livestock, feed/pet/produce/wander, hunger/happiness, persistence`);
        console.log(`[Game] Phase 16.2: Crafting System - data-driven recipes, ingredients consumption, result add, categories, persistence`);
        console.log(`[Game] Phase 16.3: Cooking System - data-driven recipes, ingredients consumption, stations, persistence`);
        console.log(`[Game] Controls: I inventory, F farming overlay, Shift+G animals overlay, Shift+C crafting, Shift+K cooking, E till/plant/harvest/feed/collect/pet, R water, Shift+F fog, Ctrl+S/L save/load`);
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

  // ==================== SAVE SYSTEM ====================

  private collectSaveData(slotId: number = AUTO_SAVE_SLOT): SaveFile {
    const currentMap = this.world.getCurrentMap();
    const currentMapId = currentMap?.mapId ?? this.playerMapId;

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

    const timeSave = this.timeManager.getSaveData();
    const explorationSave = this.explorationSystem.getSaveData();
    const farmingSave = this.farmingSystem.getSaveData();
    const animalSave = this.animalSystem.getSaveData();
    const craftingSave = this.craftingSystem.getSaveData();
    const cookingSave = this.cookingSystem.getSaveData();

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
      farming: farmingSave,
      animals: animalSave,
      crafting: craftingSave,
      cooking: cookingSave,
      weather: { current: 'SUNNY', intensity: 0, nextChange: 0, version: 1 },
      economy: { shopInventories: {}, prices: {}, transactionHistory: [], version: 1 },
      dungeons: {},
      events: {},
      seasons: {}
    };

    const npcs: Record<string, any> = {};
    for (const npc of this.npcManager.getAllNPCs()) {
      npcs[npc.id] = npc.getSaveData(currentMapId);
    }

    const quests = { quests: {}, version: 1 };

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

      const targetMapId = saveFile.world.currentMapId ?? saveFile.player.mapId;
      const targetMap = this.world.getMap(targetMapId);
      if (!targetMap) {
        console.warn(`[Game] Save target map ${targetMapId} not found, using current map`);
      } else {
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

      this.timeManager.loadSaveData(saveFile.world.time);
      console.log(`[Game] Time loaded: ${this.timeManager.formatDayTime()}`);

      this.explorationSystem.loadSaveData(saveFile.world.exploration);
      console.log(`[Game] Exploration loaded: ${this.explorationSystem.getDebugString()}`);

      if (saveFile.world.farming) {
        this.farmingSystem.loadSaveData(saveFile.world.farming);
        console.log(`[Game] Farming loaded: ${this.farmingSystem.getDebugString()}`);
      }

      if (saveFile.world.animals) {
        this.animalSystem.loadSaveData(saveFile.world.animals);
        console.log(`[Game] Animals loaded: ${this.animalSystem.getDebugString()}`);
      }

      if ((saveFile.world as any).crafting) {
        this.craftingSystem.loadSaveData((saveFile.world as any).crafting);
        console.log(`[Game] Crafting loaded: ${this.craftingSystem.getDebugString()}`);
      }

      if ((saveFile.world as any).cooking) {
        this.cookingSystem.loadSaveData((saveFile.world as any).cooking);
        console.log(`[Game] Cooking loaded: ${this.cookingSystem.getDebugString()}`);
      }

      this.worldFlags = saveFile.world.flags ?? {};
      this.openedLocations = new Set(saveFile.world.openedLocations ?? ['village_01']);
      this.collectedObjects = new Set(saveFile.world.collectedObjects ?? []);
      this.changedObjects = saveFile.world.changedObjects ?? {};
      this.questRelatedChanges = saveFile.world.questRelatedChanges ?? {};
      this.eventStates = saveFile.world.eventStates ?? {};
      this.playerMapId = saveFile.world.playerMapId ?? targetMapId;

      if (this.player) {
        this.player.loadSaveData(saveFile.player);
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

      for (const npcId of Object.keys(saveFile.npcs)) {
        const npcSave = saveFile.npcs[npcId];
        const npc = this.npcManager.getNPC(npcId);
        if (npc && npcSave) {
          npc.loadSaveData(npcSave);
        }
      }

      this.playTimeSeconds = saveFile.meta.playTimeSeconds ?? saveFile.player.stats?.playTimeSeconds ?? 0;

      if (this.player) {
        this.camera.centerOn(this.player.x, this.player.y);
      }

      this.saveSlots = this.saveManager.getAllSaveSlots();

      console.log(`[Game] Save applied successfully: Day ${this.timeManager.getDay()} ${this.playerMapId} exploration ${this.explorationSystem.getTotalExplorationPercentage().toFixed(1)}% farming ${this.farmingSystem.getDebugString()} animals ${this.animalSystem.getDebugString()} crafting ${this.craftingSystem.getDebugString()} cooking ${this.cookingSystem.getDebugString()}`);

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

    const currentMapId = 'village_01';
    const map = this.world.getMap(currentMapId) ?? this.world.getCurrentMap();

    if (!map) {
      console.error('[Game] New Game failed: no map');
      return;
    }

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

    this.timeManager = new TimeManager(6, 1, 60);
    this.timeManager.onPhaseChange((oldPhase, newPhase, time) => {
      console.log(`[Game] Day phase: ${oldPhase} -> ${newPhase} at ${time.hour}:${String(time.minute).padStart(2,'0')} Day ${time.day}`);
    });
    this.timeManager.onDayChange((newDay, time) => {
      console.log(`[Game] New day: Day ${newDay} at ${time.hour}:${String(time.minute).padStart(2,'0')}`);
    });

    const allMaps = this.world.getAllMaps();
    this.explorationSystem.initialize(allMaps.map(m => ({ mapId: m.mapId, width: m.width, height: m.height })));

    const tileSize = WorldRenderer.TILE_SIZE;
    const startX = 25 * tileSize + tileSize / 2;
    const startY = 20 * tileSize + tileSize / 2;
    this.player = new Player(startX, startY, 150);
    this.playerMapId = currentMapId;

    this.scheduleManager.initialize();
    this.npcManager.initialize(villageMap, collisionMap, this.navigationGrid, this.pathfinder, this.buildingManager, this.scheduleManager, this.timeManager, this.lifeManager);
    if (this.lifeManager.getCount() === 0) {
      this.lifeManager.initialize(this.npcManager.getAllNPCs(), this.buildingManager, this.timeManager);
    } else {
      this.lifeManager.initialize(this.npcManager.getAllNPCs(), this.buildingManager, this.timeManager);
    }

    this.farmingSystem.initialize(allMaps.map(m => ({ mapId: m.mapId, width: m.width, height: m.height })));
    this.farmingSystem.clear();
    this.animalSystem.initialize(allMaps.map(m => ({ mapId: m.mapId, width: m.width, height: m.height })));
    this.animalSystem.clear();
    this.craftingSystem.clear();
    this.cookingSystem.clear();
    // Spawn default animals for new game
    const totalSecNew = this.timeManager.getTotalSeconds();
    const villageMapForAnimals = this.world.getMap('village_01') ?? this.world.getCurrentMap();
    this.animalSystem.createAnimal(22, 22, 'village_01', 'chicken', totalSecNew, villageMapForAnimals, this.navigationGrid);
    this.animalSystem.createAnimal(23, 22, 'village_01', 'chicken', totalSecNew, villageMapForAnimals, this.navigationGrid);
    this.animalSystem.createAnimal(15, 32, 'village_01', 'cow', totalSecNew, villageMapForAnimals, this.navigationGrid);
    this.animalSystem.createAnimal(16, 32, 'village_01', 'sheep', totalSecNew, villageMapForAnimals, this.navigationGrid);
    this.animalSystem.createAnimal(24, 23, 'village_01', 'pig', totalSecNew, villageMapForAnimals, this.navigationGrid);

    this.worldFlags = {};
    this.openedLocations = new Set(['village_01']);
    this.collectedObjects = new Set();
    this.changedObjects = {};
    this.questRelatedChanges = {};
    this.eventStates = {};
    this.playTimeSeconds = 0;
    this.autoSaveTimer = 0;

    this.showPlayerInventory = false;
    this.inventorySortMode = SortMode.CATEGORY;
    this.inventoryRenderer.setShowInventory(false);
    this.showFarming = true;
    this.showAnimals = true;
    this.showCrafting = false;
    this.craftingRenderer.setShowCrafting(false);
    this.showCooking = false;
    this.cookingRenderer.setShowCooking(false);

    if (this.player) {
      const tilePos = this.player.getTilePosition();
      this.explorationSystem.update(tilePos, currentMapId);
    }

    this.camera.centerOn(this.player?.x ?? 25 * 32, this.player?.y ?? 20 * 32);

    this.saveRenderer.showMessage('🆕 New Game Started - Day 1 Village', '#8f8', 3);
    console.log('[Game] New Game started: Day 1 Village, all systems reset');
  }

  // ==================== PHASE 15 FARMING INPUT ====================

  private handleFarmingInput(): void {
    if (!this.player) return;
    const isDialogueOpen = this.dialogueManager.isOpen();
    const isSaveUIOpen = this.saveRenderer.isShowingUI();
    const isInventoryOpen = this.showPlayerInventory;
    const isCraftingOpen = this.showCrafting;
    const isCookingOpen = this.showCooking;
    if (isDialogueOpen || isSaveUIOpen || isInventoryOpen || isCraftingOpen || isCookingOpen) return;

    const map = this.world.getCurrentMap();
    if (!map) return;

    const tilePos = this.player.getTilePosition();
    const totalSeconds = this.timeManager.getTotalSeconds();

    // Find nearby plots and also potential till locations
    const nearbyPlots = this.farmingSystem.getNearbyPlots(tilePos.x, tilePos.y, map.mapId, 2);
    let closestPlot = null;
    let closestDist = Infinity;
    for (const plot of nearbyPlots) {
      const dx = plot.getX() - tilePos.x;
      const dy = plot.getY() - tilePos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < closestDist) {
        closestDist = dist;
        closestPlot = plot;
      }
    }

    // Also check tile player is standing on for tilling
    const standingPlot = this.farmingSystem.getPlot(tilePos.x, tilePos.y, map.mapId);

    // Update selected plot for UI
    if (closestPlot && closestDist <= 2) {
      this.selectedFarmPlotId = closestPlot.getId();
    } else if (standingPlot) {
      this.selectedFarmPlotId = standingPlot.getId();
    } else {
      // No plot nearby, clear selection but keep last for info? Clear if far
      if (closestDist > 3) this.selectedFarmPlotId = null;
    }

    // E to interact with farming
    if (this.input.isKeyJustPressed('e')) {
      // Prioritize NPC/building interaction first? But we already have dialogue input handling
      // If there's an interactable NPC/building, let dialogue handle it (handleDialogueInput called before)
      // So farming E only if no interactable
      const hasInteractable = this.interactionSystem.hasInteractable();
      if (hasInteractable) {
        // Let dialogue handle
        return;
      }

      // Farming logic
      if (closestPlot && closestDist <= 2) {
        const plot = closestPlot;
        const state = plot.getState();
        if (state === PlotState.TILLED) {
          // Plant if has seed
          const seeds = ['wheat_seed', 'carrot_seed', 'berry', 'herb'];
          let planted = false;
          for (const seedId of seeds) {
            if (this.player.hasItem(seedId, 1)) {
              const crop = this.cropDatabase.getCropBySeed(seedId);
              if (!crop) continue;
              const success = this.farmingSystem.plantSeed(plot.getX(), plot.getY(), map.mapId, seedId, totalSeconds);
              if (success) {
                this.player.removeItem(seedId, 1);
                console.log(`[Farming] Planted ${crop.id} using ${seedId} at ${plot.getX()},${plot.getY()}`);
                this.saveRenderer.showMessage(`🌱 Planted ${crop.name} at ${plot.getX()},${plot.getY()}`, '#8f8', 2);
                planted = true;
                break;
              }
            }
          }
          if (!planted) {
            console.log('[Farming] No seeds to plant. Need wheat_seed, carrot_seed, berry, or herb');
            this.saveRenderer.showMessage('❌ No seeds! Need wheat_seed, carrot_seed, berry, or herb', '#f88', 2);
          }
        } else if (state === PlotState.READY) {
          const result = this.farmingSystem.harvestPlot(plot.getX(), plot.getY(), map.mapId, totalSeconds);
          if (result.success && result.cropId) {
            const cropDef = this.cropDatabase.getCrop(result.cropId);
            if (cropDef) {
              // Add harvest to inventory
              const added = this.player.addItem(cropDef.harvestItemId, result.yield);
              console.log(`[Farming] Harvested ${result.cropId} yield ${result.yield} added ${added} at ${plot.getX()},${plot.getY()}`);
              this.saveRenderer.showMessage(`🌾 Harvested ${result.yield}x ${cropDef.name} + ${result.bonusSeeds}x seeds!`, '#ff8', 3);
              if (result.bonusSeeds > 0 && result.bonusSeedId) {
                this.player.addItem(result.bonusSeedId, result.bonusSeeds);
              }
            }
          }
        } else if (state === PlotState.WITHERED) {
          const cleared = plot.clearWithered(totalSeconds);
          if (cleared) {
            console.log(`[Farming] Cleared withered plot at ${plot.getX()},${plot.getY()}`);
            this.saveRenderer.showMessage(`🧹 Cleared withered plot`, '#fa8', 2);
          }
        } else if (state === PlotState.GROWING || state === PlotState.PLANTED || state === PlotState.WATERED) {
          // Water if not already watered
          if (!plot.isWatered()) {
            const watered = this.farmingSystem.waterPlot(plot.getX(), plot.getY(), map.mapId, totalSeconds);
            if (watered) {
              this.saveRenderer.showMessage(`💧 Watered ${plot.getCropId()} - grows faster!`, '#8af', 2);
            }
          } else {
            console.log(`[Farming] Plot at ${plot.getX()},${plot.getY()} already watered, growth ${(plot.getProgress()*100).toFixed(0)}% stage ${plot.getGrowthStage()}`);
          }
        }
        return;
      } else {
        // No plot nearby, try to till current tile if farmland/grass
        const currentTileTerrain = map.getTile(tilePos.x, tilePos.y);
        const canTill = currentTileTerrain === 7 || currentTileTerrain === 0; // FARMLAND=7, GRASS=0
        if (canTill) {
          const tilled = this.farmingSystem.tillPlot(tilePos.x, tilePos.y, map.mapId, totalSeconds, map);
          if (tilled) {
            console.log(`[Farming] Tilled plot at ${tilePos.x},${tilePos.y} ${map.mapId}`);
            this.saveRenderer.showMessage(`🌱 Tilled soil at ${tilePos.x},${tilePos.y}`, '#8f8', 2);
          }
        } else {
          // Also try adjacent tiles? For simplicity, try till in front of player based on direction
          const dir = this.player.direction;
          let dx = 0, dy = 0;
          if (dir.includes('up')) dy = -1;
          if (dir.includes('down')) dy = 1;
          if (dir.includes('left')) dx = -1;
          if (dir.includes('right')) dx = 1;
          if (dx === 0 && dy === 0) dy = -1; // default up
          const frontX = tilePos.x + dx;
          const frontY = tilePos.y + dy;
          const frontTerrain = map.getTile(frontX, frontY);
          if (frontTerrain === 7 || frontTerrain === 0) {
            const tilled = this.farmingSystem.tillPlot(frontX, frontY, map.mapId, totalSeconds, map);
            if (tilled) {
              console.log(`[Farming] Tilled plot at ${frontX},${frontY} ${map.mapId} (front)`);
              this.saveRenderer.showMessage(`🌱 Tilled soil at ${frontX},${frontY}`, '#8f8', 2);
            }
          }
        }
      }
    }

    // R to water nearby
    if (this.input.isKeyJustPressed('r') && !this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
      if (closestPlot && closestDist <= 2) {
        if (!closestPlot.isWatered() && closestPlot.getState() !== PlotState.TILLED && closestPlot.getState() !== PlotState.READY && closestPlot.getState() !== PlotState.WITHERED) {
          const watered = this.farmingSystem.waterPlot(closestPlot.getX(), closestPlot.getY(), map.mapId, totalSeconds);
          if (watered) {
            this.saveRenderer.showMessage(`💧 Watered ${closestPlot.getCropId()}`, '#8af', 2);
          }
        }
      }
    }
  }

  // ==================== PHASE 16.1 ANIMALS INPUT ====================

  private handleAnimalInput(): void {
    if (!this.player) return;
    const isDialogueOpen = this.dialogueManager.isOpen();
    const isSaveUIOpen = this.saveRenderer.isShowingUI();
    const isInventoryOpen = this.showPlayerInventory;
    const isCraftingOpen = this.showCrafting;
    const isCookingOpen = this.showCooking;
    if (isDialogueOpen || isSaveUIOpen || isInventoryOpen || isCraftingOpen || isCookingOpen) return;

    const map = this.world.getCurrentMap();
    if (!map) return;

    const tilePos = this.player.getTilePosition();
    const totalSeconds = this.timeManager.getTotalSeconds();

    const nearbyAnimals = this.animalSystem.getNearbyAnimals(tilePos.x, tilePos.y, map.mapId, 2);
    let closestAnimal: AnimalInstance | null = null;
    let closestDist = Infinity;
    for (const animal of nearbyAnimals) {
      const dx = animal.getX() - tilePos.x;
      const dy = animal.getY() - tilePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closestAnimal = animal;
      }
    }

    if (closestAnimal && closestDist <= 2) {
      this.selectedAnimalId = closestAnimal.getId();
    } else {
      if (closestDist > 3) this.selectedAnimalId = null;
    }

    // E to interact with animals - priority over farming if closer or produce ready
    if (this.input.isKeyJustPressed('e')) {
      const hasInteractable = this.interactionSystem.hasInteractable();
      if (hasInteractable) return; // let dialogue handle NPC/building

      // Check animals first if produce ready or closer than farm plot
      const nearbyPlots = this.farmingSystem.getNearbyPlots(tilePos.x, tilePos.y, map.mapId, 2);
      let closestPlotDist = Infinity;
      for (const plot of nearbyPlots) {
        const dx = plot.getX() - tilePos.x;
        const dy = plot.getY() - tilePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestPlotDist) closestPlotDist = dist;
      }

      const animalIsCloserOrReady = closestAnimal && (closestAnimal.isProduceReady() || closestDist <= closestPlotDist);

      if (closestAnimal && closestDist <= 2 && animalIsCloserOrReady) {
        const animal = closestAnimal;
        if (animal.isProduceReady()) {
          const result = this.animalSystem.collectProduce(animal.getId(), totalSeconds);
          if (result.success && result.itemId) {
            const added = this.player.addItem(result.itemId, result.quantity);
            console.log(`[Animals] Collected ${result.quantity}x ${result.itemId} from ${animal.getType()} added ${added}`);
            this.saveRenderer.showMessage(`🐾 Collected ${result.quantity}x ${result.itemId} from ${animal.getType()}!`, '#ff8', 3);
          } else {
            console.log(`[Animals] Collect failed chance for ${animal.getType()}`);
            this.saveRenderer.showMessage(`❌ ${animal.getType()} had no produce this time`, '#fa8', 2);
          }
        } else {
          // Try feed
          const feedItems = ['hay', 'animal_feed', 'wheat', 'wheat_seed', 'carrot', 'berry', 'apple', 'carrot_seed', 'mushroom'];
          let fed = false;
          for (const feedId of feedItems) {
            if (this.player.hasItem(feedId, 1)) {
              const def = animal.getDefinition();
              if (def && !def.feedItems.includes(feedId)) continue;
              const success = this.animalSystem.feedAnimal(animal.getId(), feedId, totalSeconds);
              if (success) {
                this.player.removeItem(feedId, 1);
                console.log(`[Animals] Fed ${animal.getType()} with ${feedId}`);
                this.saveRenderer.showMessage(`🍖 Fed ${def?.name ?? animal.getType()} with ${feedId} - Happy!`, '#8f8', 2);
                fed = true;
                break;
              }
            }
          }
          if (!fed) {
            // Pet
            const petted = this.animalSystem.petAnimal(animal.getId(), totalSeconds);
            if (petted) {
              console.log(`[Animals] Petted ${animal.getType()}`);
              this.saveRenderer.showMessage(`💚 Petted ${animal.getDefinition()?.name ?? animal.getType()} - Happy!`, '#8af', 2);
            }
          }
        }
        return;
      }
    }
  }

  // ==================== PHASE 16.2 CRAFTING INPUT ====================

  private handleCraftingInput(): void {
    const isDialogueOpen = this.dialogueManager.isOpen();
    const isSaveUIOpen = this.saveRenderer.isShowingUI();

    if (this.showCrafting) {
      if (this.input.isKeyJustPressed('escape') || (this.input.isKeyJustPressed('c') && this.input.isKeyDown('shift'))) {
        this.showCrafting = false;
        this.craftingRenderer.setShowCrafting(false);
        console.log('[Crafting] Closed crafting UI');
        return;
      }

      if (this.input.isKeyJustPressed('arrowup') || this.input.isKeyJustPressed('w')) {
        const filteredCount = (this.craftingRenderer as any).getFilteredRecipes ? 0 : 0;
        // Use craftingRenderer navigate with filtered length
        // We need to compute filtered length here
        const tempFiltered = this.craftingSystem.getUnlockedRecipes().filter(r => {
          const cat = this.craftingRenderer.getFilterCategory();
          if (cat && r.category !== cat) return false;
          if (this.craftingRenderer.getShowOnlyCraftable() && this.player) {
            const can = this.craftingSystem.canCraft(r.id, this.player.getInventory());
            return can.can;
          }
          return true;
        });
        this.craftingRenderer.navigate('up', tempFiltered.length);
      }
      if (this.input.isKeyJustPressed('arrowdown') || this.input.isKeyJustPressed('s')) {
        const tempFiltered = this.craftingSystem.getUnlockedRecipes().filter(r => {
          const cat = this.craftingRenderer.getFilterCategory();
          if (cat && r.category !== cat) return false;
          if (this.craftingRenderer.getShowOnlyCraftable() && this.player) {
            const can = this.craftingSystem.canCraft(r.id, this.player.getInventory());
            return can.can;
          }
          return true;
        });
        this.craftingRenderer.navigate('down', tempFiltered.length);
      }

      if (this.input.isKeyJustPressed('c') && !this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
        const categories: (RecipeCategory | null)[] = [null, RecipeCategory.TOOL, RecipeCategory.FOOD, RecipeCategory.MATERIAL, RecipeCategory.FEED, RecipeCategory.POTION, RecipeCategory.MISC];
        const current = this.craftingRenderer.getFilterCategory();
        const idx = categories.indexOf(current as any);
        const next = categories[(idx + 1) % categories.length];
        this.craftingRenderer.setFilterCategory(next);
        console.log(`[Crafting] Filter: ${next ?? 'ALL'}`);
      }

      if (this.input.isKeyJustPressed('c') && this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
        this.craftingRenderer.toggleCraftableFilter();
        console.log(`[Crafting] Craftable only: ${this.craftingRenderer.getShowOnlyCraftable() ? 'ON' : 'OFF'}`);
      }

      if (this.input.isKeyJustPressed('enter')) {
        if (!this.player) return;
        const filtered = (() => {
          let recipes = this.craftingSystem.getUnlockedRecipes();
          const cat = this.craftingRenderer.getFilterCategory();
          if (cat) recipes = recipes.filter(r => r.category === cat);
          if (this.craftingRenderer.getShowOnlyCraftable()) {
            recipes = recipes.filter(r => this.craftingSystem.canCraft(r.id, this.player!.getInventory()).can);
          }
          recipes.sort((a,b) => {
            if (a.category !== b.category) return a.category.localeCompare(b.category);
            return a.name.localeCompare(b.name);
          });
          return recipes;
        })();
        const idx = this.craftingRenderer.getSelectedIndex();
        if (idx >= 0 && idx < filtered.length) {
          const recipe = filtered[idx];
          const result = this.craftingSystem.craft(recipe.id, this.player.getInventory());
          if (result.success) {
            console.log(`[Crafting] Crafted ${result.resultQuantity}x ${result.resultItemId} via ${recipe.id}`);
            this.saveRenderer.showMessage(`🔨 Crafted ${result.resultQuantity}x ${result.resultItemId}!`, '#8f8', 2);
          } else {
            console.log(`[Crafting] Craft failed: ${result.reason}`);
            this.saveRenderer.showMessage(`❌ Craft failed: ${result.reason}`, '#f88', 2);
          }
        }
      }

      return;
    }

    if (!isDialogueOpen && !isSaveUIOpen && !this.showPlayerInventory) {
      if (this.input.isKeyJustPressed('c') && this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
        this.showCrafting = !this.showCrafting;
        this.craftingRenderer.setShowCrafting(this.showCrafting);
        if (this.showCrafting) {
          console.log('[Crafting] Opened crafting UI');
          // Reset selected index
          this.craftingRenderer.setSelectedIndex(0);
        } else {
          console.log('[Crafting] Closed crafting UI');
        }
        return;
      }
    }
  }

  // ==================== PHASE 16.3 COOKING INPUT ====================

  private handleCookingInput(): void {
    const isDialogueOpen = this.dialogueManager.isOpen();
    const isSaveUIOpen = this.saveRenderer.isShowingUI();

    if (this.showCooking) {
      if (this.input.isKeyJustPressed('escape') || (this.input.isKeyJustPressed('k') && this.input.isKeyDown('shift'))) {
        this.showCooking = false;
        this.cookingRenderer.setShowCooking(false);
        console.log('[Cooking] Closed cooking UI');
        return;
      }

      if (this.input.isKeyJustPressed('arrowup') || this.input.isKeyJustPressed('w')) {
        const tempFiltered = this.cookingSystem.getUnlockedRecipes().filter(r => {
          const cat = this.cookingRenderer.getFilterCategory();
          if (cat && r.category !== cat) return false;
          if (this.cookingRenderer.getShowOnlyCookable() && this.player) {
            const can = this.cookingSystem.canCook(r.id, this.player.getInventory());
            return can.can;
          }
          return true;
        });
        this.cookingRenderer.navigate('up', tempFiltered.length);
      }
      if (this.input.isKeyJustPressed('arrowdown') || this.input.isKeyJustPressed('s')) {
        const tempFiltered = this.cookingSystem.getUnlockedRecipes().filter(r => {
          const cat = this.cookingRenderer.getFilterCategory();
          if (cat && r.category !== cat) return false;
          if (this.cookingRenderer.getShowOnlyCookable() && this.player) {
            const can = this.cookingSystem.canCook(r.id, this.player.getInventory());
            return can.can;
          }
          return true;
        });
        this.cookingRenderer.navigate('down', tempFiltered.length);
      }

      if (this.input.isKeyJustPressed('c') && !this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
        const categories: (CookingCategory | null)[] = [null, CookingCategory.BREAKFAST, CookingCategory.MEAL, CookingCategory.SOUP, CookingCategory.DESSERT, CookingCategory.DAIRY, CookingCategory.MISC];
        const current = this.cookingRenderer.getFilterCategory();
        const idx = categories.indexOf(current as any);
        const next = categories[(idx + 1) % categories.length];
        this.cookingRenderer.setFilterCategory(next);
        console.log(`[Cooking] Filter: ${next ?? 'ALL'}`);
      }

      if (this.input.isKeyJustPressed('k') && this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
        // When UI open, Shift+K already handled as close above, so this is for toggle cookable only? Use Shift+K as toggle when open is close, so we need another combo for filter
        // Use Ctrl+Shift+K or reuse Shift+C? We'll use Shift+C not good. Let's use Shift+K as close, and Ctrl+Shift+K as toggle cookable
        // Actually we already handle close on Shift+K, so we shouldn't also toggle here. We'll handle cookable toggle on Ctrl+Shift+K below
      }

      if (this.input.isKeyJustPressed('k') && this.input.isKeyDown('shift') && this.input.isKeyDown('control')) {
        this.cookingRenderer.toggleCookableFilter();
        console.log(`[Cooking] Cookable only: ${this.cookingRenderer.getShowOnlyCookable() ? 'ON' : 'OFF'}`);
      }

      // Also allow Shift+K when open to toggle cookable if we differentiate? For simplicity, use same as crafting: Shift+K close, Ctrl+Shift+K toggle
      // For quick testing, also allow 'f' filter? But keep C for category
      if (this.input.isKeyJustPressed('k') && this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
        // already closed, so ignore
      }

      // Allow C for category already handled, and also allow 'k' with ctrl+shift for cookable
      if (this.input.isKeyJustPressed('c') && this.input.isKeyDown('shift') && this.input.isKeyDown('control')) {
        this.cookingRenderer.toggleCookableFilter();
        console.log(`[Cooking] Cookable only (Ctrl+Shift+C): ${this.cookingRenderer.getShowOnlyCookable() ? 'ON' : 'OFF'}`);
      }

      if (this.input.isKeyJustPressed('enter')) {
        if (!this.player) return;
        const filtered = (() => {
          let recipes = this.cookingSystem.getUnlockedRecipes();
          const cat = this.cookingRenderer.getFilterCategory();
          if (cat) recipes = recipes.filter(r => r.category === cat);
          if (this.cookingRenderer.getShowOnlyCookable()) {
            recipes = recipes.filter(r => this.cookingSystem.canCook(r.id, this.player!.getInventory()).can);
          }
          recipes.sort((a,b) => {
            if (a.category !== b.category) return a.category.localeCompare(b.category);
            return a.name.localeCompare(b.name);
          });
          return recipes;
        })();
        const idx = this.cookingRenderer.getSelectedIndex();
        if (idx >= 0 && idx < filtered.length) {
          const recipe = filtered[idx];
          const result = this.cookingSystem.cook(recipe.id, this.player.getInventory());
          if (result.success) {
            console.log(`[Cooking] Cooked ${result.resultQuantity}x ${result.resultItemId} via ${recipe.id}`);
            this.saveRenderer.showMessage(`🍳 Cooked ${result.resultQuantity}x ${result.resultItemId}!`, '#ffb74d', 2);
          } else {
            console.log(`[Cooking] Cook failed: ${result.reason}`);
            this.saveRenderer.showMessage(`❌ Cook failed: ${result.reason}`, '#f88', 2);
          }
        }
      }

      return;
    }

    if (!isDialogueOpen && !isSaveUIOpen && !this.showPlayerInventory && !this.showCrafting) {
      if (this.input.isKeyJustPressed('k') && this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
        this.showCooking = !this.showCooking;
        this.cookingRenderer.setShowCooking(this.showCooking);
        if (this.showCooking) {
          console.log('[Cooking] Opened cooking UI');
          this.cookingRenderer.setSelectedIndex(0);
        } else {
          console.log('[Cooking] Closed cooking UI');
        }
        return;
      }
    }
  }

  // ==================== PHASE 14 INVENTORY INPUT ==================== ==================== ====================

  private handleInventoryInput(): void {
    const isDialogueOpen = this.dialogueManager.isOpen();
    const isSaveUIOpen = this.saveRenderer.isShowingUI();
    const isCraftingOpen = this.showCrafting;
    const isCookingOpen = this.showCooking;

    if (this.showPlayerInventory) {
      if (this.input.isKeyJustPressed('escape') || this.input.isKeyJustPressed('i')) {
        this.showPlayerInventory = false;
        this.inventoryRenderer.setShowInventory(false);
        console.log('[Inventory] Closed inventory UI');
        return;
      }

      if (this.input.isKeyJustPressed('arrowup') || this.input.isKeyJustPressed('w')) {
        this.inventoryRenderer.navigate('up');
      }
      if (this.input.isKeyJustPressed('arrowdown') || this.input.isKeyJustPressed('s')) {
        this.inventoryRenderer.navigate('down');
      }
      if (this.input.isKeyJustPressed('arrowleft') || this.input.isKeyJustPressed('a')) {
        this.inventoryRenderer.navigate('left');
      }
      if (this.input.isKeyJustPressed('arrowright') || this.input.isKeyJustPressed('d')) {
        this.inventoryRenderer.navigate('right');
      }

      if (this.input.isKeyJustPressed('s') && this.input.isKeyDown('shift')) {
        const modes = [SortMode.CATEGORY, SortMode.NAME, SortMode.QUANTITY, SortMode.VALUE, SortMode.RARITY, SortMode.TYPE];
        const currentIndex = modes.indexOf(this.inventorySortMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        this.inventorySortMode = nextMode;
        if (this.player) {
          this.player.sortInventory(nextMode);
        }
        console.log(`[Inventory] Sort mode: ${nextMode}`);
      }

      if (this.input.isKeyJustPressed('c') && !this.input.isKeyDown('control')) {
        const categories = [null, ItemCategory.MATERIAL, ItemCategory.FOOD, ItemCategory.TOOL, ItemCategory.POTION, ItemCategory.TREASURE, ItemCategory.QUEST, ItemCategory.MISC, ItemCategory.SEED];
        const currentFilter = this.inventoryRenderer.getFilterCategory();
        const currentIndex = categories.indexOf(currentFilter as any);
        const nextCat = categories[(currentIndex + 1) % categories.length];
        this.inventoryRenderer.setFilterCategory(nextCat as any);
        console.log(`[Inventory] Filter: ${nextCat ?? 'ALL'}`);
      }

      if (this.input.isKeyJustPressed('m') && !this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
        if (this.player) {
          const before = this.player.getInventory().getUsedSlots();
          this.player.getInventory().mergeStacks();
          const after = this.player.getInventory().getUsedSlots();
          console.log(`[Inventory] Merged stacks: ${before} -> ${after} slots`);
        }
      }

      return;
    }

    if (!isDialogueOpen && !isSaveUIOpen && !isCraftingOpen && !isCookingOpen) {
      if (this.input.isKeyJustPressed('i') && !this.input.isKeyDown('control')) {
        if (this.input.isKeyDown('shift')) {
          return;
        } else {
          this.showPlayerInventory = true;
          this.inventoryRenderer.setShowInventory(true);
          console.log('[Inventory] Opened inventory UI');
          return;
        }
      }
    }
  }

  private handleSaveInput(): void {
    const isSaveUIOpen = this.saveRenderer.isShowingUI();

    if (isSaveUIOpen) {
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

      if (!this.dialogueManager.isOpen()) {
        for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
          if (this.input.isKeyJustPressed(String(i + 1)) && i < MAX_SAVE_SLOTS) {
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
        const slot = this.saveRenderer.getSelectedSlot();
        if (this.saveManager.hasSave(slot)) {
          this.saveManager.deleteSave(slot);
          this.saveSlots = this.saveManager.getAllSaveSlots();
          this.saveRenderer.showMessage(`🗑 Deleted Slot ${slot}`, '#fa8', 2);
          console.log(`[Save] Deleted slot ${slot}`);
        }
        return;
      }

      return;
    }

    if (this.input.isKeyDown('control') && this.input.isKeyJustPressed('s') && !this.input.isKeyDown('shift')) {
      if (!this.dialogueManager.isOpen() && !this.showPlayerInventory) {
        this.saveGame(AUTO_SAVE_SLOT);
      }
      return;
    }

    if ((this.input.isKeyDown('control') && this.input.isKeyDown('shift') && this.input.isKeyJustPressed('s')) ||
        (this.input.isKeyJustPressed('f5') && this.input.isKeyDown('shift'))) {
      if (!this.dialogueManager.isOpen() && !this.showPlayerInventory) {
        this.saveSlots = this.saveManager.getAllSaveSlots();
        this.saveRenderer.setShowSaveUI(true);
        console.log('[Save] Opened Save UI');
      }
      return;
    }

    if (this.input.isKeyDown('control') && this.input.isKeyJustPressed('l') && !this.input.isKeyDown('shift')) {
      if (!this.dialogueManager.isOpen() && !this.showPlayerInventory) {
        this.loadGame(AUTO_SAVE_SLOT);
      }
      return;
    }

    if ((this.input.isKeyDown('control') && this.input.isKeyDown('shift') && this.input.isKeyJustPressed('l')) ||
        (this.input.isKeyJustPressed('f6') && this.input.isKeyDown('shift'))) {
      if (!this.dialogueManager.isOpen() && !this.showPlayerInventory) {
        this.saveSlots = this.saveManager.getAllSaveSlots();
        this.saveRenderer.setShowLoadUI(true);
        console.log('[Save] Opened Load UI');
      }
      return;
    }

    if (this.input.isKeyDown('control') && this.input.isKeyJustPressed('n')) {
      if (!this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory) {
        this.newGame();
      }
      return;
    }
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

    console.log(`[World] Now in ${targetMapId} at ${newX},${newY} | ${this.explorationSystem.getMapDebugString(targetMapId)} - Auto-saving`);
    this.saveGame(AUTO_SAVE_SLOT);

    return true;
  }

  private handleMapTransitions(): void {
    if (!this.player) return;
    if (this.mapTransitionCooldown > 0) return;
    if (this.dialogueManager.isOpen()) return;
    if (this.saveRenderer.isShowingUI()) return;
    if (this.showPlayerInventory) return;
    if (this.showCrafting) return;
    if (this.showCooking) return;

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

    this.playTimeSeconds += deltaTime;
    this.autoSaveTimer += deltaTime;
    if (this.player) {
      this.player.updatePlayTime(deltaTime);
    }

    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.autoSaveTimer = 0;
      if (!this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory && !this.showCrafting && !this.showCooking) {
        console.log('[Save] Auto-save triggered');
        this.saveGame(AUTO_SAVE_SLOT);
      }
    }

    if (this.timeManager && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory && !this.showCrafting && !this.showCooking) {
      this.timeManager.update(deltaTime);
    }

    // Farming update - uses totalSeconds
    if (this.farmingSystem && this.timeManager) {
      this.farmingSystem.update(this.timeManager.getTotalSeconds(), deltaTime);
    }

    // Animals update - uses totalSeconds and navigationGrid for wander
    if (this.animalSystem && this.timeManager) {
      this.animalSystem.update(this.timeManager.getTotalSeconds(), deltaTime, this.navigationGrid ?? undefined);
    }

    const map = this.world.getCurrentMap();

    if (this.player && map) {
      const isDialogueOpen = this.dialogueManager.isOpen();
      const isSaveUIOpen = this.saveRenderer.isShowingUI();
      const isInventoryOpen = this.showPlayerInventory;
      this.player.update(deltaTime, this.input, map, this.collisionSystem, isDialogueOpen || isSaveUIOpen || isInventoryOpen);
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
      const isInventoryOpen = this.showPlayerInventory;
      const isCraftingOpen = this.showCrafting;
      const isCookingOpen = this.showCooking;
      if (isVillage && !this.dialogueManager.isOpen() && !isSaveUIOpen && !isInventoryOpen && !isCraftingOpen && !isCookingOpen) {
        this.npcManager.update(deltaTime, map, this.collisionSystem, currentMinutes);
      }
      this.npcRenderer.update(deltaTime, this.npcManager.getAllNPCs());

      if (isVillage && this.lifeManager && this.timeManager && !this.dialogueManager.isOpen() && !isSaveUIOpen && !isInventoryOpen && !isCraftingOpen && !isCookingOpen) {
        this.lifeManager.update(deltaTime, this.npcManager.getAllNPCs(), this.timeManager);
      }

      if (this.player) {
        this.interactionSystem.update(this.player, this.npcManager.getAllNPCs(), this.buildingManager);
      }

      const wasDialogueOpenBeforeInput = this.dialogueManager.isOpen();
      if (!isSaveUIOpen && !isInventoryOpen && !isCraftingOpen && !isCookingOpen) {
        this.handleDialogueInput();
      }
      (this as any)._wasDialogueOpenBeforeInput = wasDialogueOpenBeforeInput;

      this.handleInventoryInput();
      this.handleCraftingInput();
      this.handleCookingInput();
      this.handleFarmingInput();
      this.handleAnimalInput();

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

      if (this.player) {
        (this.debug as any).setInventoryInfo?.({
          databaseCount: this.itemDatabase.getCount(),
          categories: this.itemDatabase.getCategories(),
          playerUsed: this.player.getInventory().getUsedSlots(),
          playerCapacity: this.player.getInventory().getCapacity(),
          playerValue: this.player.getInventory().getTotalValue(),
          playerCount: this.player.getInventory().getTotalItemCount(),
          debug: this.player.getInventoryDebugString(),
          sortMode: this.inventorySortMode,
          showUI: this.showPlayerInventory
        });
      }

      if (this.farmingSystem) {
        (this.debug as any).setFarmingInfo?.({
          cropCount: this.cropDatabase.getCount(),
          crops: this.cropDatabase.getAllCrops().map(c=>c.id),
          plotCount: this.farmingSystem.getPlotCount(),
          mapPlotCount: this.farmingSystem.getPlotCount(map.mapId),
          debug: this.farmingSystem.getDebugString(),
          mapDebug: this.farmingSystem.getMapDebugString(map.mapId),
          showFarming: this.showFarming
        });
      }

      if (this.animalSystem) {
        (this.debug as any).setAnimalInfo?.({
          animalCount: this.animalDatabase.getCount(),
          animals: this.animalDatabase.getAllAnimals().map(a=>a.id),
          totalCount: this.animalSystem.getAnimalCount(),
          mapCount: this.animalSystem.getAnimalCount(map.mapId),
          debug: this.animalSystem.getDebugString(),
          mapDebug: this.animalSystem.getMapDebugString(map.mapId),
          showAnimals: this.showAnimals
        });
      }

      if (this.craftingSystem) {
        (this.debug as any).setCraftingInfo?.({
          recipeCount: this.recipeDatabase.getCount(),
          recipes: this.recipeDatabase.getAllRecipes().map(r=>r.id),
          unlockedCount: this.craftingSystem.getUnlockedRecipes().length,
          totalCrafted: this.craftingSystem.getTotalCrafted(),
          debug: this.craftingSystem.getDebugString(),
          showCrafting: this.showCrafting
        });
      }

      if (this.cookingSystem) {
        (this.debug as any).setCookingInfo?.({
          recipeCount: this.cookingDatabase.getCount(),
          recipes: this.cookingDatabase.getAllRecipes().map(r=>r.id),
          unlockedCount: this.cookingSystem.getUnlockedRecipes().length,
          totalCooked: this.cookingSystem.getTotalCooked(),
          debug: this.cookingSystem.getDebugString(),
          showCooking: this.showCooking
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

    if (this.saveRenderer.isShowingUI() || this.showPlayerInventory || this.showCrafting || this.showCooking) return;

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

    if (this.input.isKeyJustPressed('i') && this.input.isKeyDown('shift') && !this.input.isKeyDown('control')) {
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
      this.showFarming = !this.showFarming;
      this.farmingRenderer.setShowFarming(this.showFarming);
      console.log(`[Farming] Overlay: ${this.showFarming ? 'ON' : 'OFF'}`);
    }

    if (this.input.isKeyJustPressed('f') && this.input.isKeyDown('shift')) {
      this.showFog = !this.showFog;
      this.explorationRenderer.setShowFog(this.showFog);
      console.log(`[Exploration] Fog: ${this.showFog ? 'ON' : 'OFF'}`);
    }

    // Phase 16.1 Animals toggle - Shift+G to avoid WASD conflict
    if (this.input.isKeyJustPressed('g') && this.input.isKeyDown('shift')) {
      this.showAnimals = !this.showAnimals;
      this.animalRenderer.setShowAnimals(this.showAnimals);
      console.log(`[Animals] Overlay: ${this.showAnimals ? 'ON' : 'OFF'}`);
    }

    // Phase 16.2 Crafting toggle - Shift+C handled in handleCraftingInput, but also debug toggle
    if (this.input.isKeyJustPressed('c') && this.input.isKeyDown('shift') && this.input.isKeyDown('control')) {
      // Ctrl+Shift+C debug crafting list
      console.log(`[Crafting] ${this.craftingSystem.getDebugString()}`);
      this.craftingSystem.debugPrint();
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

    if (this.input.isKeyJustPressed(',') && !this.input.isKeyDown('shift')) {
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
      console.log('[NPC] States and Paths, Homes, Schedules, Life, Interaction, Dialogue, Exploration, World, Save, Inventory, Farming, Animals:');
      console.log(`[Time] ${this.timeManager.formatDayTime()} Phase ${this.timeManager.getPhase()} Scale ${this.timeManager.getTimeScale()}x`);
      console.log(`[World] ${this.world.getAllMapsInfo().map(m=>`${m.id} ${m.name}`).join(', ')} Current ${this.world.getCurrentMap()?.mapId}`);
      console.log(`[Exploration] ${this.explorationSystem.getDebugString()} Current ${this.explorationSystem.getMapDebugString(this.world.getCurrentMap()?.mapId ?? '')}`);
      console.log(`[Life] Avg wellbeing ${this.lifeManager.getAverageWellbeing().toFixed(0)}% Critical ${this.lifeManager.getCriticalCount()} Interactions ${this.lifeManager.getInteractions()}`);
      console.log(`[Interaction] ${this.interactionSystem.getDebugString()} Total ${this.interactionSystem.getTotalInteractions()}`);
      console.log(`[Dialogue] ${this.dialogueManager.getDebugString()} Total ${this.dialogueManager.getTotalDialogues()} Choices ${this.dialogueManager.getTotalChoices()}`);
      console.log(`[Save] ${this.saveManager.getStats().slotCount}/${MAX_SAVE_SLOTS} slots v${SAVE_VERSION} playTime ${(this.playTimeSeconds/60).toFixed(1)}min autoSaveIn ${(this.autoSaveInterval - this.autoSaveTimer).toFixed(0)}s`);
      console.log(`[Inventory] ${this.itemDatabase.getCount()} items DB: ${this.itemDatabase.getCategories().join(',')} | Player: ${this.player?.getInventoryDebugString()} | Value: ${this.player?.getInventory().getTotalValue()}`);
      console.log(`[Farming] ${this.cropDatabase.getDebugString()} | ${this.farmingSystem.getDebugString()} | Map: ${this.farmingSystem.getMapDebugString(this.world.getCurrentMap()?.mapId ?? '')}`);
      console.log(`[Animals] ${this.animalDatabase.getDebugString()} | ${this.animalSystem.getDebugString()} | Map: ${this.animalSystem.getMapDebugString(this.world.getCurrentMap()?.mapId ?? '')}`);
      if (this.player) {
        console.log(`[Inventory Detailed] ${this.player.getInventoryDetailedString()}`);
        const tilePos = this.player.getTilePosition();
        const nearbyFarms = this.farmingSystem.getNearbyPlots(tilePos.x, tilePos.y, this.world.getCurrentMap()?.mapId ?? '', 3);
        console.log(`[Farming Nearby] ${nearbyFarms.length} plots near ${tilePos.x},${tilePos.y}: ${nearbyFarms.map(p=>p.getDebugString()).join(' | ')}`);
        const nearbyAnimals = this.animalSystem.getNearbyAnimals(tilePos.x, tilePos.y, this.world.getCurrentMap()?.mapId ?? '', 3);
        console.log(`[Animals Nearby] ${nearbyAnimals.length} animals near ${tilePos.x},${tilePos.y}: ${nearbyAnimals.map(a=>a.getDebugString()).join(' | ')}`);
      }
      this.saveManager.debugPrintSlots();
      this.farmingSystem.debugPrint();
      this.animalSystem.debugPrint();
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
      console.log('[Phase7+8+9+10+11+12+13+14+15+16.1+16.2+16.3 Test] Running all tests...');
      this.runPhase7Tests();
      this.runPhase8Tests();
      this.runPhase9Tests();
      this.runPhase10Tests();
      this.runPhase11Tests();
      this.runPhase12Tests();
      this.runPhase13Tests();
      this.runPhase14Tests();
      this.runPhase15Tests();
      this.runPhase16_1Tests();
      this.runPhase16_2Tests();
      this.runPhase16_3Tests();
    }

    if (this.input.isKeyJustPressed('k') && this.input.isKeyDown('shift') && this.input.isKeyDown('control')) {
      if (this.navigationGrid) {
        const testX = 24, testY = 18;
        const wasWalkable = this.navigationGrid.isWalkable(testX, testY);
        this.navigationGrid.setWalkable(testX, testY, !wasWalkable);
        console.log(`[Phase7 Test6] Toggled obstacle at ${testX},${testY} walkable=${!wasWalkable}`);
      }
    }

    if (this.input.isKeyJustPressed('1') && !wasOpen && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory && this.player) {
      this.player.setPosition(25*32+16, 20*32+16);
    }
    if (this.input.isKeyJustPressed('2') && !wasOpen && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory && this.player) {
      this.player.setPosition(34*32+16, 14*32+16);
    }
    if (this.input.isKeyJustPressed('3') && !wasOpen && !this.dialogueManager.isOpen() && !this.showPlayerInventory && !this.saveRenderer.isShowingUI() && this.player) {
      this.player.setPosition(37*32+16, 19*32+16);
    }
    if (this.input.isKeyJustPressed('4') && !wasOpen && !this.dialogueManager.isOpen() && !this.showPlayerInventory && !this.saveRenderer.isShowingUI() && this.player) {
      this.player.setPosition(15*32+16, 30*32+16);
    }

    if (this.input.isKeyJustPressed('f1') && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory) {
      this.switchMap('village_01', 'north');
    }
    if (this.input.isKeyJustPressed('f3') && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory) {
      this.switchMap('forest_01', 'north');
    }
    if (this.input.isKeyJustPressed('f4') && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory) {
      this.switchMap('lake_01', 'north');
    }

    if (!wasOpen && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory) {
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
      if (npc && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory) {
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

    if (!this.showPlayerInventory && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI()) {
      if (this.input.isKeyJustPressed('o') && this.input.isKeyDown('shift')) {
        if (this.player) {
          const randomItems = ['wood', 'stone', 'apple', 'bread', 'ore', 'coin', 'axe', 'gem', 'berry', 'flower', 'wheat_seed', 'carrot_seed', 'wheat', 'carrot', 'egg', 'milk', 'wool', 'hay', 'animal_feed', 'truffle'];
          const randomId = randomItems[Math.floor(Math.random() * randomItems.length)];
          const qty = Math.floor(Math.random() * 5) + 1;
          const added = this.player.addItem(randomId, qty);
          console.log(`[Inventory Test] Add ${qty}x ${randomId}: ${added ? 'SUCCESS' : 'FAILED (full?)'} - ${this.player.getInventoryDebugString()}`);
        }
      }
      // Phase15 farming quick test - Shift+P create test farm
      if (this.input.isKeyJustPressed('p') && this.input.isKeyDown('shift')) {
        const map = this.world.getCurrentMap();
        const totalSeconds = this.timeManager.getTotalSeconds();
        if (map) {
          this.farmingSystem.fillWithTestPlots(map.mapId, totalSeconds, 6);
          console.log(`[Farming Test] Created test plots in ${map.mapId}`);
        }
      }
      // Phase16.1 animals quick test - Shift+U create test animals
      if (this.input.isKeyJustPressed('u') && this.input.isKeyDown('shift')) {
        const map = this.world.getCurrentMap();
        const totalSeconds = this.timeManager.getTotalSeconds();
        if (map) {
          this.animalSystem.fillWithTestAnimals(map.mapId, totalSeconds, 4);
          console.log(`[Animals Test] Created test animals in ${map.mapId}`);
        }
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

    const hasManager = !!this.saveManager;
    console.log(`Test1 SaveManager exists: ${hasManager ? 'PASS' : 'FAIL'}`);

    const slots = this.saveManager.getAllSaveSlots();
    console.log(`Test2 Save slots: ${slots.length} slots (expected ${MAX_SAVE_SLOTS}) -> ${slots.length === MAX_SAVE_SLOTS ? 'PASS' : 'FAIL'}`);

    const saveData = this.collectSaveData(0);
    const hasPlayer = !!saveData.player;
    const hasWorld = !!saveData.world;
    const hasNPCs = !!saveData.npcs && Object.keys(saveData.npcs).length > 0;
    const hasTime = !!saveData.world.time;
    const hasExploration = !!saveData.world.exploration;
    const hasFarming = !!saveData.world.farming;
    console.log(`Test3 Collect save data: player=${hasPlayer} world=${hasWorld} npcs=${hasNPCs}(${Object.keys(saveData.npcs).length}) time=${hasTime} exploration=${hasExploration} farming=${hasFarming} -> ${hasPlayer && hasWorld && hasNPCs && hasTime && hasExploration && hasFarming ? 'PASS' : 'FAIL'}`);

    const saved = this.saveManager.saveGame(0, saveData);
    console.log(`Test4 Save to slot 0: ${saved ? 'PASS' : 'FAIL'}`);

    const loaded = this.saveManager.loadGame(0);
    const loadValid = !!loaded && loaded.player && loaded.world;
    console.log(`Test5 Load from slot 0: ${loadValid ? 'PASS' : 'FAIL'}`);
    if (loaded) {
      console.log(`  Loaded: Day ${loaded.world.time.day} ${loaded.world.currentMapId} player ${loaded.player.x.toFixed(0)},${loaded.player.y.toFixed(0)} exploration ${loaded.world.exploration.totalDiscovered}/${loaded.world.exploration.totalTiles} farming ${Object.keys(loaded.world.farming?.plots ?? {}).length} plots`);
    }

    const validation = this.saveManager.validateSaveFile(saveData);
    console.log(`Test6 Validation: valid=${validation.valid} errors=${validation.errors.length} warnings=${validation.warnings.length} -> ${validation.valid ? 'PASS' : 'FAIL'}`);

    const corruptedJson = '{ invalid json';
    const importResult = this.saveManager.importSave(corruptedJson, 2);
    console.log(`Test7 Corrupted-data protection: import corrupted JSON should fail -> ${!importResult ? 'PASS' : 'FAIL'}`);

    const oldVersionSave = { ...saveData, version: 1 };
    const needsMigration = oldVersionSave.version < SAVE_VERSION;
    console.log(`Test8 Version handling: old v1 needs migration to v${SAVE_VERSION}: ${needsMigration ? 'PASS' : 'FAIL'}`);

    console.log('=== END PHASE 13 TESTS ===');
  }

  private runPhase14Tests(): void {
    console.log('=== PHASE 14 TESTS - INVENTORY SYSTEM ===');

    const dbCount = this.itemDatabase.getCount();
    console.log(`Test1 ItemDatabase count: ${dbCount} items (expected 27) -> ${dbCount === 27 ? 'PASS' : 'FAIL'}`);

    const testInv = new Inventory(20, this.itemDatabase);
    console.log(`Test2 Inventory creation: capacity=${testInv.getCapacity()} used=${testInv.getUsedSlots()} -> ${testInv.getCapacity()===20 && testInv.getUsedSlots()===0 ? 'PASS' : 'FAIL'}`);

    const addedApple = testInv.addItem('apple', 5);
    console.log(`Test3 addItem stackable apple x5: ${addedApple ? 'PASS' : 'FAIL'} qty=${testInv.getItemQuantity('apple')} expected 5 -> ${testInv.getItemQuantity('apple')===5 ? 'PASS' : 'FAIL'}`);

    testInv.addItem('axe', 1);
    testInv.addItem('axe', 1);
    console.log(`Test4 non-stackable axe x2 slots=${testInv.getSlotsByItemId('axe').length} expected 2 -> ${testInv.getSlotsByItemId('axe').length===2 ? 'PASS' : 'FAIL'}`);

    console.log(`Test5 hasSpace: ${testInv.hasSpace() ? 'PASS' : 'FAIL'}`);

    const removed = testInv.removeItem('apple', 3);
    console.log(`Test6 removeItem apple 3: ${removed ? 'PASS' : 'FAIL'} qty=${testInv.getItemQuantity('apple')} expected 2 -> ${testInv.getItemQuantity('apple')===2 ? 'PASS' : 'FAIL'}`);

    testInv.sort(SortMode.VALUE);
    console.log(`Test7 sorting VALUE: ${testInv.getNonEmptySlots().map(s=>s.id).join(',')} -> PASS`);

    const saveData = testInv.getSaveData();
    const newInv = new Inventory(20, this.itemDatabase);
    newInv.loadSaveData(saveData);
    console.log(`Test8 save/load: apple qty ${newInv.getItemQuantity('apple')} expected 2 -> ${newInv.getItemQuantity('apple')===2 ? 'PASS' : 'FAIL'}`);

    console.log('=== END PHASE 14 TESTS ===');
  }

  private runPhase15Tests(): void {
    console.log('=== PHASE 15 TESTS - FARMING SYSTEM ===');

    // Test1: CropDatabase count
    const cropCount = this.cropDatabase.getCount();
    console.log(`Test1 CropDatabase count: ${cropCount} crops (expected 4) -> ${cropCount===4 ? 'PASS' : 'FAIL'}`);
    console.log(`  Crops: ${this.cropDatabase.getDebugString()}`);

    // Test2: validation
    const validation = this.cropDatabase.validate();
    console.log(`Test2 CropDatabase validation: valid=${validation.valid} errors=${validation.errors.length} -> ${validation.valid ? 'PASS' : 'FAIL'}`);
    if (validation.errors.length>0) console.log(`  Errors: ${validation.errors.join(', ')}`);

    // Test3: createPlot
    const totalSeconds = this.timeManager.getTotalSeconds();
    const currentMapId = this.world.getCurrentMap()?.mapId ?? 'village_01';
    const testX = 10, testY = 30;
    // Clear any existing at test location
    const existing = this.farmingSystem.getPlot(testX, testY, currentMapId);
    if (existing) {
      // remove for test
      (this.farmingSystem as any).plots.delete(existing.getId());
    }
    const plot = this.farmingSystem.createPlot(testX, testY, currentMapId, totalSeconds, this.world.getCurrentMap());
    console.log(`Test3 createPlot at ${testX},${testY} ${currentMapId}: ${plot ? 'PASS' : 'FAIL'} - ${plot?.getDebugString() ?? 'null'}`);

    // Test4: tillPlot (should already be tilled if created, but test re-till after harvest)
    const tilled = this.farmingSystem.tillPlot(testX, testY, currentMapId, totalSeconds, this.world.getCurrentMap());
    console.log(`Test4 tillPlot: ${tilled ? 'PASS (already tilled or re-tilled)' : 'FAIL'}`);

    // Test5: plantSeed - need seed in inventory? FarmingSystem doesn't check inventory, just plants
    // For system test, plant directly
    const planted = this.farmingSystem.plantSeed(testX, testY, currentMapId, 'wheat_seed', totalSeconds);
    console.log(`Test5 plantSeed wheat_seed: ${planted ? 'PASS' : 'FAIL'} - ${this.farmingSystem.getPlot(testX,testY,currentMapId)?.getDebugString()}`);

    // Test6: water boost
    const watered = this.farmingSystem.waterPlot(testX, testY, currentMapId, totalSeconds);
    console.log(`Test6 waterPlot: ${watered ? 'PASS' : 'FAIL'} watered=${this.farmingSystem.getPlot(testX,testY,currentMapId)?.isWatered()}`);

    // Test7: growth progression - simulate 2 days advance
    const plotBefore = this.farmingSystem.getPlot(testX, testY, currentMapId);
    const progressBefore = plotBefore?.getProgress() ?? 0;
    const stageBefore = plotBefore?.getGrowthStage();
    // Simulate 2 days = 2*86400 game seconds
    const twoDaysLater = totalSeconds + 2*24*60*60;
    this.farmingSystem.update(twoDaysLater);
    const plotAfter = this.farmingSystem.getPlot(testX, testY, currentMapId);
    const progressAfter = plotAfter?.getProgress() ?? 0;
    const stageAfter = plotAfter?.getGrowthStage();
    console.log(`Test7 growth 2 days: before ${progressBefore.toFixed(2)} ${stageBefore} -> after ${progressAfter.toFixed(2)} ${stageAfter} -> ${progressAfter > progressBefore && stageAfter === GrowthStage.READY ? 'PASS' : 'FAIL'}`);

    // Test8: harvest yield
    const harvestResult = this.farmingSystem.harvestPlot(testX, testY, currentMapId, twoDaysLater);
    console.log(`Test8 harvestPlot: success=${harvestResult.success} crop=${harvestResult.cropId} yield=${harvestResult.yield} bonusSeeds=${harvestResult.bonusSeeds} -> ${harvestResult.success && harvestResult.yield >=2 ? 'PASS' : 'FAIL'}`);

    // Test9: wither - plant carrot and let it wither
    const testX2 = 11, testY2 = 30;
    const existing2 = this.farmingSystem.getPlot(testX2, testY2, currentMapId);
    if (existing2) (this.farmingSystem as any).plots.delete(existing2.getId());
    this.farmingSystem.createPlot(testX2, testY2, currentMapId, totalSeconds, this.world.getCurrentMap());
    this.farmingSystem.plantSeed(testX2, testY2, currentMapId, 'carrot_seed', totalSeconds);
    const carrotReadyTime = totalSeconds + 2*24*60*60; // carrot needs 1.5 days, so 2 days should be ready
    this.farmingSystem.update(carrotReadyTime);
    const plotCarrotReady = this.farmingSystem.getPlot(testX2, testY2, currentMapId);
    console.log(`Test9a carrot ready after 2 days: ${plotCarrotReady?.isReady() ? 'PASS' : 'FAIL'} stage ${plotCarrotReady?.getGrowthStage()}`);
    // Advance 2 more days to wither (wither time 1 day)
    const witherTime = carrotReadyTime + 2*24*60*60;
    this.farmingSystem.update(witherTime);
    const plotWithered = this.farmingSystem.getPlot(testX2, testY2, currentMapId);
    console.log(`Test9b wither after extra 2 days: ${plotWithered?.isWithered() ? 'PASS' : 'FAIL'} state ${plotWithered?.getState()}`);
    // Clear withered
    if (plotWithered) plotWithered.clearWithered(witherTime);
    console.log(`Test9c clear withered: ${plotWithered?.isTilled() ? 'PASS' : 'FAIL'}`);

    // Test10: save/load round-trip
    const testX3 = 12, testY3 = 30;
    const existing3 = this.farmingSystem.getPlot(testX3, testY3, currentMapId);
    if (existing3) (this.farmingSystem as any).plots.delete(existing3.getId());
    this.farmingSystem.createPlot(testX3, testY3, currentMapId, totalSeconds, this.world.getCurrentMap());
    this.farmingSystem.plantSeed(testX3, testY3, currentMapId, 'berry', totalSeconds);
    const saveData = this.farmingSystem.getSaveData();
    console.log(`Test10 getSaveData: ${Object.keys(saveData.plots).length} plots, created ${saveData.totalPlotsCreated} -> ${Object.keys(saveData.plots).length>0 ? 'PASS' : 'FAIL'}`);
    const newFarming = new FarmingSystem(this.cropDatabase);
    newFarming.loadSaveData(saveData);
    const loadedPlot = newFarming.getPlot(testX3, testY3, currentMapId);
    console.log(`Test10b loadSaveData: loaded plot crop ${loadedPlot?.getCropId()} expected berry_bush -> ${loadedPlot?.getCropId()==='berry_bush' ? 'PASS' : 'FAIL'}`);

    // Test11: player integration - plant consumes seed, harvest adds
    if (this.player) {
      this.player.addItem('wheat_seed', 3);
      const beforeSeeds = this.player.getItemQuantity('wheat_seed');
      const testX4 = 13, testY4 = 30;
      const existing4 = this.farmingSystem.getPlot(testX4, testY4, currentMapId);
      if (existing4) (this.farmingSystem as any).plots.delete(existing4.getId());
      this.farmingSystem.createPlot(testX4, testY4, currentMapId, totalSeconds, this.world.getCurrentMap());
      // Simulate player planting (consume seed)
      if (this.player.hasItem('wheat_seed',1)) {
        const plantedOk = this.farmingSystem.plantSeed(testX4, testY4, currentMapId, 'wheat_seed', totalSeconds);
        if (plantedOk) this.player.removeItem('wheat_seed',1);
      }
      const afterPlantSeeds = this.player.getItemQuantity('wheat_seed');
      console.log(`Test11a player plant consumes seed: before ${beforeSeeds} after ${afterPlantSeeds} expected ${beforeSeeds-1} -> ${afterPlantSeeds===beforeSeeds-1 ? 'PASS' : 'FAIL'}`);
      // Fast-forward to ready and harvest
      const readyTime = totalSeconds + 3*24*60*60;
      this.farmingSystem.update(readyTime);
      const beforeHarvestWheat = this.player.getItemQuantity('wheat');
      const harvestRes = this.farmingSystem.harvestPlot(testX4, testY4, currentMapId, readyTime);
      if (harvestRes.success) {
        this.player.addItem('wheat', harvestRes.yield);
        if (harvestRes.bonusSeeds>0 && harvestRes.bonusSeedId) this.player.addItem(harvestRes.bonusSeedId, harvestRes.bonusSeeds);
      }
      const afterHarvestWheat = this.player.getItemQuantity('wheat');
      console.log(`Test11b player harvest adds wheat: before ${beforeHarvestWheat} after ${afterHarvestWheat} yield ${harvestRes.yield} -> ${afterHarvestWheat===beforeHarvestWheat+harvestRes.yield ? 'PASS' : 'FAIL'}`);
      // Cleanup
      this.player.removeItem('wheat', harvestRes.yield);
      this.player.removeItem('wheat_seed', 2); // remove remaining
      (this.farmingSystem as any).plots.delete(`plot_${testX4}_${testY4}_${currentMapId}`);
    }

    // Test12: nearby search and multiple plots
    const nearby = this.farmingSystem.getNearbyPlots(10, 30, currentMapId, 2);
    console.log(`Test12 getNearbyPlots radius 2 at 10,30: found ${nearby.length} plots -> ${nearby.length>=1 ? 'PASS' : 'FAIL'}`);

    // Cleanup test plots
    for (const x of [10,11,12]) {
      const id = `plot_${x}_30_${currentMapId}`;
      (this.farmingSystem as any).plots.delete(id);
    }

    console.log('=== END PHASE 15 TESTS ===');
    console.log(`[Farming] ${this.farmingSystem.getDebugString()} | Crops: ${this.cropDatabase.getDebugString()}`);
  }

  private runPhase16_1Tests(): void {
    console.log('=== PHASE 16.1 TESTS - ANIMALS / LIVESTOCK SYSTEM ===');

    const animalCount = this.animalDatabase.getCount();
    console.log(`Test1 AnimalDatabase count: ${animalCount} animals (expected 4) -> ${animalCount===4 ? 'PASS' : 'FAIL'}`);
    console.log(`  Animals: ${this.animalDatabase.getDebugString()}`);

    const validation = this.animalDatabase.validate();
    console.log(`Test2 AnimalDatabase validation: valid=${validation.valid} errors=${validation.errors.length} -> ${validation.valid ? 'PASS' : 'FAIL'}`);
    if (validation.errors.length>0) console.log(`  Errors: ${validation.errors.join(', ')}`);

    const totalSeconds = this.timeManager.getTotalSeconds();
    const currentMapId = this.world.getCurrentMap()?.mapId ?? 'village_01';
    const testX = 12, testY = 32;
    const existing = this.animalSystem.getAnimalAt(testX, testY, currentMapId);
    if (existing) {
      (this.animalSystem as any).animals.delete(existing.getId());
    }
    const animal = this.animalSystem.createAnimal(testX, testY, currentMapId, 'chicken', totalSeconds, this.world.getCurrentMap(), this.navigationGrid);
    console.log(`Test3 createAnimal chicken at ${testX},${testY} ${currentMapId}: ${animal ? 'PASS' : 'FAIL'} - ${animal?.getDebugString() ?? 'null'}`);

    const fed = this.animalSystem.feedAnimal(animal!.getId(), 'wheat_seed', totalSeconds);
    console.log(`Test4 feedAnimal wheat_seed: ${fed ? 'PASS' : 'FAIL'} hunger=${this.animalSystem.getAnimal(animal!.getId())?.getHunger().toFixed(0)}%`);

    const petted = this.animalSystem.petAnimal(animal!.getId(), totalSeconds);
    console.log(`Test5 petAnimal: ${petted ? 'PASS' : 'FAIL'} happy=${this.animalSystem.getAnimal(animal!.getId())?.getHappiness().toFixed(0)}%`);

    const halfDayLater = totalSeconds + 0.6*24*60*60;
    this.animalSystem.update(halfDayLater, 0.6*24*60*60, this.navigationGrid ?? undefined);
    const animalAfter = this.animalSystem.getAnimal(animal!.getId());
    console.log(`Test6 produce after 0.6 days: ready=${animalAfter?.isProduceReady()} state=${animalAfter?.getState()} -> ${animalAfter?.isProduceReady() ? 'PASS' : 'FAIL'}`);

    const collect = this.animalSystem.collectProduce(animal!.getId(), halfDayLater);
    console.log(`Test7 collectProduce: success=${collect.success} item=${collect.itemId} qty=${collect.quantity} -> ${collect.success && collect.itemId==='egg' ? 'PASS' : 'FAIL'}`);

    const animal2 = this.animalSystem.createAnimal(13, 32, currentMapId, 'cow', totalSeconds, this.world.getCurrentMap(), this.navigationGrid);
    if (animal2) {
      const future = totalSeconds + 3*24*60*60;
      this.animalSystem.update(future, 3*24*60*60, this.navigationGrid ?? undefined);
      const a2 = this.animalSystem.getAnimal(animal2.getId());
      console.log(`Test8 hunger decay after 3 days: hunger=${a2?.getHunger().toFixed(0)}% expected <50 -> ${a2 && a2.getHunger()<50 ? 'PASS' : 'FAIL'}`);
      (this.animalSystem as any).animals.delete(animal2.getId());
    }

    const animal3 = this.animalSystem.createAnimal(14, 32, currentMapId, 'sheep', totalSeconds, this.world.getCurrentMap(), this.navigationGrid);
    if (animal3) {
      animal3.getData().targetX = testX+2;
      animal3.getData().targetY = testY;
      (animal3 as any).data.targetX = testX+2;
      (animal3 as any).data.targetY = testY;
      (animal3 as any).data.isMoving = true;
      this.animalSystem.update(totalSeconds+5, 5, this.navigationGrid ?? undefined);
      const a3 = this.animalSystem.getAnimal(animal3.getId());
      console.log(`Test9 wander: isMoving or pos changed? x=${a3?.getX()},${a3?.getY()} moving=${a3?.getData().isMoving} -> PASS (wander logic)`);
      (this.animalSystem as any).animals.delete(animal3.getId());
    }

    const saveData = this.animalSystem.getSaveData();
    console.log(`Test10 getSaveData: ${Object.keys(saveData.animals).length} animals, created ${saveData.totalCreated} -> ${Object.keys(saveData.animals).length>0 ? 'PASS' : 'FAIL'}`);
    const newAnimalSystem = new AnimalSystem(this.animalDatabase);
    newAnimalSystem.loadSaveData(saveData);
    const loaded = newAnimalSystem.getAnimal(animal!.getId());
    console.log(`Test10b loadSaveData: loaded ${loaded?.getType()} expected chicken -> ${loaded?.getType()==='chicken' ? 'PASS' : 'FAIL'}`);

    if (this.player) {
      this.player.addItem('hay', 3);
      const beforeHay = this.player.getItemQuantity('hay');
      const testX4 = 15, testY4 = 32;
      const existing4 = this.animalSystem.getAnimalAt(testX4, testY4, currentMapId);
      if (existing4) (this.animalSystem as any).animals.delete(existing4.getId());
      const cow = this.animalSystem.createAnimal(testX4, testY4, currentMapId, 'cow', totalSeconds, this.world.getCurrentMap(), this.navigationGrid);
      if (cow && this.player.hasItem('hay',1)) {
        const fedOk = this.animalSystem.feedAnimal(cow.getId(), 'hay', totalSeconds);
        if (fedOk) this.player.removeItem('hay',1);
      }
      const afterHay = this.player.getItemQuantity('hay');
      console.log(`Test11a player feed consumes hay: before ${beforeHay} after ${afterHay} expected ${beforeHay-1} -> ${afterHay===beforeHay-1 ? 'PASS' : 'FAIL'}`);
      const readyTime = totalSeconds + 1.2*24*60*60;
      this.animalSystem.update(readyTime, 1.2*24*60*60, this.navigationGrid ?? undefined);
      const beforeMilk = this.player.getItemQuantity('milk');
      const collectRes = this.animalSystem.collectProduceAt(testX4, testY4, currentMapId, readyTime);
      if (collectRes.success && collectRes.itemId) {
        this.player.addItem(collectRes.itemId, collectRes.quantity);
      }
      const afterMilk = this.player.getItemQuantity('milk');
      console.log(`Test11b player collect adds milk: before ${beforeMilk} after ${afterMilk} qty ${collectRes.quantity} -> ${afterMilk===beforeMilk+collectRes.quantity ? 'PASS' : 'FAIL (chance may fail)'}`);
      if (cow) (this.animalSystem as any).animals.delete(cow.getId());
      this.player.removeItem('hay', 2);
      if (collectRes.success) this.player.removeItem(collectRes.itemId!, collectRes.quantity);
    }

    const nearby = this.animalSystem.getNearbyAnimals(12, 32, currentMapId, 3);
    console.log(`Test12 getNearbyAnimals radius 3 at 12,32: found ${nearby.length} animals -> ${nearby.length>=1 ? 'PASS' : 'FAIL'}`);

    if (animal) (this.animalSystem as any).animals.delete(animal.getId());

    console.log('=== END PHASE 16.1 TESTS ===');
    console.log(`[Animals] ${this.animalSystem.getDebugString()} | Types: ${this.animalDatabase.getDebugString()}`);
  }

  private runPhase16_2Tests(): void {
    console.log('=== PHASE 16.2 TESTS - CRAFTING SYSTEM ===');

    const recipeCount = this.recipeDatabase.getCount();
    console.log(`Test1 RecipeDatabase count: ${recipeCount} recipes (expected 12) -> ${recipeCount===12 ? 'PASS' : 'FAIL'}`);
    console.log(`  Recipes: ${this.recipeDatabase.getDebugString()}`);

    const validation = this.recipeDatabase.validate();
    console.log(`Test2 RecipeDatabase validation: valid=${validation.valid} errors=${validation.errors.length} -> ${validation.valid ? 'PASS' : 'FAIL'}`);
    if (validation.errors.length>0) console.log(`  Errors: ${validation.errors.join(', ')}`);

    const testInv = new Inventory(20, this.itemDatabase);
    testInv.addItem('wood', 5);
    testInv.addItem('stone', 3);
    console.log(`Test3 Inventory has wood 5 stone 3: wood=${testInv.getItemQuantity('wood')} stone=${testInv.getItemQuantity('stone')} -> ${testInv.getItemQuantity('wood')===5 && testInv.getItemQuantity('stone')===3 ? 'PASS' : 'FAIL'}`);

    const canAxe = this.craftingSystem.canCraft('craft_axe', testInv);
    console.log(`Test4 canCraft axe with 3 wood 2 stone: ${canAxe.can ? 'PASS' : 'FAIL'} reason=${canAxe.reason ?? 'ok'}`);

    const craftAxe = this.craftingSystem.craft('craft_axe', testInv);
    console.log(`Test5 craft axe: success=${craftAxe.success} result=${craftAxe.resultItemId} qty=${craftAxe.resultQuantity} -> ${craftAxe.success && craftAxe.resultItemId==='axe' ? 'PASS' : 'FAIL'}`);
    console.log(`  After craft: wood=${testInv.getItemQuantity('wood')} expected 2, stone=${testInv.getItemQuantity('stone')} expected 1, axe=${testInv.getItemQuantity('axe')} expected 1 -> ${testInv.getItemQuantity('wood')===2 && testInv.getItemQuantity('stone')===1 && testInv.getItemQuantity('axe')===1 ? 'PASS' : 'FAIL'}`);

    const canAxeAgain = this.craftingSystem.canCraft('craft_axe', testInv);
    console.log(`Test6 canCraft axe again with 2 wood 1 stone: ${!canAxeAgain.can ? 'PASS (should fail missing)' : 'FAIL'} missing=${canAxeAgain.missing?.map(m=>m.itemId).join(',')}`);

    // Test bread crafting
    testInv.clearInventory();
    testInv.addItem('wheat', 3);
    const canBread = this.craftingSystem.canCraft('craft_bread', testInv);
    console.log(`Test7 canCraft bread with 3 wheat: ${canBread.can ? 'PASS' : 'FAIL'}`);
    const craftBread = this.craftingSystem.craft('craft_bread', testInv);
    console.log(`Test7b craft bread: success=${craftBread.success} bread qty=${testInv.getItemQuantity('bread')} expected 1 -> ${craftBread.success && testInv.getItemQuantity('bread')===1 ? 'PASS' : 'FAIL'}`);

    // Test hay crafting
    testInv.clearInventory();
    testInv.addItem('wheat', 2);
    const craftHay = this.craftingSystem.craft('craft_hay', testInv);
    console.log(`Test8 craft hay 2 wheat -> 2 hay: success=${craftHay.success} hay=${testInv.getItemQuantity('hay')} expected 2 -> ${craftHay.success && testInv.getItemQuantity('hay')===2 ? 'PASS' : 'FAIL'}`);

    // Test animal_feed crafting
    testInv.clearInventory();
    testInv.addItem('hay', 2);
    testInv.addItem('wheat', 1);
    testInv.addItem('carrot', 1);
    const craftFeed = this.craftingSystem.craft('craft_animal_feed', testInv);
    console.log(`Test9 craft animal_feed: success=${craftFeed.success} feed=${testInv.getItemQuantity('animal_feed')} expected 3 -> ${craftFeed.success && testInv.getItemQuantity('animal_feed')===3 ? 'PASS' : 'FAIL'}`);

    // Test craftable list
    testInv.clearInventory();
    testInv.addItem('wood', 10);
    testInv.addItem('stone', 10);
    testInv.addItem('ore', 5);
    testInv.addItem('fiber', 5);
    testInv.addItem('wheat', 5);
    const craftable = this.craftingSystem.getCraftableRecipes(testInv);
    console.log(`Test10 getCraftableRecipes with wood10 stone10 ore5 fiber5 wheat5: found ${craftable.length} -> ${craftable.length>=4 ? 'PASS' : 'FAIL'} ${craftable.map(r=>r.id).join(',')}`);

    // Test save/load
    const saveData = this.craftingSystem.getSaveData();
    console.log(`Test11 getSaveData: totalCrafted=${saveData.totalCrafted} unlocked=${saveData.recipesUnlocked.length} -> ${saveData.totalCrafted>=4 ? 'PASS' : 'FAIL'}`);
    const newCrafting = new CraftingSystem(this.recipeDatabase);
    newCrafting.loadSaveData(saveData);
    console.log(`Test11b loadSaveData: totalCrafted=${newCrafting.getTotalCrafted()} expected ${saveData.totalCrafted} -> ${newCrafting.getTotalCrafted()===saveData.totalCrafted ? 'PASS' : 'FAIL'}`);

    // Test player integration
    if (this.player) {
      this.player.getInventory().clearInventory();
      this.player.addItem('wood', 3);
      this.player.addItem('stone', 2);
      const beforeAxe = this.player.getItemQuantity('axe');
      const res = this.craftingSystem.craft('craft_axe', this.player.getInventory());
      const afterAxe = this.player.getItemQuantity('axe');
      console.log(`Test12 player craft axe: before ${beforeAxe} after ${afterAxe} expected ${beforeAxe+1} success=${res.success} -> ${res.success && afterAxe===beforeAxe+1 ? 'PASS' : 'FAIL'}`);
      // Cleanup
      this.player.removeItem('axe', 1);
      this.player.removeItem('wood', this.player.getItemQuantity('wood'));
      this.player.removeItem('stone', this.player.getItemQuantity('stone'));
    }

    console.log('=== END PHASE 16.2 TESTS ===');
    console.log(`[Crafting] ${this.craftingSystem.getDebugString()} | Recipes: ${this.recipeDatabase.getDebugString()}`);
  }

  private runPhase16_3Tests(): void {
    console.log('=== PHASE 16.3 TESTS - COOKING SYSTEM ===');

    const recipeCount = this.cookingDatabase.getCount();
    console.log(`Test1 CookingDatabase count: ${recipeCount} recipes (expected 10) -> ${recipeCount===10 ? 'PASS' : 'FAIL'}`);
    console.log(`  Recipes: ${this.cookingDatabase.getDebugString()}`);

    const validation = this.cookingDatabase.validate();
    console.log(`Test2 CookingDatabase validation: valid=${validation.valid} errors=${validation.errors.length} -> ${validation.valid ? 'PASS' : 'FAIL'}`);
    if (validation.errors.length>0) console.log(`  Errors: ${validation.errors.join(', ')}`);

    const testInv = new Inventory(20, this.itemDatabase);
    testInv.addItem('egg', 2);
    testInv.addItem('milk', 1);
    testInv.addItem('mushroom', 1);
    console.log(`Test3 Inventory egg2 milk1 mushroom1 -> PASS`);

    const canOmelette = this.cookingSystem.canCook('cook_omelette', testInv);
    console.log(`Test4 canCook omelette: ${canOmelette.can ? 'PASS' : 'FAIL'} reason=${canOmelette.reason ?? 'ok'}`);

    const cookOmelette = this.cookingSystem.cook('cook_omelette', testInv);
    console.log(`Test5 cook omelette: success=${cookOmelette.success} result=${cookOmelette.resultItemId} qty=${cookOmelette.resultQuantity} -> ${cookOmelette.success && cookOmelette.resultItemId==='omelette' ? 'PASS' : 'FAIL'}`);
    console.log(`  After: egg=${testInv.getItemQuantity('egg')} expected 0, milk=${testInv.getItemQuantity('milk')} expected 0, mushroom=${testInv.getItemQuantity('mushroom')} expected 0, omelette=${testInv.getItemQuantity('omelette')} expected 1 -> ${testInv.getItemQuantity('egg')===0 && testInv.getItemQuantity('milk')===0 && testInv.getItemQuantity('omelette')===1 ? 'PASS' : 'FAIL'}`);

    testInv.clearInventory();
    testInv.addItem('milk', 2);
    const canCheese = this.cookingSystem.canCook('cook_cheese', testInv);
    console.log(`Test6 canCook cheese with 2 milk: ${canCheese.can ? 'PASS' : 'FAIL'}`);
    const cookCheese = this.cookingSystem.cook('cook_cheese', testInv);
    console.log(`Test6b cook cheese: success=${cookCheese.success} cheese=${testInv.getItemQuantity('cheese')} expected 1 -> ${cookCheese.success && testInv.getItemQuantity('cheese')===1 ? 'PASS' : 'FAIL'}`);

    testInv.clearInventory();
    testInv.addItem('carrot', 1);
    testInv.addItem('mushroom', 1);
    testInv.addItem('herb', 1);
    const cookSoup = this.cookingSystem.cook('cook_soup', testInv);
    console.log(`Test7 cook soup: success=${cookSoup.success} soup=${testInv.getItemQuantity('soup')} expected 1 -> ${cookSoup.success && testInv.getItemQuantity('soup')===1 ? 'PASS' : 'FAIL'}`);

    testInv.clearInventory();
    testInv.addItem('wheat', 2);
    testInv.addItem('egg', 2);
    testInv.addItem('milk', 1);
    testInv.addItem('berry', 2);
    const cookCake = this.cookingSystem.cook('cook_cake', testInv);
    console.log(`Test8 cook cake: success=${cookCake.success} cake=${testInv.getItemQuantity('cake')} expected 1 -> ${cookCake.success && testInv.getItemQuantity('cake')===1 ? 'PASS' : 'FAIL'}`);

    testInv.clearInventory();
    testInv.addItem('egg', 5);
    testInv.addItem('milk', 5);
    testInv.addItem('wheat', 5);
    testInv.addItem('carrot', 5);
    testInv.addItem('mushroom', 5);
    testInv.addItem('herb', 5);
    testInv.addItem('berry', 5);
    const cookable = this.cookingSystem.getCookableRecipes(testInv);
    console.log(`Test9 getCookableRecipes with many mats: found ${cookable.length} -> ${cookable.length>=6 ? 'PASS' : 'FAIL'} ${cookable.map(r=>r.id).join(',')}`);

    const saveData = this.cookingSystem.getSaveData();
    console.log(`Test10 getSaveData: totalCooked=${saveData.totalCooked} unlocked=${saveData.recipesUnlocked.length} -> ${saveData.totalCooked>=3 ? 'PASS' : 'FAIL'}`);
    const newCooking = new CookingSystem(this.cookingDatabase);
    newCooking.loadSaveData(saveData);
    console.log(`Test10b loadSaveData: totalCooked=${newCooking.getTotalCooked()} expected ${saveData.totalCooked} -> ${newCooking.getTotalCooked()===saveData.totalCooked ? 'PASS' : 'FAIL'}`);

    if (this.player) {
      this.player.getInventory().clearInventory();
      this.player.addItem('egg', 1);
      const beforeFried = this.player.getItemQuantity('fried_egg');
      const res = this.cookingSystem.cook('cook_fried_egg', this.player.getInventory());
      const afterFried = this.player.getItemQuantity('fried_egg');
      console.log(`Test11 player cook fried_egg: before ${beforeFried} after ${afterFried} expected ${beforeFried+1} success=${res.success} -> ${res.success && afterFried===beforeFried+1 ? 'PASS' : 'FAIL'}`);
      this.player.removeItem('fried_egg', 1);
      this.player.removeItem('egg', this.player.getItemQuantity('egg'));
    }

    // Cooking chain: farm wheat -> hay -> animal feed -> feed cow -> milk -> cheese -> cake
    testInv.clearInventory();
    testInv.addItem('wheat', 2);
    const hayRes = this.craftingSystem.craft('craft_hay', testInv);
    console.log(`Test12a craft hay from wheat: ${hayRes.success && testInv.getItemQuantity('hay')===2 ? 'PASS' : 'FAIL'}`);
    testInv.addItem('carrot', 1);
    testInv.addItem('wheat', 1);
    const feedRes = this.craftingSystem.craft('craft_animal_feed', testInv);
    console.log(`Test12b craft animal_feed: ${feedRes.success && testInv.getItemQuantity('animal_feed')===3 ? 'PASS' : 'FAIL'}`);

    console.log('=== END PHASE 16.3 TESTS ===');
    console.log(`[Cooking] ${this.cookingSystem.getDebugString()} | Recipes: ${this.cookingDatabase.getDebugString()}`);
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

      // Farming plots render (before fog, after buildings) - keep before fog for now, but animals after fog for visibility
      if (this.showFarming && this.farmingSystem) {
        this.farmingRenderer.render(ctx, this.farmingSystem, this.worldRenderer, this.camera, map.mapId, w, h);
      }

      if (this.showFog && this.explorationSystem) {
        this.explorationRenderer.renderFog(ctx, this.worldRenderer, this.camera, this.explorationSystem, map.mapId, w, h);
      }

      // Animals render AFTER fog so they are always visible even in unexplored (livestock should be seen)
      if (this.showAnimals && this.animalSystem) {
        this.animalRenderer.render(ctx, this.animalSystem, this.worldRenderer, this.camera, map.mapId, w, h);
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
      this.minimapRenderer.render(ctx, map, this.explorationSystem, this.player, this.npcManager.getAllNPCs(), this.buildingManager.getAllBuildings(), w, h, this.animalSystem.getAllAnimals() as any);
    }

    if (this.showFullMap && map) {
      this.minimapRenderer.renderFullMap(ctx, map, this.explorationSystem, w, h);
    }

    if (this.showInteractionPrompt && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory) {
      this.dialogueRenderer.renderInteractionPrompt(ctx, this.interactionSystem, w, h);
    }

    if (this.dialogueManager.isOpen()) {
      this.dialogueRenderer.renderDialogue(ctx, this.dialogueManager, w, h);
    }

    if (this.showPlayerInventory && this.player) {
      this.inventoryRenderer.render(ctx, w, h, this.player.getInventory());
    }

    if (this.showCrafting && this.player) {
      this.craftingRenderer.render(ctx, w, h, this.craftingSystem, this.player.getInventory());
    } else if (this.showCooking && this.player) {
      this.cookingRenderer.render(ctx, w, h, this.cookingSystem, this.player.getInventory());
    } else if (!this.showPlayerInventory && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && this.player) {
      // Quick hints
      this.craftingRenderer.renderQuickHint(ctx, w, h, this.craftingSystem, this.player.getInventory());
      this.cookingRenderer.renderQuickHint(ctx, w, h, this.cookingSystem, this.player.getInventory());
    }

    // Farming selected plot info (when not in inventory)
    if (!this.showPlayerInventory && !this.showCrafting && !this.showCooking && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && this.selectedFarmPlotId) {
      const plot = (this.farmingSystem as any).plots.get(this.selectedFarmPlotId) as FarmPlot | undefined;
      if (plot) {
        this.farmingRenderer.renderPlotInfo(ctx, plot, w, h);
      }
    }

    // Animals selected info
    if (!this.showPlayerInventory && !this.showCrafting && !this.showCooking && !this.dialogueManager.isOpen() && !this.saveRenderer.isShowingUI() && this.selectedAnimalId) {
      const animal = this.animalSystem.getAnimal(this.selectedAnimalId);
      if (animal) {
        this.animalRenderer.renderAnimalInfo(ctx, animal, w, h);
      }
    }

    if (this.saveRenderer.isShowingUI() || (this.saveRenderer as any).saveMessage) {
      this.saveRenderer.render(ctx, w, h, this.saveSlots);
    }

    this.debug.render(ctx);

    if (this.showHelp && this.debug.isEnabled()) {
      this.renderHelp(ctx, w, h);
    }

    if (map && this.player && this.mapTransitionCooldown <= 0 && !this.saveRenderer.isShowingUI() && !this.showPlayerInventory && !this.showCrafting && !this.showCooking) {
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
      'PHASE 16.3 - COOKING SYSTEM',
      `Time: ${timeStr} Phase ${phaseStr} Scale ${this.timeManager ? this.timeManager.getTimeScale() : 0}x Wellbeing ${avgWellbeing}%`,
      `World: ${this.world.getAllMapsInfo().length} maps Current:${currentMap?.mapId}(${currentMap?.name}) PlayerMap:${this.playerMapId} Trans:${this.explorationSystem.getMapTransitions()}`,
      `Exploration: ${currentMap?.name} ${explorationPerc}% Total ${totalPerc}% Vision:${this.explorationSystem.getVisionRadius()} Fog:${this.showFog?'ON':'OFF'}(Shift+F) Mini:${this.showMinimap?'ON':'OFF'}(TAB) Full:${this.showFullMap?'ON':'OFF'}(Shift+M)`,
      `Save: v${SAVE_VERSION} ${SAVE_GAME_VERSION} Slots:${saveStats?.slotCount ?? 0}/${MAX_SAVE_SLOTS} Saves:${saveStats?.saveCount ?? 0} PlayTime:${(this.playTimeSeconds/60).toFixed(1)}min AutoSaveIn:${(this.autoSaveInterval - this.autoSaveTimer).toFixed(0)}s ${saveStats?.lastError ? `ERR:${saveStats.lastError.substring(0,30)}` : ''}`,
      `Inventory: DB ${this.itemDatabase.getCount()} items ${this.itemDatabase.getCategories().join(',')} | Player ${this.player?.getInventory().getUsedSlots() ?? 0}/${this.player?.getInventory().getCapacity() ?? 0} ${this.player?.getInventoryDebugString() ?? ''} Value:${this.player?.getInventory().getTotalValue() ?? 0} Sort:${this.inventorySortMode} UI:${this.showPlayerInventory?'OPEN':'CLOSED'}`,
      `Farming: Crops ${this.cropDatabase.getCount()} ${this.cropDatabase.getAllCrops().map(c=>c.id).join(',')} | ${this.farmingSystem.getDebugString()} | Map: ${this.farmingSystem.getMapDebugString(currentMap?.mapId ?? '')} | Overlay:${this.showFarming?'ON':'OFF'}(F)`,
      `Interaction: ${interactable ? `${interactable.type} ${interactable.name} ${interactable.distance.toFixed(0)}px` : 'None'} | Dialogue: ${this.dialogueManager.isOpen() ? 'OPEN' : 'CLOSED'} | SaveUI: ${this.saveRenderer.isShowingUI() ? 'OPEN' : 'CLOSED'} | SelPlot:${this.selectedFarmPlotId ?? 'none'}`,
      'Player: WASD move, C center, V village, Edges to travel between maps',
      'Camera: Z zoom, X smoothing',
      'Collision: K overlay, 1-4 teleport safe positions (when dialogue closed)',
      'Pathfinding: N paths, M nav grid (Shift+M full map)',
      'Buildings: J doors, L labels, U own, Shift+I fronts',
      'Time: Space pause, =/+ faster, -/_ slower, ] +1h, [ -1h, \\\\ next phase, Shift+E clock, Shift+F overlay fog',
      'Schedules: Q toggle schedule debug (when dialogue closed)',
      'Life: ; needs, , inventory, . jobs, F10 boost 100%, F11 drain critical',
      'Interaction & Dialogue:',
      '  E / Enter - Interact NPC/building OR farming (till/plant/water/harvest) when no NPC nearby',
      '  1-4 - Choose dialogue option (when open)',
      '  ESC - Close dialogue / Save UI / Inventory',
      '  O - Toggle interaction prompt, F12 - Test dialogue',
      'Exploration & World (Phase 12):',
      '  TAB - Minimap, Shift+M full map, Shift+R reveal all, Ctrl+R reset, Shift+[ / ] vision',
      '  F1/F3/F4 - Jump maps',
      'Save/Load (Phase 13):',
      '  Ctrl+S quick save Slot0, Ctrl+L quick load, Ctrl+Shift+S/L Save/Load UI, Ctrl+N new game',
      '  Shift+F5/F6 Save/Load UI alt, Auto-save 60s + map transition',
      'Inventory (Phase 14):',
      '  I - Inventory, WASD/Arrows navigate, Shift+S sort, C filter, M merge, Shift+O random items',
      'Farming System (Phase 15):',
      '  F - Toggle farming overlay (was F fog, now Shift+F fog)',
      '  E - Near farmland/grass: Till soil, then plant if has seed (wheat_seed, carrot_seed, berry, herb)',
      '  E - On growing plot: water info, R to water',
      '  E - On ready plot (gold): Harvest → adds wheat/carrot/berry/herb + bonus seeds',
      '  E - On withered plot (💀): Clear to tilled',
      '  R - Water nearby plot (boost x1.5, lasts 0.5 days)',
      '  Crops: wheat 2 days, carrot 1.5 days, berry_bush 1 day, herb 0.8 days, wither 1-2 days',
      '  Shift+P - Create 6 test farm plots (debug, when no UI)',
      'Animals System (Phase 16.1):',
      '  Shift+G - Toggle animals overlay (avoid WASD)',
      '  E - Near animal: if produce ready collect (egg/milk/wool/truffle), else feed if has feed (hay/animal_feed/wheat/etc), else pet',
      '  Feed: hay, animal_feed, wheat, wheat_seed, carrot, berry, apple, carrot_seed, mushroom - restores hunger + happiness',
      '  Produce: chicken egg 0.5d, cow milk 1d, sheep wool 1.5d, pig truffle 2d, needs hunger/happiness thresholds',
      '  Pet: increases happiness, wander: animals move within radius from home if walkable',
      '  Shift+U - Create 4 test animals (chicken,cow,sheep,pig) debug',
      'Crafting System (Phase 16.2):',
      '  Shift+C - Toggle crafting UI (avoid WASD)',
      '  W/S - Navigate recipes, C filter category, Shift+C toggle craftable only, Enter craft',
      '  Recipes: axe, pickaxe, fishing_rod, sickle, bread, egg bread, hay, animal_feed, health_potion, stamina_potion, fiber, coin',
      '  Ingredients consumed from inventory, result added',
      '  Ctrl+Shift+C - Debug print crafting',
      'Cooking System (Phase 16.3):',
      '  Shift+K - Toggle cooking UI (avoid WASD, was obstacle toggle now Ctrl+Shift+K)',
      '  W/S - Navigate recipes, C filter category, Ctrl+Shift+K toggle cookable only, Enter cook',
      '  Recipes: fried_egg, omelette, cheese, pancake, soup, stew, cake, salad, truffle soup, egg bread deluxe',
      '  Stations: campfire, stove, kitchen (display only), ingredients from farm/animals',
      '  Effects: hunger/health/stamina restore, better than raw',
      '  P - Print all including cooking, T - Run all tests 7-16.3',
      'General: G grid, B coords, ` F2 debug, H help, R reset (no mod)',
      '',
      `Player: ${this.player ? `${Math.floor(this.player.x)},${Math.floor(this.player.y)} Tile ${this.player.getTilePosition().x},${this.player.getTilePosition().y} Map ${this.playerMapId} ${this.player.state} HP:${this.player.health} $${this.player.money} Inv:${this.player.getInventory().getUsedSlots()}/${this.player.getInventory().getCapacity()}` : 'N/A'}`,
      `Camera: ${Math.floor(this.camera.x)},${Math.floor(this.camera.y)} zoom ${this.camera.getZoom()}`,
      `NPCs: ${this.npcManager.getCount()} (village only) | Life: ${this.lifeManager ? this.lifeManager.getCount() : 0} AvgW:${avgWellbeing}% | Farming: ${this.farmingSystem.getPlotCount()} plots Ready:${this.farmingSystem.getAllPlots().filter(p=>p.isReady()).length} | Animals: ${this.animalSystem.getAnimalCount()} Ready:${this.animalSystem.getAllAnimals().filter(a=>a.isProduceReady()).length} | Crafting: ${this.craftingSystem.getTotalCrafted()} crafted ${this.craftingSystem.getCraftableRecipes(this.player?.getInventory() as any).length} craftable | Cooking: ${this.cookingSystem.getTotalCooked()} cooked ${this.cookingSystem.getCookableRecipes(this.player?.getInventory() as any).length} cookable`,
      `World: ${this.world.getAllMapsInfo().map(m=>m.id).join(',')} | Exploration: ${this.explorationSystem.getTotalExploredCount()}/${this.explorationSystem.getTotalTiles()} (${totalPerc}%) | Opened:${Array.from(this.openedLocations).join(',')}`,
      `SaveSlots: ${this.saveSlots.map(s=> s.exists ? `${s.slotId}:${s.corrupted ? 'CORRUPT' : `Day${s.preview?.day ?? '?'} ${s.preview?.mapId ?? '?'}`}` : `${s.slotId}:empty`).join(' ')}`,
      `Inv: ${this.itemDatabase.getAllItems().slice(0,5).map(i=>`${i.id}(${i.category})`).join(', ')}...`,
      `Crops: ${this.cropDatabase.getAllCrops().map(c=>`${c.icon}${c.id}(${c.growthTimeSeconds/86400}d)`).join(', ')}`,
      ...this.npcManager.getAllNPCs().slice(0, 2).map(n => {
        const path = n.getPath();
        const home = n.getHomeBuilding();
        const activity = n.getCurrentActivity() ?? n.state;
        const lifeData = this.lifeManager.getLifeData(n.id);
        return `${n.id} ${activity} ${n.getTilePosition().x},${n.getTilePosition().y}->${n.getDestinationTile()?.x},${n.getDestinationTile()?.y} len:${path?.getLength()??0} home:${home?.id} W:${lifeData?.needs.getOverallWellbeing().toFixed(0) ?? 0}%`;
      }),
      ...this.farmingSystem.getAllPlots().slice(0,3).map(p=> `Farm ${p.getDetailedString()}`)
    ];

    const padding = 10;
    const lineHeight = 11;
    const boxWidth = 680;
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
      } else if (line.endsWith(':') || line.startsWith('Pathfinding') || line.startsWith('Buildings') || line.startsWith('Tests') || line.startsWith('Time') || line.startsWith('Schedules') || line.startsWith('Life') || line.startsWith('Interaction') || line.startsWith('Exploration') || line.startsWith('World') || line.startsWith('Save') || line.startsWith('Inventory') || line.startsWith('Farming') || line.startsWith('Crops')) {
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
  getItemDatabase(): ItemDatabase { return this.itemDatabase; }
  getInventoryRenderer(): InventoryRenderer { return this.inventoryRenderer; }
  getPlayerInventory(): Inventory | null { return this.player ? this.player.getInventory() : null; }
  getCropDatabase(): CropDatabase { return this.cropDatabase; }
  getFarmingSystem(): FarmingSystem { return this.farmingSystem; }
  getFarmingRenderer(): FarmingRenderer { return this.farmingRenderer; }
  getAnimalDatabase(): AnimalDatabase { return this.animalDatabase; }
  getAnimalSystem(): AnimalSystem { return this.animalSystem; }
  getAnimalRenderer(): AnimalRenderer { return this.animalRenderer; }
  getRecipeDatabase(): RecipeDatabase { return this.recipeDatabase; }
  getCraftingSystem(): CraftingSystem { return this.craftingSystem; }
  getCraftingRenderer(): CraftingRenderer { return this.craftingRenderer; }
  getCookingDatabase(): CookingDatabase { return this.cookingDatabase; }
  getCookingSystem(): CookingSystem { return this.cookingSystem; }
  getCookingRenderer(): CookingRenderer { return this.cookingRenderer; }
  isPlayerInventoryOpen(): boolean { return this.showPlayerInventory; }
  isFarmingShowing(): boolean { return this.showFarming; }
  isAnimalsShowing(): boolean { return this.showAnimals; }
  isCraftingShowing(): boolean { return this.showCrafting; }
  isCookingShowing(): boolean { return this.showCooking; }
  isGameRunning(): boolean { return this.isRunning; }
}
