/**
 * LifeRenderer - Phase 10 NPC Life Simulation
 * Renders needs bars, inventory, job indicators
 */

import { NPC } from '../npc/NPC';
import { LifeManager } from './LifeManager';
import { NeedType, getNeedProperties } from './NeedType';
import { WorldRenderer } from '../world/WorldRenderer';
import { Camera } from '../camera/Camera';

export class LifeRenderer {
  private showNeeds: boolean = true;
  private showInventory: boolean = false;
  private showJobs: boolean = false;

  constructor() {}

  setShowNeeds(show: boolean): void {
    this.showNeeds = show;
  }

  setShowInventory(show: boolean): void {
    this.showInventory = show;
  }

  setShowJobs(show: boolean): void {
    this.showJobs = show;
  }

  renderAll(
    ctx: CanvasRenderingContext2D,
    npcs: NPC[],
    lifeManager: LifeManager,
    worldRenderer: WorldRenderer,
    camera: Camera
  ): void {
    for (const npc of npcs) {
      if (this.showNeeds) {
        this.renderNeedsBar(ctx, npc, lifeManager, worldRenderer, camera);
      }
      if (this.showInventory) {
        this.renderInventory(ctx, npc, lifeManager, worldRenderer, camera);
      }
      if (this.showJobs) {
        this.renderJob(ctx, npc, lifeManager, worldRenderer, camera);
      }
    }
  }

  private renderNeedsBar(
    ctx: CanvasRenderingContext2D,
    npc: NPC,
    lifeManager: LifeManager,
    worldRenderer: WorldRenderer,
    camera: Camera
  ): void {
    const needs = lifeManager.getNeedsForNPC(npc.id);
    if (!needs) return;

    const screenPos = camera.worldToScreen(npc.x, npc.y);
    const zoom = worldRenderer.getZoom();

    // Only render if on screen and not inside building (inside NPCs dimmed)
    if (npc.state === 'INSIDE' as any) return;

    ctx.save();

    const barWidth = 40 * zoom;
    const barHeight = 4 * zoom;
    const spacing = 2 * zoom;
    const totalHeight = 5 * (barHeight + spacing);
    
    const x = screenPos.x - barWidth / 2;
    const y = screenPos.y - 30 * zoom - totalHeight;

    const needsData = needs.getNeedsData();
    const needsList: { type: NeedType; value: number }[] = [
      { type: NeedType.ENERGY, value: needsData.energy },
      { type: NeedType.HUNGER, value: needsData.hunger },
      { type: NeedType.SOCIAL, value: needsData.social },
      { type: NeedType.HAPPINESS, value: needsData.happiness },
      { type: NeedType.HEALTH, value: needsData.health }
    ];

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x - 2, y - 2, barWidth + 4, totalHeight + 4);

