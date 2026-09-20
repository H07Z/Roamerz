/**
 * AnimalRenderer - Phase 16.1 Animals / Livestock System
 * Renders animals with icons, hunger/happiness, produce ready
 */

import { AnimalSystem } from './AnimalSystem';
import { AnimalInstance } from './AnimalInstance';
import { AnimalState } from './Animal';
import { WorldRenderer } from '../world/WorldRenderer';
import { Camera } from '../camera/Camera';

export class AnimalRenderer {
  private showAnimals: boolean = true;
  private showDebug: boolean = true;

  constructor() {}

  setShowAnimals(show: boolean): void {
    this.showAnimals = show;
  }

  isShowing(): boolean {
    return this.showAnimals;
  }

  setShowDebug(show: boolean): void {
    this.showDebug = show;
  }

  render(
    ctx: CanvasRenderingContext2D,
    animalSystem: AnimalSystem,
    worldRenderer: WorldRenderer,
    camera: Camera,
    mapId: string,
    screenWidth: number,
    screenHeight: number
  ): void {
    if (!this.showAnimals) return;

    const animals = animalSystem.getAnimalsForMap(mapId);
    if (animals.length === 0) return;

    const tileSize = worldRenderer.getTileSize();
    const zoom = worldRenderer.getZoom();
    const offset = camera.getOffset();

    ctx.save();

    for (const animal of animals) {
      const pixelX = animal.getPixelX();
      const pixelY = animal.getPixelY();
      const screenX = (pixelX - offset.x) * zoom - (tileSize * zoom) / 2;
      const screenY = (pixelY - offset.y) * zoom - (tileSize * zoom) / 2;
      const scaledSize = tileSize * zoom;

      if (screenX + scaledSize < 0 || screenX > screenWidth || screenY + scaledSize < 0 || screenY > screenHeight) {
        continue;
      }

      const def = animal.getDefinition();
      const icon = def?.icon ?? '🐾';
      const state = animal.getState();
      const hunger = animal.getHunger();
      const happiness = animal.getHappiness();
      const produceReady = animal.isProduceReady();

      // Background based on state
      let bgColor = 'rgba(100, 100, 100, 0.2)';
      switch (state) {
        case AnimalState.HUNGRY:
          bgColor = 'rgba(255, 100, 100, 0.3)';
          break;
        case AnimalState.HAPPY:
          bgColor = 'rgba(100, 255, 100, 0.3)';
          break;
        case AnimalState.PRODUCING:
          bgColor = 'rgba(255, 215, 0, 0.4)';
          break;
        case AnimalState.SICK:
          bgColor = 'rgba(100, 0, 0, 0.4)';
          break;
        case AnimalState.EATING:
          bgColor = 'rgba(100, 200, 255, 0.3)';
          break;
        case AnimalState.WANDERING:
          bgColor = 'rgba(150, 150, 150, 0.2)';
          break;
      }

      ctx.fillStyle = bgColor;
      ctx.fillRect(screenX, screenY, scaledSize, scaledSize);

      // Animal icon
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.max(12, scaledSize * 0.8)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, screenX + scaledSize / 2, screenY + scaledSize / 2);

      // Produce ready glow
      if (produceReady) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, scaledSize, scaledSize);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fillRect(screenX - 2, screenY - 2, scaledSize + 4, scaledSize + 4);

