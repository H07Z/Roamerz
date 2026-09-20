/**
 * PlayerRenderer - Phase 3
 * Renders player with placeholder graphics
 * Simple rectangle/circle as per spec, with direction indicator
 */

import { Player, PlayerDirection, PlayerState } from './Player';
import { WorldRenderer } from '../world/WorldRenderer';

export class PlayerRenderer {
  // For walk animation bobbing
  private walkAnimTime: number = 0;

  constructor() {}

  update(deltaTime: number, player: Player): void {
    if (player.state === PlayerState.WALK) {
      this.walkAnimTime += deltaTime * 10; // bob speed
    }
  }

  render(ctx: CanvasRenderingContext2D, player: Player, worldRenderer: WorldRenderer): void {
    const screenPos = worldRenderer.worldToScreen(player.x, player.y);
    const x = screenPos.x;
    const y = screenPos.y;
    const zoom = worldRenderer.getZoom();

    // Don't render if off-screen (culling)
    const tileSize = worldRenderer.getTileSize() * zoom;
    if (x < -tileSize || y < -tileSize || x > ctx.canvas.width + tileSize || y > ctx.canvas.height + tileSize) {
      return;
    }

    ctx.save();

    // Walk bobbing
    let bobOffset = 0;
    if (player.state === PlayerState.WALK) {
      bobOffset = Math.sin(this.walkAnimTime) * 2 * zoom;
    }

    const s = zoom; // scale factor

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 12 * s, 10 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body - rectangle
    ctx.fillStyle = '#4a8a4a'; // green tunic
    ctx.fillRect(x - 8 * s, y - 6 * s + bobOffset, 16 * s, 14 * s);

    // Head - circle
    ctx.fillStyle = '#e8c8a0'; // skin
    ctx.beginPath();
    ctx.arc(x, y - 10 * s + bobOffset, 8 * s, 0, Math.PI * 2);
    ctx.fill();

    // Hair / hat
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.arc(x, y - 13 * s + bobOffset, 8 * s, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 8 * s, y - 14 * s + bobOffset, 16 * s, 3 * s);

    // Direction indicator - eyes looking direction
    ctx.fillStyle = '#000';
    const eyeOffsetX = this.getDirectionEyeOffset(player.direction).x * s;
    const eyeOffsetY = this.getDirectionEyeOffset(player.direction).y * s;

    // Left eye
    ctx.beginPath();
    ctx.arc(x - 3 * s + eyeOffsetX, y - 10 * s + bobOffset + eyeOffsetY, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();
    // Right eye
    ctx.beginPath();
    ctx.arc(x + 3 * s + eyeOffsetX, y - 10 * s + bobOffset + eyeOffsetY, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Direction arrow for debugging - small triangle showing facing
    this.renderDirectionIndicator(ctx, x, y + bobOffset, player.direction, s);

    // State indicator - small dot: green = idle, yellow = walk
    ctx.fillStyle = player.state === PlayerState.IDLE ? '#8f8' : '#ff8';
    ctx.beginPath();
    ctx.arc(x + 10 * s, y - 14 * s + bobOffset, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Player outline for visibility
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 8 * s, y - 18 * s + bobOffset, 16 * s, 26 * s);

    ctx.restore();
  }

  private getDirectionEyeOffset(dir: PlayerDirection): { x: number; y: number } {
    switch (dir) {
      case PlayerDirection.UP:
        return { x: 0, y: -1 };
      case PlayerDirection.DOWN:
        return { x: 0, y: 1 };
      case PlayerDirection.LEFT:
        return { x: -1, y: 0 };
      case PlayerDirection.RIGHT:
        return { x: 1, y: 0 };
      case PlayerDirection.UP_LEFT:
        return { x: -1, y: -1 };
      case PlayerDirection.UP_RIGHT:
        return { x: 1, y: -1 };
      case PlayerDirection.DOWN_LEFT:
        return { x: -1, y: 1 };
      case PlayerDirection.DOWN_RIGHT:
        return { x: 1, y: 1 };
      default:
        return { x: 0, y: 0 };
    }
  }

  private renderDirectionIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, dir: PlayerDirection, scale: number = 1): void {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 100, 0.9)';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;

    let angle = 0;
    switch (dir) {
      case PlayerDirection.UP:
        angle = -Math.PI / 2;
        break;
      case PlayerDirection.DOWN:
        angle = Math.PI / 2;
        break;
      case PlayerDirection.LEFT:
        angle = Math.PI;
        break;
      case PlayerDirection.RIGHT:
        angle = 0;
        break;
      case PlayerDirection.UP_LEFT:
        angle = -3 * Math.PI / 4;
        break;
      case PlayerDirection.UP_RIGHT:
        angle = -Math.PI / 4;
        break;
      case PlayerDirection.DOWN_LEFT:
        angle = 3 * Math.PI / 4;
        break;
      case PlayerDirection.DOWN_RIGHT:
        angle = Math.PI / 4;
        break;
    }

    // Draw small arrow 14px from center in direction
    const dist = 14 * scale;
    const ax = x + Math.cos(angle) * dist;
    const ay = y - 6 * scale + Math.sin(angle) * dist;

    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(-3, -2);
    ctx.lineTo(-3, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // For future: render with sprite
  // Placeholder for Phase 29 sprite animation
}