    needsList.forEach((need, index) => {
      const props = getNeedProperties(need.type);
      const barY = y + index * (barHeight + spacing);
      const fillWidth = (need.value / 100) * barWidth;

      // Background bar
      ctx.fillStyle = props.bgColor;
      ctx.fillRect(x, barY, barWidth, barHeight);

      // Fill
      let color = props.color;
      if (need.value < props.criticalThreshold) {
        color = props.criticalColor;
        // Pulsing effect for critical
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, barY, fillWidth, barHeight);
      ctx.globalAlpha = 1;

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, barY, barWidth, barHeight);
    });

    ctx.restore();
  }

  private renderInventory(
    ctx: CanvasRenderingContext2D,
    npc: NPC,
    lifeManager: LifeManager,
    worldRenderer: WorldRenderer,
    camera: Camera
  ): void {
    const inventory = lifeManager.getInventoryForNPC(npc.id);
    if (!inventory) return;

    if (npc.state === 'INSIDE' as any) return;

    const screenPos = camera.worldToScreen(npc.x, npc.y);
    const zoom = worldRenderer.getZoom();

    ctx.save();

    const text = inventory.getDebugString();
    if (!text || text === 'Empty') {
      ctx.restore();
      return;
    }

    ctx.font = `${10 * zoom}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    const x = screenPos.x;
    const y = screenPos.y + 25 * zoom;

    // Background
    const metrics = ctx.measureText(text);
    const padding = 4 * zoom;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - metrics.width / 2 - padding, y - 12 * zoom, metrics.width + padding * 2, 14 * zoom);

    ctx.fillStyle = '#fff';
    ctx.fillText(text, x, y);

    ctx.restore();
  }

  private renderJob(
    ctx: CanvasRenderingContext2D,
    npc: NPC,
    lifeManager: LifeManager,
    worldRenderer: WorldRenderer,
    camera: Camera
  ): void {
    const job = lifeManager.getJobForNPC(npc.id);
    if (!job) return;

    if (npc.state === 'INSIDE' as any) return;

    const screenPos = camera.worldToScreen(npc.x, npc.y);
    const zoom = worldRenderer.getZoom();

    ctx.save();

    const progress = job.getWorkProgress();
    if (progress > 0 && (npc.state === 'WORKING' as any || npc.state === 'FARMING' as any || npc.state === 'SHOPPING' as any)) {
      // Work progress bar
      const barWidth = 30 * zoom;
      const barHeight = 3 * zoom;
      const x = screenPos.x - barWidth / 2;
      const y = screenPos.y - 45 * zoom;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#4caf50';
      ctx.fillRect(x, y, barWidth * progress, barHeight);

      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, barWidth, barHeight);
    }

    // Job icon when working
    if (npc.state === 'WORKING' as any || npc.state === 'FARMING' as any || npc.state === 'SHOPPING' as any) {
      ctx.font = `${14 * zoom}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const x = screenPos.x;
      const y = screenPos.y - 50 * zoom;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const icon = job.type === 'FARMER' ? '🌾' : job.type === 'SHOPKEEPER' ? '🏪' : job.type === 'BLACKSMITH' ? '🔨' : '⚒';
      ctx.fillText(icon, x, y);
    }

    ctx.restore();
  }

  // Render detailed life info for selected NPC (for debug)
  renderDetailedLife(
    ctx: CanvasRenderingContext2D,
    npc: NPC,
    lifeManager: LifeManager,
    x: number,
    y: number
  ): void {
    const data = lifeManager.getLifeData(npc.id);
    if (!data) return;

    ctx.save();

    ctx.font = '10px monospace';
    ctx.textBaseline = 'top';

    const needsData = data.needs.getNeedsData();
    const job = data.job;
    const inventory = data.inventory;

    const lines = [
      `${npc.id} ${npc.name} - Life`,
      `Needs: ${data.needs.getDebugString()}`,
      `  Energy: ${needsData.energy.toFixed(0)}% ${needsData.energy < 20 ? '⚠️ CRITICAL' : ''}`,
      `  Hunger: ${needsData.hunger.toFixed(0)}% ${needsData.hunger < 25 ? '⚠️ CRITICAL' : ''}`,
      `  Social: ${needsData.social.toFixed(0)}% ${needsData.social < 20 ? '⚠️ CRITICAL' : ''}`,
      `  Happiness: ${needsData.happiness.toFixed(0)}%`,
      `  Health: ${needsData.health.toFixed(0)}%`,
      `  Overall: ${data.needs.getOverallWellbeing().toFixed(0)}%`,
      `Job: ${job.getDebugString()}`,
      `Inventory: ${inventory.getDebugString()} Value:${inventory.getTotalValue()}`,
      `  Collected:${inventory.getStats().totalCollected} Used:${inventory.getStats().totalUsed}`,
      `Critical: ${data.needs.getCriticalNeeds().join(', ') || 'None'}`,
      `Lowest: ${data.needs.getLowestNeed()?.type} ${data.needs.getLowestNeed()?.value.toFixed(0)}%`
    ];

    const lineHeight = 12;
    const boxWidth = 300;
    const boxHeight = lines.length * lineHeight + 10;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    lines.forEach((line, i) => {
      if (i === 0) {
        ctx.fillStyle = '#8ff';
      } else if (line.includes('CRITICAL')) {
        ctx.fillStyle = '#f88';
      } else if (line.startsWith('  Energy') || line.startsWith('  Hunger') || line.startsWith('  Social')) {
        ctx.fillStyle = '#ddd';
      } else {
        ctx.fillStyle = '#aaa';
      }
      ctx.fillText(line, x + 5, y + 5 + i * lineHeight);
    });

    ctx.restore();
  }
}