        // Produce icon small
        const produceIcon = def?.produceItemId === 'egg' ? '🥚' : def?.produceItemId === 'milk' ? '🥛' : def?.produceItemId === 'wool' ? '🧶' : '✨';
        ctx.font = `${Math.max(8, scaledSize * 0.4)}px monospace`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(produceIcon, screenX + scaledSize - 2, screenY + 2);
      }

      // Hunger bar
      if (this.showDebug) {
        const barW = scaledSize - 4;
        const barH = Math.max(2, scaledSize * 0.12);
        const barX = screenX + 2;
        const barY = screenY + scaledSize - barH - 2;

        // Hunger bar (bottom)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barW, barH);
        const hungerColor = hunger < 30 ? 'rgba(255, 50, 50, 0.9)' : hunger < 60 ? 'rgba(255, 200, 50, 0.9)' : 'rgba(100, 255, 100, 0.9)';
        ctx.fillStyle = hungerColor;
        ctx.fillRect(barX, barY, barW * (hunger / 100), barH);

        // Happiness bar (above hunger)
        const barY2 = barY - barH - 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY2, barW, barH);
        ctx.fillStyle = happiness > 70 ? 'rgba(100, 200, 255, 0.9)' : happiness > 40 ? 'rgba(200, 200, 100, 0.9)' : 'rgba(150, 150, 150, 0.7)';
        ctx.fillStyle = `rgba(100, ${Math.floor(150 + happiness * 1)}, 255, 0.9)`;
        ctx.fillRect(barX, barY2, barW * (happiness / 100), barH);
      }

      // State text when zoomed
      if (zoom >= 1.2 && this.showDebug) {
        ctx.fillStyle = '#fff';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(state.substring(0, 4), screenX + scaledSize / 2, screenY + scaledSize + 8);
      }
    }

    ctx.restore();
  }

  renderAnimalInfo(ctx: CanvasRenderingContext2D, animal: AnimalInstance | null, screenWidth: number, screenHeight: number): void {
    if (!animal) return;

    ctx.save();

    const boxW = 340;
    const boxH = 130;
    const boxX = 20;
    const boxY = screenHeight - boxH - 220; // above farming info

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = 'rgba(100, 200, 150, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    const def = animal.getDefinition();
    const icon = def?.icon ?? '🐾';

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${icon} ${def?.name ?? animal.getType()} ${animal.getX()},${animal.getY()} ${animal.getMapId()}`, boxX + 10, boxY + 8);

    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.fillText(
      `State: ${animal.getState()} ${animal.isProduceReady() ? '🥚 READY' : ''} H:${animal.getHunger().toFixed(0)}% Happy:${animal.getHappiness().toFixed(0)}% HP:${animal.getHealth().toFixed(0)}%`,
      boxX + 10,
      boxY + 26
    );

    if (def) {
      ctx.fillStyle = def.color ?? '#ccc';
      ctx.fillText(`${def.description.substring(0, 55)}...`, boxX + 10, boxY + 40);
      ctx.fillStyle = '#8f8';
      ctx.fillText(
        `Produce: ${def.produceMin}-${def.produceMax}x ${def.produceItemId} every ${(def.produceIntervalSeconds / 86400).toFixed(1)}d chance ${(def.produceChance * 100).toFixed(0)}%`,
        boxX + 10,
        boxY + 54
      );
      ctx.fillStyle = '#88f';
      ctx.fillText(`Feed: ${def.feedItems.join(', ')} (+${def.feedValue} hunger, +${def.happinessOnFeed} happy) Pet +${def.happinessOnPet}`, boxX + 10, boxY + 68);
      ctx.fillStyle = '#fa8';
      ctx.fillText(`Needs: hunger>${def.minHungerForProduce}% happy>${def.minHappinessForProduce}% to produce | Wander ${def.wanderRadius} tiles every ${def.wanderIntervalSeconds}s`, boxX + 10, boxY + 82);
    }

    ctx.fillStyle = '#ccc';
    ctx.font = '9px monospace';
    const actions = [];
    if (animal.isProduceReady()) actions.push('[Collect: E]');
    else {
      actions.push('[Feed: E]');
      actions.push('[Pet: E]');
    }
    ctx.fillText(`Actions: ${actions.join(' ')} | Fed ${animal.getData().feedCount}x Petted ${animal.getData().petCount}x Produced ${animal.getData().produceCount}x`, boxX + 10, boxY + 98);
    ctx.fillText(
      `Age: ${animal.getData().ageDays.toFixed(1)}d Home: ${animal.getHomeX()},${animal.getHomeY()} Target: ${animal.getData().targetX ?? 'none'},${animal.getData().targetY ?? 'none'} ${animal.getData().isMoving ? 'moving' : 'idle'}`,
      boxX + 10,
      boxY + 112
    );

    ctx.restore();
  }
}
