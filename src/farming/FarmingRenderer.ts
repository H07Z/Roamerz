/**
 * FarmingRenderer - Phase 15 Farming System
 * Renders farm plots with growth stages, watered indicator, ready highlight
 */

import { FarmingSystem } from './FarmingSystem';
import { FarmPlot } from './FarmPlot';
import { PlotState, GrowthStage } from './Crop';
import { WorldRenderer } from '../world/WorldRenderer';
import { Camera } from '../camera/Camera';

export class FarmingRenderer {
  private showFarming: boolean = true;
  private showGrowthDebug: boolean = true;

  constructor() {}

  setShowFarming(show: boolean): void {
    this.showFarming = show;
  }

  isShowing(): boolean {
    return this.showFarming;
  }

  setShowGrowthDebug(show: boolean): void {
    this.showGrowthDebug = show;
  }

  render(ctx: CanvasRenderingContext2D, farmingSystem: FarmingSystem, worldRenderer: WorldRenderer, camera: Camera, mapId: string, screenWidth: number, screenHeight: number): void {
    if (!this.showFarming) return;

    const plots = farmingSystem.getPlotsForMap(mapId);
    if (plots.length === 0) return;

    const tileSize = worldRenderer.getTileSize();
    const zoom = worldRenderer.getZoom();
    const offset = camera.getOffset();

    ctx.save();

    for (const plot of plots) {
      const tileX = plot.getX();
      const tileY = plot.getY();
      const screenX = (tileX * tileSize - offset.x) * zoom;
      const screenY = (tileY * tileSize - offset.y) * zoom;
      const scaledSize = tileSize * zoom;

      // Culling - skip if off-screen
      if (screenX + scaledSize < 0 || screenX > screenWidth || screenY + scaledSize < 0 || screenY > screenHeight) {
        continue;
      }

      const state = plot.getState();
      const stage = plot.getGrowthStage();
      const progress = plot.getProgress();
      const isWatered = plot.isWatered();
      const cropDef = plot.getCropDefinition();

      // Base tilled soil highlight
      if (state === PlotState.TILLED) {
        ctx.fillStyle = 'rgba(139, 90, 43, 0.3)'; // brown tilled
        ctx.fillRect(screenX, screenY, scaledSize, scaledSize);
        ctx.strokeStyle = 'rgba(160, 110, 60, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, scaledSize, scaledSize);
        // Small tilled lines
        ctx.strokeStyle = 'rgba(100, 60, 20, 0.4)';
        ctx.beginPath();
        for (let i = 1; i < 3; i++) {
          const ly = screenY + (scaledSize / 3) * i;
          ctx.moveTo(screenX + 2, ly);
          ctx.lineTo(screenX + scaledSize - 2, ly);
        }
        ctx.stroke();
      } else if (state === PlotState.WITHERED) {
        ctx.fillStyle = 'rgba(80, 40, 20, 0.5)';
        ctx.fillRect(screenX, screenY, scaledSize, scaledSize);
        ctx.fillStyle = 'rgba(60, 30, 10, 0.8)';
        ctx.font = `${Math.max(10, scaledSize * 0.6)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀', screenX + scaledSize / 2, screenY + scaledSize / 2);
      } else if (cropDef) {
        // Growing crop - color based on stage
        let bgColor = 'rgba(34, 139, 34, 0.2)'; // default green
        let icon = cropDef.icon;
        let iconScale = 0.5;

        switch (stage) {
          case GrowthStage.PLANTED:
            bgColor = 'rgba(139, 90, 43, 0.4)'; // tilled with seed
            icon = '🌰'; // seed
            iconScale = 0.4;
            break;
          case GrowthStage.SPROUT:
            bgColor = 'rgba(144, 238, 144, 0.3)'; // light green
            icon = '🌱';
            iconScale = 0.5;
            break;
          case GrowthStage.GROWING:
            bgColor = 'rgba(34, 139, 34, 0.3)'; // green
            icon = cropDef.icon;
            iconScale = 0.6;
            break;
          case GrowthStage.MATURE:
            bgColor = 'rgba(34, 139, 34, 0.5)';
            icon = cropDef.icon;
            iconScale = 0.8;
            break;
          case GrowthStage.READY:
            bgColor = 'rgba(255, 215, 0, 0.4)'; // gold ready
            icon = cropDef.icon;
            iconScale = 1.0;
            break;
        }

        ctx.fillStyle = bgColor;
        ctx.fillRect(screenX, screenY, scaledSize, scaledSize);

        // Crop icon
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(10, scaledSize * iconScale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, screenX + scaledSize / 2, screenY + scaledSize / 2);

        // Growth progress bar - withered already handled above, so only check READY
        if (this.showGrowthDebug && state !== PlotState.READY) {
          const barW = scaledSize - 4;
          const barH = Math.max(2, scaledSize * 0.12);
          const barX = screenX + 2;
          const barY = screenY + scaledSize - barH - 2;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(barX, barY, barW, barH);

          ctx.fillStyle = isWatered ? 'rgba(100, 180, 255, 0.9)' : 'rgba(100, 255, 100, 0.9)';
          ctx.fillRect(barX, barY, barW * progress, barH);

          // Percentage text if zoomed in
          if (zoom >= 1) {
            ctx.fillStyle = '#fff';
            ctx.font = '7px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.floor(progress * 100)}%`, screenX + scaledSize / 2, barY + barH / 2 + 1);
          }
        }

