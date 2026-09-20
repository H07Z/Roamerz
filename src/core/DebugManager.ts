/**
 * DebugManager - Phase 4
 * Tracks FPS, game time, world, player, collision info
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
  private currentPhase: number = 4;

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

  getFps(): number { return this.fps; }
  getGameTime(): number { return this.gameTimeSeconds; }
  getScreenSize(): { width: number; height: number } { return { width: this.screenWidth, height: this.screenHeight }; }
  getTotalFrames(): number { return this.totalFrames; }

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
    const lineHeight = 13;
    const boxWidth = 340;
    const baseHeight = 90;
    const mapHeight = this.mapInfo ? 60 : 0;
    const playerHeight = this.playerInfo ? 95 : 0;
    const collisionHeight = this.collisionInfo ? 85 : 0;
    const boxHeight = baseHeight + mapHeight + playerHeight + collisionHeight + 15;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(padding, padding, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, boxWidth, boxHeight);

    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#8f8';
    ctx.fillText(`─ PHASE ${this.currentPhase} DEBUG ─`, padding + 10, padding + 8);

    ctx.fillStyle = '#ddd';
    let y = padding + 22;
    const x = padding + 10;

    ctx.fillText(`FPS: ${this.fps} | Time: ${this.formatGameTime()} | ${this.screenWidth}x${this.screenHeight} | Frames: ${this.totalFrames}`, x, y);
    y += lineHeight;
    ctx.fillText(`Offset: ${Math.floor(this.worldOffset.x)},${Math.floor(this.worldOffset.y)} | RUNNING`, x, y);
    y += lineHeight + 4;

    if (this.playerInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`─ PLAYER ─`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      ctx.font = '10px monospace';
      ctx.fillText(`Pos:${Math.floor(this.playerInfo.x)},${Math.floor(this.playerInfo.y)} Tile:${this.playerInfo.tileX},${this.playerInfo.tileY} Speed:${this.playerInfo.speed} Dir:${this.playerInfo.direction} State:${this.playerInfo.state}`, x, y);
      y += lineHeight;
      ctx.fillText(`Dist:${Math.floor(this.playerInfo.distance)} Boundary:${this.playerAtBoundary ? 'YES('+this.playerBoundarySide+')' : 'NO'} Colliding:${this.collisionInfo?.isColliding ? 'YES' : 'NO'}`, x, y);
      y += lineHeight;
      if (this.currentTileCollision !== null) {
        const names = ['WALKABLE','BLOCKED','INTERACTABLE'];
        const name = names[this.currentTileCollision] ?? 'UNKNOWN';
        const color = this.currentTileCollision === 1 ? '#f88' : this.currentTileCollision === 2 ? '#ff8' : '#8f8';
        ctx.fillStyle = color;
        ctx.fillText(`Current Tile: ${name} (${this.currentTileCollision})`, x, y);
        ctx.fillStyle = '#ddd';
        y += lineHeight;
      }
      if (this.collisionInfo && this.collisionInfo.lastCollision.length > 0) {
        ctx.fillStyle = '#f88';
        const collStr = this.collisionInfo.lastCollision.map(c => `(${c.x},${c.y})`).join(' ');
        ctx.fillText(`Blocked: ${collStr}`, x, y);
        ctx.fillStyle = '#ddd';
        y += lineHeight;
      }
      y += 2;
      ctx.font = '11px monospace';
    }

    if (this.collisionInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`─ COLLISION ─`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      ctx.font = '10px monospace';
      const c = this.collisionInfo.counts;
      ctx.fillText(`WALKABLE:${c.WALKABLE} BLOCKED:${c.BLOCKED} INTERACT:${c.INTERACTABLE} Overlay:${this.collisionInfo.showCollision?'ON':'OFF'} (K)`, x, y);
      y += lineHeight;
      ctx.fillText(`GRASS/ROAD/BRIDGE/FARM=WALKABLE | WATER/TREE/ROCK/HOUSE=BLOCKED | Door=INTERACT`, x, y);
      y += lineHeight + 2;
      ctx.font = '11px monospace';
    }

    if (this.mapInfo) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`─ MAP: ${this.mapInfo.id} ─`, x, y);
      y += lineHeight;
      ctx.fillStyle = '#ddd';
      ctx.font = '10px monospace';
      const counts = this.mapInfo.tileCounts;
      const countStr = Object.entries(counts).map(([k,v])=>`${k[0]}:${v}`).join(' ');
      ctx.fillText(`${this.mapInfo.name} ${this.mapInfo.width}x${this.mapInfo.height} ${countStr}`, x, y);
      y += lineHeight;
      ctx.font = '11px monospace';
    }

    let fpsColor = '#8f8';
    if (this.fps < 30) fpsColor = '#f88';
    else if (this.fps < 50) fpsColor = '#ff8';
    ctx.fillStyle = fpsColor;
    ctx.fillRect(padding + boxWidth - 18, padding + 10, 8, 8);

    ctx.restore();
  }

  renderCenterLabel(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.enabled) return;
    ctx.save();
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ROAMERZ', canvasWidth / 2, canvasHeight / 2 - 30);
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(180,255,180,0.8)';
    ctx.fillText(`Phase ${this.currentPhase} - Collision System`, canvasWidth / 2, canvasHeight / 2);
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('WASD to move, K collision overlay, test Tree/Rock/Water/House/Bridge', canvasWidth / 2, canvasHeight / 2 + 25);
    ctx.restore();
  }
}
