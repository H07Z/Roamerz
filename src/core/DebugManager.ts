/**
 * DebugManager - Phase 5+6
 * Camera + NPC info
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
  private currentPhase: string = '5+6';

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
    const lineHeight = 12;
    const boxWidth = 380;
    const baseHeight = 70;
    const mapHeight = this.mapInfo ? 35 : 0;
    const playerHeight = this.playerInfo ? 60 : 0;
    const collisionHeight = this.collisionInfo ? 40 : 0;
    const cameraHeight = this.cameraInfo ? 35 : 0;
    const npcHeight = this.npcInfo ? 90 : 0;
    const boxHeight = baseHeight + mapHeight + playerHeight + collisionHeight + cameraHeight + npcHeight + 15;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(padding, padding, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, boxWidth, boxHeight);

    ctx.font = '10px monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#8f8';
    ctx.fillText(`─ PHASE ${this.currentPhase} DEBUG ─`, padding + 10, padding + 8);

    ctx.fillStyle = '#ddd';
    let y = padding + 20;
    const x = padding + 10;

    ctx.fillText(`FPS:${this.fps} Time:${this.formatGameTime()} ${this.screenWidth}x${this.screenHeight} Frames:${this.totalFrames} RUNNING`, x, y);
    y += lineHeight;

    if (this.cameraInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`─ CAMERA ─`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      ctx.fillText(`Offset:${Math.floor(this.cameraInfo.x)},${Math.floor(this.cameraInfo.y)} Target:${Math.floor(this.cameraInfo.targetX)},${Math.floor(this.cameraInfo.targetY)} Zoom:${this.cameraInfo.zoom} Smooth:${this.cameraInfo.smoothing}`, x, y);
      y += lineHeight + 2;
    }

    if (this.playerInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`─ PLAYER ─`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      ctx.fillText(`Pos:${Math.floor(this.playerInfo.x)},${Math.floor(this.playerInfo.y)} Tile:${this.playerInfo.tileX},${this.playerInfo.tileY} ${this.playerInfo.state} ${this.playerInfo.direction} Colliding:${this.collisionInfo?.isColliding?'YES':'NO'}`, x, y);
      y += lineHeight;
      if (this.currentTileCollision !== null) {
        const names = ['WALKABLE','BLOCKED','INTERACTABLE'];
        ctx.fillText(`Tile:${names[this.currentTileCollision]??'UNK'} Boundary:${this.playerAtBoundary?this.playerBoundarySide:'NO'} Dist:${Math.floor(this.playerInfo.distance)}`, x, y);
        y += lineHeight;
      }
      y += 2;
    }

    if (this.npcInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`─ NPCS (${this.npcInfo.count}) ─`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      for (const npc of this.npcInfo.npcs) {
        ctx.fillText(`${npc.id} ${npc.name}(${npc.role[0]}) ${npc.state} ${npc.tileX},${npc.tileY}->${Math.floor(npc.targetX/32)},${Math.floor(npc.targetY/32)}`, x, y);
        y += lineHeight;
      }
      y += 2;
    }

    if (this.collisionInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`─ COLLISION ─`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      const c = this.collisionInfo.counts;
      ctx.fillText(`W:${c.WALKABLE} B:${c.BLOCKED} I:${c.INTERACTABLE} Overlay:${this.collisionInfo.showCollision?'ON':'OFF'}(K)`, x, y);
      y += lineHeight + 2;
    }

    if (this.mapInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`─ MAP: ${this.mapInfo.id} ─`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      const counts = this.mapInfo.tileCounts;
      const countStr = Object.entries(counts).map(([k,v])=>`${k[0]}:${v}`).join(' ');
      ctx.fillText(`${this.mapInfo.name} ${this.mapInfo.width}x${this.mapInfo.height} ${countStr}`, x, y);
      y += lineHeight;
    }

    let fpsColor = '#8f8';
    if (this.fps < 30) fpsColor = '#f88';
    else if (this.fps < 50) fpsColor = '#ff8';
    ctx.fillStyle = fpsColor;
    ctx.fillRect(padding + boxWidth - 14, padding + 8, 8, 8);

    ctx.restore();
  }

  renderCenterLabel(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.enabled) return;
    ctx.save();
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ROAMERZ', canvasWidth / 2, canvasHeight / 2 - 20);
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(180,255,180,0.8)';
    ctx.fillText(`Phase 5+6 - Camera + NPC Foundation`, canvasWidth / 2, canvasHeight / 2 + 5);
    ctx.restore();
  }
}
