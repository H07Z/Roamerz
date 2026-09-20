/**
 * DebugManager - Phase 12 Exploration & World Expansion
 */

export interface MapDebugInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  tileCounts: Record<string, number>;
}

export interface PlayerDebugInfo {
  x: number;
  y: number;
  tileX: number;
  tileY: number;
  speed: number;
  direction: string;
  state: string;
  distance: number;
}

export interface CollisionDebugInfo {
  counts: Record<string, number>;
  isColliding: boolean;
  lastCollision: { x: number; y: number; type: number }[];
  showCollision: boolean;
}

export interface CameraDebugInfo {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  zoom: number;
  smoothing: number;
}

export interface NPCDebugInfo {
  count: number;
  npcs: { id: string; name: string; role: string; x: number; y: number; tileX: number; tileY: number; state: string; direction: string; targetX: number; targetY: number }[];
}

export interface PathfindingDebugInfo {
  gridCounts: { walkable: number; blocked: number };
  totalRequests: number;
  successful: number;
  failed: number;
  successRate: number;
  showPaths: boolean;
  showNavGrid: boolean;
}

export interface NPCPathDebugInfo {
  id: string;
  pathLength: number;
  currentNode: number;
  status: string;
  destination: { x: number; y: number } | null;
  start: { x: number; y: number } | null;
  stats: {
    requests: number;
    found: number;
    failed: number;
    distance: number;
    recalculations: number;
    homeVisits: number;
    isAtHome: boolean;
    hasHome: boolean;
    scheduleChanges: number;
    currentActivity: string | null;
    hasSchedule: boolean;
    activitiesCompleted: Record<string, number>;
  };
}

export interface BuildingDebugInfo {
  counts: { total: number; residential: number; withInterior: number; byType: Record<string, number> };
  showDoors: boolean;
  showLabels: boolean;
  showOwnership: boolean;
  showFronts: boolean;
}

export interface BuildingDetailInfo {
  id: string;
  name: string;
  type: number;
  x: number;
  y: number;
  doorX: number;
  doorY: number;
  ownerId: string | null;
  occupied: boolean;
  occupantId: string | null;
}

export interface TimeDebugInfo {
  day: number;
  hour: number;
  minute: number;
  second: number;
  phase: string;
  timeScale: number;
  isPaused: boolean;
  dayProgress: number;
  isDaytime: boolean;
}

export interface ScheduleDebugInfo {
  count: number;
  showSchedules: boolean;
  currentTimeMinutes: number;
}

export interface ScheduleDetailInfo {
  npcId: string;
  currentActivity: string | null;
  currentEntry: { start: string; end: string; activity: string; destination: string } | null;
  nextEntry: { start: string; end: string; activity: string } | null;
  entryCount: number;
  scheduleChanges: number;
  enabled: boolean;
}

export interface LifeDebugInfo {
  count: number;
  showNeeds: boolean;
  showInventory: boolean;
  showJobs: boolean;
  averageWellbeing: number;
  criticalCount: number;
  interactions: number;
}

export interface LifeDetailInfo {
  npcId: string;
  needs: { energy: number; hunger: number; social: number; happiness: number; health: number; overall: number; lowest: string | null; critical: string[] };
  inventory: { debug: string; value: number; count: number };
  job: { type: string; workDone: number; itemsProduced: number; coinsEarned: number; progress: number };
  stats: { socialInteractions: number; itemsProduced: number; homeVisits: number };
}

export interface InteractionDebugInfo {
  hasInteractable: boolean;
  currentType: string | null;
  currentId: string | null;
  currentName: string | null;
  nearbyCount: number;
  totalInteractions: number;
  range: number;
  prompt: string;
}

export interface DialogueDebugInfo {
  isOpen: boolean;
  isBuildingDialogue: boolean;
  activeNpcId: string | null;
  activeNpcName: string | null;
  currentNodeId: string | null;
  totalDialogues: number;
  totalChoices: number;
  historyCount: number;
  debug: string;
}

