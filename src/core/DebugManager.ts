/**
 * DebugManager - Phase 7 Pathfinding
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
  stats: { requests: number; found: number; failed: number; distance: number; recalculations: number };
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
  private currentPhase: string = '7';

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
    const boxWidth = 420;
    const baseHeight = 60;
    const mapHeight = this.mapInfo ? 25 : 0;
    const playerHeight = this.playerInfo ? 35 : 0;
    const cameraHeight = this.cameraInfo ? 25 : 0;
    const pathfindingHeight = this.pathfindingInfo ? 50 : 0;
    const npcHeight = this.npcInfo ? Math.min(120, this.npcInfo.count * lineHeight + 15) : 0;
    const npcPathHeight = this.npcPathInfo.length > 0 ? Math.min(100, this.npcPathInfo.length * lineHeight + 15) : 0;
    const boxHeight = baseHeight + mapHeight + playerHeight + cameraHeight + pathfindingHeight + npcHeight + npcPathHeight + 20;

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

    if (this.cameraInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`CAMERA: Offset ${Math.floor(this.cameraInfo.x)},${Math.floor(this.cameraInfo.y)} Target ${Math.floor(this.cameraInfo.targetX)},${Math.floor(this.cameraInfo.targetY)} Zoom ${this.cameraInfo.zoom} Smooth ${this.cameraInfo.smoothing}`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.playerInfo) {
      ctx.fillText(`PLAYER: ${Math.floor(this.playerInfo.x)},${Math.floor(this.playerInfo.y)} Tile ${this.playerInfo.tileX},${this.playerInfo.tileY} ${this.playerInfo.state} ${this.playerInfo.direction} Colliding:${this.collisionInfo?.isColliding?'YES':'NO'}`, x, y);
      y += lineHeight;
    }

    if (this.pathfindingInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`PATHFINDING: Grid W:${this.pathfindingInfo.gridCounts.walkable} B:${this.pathfindingInfo.gridCounts.blocked} | Req:${this.pathfindingInfo.totalRequests} OK:${this.pathfindingInfo.successful} Fail:${this.pathfindingInfo.failed} Rate:${(this.pathfindingInfo.successRate*100).toFixed(0)}% | Paths:${this.pathfindingInfo.showPaths?'ON':'OFF'}(N) Nav:${this.pathfindingInfo.showNavGrid?'ON':'OFF'}(M)`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
    }

    if (this.npcInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`NPCS (${this.npcInfo.count}):`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      for (const npc of this.npcInfo.npcs) {
        ctx.fillText(`${npc.id} ${npc.name}(${npc.role[0]}) ${npc.state} ${npc.tileX},${npc.tileY}->${Math.floor(npc.targetX/32)},${Math.floor(npc.targetY/32)}`, x, y);
        y += lineHeight;
      }
    }

    if (this.npcPathInfo.length > 0) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`PATHS:`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      for (const p of this.npcPathInfo) {
        const statusColor = p.status === 'FOUND' || p.status === 'FOLLOWING' ? '#8ff' : '#f88';
        ctx.fillStyle = statusColor;
        ctx.fillText(`${p.id} ${p.status} Len:${p.pathLength} Cur:${p.currentNode}/${p.pathLength} Dest:${p.destination?.x},${p.destination?.y} Req:${p.stats.requests} Found:${p.stats.found} Fail:${p.stats.failed} Recalc:${p.stats.recalculations}`, x, y);
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
    ctx.fillText(`Phase 7 - NPC Pathfinding A*`, canvasWidth / 2, canvasHeight / 2);
    ctx.restore();
  }
}
