/**
 * QuestRenderer - Phase 17 Quest System
 * Renders quest UI overlay with objectives, rewards, progress
 */

import { QuestSystem, QuestInstance } from './QuestSystem';
import { QuestDatabase } from './QuestDatabase';
import { QuestStatus } from './Quest';
import { Inventory } from '../inventory/Inventory';
import { ItemDatabase } from '../inventory/ItemDatabase';

export class QuestRenderer {
  private showQuests: boolean = false;
  private selectedQuestIndex: number = 0;
  private filterStatus: QuestStatus | null = null; // null = ALL
  private itemDatabase: ItemDatabase;
  private questDatabase: QuestDatabase;

  constructor(itemDatabase?: ItemDatabase, questDatabase?: QuestDatabase) {
    this.itemDatabase = itemDatabase ?? ItemDatabase.getInstance();
    this.questDatabase = questDatabase ?? QuestDatabase.getInstance();
  }

  setShowQuests(show: boolean): void {
    this.showQuests = show;
  }

  isShowing(): boolean {
    return this.showQuests;
  }

  toggle(): void {
    this.showQuests = !this.showQuests;
  }

  getSelectedQuestIndex(): number {
    return this.selectedQuestIndex;
  }

  setSelectedQuestIndex(idx: number): void {
    this.selectedQuestIndex = Math.max(0, idx);
  }

  getFilterStatus(): QuestStatus | null {
    return this.filterStatus;
  }

  setFilterStatus(status: QuestStatus | null): void {
    this.filterStatus = status;
    this.selectedQuestIndex = 0;
  }

  cycleFilter(): void {
    const statuses: (QuestStatus | null)[] = [null, QuestStatus.AVAILABLE, QuestStatus.ACTIVE, QuestStatus.COMPLETED, QuestStatus.LOCKED];
    const idx = statuses.indexOf(this.filterStatus);
    const next = statuses[(idx + 1) % statuses.length];
    this.filterStatus = next;
    this.selectedQuestIndex = 0;
  }

  navigate(dir: 'up' | 'down', totalQuests: number): void {
    switch (dir) {
      case 'up':
        this.selectedQuestIndex = Math.max(0, this.selectedQuestIndex - 1);
        break;
      case 'down':
        this.selectedQuestIndex = Math.min(totalQuests - 1, this.selectedQuestIndex + 1);
        break;
    }
  }

  private getFilteredQuests(questSystem: QuestSystem): QuestInstance[] {
    let quests = questSystem.getAllQuestInstances();

    if (this.filterStatus) {
      quests = quests.filter(q => q.status === this.filterStatus);
    }

    // Sort: ACTIVE first, then AVAILABLE, then COMPLETED, then LOCKED
    const order: Record<string, number> = {
      [QuestStatus.ACTIVE]: 0,
      [QuestStatus.AVAILABLE]: 1,
      [QuestStatus.COMPLETED]: 2,
      [QuestStatus.LOCKED]: 3,
      [QuestStatus.FAILED]: 4
    };

    quests.sort((a, b) => {
      const orderA = order[a.status] ?? 5;
      const orderB = order[b.status] ?? 5;
      if (orderA !== orderB) return orderA - orderB;
      return a.definition.name.localeCompare(b.definition.name);
    });

    return quests;
  }