export interface ExplorationDebugInfo {
  currentMapId: string;
  currentMapName: string;
  discovered: number;
  total: number;
  percentage: number;
  totalDiscovered: number;
  totalTiles: number;
  totalPercentage: number;
  visionRadius: number;
  transitions: number;
  showFog: boolean;
  showMinimap: boolean;
  debug: string;
}

export interface WorldDebugInfo {
  currentMapId: string;
  currentMapName: string;
  mapCount: number;
  allMaps: { id: string; name: string; width: number; height: number; tileCount: number }[];
  playerMapId: string;
}

export interface SaveDebugInfo {
  version: number;
  gameVersion: string;
  slotCount: number;
  maxSlots: number;
  saveCount: number;
  lastSave: number;
  lastLoad: number;
  lastError: string | null;
  corrupted: number;
  playTime: number;
  autoSaveIn: number;
  showDebug: boolean;
}

export interface FarmingDebugInfo {
  cropCount: number;
  crops: string[];
  plotCount: number;
  mapPlotCount: number;
  debug: string;
  mapDebug: string;
  showFarming: boolean;
}

export interface AnimalDebugInfo {
  animalCount: number;
  animals: string[];
  totalCount: number;
  mapCount: number;
  debug: string;
  mapDebug: string;
  showAnimals: boolean;
}

export interface InventoryDebugInfo {
  databaseCount: number;
  categories: string[];
  playerUsed: number;
  playerCapacity: number;
  playerValue: number;
  playerCount: number;
  debug: string;
  sortMode: string;
  showUI: boolean;
}

export interface CraftingDebugInfo {
  recipeCount: number;
  recipes: string[];
  unlockedCount: number;
  totalCrafted: number;
  debug: string;
  showCrafting: boolean;
}


export class DebugManager {
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private fpsAccumulator: number = 0;
  private fpsSamples: number = 0;

  private gameTimeSeconds: number = 0;
  private totalFrames: number = 0;

  private screenWidth: number = 0;
  private screenHeight: number = 0;

  private enabled: boolean = true;

  private mapInfo: MapDebugInfo | null = null;
  private worldOffset: { x: number; y: number } = { x: 0, y: 0 };
  private playerInfo: PlayerDebugInfo | null = null;
  private playerAtBoundary: boolean = false;
  private playerBoundarySide: string | null = null;
  private collisionInfo: CollisionDebugInfo | null = null;
  private currentTileCollision: number | null = null;
  private cameraInfo: CameraDebugInfo | null = null;
  private npcInfo: NPCDebugInfo | null = null;
  private pathfindingInfo: PathfindingDebugInfo | null = null;
  private npcPathInfo: NPCPathDebugInfo[] = [];
  private buildingInfo: BuildingDebugInfo | null = null;
  private buildingDetails: BuildingDetailInfo[] = [];
  private timeInfo: TimeDebugInfo | null = null;
  private scheduleInfo: ScheduleDebugInfo | null = null;
  private scheduleDetails: ScheduleDetailInfo[] = [];
  private lifeInfo: LifeDebugInfo | null = null;
  private lifeDetails: LifeDetailInfo[] = [];
  private interactionInfo: InteractionDebugInfo | null = null;
  private dialogueInfo: DialogueDebugInfo | null = null;
  private explorationInfo: ExplorationDebugInfo | null = null;
  private worldInfo: WorldDebugInfo | null = null;
  private saveInfo: SaveDebugInfo | null = null;
  private farmingInfo: FarmingDebugInfo | null = null;
  private animalInfo: AnimalDebugInfo | null = null;
  private inventoryInfo: InventoryDebugInfo | null = null;
  private craftingInfo: CraftingDebugInfo | null = null;
  private currentPhase: string = '17';