        // Watered indicator
        if (isWatered) {
          ctx.fillStyle = 'rgba(100, 180, 255, 0.9)';
          ctx.font = `${Math.max(8, scaledSize * 0.3)}px monospace`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText('💧', screenX + scaledSize - 2, screenY + 2);
        }

        // Ready pulse highlight
        if (state === PlotState.READY) {
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
          ctx.lineWidth = 2;
          ctx.strokeRect(screenX, screenY, scaledSize, scaledSize);
          // Glow effect
          ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
          ctx.fillRect(screenX - 2, screenY - 2, scaledSize + 4, scaledSize + 4);
        }
      }
    }

    ctx.restore();
  }

  // Render farming UI overlay (selected plot info)
  renderPlotInfo(ctx: CanvasRenderingContext2D, plot: FarmPlot | null, screenWidth: number, screenHeight: number): void {
    if (!plot) return;

    ctx.save();

    const boxW = 300;
    const boxH = 120;
    const boxX = 20;
    const boxY = screenHeight - boxH - 80;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    const def = plot.getCropDefinition();
    const icon = def?.icon ?? '🌱';

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${icon} Plot ${plot.getX()},${plot.getY()} ${plot.getMapId()}`, boxX + 10, boxY + 8);

    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.fillText(`State: ${plot.getState()} Stage: ${plot.getGrowthStage()} ${(plot.getProgress()*100).toFixed(0)}% ${plot.isWatered() ? '💧 Watered' : ''}`, boxX + 10, boxY + 26);

    if (def) {
      ctx.fillStyle = def.color ?? '#ccc';
      ctx.fillText(`${def.name} - ${def.description.substring(0, 50)}...`, boxX + 10, boxY + 40);
      ctx.fillStyle = '#8f8';
      ctx.fillText(`Yield: ${def.yieldMin}-${def.yieldMax}x ${def.harvestItemId} + bonus ${def.bonusSeedItemId} (${(def.bonusSeedChance*100).toFixed(0)}%)`, boxX + 10, boxY + 54);
      ctx.fillStyle = '#88f';
      ctx.fillText(`Growth: ${(def.growthTimeSeconds/86400).toFixed(1)} days, Water boost x${def.waterBoost}, Wither ${(def.witherTimeSeconds/86400).toFixed(1)} days`, boxX + 10, boxY + 68);
    } else {
      ctx.fillStyle = '#666';
      ctx.fillText('Empty tilled soil - plant a seed!', boxX + 10, boxY + 40);
      ctx.fillText('Needs: seed from inventory (wheat_seed, carrot_seed, berry, herb)', boxX + 10, boxY + 54);
    }

    ctx.fillStyle = '#ccc';
    ctx.font = '9px monospace';
    const actions = [];
    if (plot.getState() === PlotState.TILLED) actions.push('[Plant: E]');
    if (plot.getState() === PlotState.GROWING || plot.getState() === PlotState.PLANTED) actions.push('[Water: R]');
    if (plot.getState() === PlotState.READY) actions.push('[Harvest: E]');
    if (plot.getState() === PlotState.WITHERED) actions.push('[Clear: E]');
    ctx.fillText(`Actions: ${actions.join(' ')} | Harvests: ${plot.getData().harvestCount}`, boxX + 10, boxY + 84);
    ctx.fillText(`Tilled: Day ${(plot.getData().tilledAt/86400).toFixed(1)} Planted: ${plot.getData().plantedAt ? (plot.getData().plantedAt/86400).toFixed(1) : 'never'}`, boxX + 10, boxY + 98);

    ctx.restore();
  }

  // Render farming help overlay
  renderHelp(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void {
    // This is called from Game's help, but we can have small farming indicator
  }
}