  render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, questSystem: QuestSystem, playerInventory: Inventory, playerMoney: number): void {
    const filtered = this.getFilteredQuests(questSystem);
    const totalQuests = filtered.length;

    if (this.selectedQuestIndex >= totalQuests) {
      this.selectedQuestIndex = Math.max(0, totalQuests - 1);
    }

    const selected = totalQuests > 0 ? filtered[this.selectedQuestIndex] : null;

    ctx.save();

    const boxW = 700;
    const boxH = 520;
    const boxX = screenWidth / 2 - boxW / 2;
    const boxY = screenHeight / 2 - boxH / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`📜 QUEST JOURNAL - ${this.filterStatus ?? 'ALL'}`, screenWidth / 2, boxY + 15);

    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Quests: ${questSystem.getCount()} | Active: ${questSystem.getActiveQuests().length} | Available: ${questSystem.getAvailableQuests().length} | Completed: ${questSystem.getCompletedQuests().length} | Filter:${this.filterStatus ?? 'ALL'} (C) | Player $${playerMoney}`,
      screenWidth / 2,
      boxY + 35
    );

    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.fillText('Shift+Q / ESC close, W/S navigate, C filter status, Enter start quest, Q/E cycle filter, P prints quests', screenWidth / 2, boxY + 50);

    // Left panel - quest list
    const listX = boxX + 20;
    const listY = boxY + 70;
    const listW = 280;
    const listH = 360;
    const rowH = 44;

    ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.5)';
    ctx.strokeRect(listX, listY, listW, listH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(listX, listY, listW, listH);
    ctx.clip();

    const visibleRows = Math.floor(listH / rowH);
    const scrollOffset = Math.max(0, this.selectedQuestIndex - visibleRows + 2);

    for (let i = 0; i < filtered.length; i++) {
      const y = listY + (i - scrollOffset) * rowH;
      if (y + rowH < listY || y > listY + listH) continue;

      const quest = filtered[i];
      const isSelected = i === this.selectedQuestIndex;

      if (isSelected) {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.25)';
        ctx.fillRect(listX, y, listW, rowH);
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX, y, listW, rowH);
      } else {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(50, 50, 50, 0.5)' : 'rgba(40, 40, 40, 0.5)';
        ctx.fillRect(listX, y, listW, rowH);
      }

      const progress = questSystem.getQuestProgress(quest.definition.id);
      const completed = progress?.completed ?? 0;
      const total = progress?.total ?? quest.objectives.length;

      // Status color
      let statusColor = '#aaa';
      switch (quest.status) {
        case QuestStatus.ACTIVE: statusColor = '#8af'; break;
        case QuestStatus.AVAILABLE: statusColor = '#ff8'; break;
        case QuestStatus.COMPLETED: statusColor = '#8f8'; break;
        case QuestStatus.LOCKED: statusColor = '#666'; break;
        case QuestStatus.FAILED: statusColor = '#f88'; break;
      }

      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(quest.definition.icon, listX + 8, y + rowH / 2 - 6);

      ctx.fillStyle = isSelected ? '#fff' : '#ccc';
      ctx.font = isSelected ? 'bold 10px monospace' : '9px monospace';
      ctx.fillText(quest.definition.name.substring(0, 20), listX + 30, y + 10);

      ctx.fillStyle = statusColor;
      ctx.font = '8px monospace';
      ctx.fillText(`${quest.status} ${completed}/${total} ${(progress?.percentage ?? 0).toFixed(0)}%`, listX + 30, y + 22);

      ctx.fillStyle = '#888';
      ctx.font = '7px monospace';
      ctx.fillText(quest.definition.tags?.slice(0, 2).join(',') ?? '', listX + 30, y + 32);
    }

    ctx.restore();

    // Right panel - details
    const detailX = listX + listW + 20;
    const detailY = listY;
    const detailW = boxW - listW - 60;
    const detailH = 360;

    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    ctx.fillRect(detailX, detailY, detailW, detailH);
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.strokeRect(detailX, detailY, detailW, detailH);

    if (selected) {
      const def = selected.definition;
      const progress = questSystem.getQuestProgress(def.id);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${def.icon} ${def.name}`, detailX + 10, detailY + 10);

      let statusColor = '#aaa';
      switch (selected.status) {
        case QuestStatus.ACTIVE: statusColor = '#8af'; break;
        case QuestStatus.AVAILABLE: statusColor = '#ff8'; break;
        case QuestStatus.COMPLETED: statusColor = '#8f8'; break;
        case QuestStatus.LOCKED: statusColor = '#666'; break;
        case QuestStatus.FAILED: statusColor = '#f88'; break;
      }
      ctx.fillStyle = statusColor;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`Status: ${selected.status} | Progress: ${progress?.completed ?? 0}/${progress?.total ?? 0} (${(progress?.percentage ?? 0).toFixed(0)}%)`, detailX + 10, detailY + 28);

      ctx.fillStyle = '#aaa';
      ctx.font = '9px monospace';
      ctx.fillText(`ID: ${def.id} | Giver: ${def.giverNpcId ?? 'none'} | Map: ${def.mapId ?? 'any'}`, detailX + 10, detailY + 42);

      // Description wrapped
      ctx.fillStyle = '#ccc';
      ctx.font = '9px monospace';
      const desc = def.description;
      const maxChars = 45;
      let lines: string[] = [];
      let remaining = desc;
      while (remaining.length > maxChars) {
        let cut = remaining.lastIndexOf(' ', maxChars);
        if (cut === -1) cut = maxChars;
        lines.push(remaining.substring(0, cut));
        remaining = remaining.substring(cut).trim();
      }
      if (remaining) lines.push(remaining);
      for (let i = 0; i < Math.min(lines.length, 2); i++) {
        ctx.fillText(lines[i], detailX + 10, detailY + 54 + i * 11);
      }

      // Prerequisites
      if (def.prerequisites && def.prerequisites.length > 0) {
        ctx.fillStyle = '#fa8';
        ctx.font = '8px monospace';
        ctx.fillText(`Prerequisites: ${def.prerequisites.join(', ')}`, detailX + 10, detailY + 78);
      }

      // Objectives
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('Objectives:', detailX + 10, detailY + 92);

      let oy = detailY + 106;
      for (const obj of selected.objectives) {
        const done = obj.completed;
        ctx.fillStyle = done ? '#8f8' : '#ff8';
        ctx.font = done ? '9px monospace' : 'bold 9px monospace';
        const icon = done ? '✓' : '○';
        const text = `${icon} ${obj.description} [${obj.currentAmount}/${obj.requiredAmount}]`;
        ctx.fillText(text.substring(0, 55), detailX + 10, oy);
        oy += 12;
        if (oy > detailY + 190) break;
      }

      // Rewards
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('Rewards:', detailX + 10, detailY + 200);

      let ry = detailY + 214;
      if (def.rewards.money) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '9px monospace';
        ctx.fillText(`💰 $${def.rewards.money} money`, detailX + 10, ry);
        ry += 11;
      }
      if (def.rewards.items) {
        for (const item of def.rewards.items) {
          const itemDef = this.itemDatabase.getItem(item.itemId);
          ctx.fillStyle = '#ccc';
          ctx.font = '9px monospace';
          ctx.fillText(`${itemDef?.icon ?? ''} ${item.quantity}x ${itemDef?.name ?? item.itemId}`, detailX + 10, ry);
          ry += 11;
          if (ry > detailY + 260) break;
        }
      }
      if (def.rewards.xp) {
        ctx.fillStyle = '#8af';
        ctx.font = '9px monospace';
        ctx.fillText(`⭐ ${def.rewards.xp} XP`, detailX + 10, ry);
        ry += 11;
      }

      // Action hint
      if (selected.status === QuestStatus.AVAILABLE) {
        ctx.fillStyle = 'rgba(255, 255, 100, 0.15)';
        ctx.fillRect(detailX + 10, detailY + 275, detailW - 20, 26);
        ctx.strokeStyle = 'rgba(255, 255, 100, 0.5)';
        ctx.strokeRect(detailX + 10, detailY + 275, detailW - 20, 26);
        ctx.fillStyle = '#ff8';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press ENTER to Start Quest!', detailX + detailW / 2, detailY + 284);
        ctx.textAlign = 'left';
      } else if (selected.status === QuestStatus.ACTIVE) {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.15)';
        ctx.fillRect(detailX + 10, detailY + 275, detailW - 20, 26);
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.strokeRect(detailX + 10, detailY + 275, detailW - 20, 26);
        ctx.fillStyle = '#8af';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Active: ${progress?.completed}/${progress?.total} objectives done`, detailX + detailW / 2, detailY + 284);
        ctx.textAlign = 'left';
      } else if (selected.status === QuestStatus.COMPLETED) {
        ctx.fillStyle = 'rgba(100, 255, 100, 0.15)';
        ctx.fillRect(detailX + 10, detailY + 275, detailW - 20, 26);
        ctx.strokeStyle = 'rgba(100, 255, 100, 0.5)';
        ctx.strokeRect(detailX + 10, detailY + 275, detailW - 20, 26);
        ctx.fillStyle = '#8f8';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✓ Completed! Rewards claimed', detailX + detailW / 2, detailY + 284);
        ctx.textAlign = 'left';
      } else if (selected.status === QuestStatus.LOCKED) {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.15)';
        ctx.fillRect(detailX + 10, detailY + 275, detailW - 20, 26);
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.strokeRect(detailX + 10, detailY + 275, detailW - 20, 26);
        ctx.fillStyle = '#888';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Locked: Complete ${def.prerequisites?.join(', ') ?? ''} first`, detailX + detailW / 2, detailY + 284);
        ctx.textAlign = 'left';
      }

      // Player inventory check for collect objectives
      if (selected.status === QuestStatus.ACTIVE) {
        let py = detailY + 310;
        ctx.fillStyle = '#666';
        ctx.font = '8px monospace';
        ctx.fillText(`Player: $${playerMoney} | Inv: ${playerInventory.getUsedSlots()}/${playerInventory.getCapacity()} | Have:`, detailX + 10, py);
        py += 10;
        for (const obj of selected.objectives.slice(0, 2)) {
          if (obj.type === 'COLLECT_ITEM') {
            const have = playerInventory.getItemQuantity(obj.targetId);
            const defItem = this.itemDatabase.getItem(obj.targetId);
            ctx.fillStyle = have >= obj.requiredAmount ? '#8f8' : '#fa8';
            ctx.font = '8px monospace';
            ctx.fillText(`${defItem?.icon ?? ''}${obj.targetId}: ${have}/${obj.requiredAmount}`, detailX + 10, py);
            py += 9;
          }
        }
      }
    } else {
      ctx.fillStyle = '#666';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No quests', detailX + detailW / 2, detailY + detailH / 2);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = '#444';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Quests v1 | ${this.questDatabase.getCount()} quests | ${questSystem.getTotalStarted()} started ${questSystem.getTotalCompleted()} done | Filter ${this.filterStatus ?? 'ALL'} | Player $${playerMoney}`,
      screenWidth / 2,
      boxY + boxH - 12
    );

    ctx.restore();
  }

  renderQuickHint(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, questSystem: QuestSystem): void {
    if (this.showQuests) return;

    const active = questSystem.getActiveQuests();
    const available = questSystem.getAvailableQuests();

    if (active.length === 0 && available.length === 0) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const w = 260;
    const h = active.length > 0 ? 22 + Math.min(active.length, 2) * 12 : 22;
    const x = screenWidth - w - 20;
    const y = 135;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#8af';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📜 Quests: ${active.length} active, ${available.length} available! Shift+Q`, x + 8, y + 11);

    let ty = y + 22;
    for (const quest of active.slice(0, 2)) {
      const progress = questSystem.getQuestProgress(quest.definition.id);
      ctx.fillStyle = '#ccc';
      ctx.font = '8px monospace';
      ctx.fillText(`${quest.definition.icon} ${quest.definition.name} ${progress?.completed}/${progress?.total} ${(progress?.percentage ?? 0).toFixed(0)}%`, x + 8, ty);
      ty += 11;
    }

    ctx.restore();
  }
}