  constructor() {
    this.lastFpsUpdate = performance.now();
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    this.gameTimeSeconds += deltaTime;
    this.totalFrames++;
    this.screenWidth = canvasWidth;
    this.screenHeight = canvasHeight;
    this.frameCount++;
    this.fpsAccumulator += deltaTime;
    this.fpsSamples++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      if (this.fpsAccumulator > 0) {
        this.fps = Math.round(this.fpsSamples / this.fpsAccumulator);
      }
      this.lastFpsUpdate = now;
      this.fpsAccumulator = 0;
      this.fpsSamples = 0;
    }
  }

  setMapInfo(info: MapDebugInfo): void { this.mapInfo = info; }
  setWorldOffset(x: number, y: number): void { this.worldOffset.x = x; this.worldOffset.y = y; }
  setPlayerInfo(info: PlayerDebugInfo): void { this.playerInfo = info; }
  setPlayerAtBoundary(atBoundary: boolean, side: string | null): void {
    this.playerAtBoundary = atBoundary;
    this.playerBoundarySide = side;
  }
  setCollisionInfo(info: CollisionDebugInfo): void { this.collisionInfo = info; }
  setCurrentTileCollision(type: number | null): void { this.currentTileCollision = type; }
  setCameraInfo(info: CameraDebugInfo): void { this.cameraInfo = info; }
  setNPCInfo(info: NPCDebugInfo): void { this.npcInfo = info; }
  setPathfindingInfo(info: PathfindingDebugInfo): void { this.pathfindingInfo = info; }
  setNPCPathInfo(info: NPCPathDebugInfo[]): void { this.npcPathInfo = info; }
  setBuildingInfo(info: BuildingDebugInfo): void { this.buildingInfo = info; }
  setBuildingDetails(details: BuildingDetailInfo[]): void { this.buildingDetails = details; }
  setTimeInfo(info: TimeDebugInfo): void { this.timeInfo = info; }
  setScheduleInfo(info: ScheduleDebugInfo): void { this.scheduleInfo = info; }
  setScheduleDetails(details: ScheduleDetailInfo[]): void { this.scheduleDetails = details; }
  setLifeInfo(info: LifeDebugInfo): void { this.lifeInfo = info; }
  setLifeDetails(details: LifeDetailInfo[]): void { this.lifeDetails = details; }
  setInteractionInfo(info: InteractionDebugInfo): void { this.interactionInfo = info; }
  setDialogueInfo(info: DialogueDebugInfo): void { this.dialogueInfo = info; }
  setExplorationInfo(info: ExplorationDebugInfo): void { this.explorationInfo = info; }
  setWorldInfo(info: WorldDebugInfo): void { this.worldInfo = info; }
  setSaveInfo(info: SaveDebugInfo): void { this.saveInfo = info; }
  setFarmingInfo(info: FarmingDebugInfo): void { this.farmingInfo = info; }
  setAnimalInfo(info: AnimalDebugInfo): void { this.animalInfo = info; }
  setInventoryInfo(info: InventoryDebugInfo): void { this.inventoryInfo = info; }
  setCraftingInfo(info: CraftingDebugInfo): void { this.craftingInfo = info; }

  getFps(): number { return this.fps; }

  formatGameTime(): string {
    const total = Math.floor(this.gameTimeSeconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  setEnabled(enabled: boolean): void { this.enabled = enabled; }
  isEnabled(): boolean { return this.enabled; }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled) return;

    const padding = 10;
    const lineHeight = 11;
    const boxWidth = 620;
    const baseHeight = 60;
    const mapHeight = this.mapInfo ? 15 : 0;
    const worldHeight = this.worldInfo ? 25 : 0;
    const explorationHeight = this.explorationInfo ? 20 : 0;
    const saveHeight = this.saveInfo ? 20 : 0;
    const timeHeight = this.timeInfo ? 35 : 0;
    const playerHeight = this.playerInfo ? 15 : 0;
    const cameraHeight = this.cameraInfo ? 15 : 0;
    const pathfindingHeight = this.pathfindingInfo ? 15 : 0;
    const buildingHeight = this.buildingInfo ? 15 : 0;
    const scheduleHeight = this.scheduleInfo ? 15 : 0;
    const lifeHeight = this.lifeInfo ? 15 : 0;
    const interactionHeight = this.interactionInfo ? 15 : 0;
    const dialogueHeight = this.dialogueInfo ? 15 : 0;
    const farmingHeight = this.farmingInfo ? 15 : 0;
    const animalHeight = this.animalInfo ? 15 : 0;
    const inventoryHeight = this.inventoryInfo ? 15 : 0;
    const craftingHeight = this.craftingInfo ? 15 : 0;
    const npcHeight = this.npcInfo ? Math.min(100, this.npcInfo.count * lineHeight + 15) : 0;
    const npcPathHeight = this.npcPathInfo.length > 0 ? Math.min(120, this.npcPathInfo.length * lineHeight + 15) : 0;
    const buildingDetailHeight = this.buildingDetails.length > 0 ? Math.min(60, this.buildingDetails.length * lineHeight + 15) : 0;
    const scheduleDetailHeight = this.scheduleDetails.length > 0 ? Math.min(120, this.scheduleDetails.length * lineHeight + 15) : 0;
    const lifeDetailHeight = this.lifeDetails.length > 0 ? Math.min(150, this.lifeDetails.length * lineHeight * 2 + 15) : 0;
    const boxHeight = baseHeight + mapHeight + worldHeight + explorationHeight + saveHeight + timeHeight + playerHeight + cameraHeight + pathfindingHeight + buildingHeight + scheduleHeight + lifeHeight + interactionHeight + dialogueHeight + farmingHeight + animalHeight + inventoryHeight + craftingHeight + npcHeight + npcPathHeight + buildingDetailHeight + scheduleDetailHeight + lifeDetailHeight + 20;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(padding, padding, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, boxWidth, boxHeight);

    ctx.font = '9px monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#8f8';
    ctx.fillText(`─ PHASE ${this.currentPhase} DEBUG ─`, padding + 10, padding + 6);

    ctx.fillStyle = '#ddd';
    let y = padding + 18;
    const x = padding + 8;

    ctx.fillText(`FPS:${this.fps} Time:${this.formatGameTime()} ${this.screenWidth}x${this.screenHeight} Frames:${this.totalFrames}`, x, y);
    y += lineHeight;

    if (this.worldInfo) {
      ctx.fillStyle = '#8ff';
      ctx.fillText(`WORLD: ${this.worldInfo.mapCount} maps Current:${this.worldInfo.currentMapId}(${this.worldInfo.currentMapName}) PlayerMap:${this.worldInfo.playerMapId} | ${this.worldInfo.allMaps.map(m=>m.id).join(',')}`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.explorationInfo) {
      ctx.fillStyle = '#fa8';
      ctx.fillText(`EXPLORATION: ${this.explorationInfo.currentMapName} ${this.explorationInfo.discovered}/${this.explorationInfo.total} (${this.explorationInfo.percentage.toFixed(1)}%) Total ${this.explorationInfo.totalDiscovered}/${this.explorationInfo.totalTiles} (${this.explorationInfo.totalPercentage.toFixed(1)}%) Vision:${this.explorationInfo.visionRadius} Trans:${this.explorationInfo.transitions} Fog:${this.explorationInfo.showFog?'ON':'OFF'}(F) Mini:${this.explorationInfo.showMinimap?'ON':'OFF'}(TAB)`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.saveInfo) {
      ctx.fillStyle = '#8f8';
      const lastSaveStr = this.saveInfo.lastSave ? new Date(this.saveInfo.lastSave).toLocaleTimeString() : 'never';
      const lastLoadStr = this.saveInfo.lastLoad ? new Date(this.saveInfo.lastLoad).toLocaleTimeString() : 'never';
      ctx.fillText(`SAVE: v${this.saveInfo.version} ${this.saveInfo.gameVersion} Slots:${this.saveInfo.slotCount}/${this.saveInfo.maxSlots} Saves:${this.saveInfo.saveCount} Corrupt:${this.saveInfo.corrupted} Play:${(this.saveInfo.playTime/60).toFixed(1)}m Auto:${this.saveInfo.autoSaveIn.toFixed(0)}s LastSave:${lastSaveStr} LastLoad:${lastLoadStr} ${this.saveInfo.lastError ? `ERR:${this.saveInfo.lastError.substring(0,20)}` : ''}`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.inventoryInfo) {
      ctx.fillStyle = '#8af';
      ctx.fillText(`INVENTORY: DB ${this.inventoryInfo.databaseCount} items ${this.inventoryInfo.categories.slice(0,3).join(',')} | Player ${this.inventoryInfo.playerUsed}/${this.inventoryInfo.playerCapacity} Val:${this.inventoryInfo.playerValue} Count:${this.inventoryInfo.playerCount} Sort:${this.inventoryInfo.sortMode} UI:${this.inventoryInfo.showUI?'OPEN':'CLOSED'} ${this.inventoryInfo.debug.substring(0,40)}`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.farmingInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`FARMING: Crops ${this.farmingInfo.cropCount} ${this.farmingInfo.crops.join(',')} | ${this.farmingInfo.debug} | Map: ${this.farmingInfo.mapDebug} Overlay:${this.farmingInfo.showFarming?'ON':'OFF'}`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.animalInfo) {
      ctx.fillStyle = '#fa8';
      ctx.fillText(`ANIMALS: Types ${this.animalInfo.animalCount} ${this.animalInfo.animals.join(',')} | ${this.animalInfo.debug} | Map: ${this.animalInfo.mapDebug} Overlay:${this.animalInfo.showAnimals?'ON':'OFF'}`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.craftingInfo) {
      ctx.fillStyle = '#f8f';
      ctx.fillText(`CRAFTING: Recipes ${this.craftingInfo.recipeCount} ${this.craftingInfo.recipes.slice(0,4).join(',')} | Unlocked:${this.craftingInfo.unlockedCount} Crafted:${this.craftingInfo.totalCrafted} | ${this.craftingInfo.debug} UI:${this.craftingInfo.showCrafting?'OPEN':'CLOSED'}`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.timeInfo) {
      ctx.fillStyle = '#8ff';
      ctx.fillText(`TIME: Day ${this.timeInfo.day} ${String(this.timeInfo.hour).padStart(2,'0')}:${String(this.timeInfo.minute).padStart(2,'0')}:${String(this.timeInfo.second).padStart(2,'0')} Phase ${this.timeInfo.phase} ${this.timeInfo.isDaytime?'☀ DAY':'🌙 NIGHT'} Scale ${this.timeInfo.timeScale}x ${this.timeInfo.isPaused?'PAUSED':''} Progress ${(this.timeInfo.dayProgress*100).toFixed(0)}%`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.cameraInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`CAMERA: Offset ${Math.floor(this.cameraInfo.x)},${Math.floor(this.cameraInfo.y)} Zoom ${this.cameraInfo.zoom} Smooth ${this.cameraInfo.smoothing}`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.playerInfo) {
      ctx.fillText(`PLAYER: ${Math.floor(this.playerInfo.x)},${Math.floor(this.playerInfo.y)} Tile ${this.playerInfo.tileX},${this.playerInfo.tileY} ${this.playerInfo.state} Colliding:${this.collisionInfo?.isColliding?'YES':'NO'}`, x, y);
      y += lineHeight;
    }

    if (this.pathfindingInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`PATHFINDING: W:${this.pathfindingInfo.gridCounts.walkable} B:${this.pathfindingInfo.gridCounts.blocked} Req:${this.pathfindingInfo.totalRequests} OK:${this.pathfindingInfo.successful} Fail:${this.pathfindingInfo.failed} Rate:${(this.pathfindingInfo.successRate*100).toFixed(0)}% Paths:${this.pathfindingInfo.showPaths?'ON':'OFF'}(N) Nav:${this.pathfindingInfo.showNavGrid?'ON':'OFF'}(M)`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.buildingInfo) {
      ctx.fillStyle = '#8f8';
      const c = this.buildingInfo.counts;
      ctx.fillText(`BUILDINGS: Total:${c.total} Res:${c.residential} | Doors:${this.buildingInfo.showDoors?'ON':'OFF'}(J) Labels:${this.buildingInfo.showLabels?'ON':'OFF'}(L) Own:${this.buildingInfo.showOwnership?'ON':'OFF'}(U)`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.scheduleInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`SCHEDULES: ${this.scheduleInfo.count} NPCs | Time ${Math.floor(this.scheduleInfo.currentTimeMinutes/60)}:${String(this.scheduleInfo.currentTimeMinutes%60).padStart(2,'0')} | Show:${this.scheduleInfo.showSchedules?'ON':'OFF'}(Q)`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.lifeInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`LIFE: ${this.lifeInfo.count} NPCs AvgWellbeing:${this.lifeInfo.averageWellbeing.toFixed(0)}% Critical:${this.lifeInfo.criticalCount} Interactions:${this.lifeInfo.interactions} Needs:${this.lifeInfo.showNeeds?'ON':'OFF'}(;) Inv:${this.lifeInfo.showInventory?'ON':'OFF'}(,) Jobs:${this.lifeInfo.showJobs?'ON':'OFF'}(.)`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.interactionInfo) {
      ctx.fillStyle = this.interactionInfo.hasInteractable ? '#ff8' : '#aaa';
      ctx.fillText(`INTERACTION: ${this.interactionInfo.hasInteractable ? `${this.interactionInfo.currentType} ${this.interactionInfo.currentName} (${this.interactionInfo.currentId}) ${this.interactionInfo.nearbyCount} nearby` : 'None'} Total:${this.interactionInfo.totalInteractions} Range:${this.interactionInfo.range}px (E to interact)`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      if (this.interactionInfo.prompt) {
        ctx.fillText(`  Prompt: ${this.interactionInfo.prompt.substring(0, 80)}`, x, y);
        y += lineHeight;
      }
    }

    if (this.dialogueInfo) {
      ctx.fillStyle = this.dialogueInfo.isOpen ? '#f8f' : '#aaa';
      ctx.fillText(`DIALOGUE: ${this.dialogueInfo.isOpen ? `OPEN ${this.dialogueInfo.isBuildingDialogue ? 'Building' : `NPC ${this.dialogueInfo.activeNpcName} (${this.dialogueInfo.activeNpcId}) Node ${this.dialogueInfo.currentNodeId}`}` : 'CLOSED'} Total:${this.dialogueInfo.totalDialogues} Choices:${this.dialogueInfo.totalChoices} Hist:${this.dialogueInfo.historyCount} | 1-4 choose, ESC close`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.npcInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`NPCS (${this.npcInfo.count}):`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      for (const npc of this.npcInfo.npcs) {
        ctx.fillText(`${npc.id} ${npc.name}(${npc.role[0]}) ${npc.state} ${npc.tileX},${npc.tileY}`, x, y);
        y += lineHeight;
      }
    }

    if (this.npcPathInfo.length > 0) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`PATHS & SCHEDULES:`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      for (const p of this.npcPathInfo) {
        const statusColor = p.status === 'FOUND' || p.status === 'FOLLOWING' ? '#8ff' : p.status.includes('HOME') || p.status.includes('WORK') || p.status.includes('SLEEP') ? '#fa8' : '#f88';
        ctx.fillStyle = statusColor;
        ctx.fillText(`${p.id} ${p.status} Len:${p.pathLength} H:${p.stats.homeVisits} Sched:${p.stats.scheduleChanges} Act:${p.stats.currentActivity ?? 'none'} ${p.stats.isAtHome?'AT_HOME':''}`, x, y);
        y += lineHeight;
        ctx.fillStyle = '#ddd';
      }
    }

    if (this.scheduleDetails.length > 0) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`SCHEDULE DETAILS:`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      for (const s of this.scheduleDetails) {
        const activityColor = s.currentActivity ? '#8ff' : '#aaa';
        ctx.fillStyle = activityColor;
        ctx.fillText(`${s.npcId} ${s.enabled?'ON':'OFF'} ${s.currentActivity ?? 'none'} ${s.currentEntry ? `${s.currentEntry.start}-${s.currentEntry.end} ${s.currentEntry.activity} -> ${s.currentEntry.destination}` : 'no entry'} Next: ${s.nextEntry ? `${s.nextEntry.start} ${s.nextEntry.activity}` : 'none'}`, x, y);
        y += lineHeight;
        ctx.fillStyle = '#ddd';
      }
    }

    if (this.lifeDetails.length > 0) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`LIFE DETAILS:`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      for (const l of this.lifeDetails) {
        const wellbeingColor = l.needs.overall < 30 ? '#f88' : l.needs.overall < 60 ? '#ff8' : '#8f8';
        ctx.fillStyle = wellbeingColor;
        ctx.fillText(`${l.npcId} W:${l.needs.overall.toFixed(0)}% E:${l.needs.energy.toFixed(0)} H:${l.needs.hunger.toFixed(0)} S:${l.needs.social.toFixed(0)} Hap:${l.needs.happiness.toFixed(0)} Health:${l.needs.health.toFixed(0)} ${l.needs.critical.length>0?`CRIT:${l.needs.critical.join(',')}`:''} Lowest:${l.needs.lowest ?? 'none'}`, x, y);
        y += lineHeight;
        ctx.fillStyle = '#aaa';
        ctx.fillText(`  ${l.job.type} Work:${l.job.workDone.toFixed(1)}h Prod:${l.job.itemsProduced} Coins:${l.job.coinsEarned} Inv:${l.inventory.debug} Val:${l.inventory.value} Inter:${l.stats.socialInteractions}`, x, y);
        y += lineHeight;
        ctx.fillStyle = '#ddd';
      }
    }

    if (this.buildingDetails.length > 0) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`BUILDING DETAILS:`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      for (const b of this.buildingDetails) {
        const occupiedColor = b.occupied ? '#8f8' : '#aaa';
        ctx.fillStyle = occupiedColor;
        ctx.fillText(`${b.id} door ${b.doorX},${b.doorY} owner ${b.ownerId ?? 'none'} ${b.occupied ? `OCCUPIED by ${b.occupantId}` : ''}`, x, y);
        y += lineHeight;
        ctx.fillStyle = '#ddd';
      }
    }

    if (this.mapInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`MAP: ${this.mapInfo.id} ${this.mapInfo.width}x${this.mapInfo.height}`, x, y);
      y += lineHeight;
    }

    let fpsColor = '#8f8';
    if (this.fps < 30) fpsColor = '#f88';
    else if (this.fps < 50) fpsColor = '#ff8';
    ctx.fillStyle = fpsColor;
    ctx.fillRect(padding + boxWidth - 12, padding + 6, 8, 8);

    ctx.restore();
  }

  renderCenterLabel(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.enabled) return;
    ctx.save();
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ROAMERZ', canvasWidth / 2, canvasHeight / 2 - 20);
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(180,255,180,0.8)';
    ctx.fillText(`Phase 13 - Save, Load & World Persistence`, canvasWidth / 2, canvasHeight / 2);
    ctx.restore();
  }
}
