/**
 * NPCRenderer - Phase 6
 * Renders NPCs with placeholder shapes, distinct per role
 */

import { NPC, NPCState } from './NPC';
import { WorldRenderer } from '../world/WorldRenderer';
import { Camera } from '../camera/Camera';

export class NPCRenderer {
  private walkAnimTime: Map<string, number> = new Map();

  constructor() {}

  update(deltaTime: number, npcs: NPC[]): void {
    for (const npc of npcs) {
      if (npc.state === NPCState.WALK) {
        const current = this.walkAnimTime.get(npc.id) ?? 0;
        this.walkAnimTime.set(npc.id, current + deltaTime * 8);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, npc: NPC, worldRenderer: WorldRenderer, camera?: Camera): void {
    // Use camera if provided, else worldRenderer offset
    let screenPos: { x: number; y: number };
    if (camera) {
      screenPos = camera.worldToScreen(npc.x, npc.y);
    } else {
      screenPos = worldRenderer.worldToScreen(npc.x, npc.y);
    }

    const x = screenPos.x;
    const y = screenPos.y;

    // Culling
    if (x < -32 || y < -32 || x > ctx.canvas.width + 32 || y > ctx.canvas.height + 32) return;

    ctx.save();

    const animTime = this.walkAnimTime.get(npc.id) ?? 0;
    let bobOffset = 0;
    if (npc.state === NPCState.WALK) {
      bobOffset = Math.sin(animTime) * 1.5;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Role-based colors
    const colors = this.getRoleColors(npc.role);

    // Body
    ctx.fillStyle = colors.body;
    ctx.fillRect(x - 7, y - 5 + bobOffset, 14, 12);

    // Head
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(x, y - 8 + bobOffset, 7, 0, Math.PI * 2);
    ctx.fill();

    // Hat / hair based on role
    ctx.fillStyle = colors.hat;
    ctx.beginPath();
    ctx.arc(x, y - 11 + bobOffset, 7, Math.PI, 0);
    ctx.fill();

    // Role indicator icon
    ctx.fillStyle = colors.accent;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.getRoleIcon(npc.role), x, y - 20 + bobOffset);

    // Direction indicator
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const dirOffset = this.getDirectionOffset(npc.direction);
    ctx.beginPath();
    ctx.arc(x + dirOffset.x, y - 8 + bobOffset + dirOffset.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // State indicator
    ctx.fillStyle = npc.state === NPCState.IDLE ? '#8f8' : '#ff8';
    ctx.beginPath();
    ctx.arc(x + 9, y - 12 + bobOffset, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Name label
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 20, y + 14, 40, 12);
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name.substring(0, 8), x, y + 22);

    // ID for debug
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '7px monospace';
    ctx.fillText(npc.id, x, y + 30);

    ctx.restore();
  }

  renderAll(ctx: CanvasRenderingContext2D, npcs: NPC[], worldRenderer: WorldRenderer, camera?: Camera): void {
    // Sort by Y for proper overlap (top-down)
    const sorted = [...npcs].sort((a, b) => a.y - b.y);
    for (const npc of sorted) {
      this.render(ctx, npc, worldRenderer, camera);
    }
  }

  renderDebugPath(ctx: CanvasRenderingContext2D, npc: NPC, worldRenderer: WorldRenderer, camera?: Camera): void {
    // Phase 6: Show movement between two points
    const points = npc.getPoints();
    const target = npc.getTarget();

    let screenA, screenB, screenTarget, screenPos;
    if (camera) {
      screenA = camera.worldToScreen(points.a.x, points.a.y);
      screenB = camera.worldToScreen(points.b.x, points.b.y);
      screenTarget = camera.worldToScreen(target.x, target.y);
      screenPos = camera.worldToScreen(npc.x, npc.y);
    } else {
      screenA = worldRenderer.worldToScreen(points.a.x, points.a.y);
      screenB = worldRenderer.worldToScreen(points.b.x, points.b.y);
      screenTarget = worldRenderer.worldToScreen(target.x, target.y);
      screenPos = worldRenderer.worldToScreen(npc.x, npc.y);
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(screenA.x, screenA.y);
    ctx.lineTo(screenB.x, screenB.y);
    ctx.stroke();

    // Points
    ctx.fillStyle = 'rgba(100, 255, 100, 0.6)';
    ctx.beginPath();
    ctx.arc(screenA.x, screenA.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenB.x, screenB.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Target
    ctx.fillStyle = 'rgba(255, 255, 100, 0.8)';
    ctx.beginPath();
    ctx.arc(screenTarget.x, screenTarget.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Line from NPC to target
    ctx.strokeStyle = 'rgba(255, 255, 100, 0.5)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(screenPos.x, screenPos.y);
    ctx.lineTo(screenTarget.x, screenTarget.y);
    ctx.stroke();

    ctx.restore();
  }

  renderAllDebugPaths(ctx: CanvasRenderingContext2D, npcs: NPC[], worldRenderer: WorldRenderer, camera?: Camera): void {
    for (const npc of npcs) {
      this.renderDebugPath(ctx, npc, worldRenderer, camera);
    }
  }

  private getRoleColors(role: string): { body: string; skin: string; hat: string; accent: string } {
    switch (role) {
      case 'farmer':
        return { body: '#6a8a3a', skin: '#e8c8a0', hat: '#8a6a2a', accent: '#aaff5a' };
      case 'shopkeeper':
        return { body: '#8a5a3a', skin: '#e8c8a0', hat: '#3a5a8a', accent: '#ffaa5a' };
      case 'blacksmith':
        return { body: '#5a5a5a', skin: '#d8a080', hat: '#2a2a2a', accent: '#ff5a5a' };
      case 'villager':
        return { body: '#5a7a8a', skin: '#e8c8a0', hat: '#4a6a5a', accent: '#5aafff' };
      case 'child':
        return { body: '#8a6a9a', skin: '#f0d0a0', hat: '#9a8a3a', accent: '#ff8aff' };
      default:
        return { body: '#6a6a6a', skin: '#e8c8a0', hat: '#4a4a4a', accent: '#ffffff' };
    }
  }

  private getRoleIcon(role: string): string {
    switch (role) {
      case 'farmer': return 'F';
      case 'shopkeeper': return 'S';
      case 'blacksmith': return 'B';
      case 'villager': return 'V';
      case 'child': return 'C';
      default: return '?';
    }
  }

  private getDirectionOffset(dir: string): { x: number; y: number } {
    switch (dir) {
      case 'up': return { x: 0, y: -1 };
      case 'down': return { x: 0, y: 1 };
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
      default: return { x: 0, y: 0 };
    }
  }
}
