/**
 * SaveRenderer - Phase 13 Save UI
 * Renders save/load UI overlay and status messages
 */

import { SaveSlotInfo } from './SaveTypes';

export class SaveRenderer {
  private showSaveUI: boolean = false;
  private showLoadUI: boolean = false;
  private selectedSlot: number = 0;
  private saveMessage: string = '';
  private saveMessageTimer: number = 0;
  private saveMessageColor: string = '#8f8';
  private lastAction: string = '';

  constructor() {}

  setShowSaveUI(show: boolean): void {
    this.showSaveUI = show;
    if (show) this.showLoadUI = false;
  }

  setShowLoadUI(show: boolean): void {
    this.showLoadUI = show;
    if (show) this.showSaveUI = false;
  }

  isShowingUI(): boolean {
    return this.showSaveUI || this.showLoadUI;
  }

  getSelectedSlot(): number {
    return this.selectedSlot;
  }

  setSelectedSlot(slot: number): void {
    this.selectedSlot = slot;
  }

  showMessage(message: string, color: string = '#8f8', duration: number = 3): void {
    this.saveMessage = message;
    this.saveMessageColor = color;
    this.saveMessageTimer = duration;
    this.lastAction = message;
    console.log(`[SaveUI] ${message}`);
  }

  update(deltaTime: number): void {
    if (this.saveMessageTimer > 0) {
      this.saveMessageTimer -= deltaTime;
      if (this.saveMessageTimer <= 0) {
        this.saveMessage = '';
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, slots: SaveSlotInfo[]): void {
    // Always render save message if present
    if (this.saveMessage) {
      ctx.save();
      const msgW = 400;
      const msgH = 40;
      const x = screenWidth / 2 - msgW / 2;
      const y = 100;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(x, y, msgW, msgH);
      ctx.strokeStyle = this.saveMessageColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, msgW, msgH);
      ctx.fillStyle = this.saveMessageColor;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.saveMessage, screenWidth / 2, y + msgH / 2);
      ctx.restore();
    }

    if (!this.showSaveUI && !this.showLoadUI) return;

    ctx.save();

    const isSaveMode = this.showSaveUI;
    const title = isSaveMode ? '💾 SAVE GAME - Select Slot (Enter to save, ESC to cancel)' : '📂 LOAD GAME - Select Slot (Enter to load, ESC to cancel)';

    const boxW = 500;
    const boxH = 400;
    const boxX = screenWidth / 2 - boxW / 2;
    const boxY = screenHeight / 2 - boxH / 2;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = isSaveMode ? 'rgba(100, 255, 100, 0.8)' : 'rgba(100, 200, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, screenWidth / 2, boxY + 15);

    // Instructions
    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.fillText('UP/DOWN or 1-5 select slot, ENTER confirm, ESC close, D delete slot', screenWidth / 2, boxY + 35);

    // Slots
    const slotStartY = boxY + 60;
    const slotHeight = 60;
    const slotPadding = 5;

    ctx.textAlign = 'left';

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const y = slotStartY + i * (slotHeight + slotPadding);
      const x = boxX + 20;
      const w = boxW - 40;

      const isSelected = i === this.selectedSlot;

      // Slot background
      if (isSelected) {
        ctx.fillStyle = isSaveMode ? 'rgba(100, 255, 100, 0.2)' : 'rgba(100, 200, 255, 0.2)';
        ctx.fillRect(x, y, w, slotHeight);
        ctx.strokeStyle = isSaveMode ? 'rgba(100, 255, 100, 0.8)' : 'rgba(100, 200, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, slotHeight);
      } else {
        ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
        ctx.fillRect(x, y, w, slotHeight);
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, slotHeight);
      }

      // Slot content
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textBaseline = 'top';
      ctx.fillText(`Slot ${i} ${i === 0 ? '(Auto)' : ''} ${isSelected ? '◀' : ''}`, x + 10, y + 8);

      if (slot.exists) {
        if (slot.corrupted) {
          ctx.fillStyle = '#f88';
          ctx.font = '10px monospace';
          ctx.fillText(`CORRUPTED: ${slot.error?.substring(0, 50) ?? 'Unknown error'}`, x + 10, y + 24);
          ctx.fillStyle = '#aaa';
          ctx.fillText(`Size: ${slot.sizeBytes ? (slot.sizeBytes / 1024).toFixed(1) + 'KB' : 'unknown'}`, x + 10, y + 38);
        } else {
          const preview = slot.preview;
          const meta = slot.meta;
          ctx.fillStyle = '#8f8';
          ctx.font = '10px monospace';
          if (preview) {
            ctx.fillText(`Day ${preview.day} ${preview.time} | ${preview.mapName} (${preview.mapId}) | ${preview.explorationPercent.toFixed(1)}% explored`, x + 10, y + 24);
            ctx.fillStyle = '#aaa';
            ctx.fillText(`$${preview.money} | ❤ ${preview.health} | v${slot.saveVersion} ${slot.gameVersion} | ${meta ? new Date(meta.lastSaved).toLocaleString() : ''}`, x + 10, y + 38);
          } else {
            ctx.fillText(`Save exists but no preview`, x + 10, y + 24);
          }
        }
      } else {
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText('Empty slot', x + 10, y + 24);
      }
    }

    // Footer
    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Save Version ${slots[0]?.saveVersion ?? '?'} | Auto-save slot 0 | Max ${slots.length} slots | LocalStorage`, screenWidth / 2, boxY + boxH - 15);

    ctx.restore();
  }

  getLastAction(): string {
    return this.lastAction;
  }
}
