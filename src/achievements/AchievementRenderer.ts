/**
 * AchievementRenderer - Phase 18.1 Achievements System
 * Renders the achievements modal (Shift+T), the "nearly there" quick hint,
 * and a queue of "Achievement Unlocked" toasts.
 */

import { AchievementSystem } from './AchievementSystem';
import { AchievementInstance, AchievementCategory, ACHIEVEMENT_CATEGORY_ORDER, ACHIEVEMENT_CATEGORY_ICONS } from './Achievement';
import { ItemDatabase } from '../inventory/ItemDatabase';

interface AchievementToast {
  title: string;
  subtitle: string;
  icon: string;
  timer: number;      // seconds remaining
  duration: number;   // total seconds
}

export class AchievementRenderer {
  private showAchievements: boolean = false;
  private selectedIndex: number = 0;
  private filterCategory: AchievementCategory | null = null; // null = ALL
  private itemDatabase: ItemDatabase;
  private toasts: AchievementToast[] = [];
  private static readonly TOAST_DURATION = 4;
  private static readonly ACCENT = 'rgba(255, 200, 80, 0.85)';

  constructor(itemDatabase?: ItemDatabase) {
    this.itemDatabase = itemDatabase ?? ItemDatabase.getInstance();
  }

  // ==================== STATE ====================

  setShowAchievements(show: boolean): void { this.showAchievements = show; }
  isShowing(): boolean { return this.showAchievements; }

  getSelectedIndex(): number { return this.selectedIndex; }
  setSelectedIndex(idx: number): void { this.selectedIndex = Math.max(0, idx); }

  getFilterCategory(): AchievementCategory | null { return this.filterCategory; }
  setFilterCategory(cat: AchievementCategory | null): void {
    this.filterCategory = cat;
    this.selectedIndex = 0;
  }

  cycleFilter(): void {
    const cats: (AchievementCategory | null)[] = [null, ...ACHIEVEMENT_CATEGORY_ORDER];
    const idx = cats.indexOf(this.filterCategory);
    this.filterCategory = cats[(idx + 1) % cats.length];
    this.selectedIndex = 0;
  }

  navigate(direction: 'up' | 'down', total: number): void {
    if (total <= 0) { this.selectedIndex = 0; return; }
    if (direction === 'up') this.selectedIndex = (this.selectedIndex - 1 + total) % total;
    else this.selectedIndex = (this.selectedIndex + 1) % total;
  }

  /** Same ordering used by Game.ts input so selection index matches what's drawn. */
  getFilteredAchievements(system: AchievementSystem): AchievementInstance[] {
    let list = system.getAllAchievements();
    if (this.filterCategory) list = list.filter(a => a.definition.category === this.filterCategory);
    // Stable: database order grouped by category order
    const catOrder = new Map<string, number>(ACHIEVEMENT_CATEGORY_ORDER.map((c, i) => [c, i]));
    return list
      .map((a, i) => ({ a, i }))
      .sort((x, y) => {
        const cx = catOrder.get(x.a.definition.category) ?? 99;
        const cy = catOrder.get(y.a.definition.category) ?? 99;
        if (cx !== cy) return cx - cy;
        return x.i - y.i;
      })
      .map(x => x.a);
  }

  getSelectedAchievement(system: AchievementSystem): AchievementInstance | null {
    const list = this.getFilteredAchievements(system);
    if (list.length === 0) return null;
    if (this.selectedIndex >= list.length) this.selectedIndex = list.length - 1;
    return list[this.selectedIndex];
  }

  // ==================== TOASTS ====================

  pushUnlockToast(inst: AchievementInstance): void {
    const rewards = inst.definition.rewards;
    const parts: string[] = [];
    if (rewards?.money) parts.push(`+$${rewards.money}`);
    if (rewards?.items) {
      for (const it of rewards.items) {
        const def = this.itemDatabase.getItem(it.itemId);
        parts.push(`+${it.quantity}x ${def?.name ?? it.itemId}`);
      }
    }
    this.toasts.push({
      title: inst.definition.name,
      subtitle: parts.length ? `Reward: ${parts.join(', ')}` : inst.definition.description,
      icon: inst.definition.icon,
      timer: AchievementRenderer.TOAST_DURATION,
      duration: AchievementRenderer.TOAST_DURATION
    });
    if (this.toasts.length > 6) this.toasts.splice(0, this.toasts.length - 6);
  }

  update(deltaTime: number): void {
    if (this.toasts.length === 0) return;
    const head = this.toasts[0];
    head.timer -= deltaTime;
    if (head.timer <= 0) this.toasts.shift();
  }

  getToastCount(): number { return this.toasts.length; }

  renderToasts(ctx: CanvasRenderingContext2D, screenWidth: number, _screenHeight: number): void {
    if (this.toasts.length === 0) return;
    const t = this.toasts[0];
    const elapsed = t.duration - t.timer;
    // fade in 0.3s, fade out last 0.5s
    let alpha = 1;
    if (elapsed < 0.3) alpha = elapsed / 0.3;
    else if (t.timer < 0.5) alpha = Math.max(0, t.timer / 0.5);
    const slide = elapsed < 0.3 ? (1 - elapsed / 0.3) * -20 : 0;

    const w = 380;
    const h = 56;
    const x = screenWidth / 2 - w / 2;
    const y = 90 + slide;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(20, 16, 0, 0.92)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = AchievementRenderer.ACCENT;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '24px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(t.icon, x + 12, y + h / 2);

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#fc6';
    ctx.fillText('🏆 ACHIEVEMENT UNLOCKED', x + 52, y + 13);
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(t.title, x + 52, y + 29);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#8f8';
    ctx.fillText(t.subtitle.substring(0, 52), x + 52, y + 44);

    if (this.toasts.length > 1) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#999';
      ctx.font = '8px monospace';
      ctx.fillText(`+${this.toasts.length - 1} more`, x + w - 6, y + h - 8);
    }
    ctx.restore();
  }

  // ==================== MAIN UI ====================

  render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, system: AchievementSystem, playerMoney: number): void {
    if (!this.showAchievements) return;

    const filtered = this.getFilteredAchievements(system);
    const total = filtered.length;
    if (this.selectedIndex >= total) this.selectedIndex = Math.max(0, total - 1);
    const selected = total > 0 ? filtered[this.selectedIndex] : null;

    const unlockedCount = system.getUnlockedCount();
    const count = system.getCount();
    const percent = system.getCompletionPercent();

    ctx.save();

    const boxW = 700;
    const boxH = 520;
    const boxX = screenWidth / 2 - boxW / 2;
    const boxY = screenHeight / 2 - boxH / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = AchievementRenderer.ACCENT;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const filterLabel = this.filterCategory ? `${ACHIEVEMENT_CATEGORY_ICONS[this.filterCategory]} ${this.filterCategory}` : 'ALL';
    ctx.fillText(`🏆 ACHIEVEMENTS - ${filterLabel}`, screenWidth / 2, boxY + 15);

    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Unlocked: ${unlockedCount}/${count} (${percent.toFixed(0)}%) | Showing: ${total} | Filter: ${this.filterCategory ?? 'ALL'} (C) | Player $${playerMoney}`,
      screenWidth / 2,
      boxY + 35
    );

    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.fillText('Shift+T / ESC close, W/S navigate, C cycle category, Enter show details', screenWidth / 2, boxY + 50);

    // Overall progress bar
    const barX = boxX + 20;
    const barY = boxY + 63;
    const barW = boxW - 40;
    const barH = 6;
    ctx.fillStyle = 'rgba(60, 60, 60, 0.9)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#fc6';
    ctx.fillRect(barX, barY, barW * (percent / 100), barH);

    // Left panel - list
    const listX = boxX + 20;
    const listY = boxY + 78;
    const listW = 300;
    const listH = 400;
    const rowH = 40;

    ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(listX, listY, listW, listH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(listX, listY, listW, listH);
    ctx.clip();

    const visibleRows = Math.floor(listH / rowH);
    const scrollOffset = Math.max(0, Math.min(this.selectedIndex - visibleRows + 2, Math.max(0, total - visibleRows)));

    if (total === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No achievements in this category', listX + listW / 2, listY + listH / 2);
    }

    for (let i = 0; i < filtered.length; i++) {
      const y = listY + (i - scrollOffset) * rowH;
      if (y + rowH < listY || y > listY + listH) continue;

      const inst = filtered[i];
      const isSelected = i === this.selectedIndex;
      const progress = system.getProgress(inst.definition.id);
      const hiddenLocked = inst.definition.hidden && !inst.unlocked;

      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 200, 80, 0.22)';
        ctx.fillRect(listX, y, listW, rowH);
        ctx.strokeStyle = AchievementRenderer.ACCENT;
        ctx.strokeRect(listX + 0.5, y + 0.5, listW - 1, rowH - 1);
      } else {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(50, 50, 50, 0.5)' : 'rgba(40, 40, 40, 0.5)';
        ctx.fillRect(listX, y, listW, rowH);
      }

      // Icon
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '16px monospace';
      ctx.fillStyle = inst.unlocked ? '#fff' : '#777';
      ctx.fillText(hiddenLocked ? '❓' : inst.definition.icon, listX + 8, y + rowH / 2);

      // Name + category
      ctx.font = isSelected ? 'bold 10px monospace' : '10px monospace';
      ctx.fillStyle = inst.unlocked ? '#fc6' : (isSelected ? '#fff' : '#bbb');
      ctx.fillText((hiddenLocked ? '???' : inst.definition.name).substring(0, 22), listX + 34, y + 11);

      ctx.font = '8px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText(`${ACHIEVEMENT_CATEGORY_ICONS[inst.definition.category]} ${inst.definition.category}`, listX + 34, y + 23);

      // Status / progress at right
      ctx.textAlign = 'right';
      if (inst.unlocked) {
        ctx.font = '11px monospace';
        ctx.fillStyle = '#8f8';
        ctx.fillText('✅', listX + listW - 8, y + 12);
      } else if (progress) {
        ctx.font = '9px monospace';
        ctx.fillStyle = progress.percent >= 50 ? '#ff8' : '#999';
        ctx.fillText(`${progress.current}/${progress.target}`, listX + listW - 8, y + 12);
      }

      // Mini progress bar
      if (progress) {
        const pbX = listX + 34;
        const pbY = y + rowH - 8;
        const pbW = listW - 44;
        const pbH = 4;
        ctx.fillStyle = 'rgba(60, 60, 60, 0.9)';
        ctx.fillRect(pbX, pbY, pbW, pbH);
        ctx.fillStyle = inst.unlocked ? '#8f8' : (progress.percent >= 50 ? '#fc6' : '#7af');
        ctx.fillRect(pbX, pbY, pbW * Math.min(1, progress.percent / 100), pbH);
      }
    }
    ctx.restore();

    // Right panel - details
    const detX = listX + listW + 15;
    const detY = listY;
    const detW = boxW - listW - 55;
    const detH = listH;

    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    ctx.fillRect(detX, detY, detW, detH);
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.5)';
    ctx.strokeRect(detX, detY, detW, detH);

    if (selected) {
      const def = selected.definition;
      const hiddenLocked = def.hidden && !selected.unlocked;
      const progress = system.getProgress(def.id);
      let ty = detY + 14;

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '26px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(hiddenLocked ? '❓' : def.icon, detX + 14, ty);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = selected.unlocked ? '#fc6' : '#fff';
      ctx.fillText(hiddenLocked ? '???' : def.name, detX + 52, ty + 2);

      ctx.font = '9px monospace';
      ctx.fillStyle = '#999';
      const tierLabel = def.tier === 3 ? '🥇 Gold' : def.tier === 2 ? '🥈 Silver' : '🥉 Bronze';
      ctx.fillText(`${ACHIEVEMENT_CATEGORY_ICONS[def.category]} ${def.category}  •  ${tierLabel}`, detX + 52, ty + 20);
      ty += 46;

      // Status line
      ctx.font = 'bold 10px monospace';
      if (selected.unlocked) {
        ctx.fillStyle = '#8f8';
        ctx.fillText(`✅ UNLOCKED${selected.unlockedAt !== undefined ? ` at ${this.formatGameTime(selected.unlockedAt)}` : ''}`, detX + 14, ty);
      } else {
        ctx.fillStyle = '#fa8';
        ctx.fillText('🔒 LOCKED - keep playing!', detX + 14, ty);
      }
      ty += 18;

      // Description (wrapped)
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ddd';
      const descLines = this.wrapText(hiddenLocked ? 'Hidden achievement. Unlock it to reveal.' : def.description, 44);
      for (const line of descLines.slice(0, 4)) {
        ctx.fillText(line, detX + 14, ty);
        ty += 13;
      }
      ty += 8;

      // Progress
      if (progress) {
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Progress: ${progress.current}/${progress.target} (${progress.percent.toFixed(0)}%)`, detX + 14, ty);
        ty += 14;
        const pbW = detW - 28;
        ctx.fillStyle = 'rgba(60, 60, 60, 0.9)';
        ctx.fillRect(detX + 14, ty, pbW, 10);
        ctx.fillStyle = selected.unlocked ? '#8f8' : '#fc6';
        ctx.fillRect(detX + 14, ty, pbW * Math.min(1, progress.percent / 100), 10);
        ctx.strokeStyle = 'rgba(120,120,120,0.6)';
        ctx.strokeRect(detX + 14, ty, pbW, 10);
        ty += 22;
        ctx.font = '8px monospace';
        ctx.fillStyle = '#777';
        ctx.fillText(`Tracked stat: ${def.stat} = ${system.getStat(def.stat)}`, detX + 14, ty);
        ty += 18;
      }

      // Rewards
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText('Rewards:', detX + 14, ty);
      ty += 14;
      ctx.font = '10px monospace';
      const rewards = def.rewards;
      if (!rewards || (!rewards.money && (!rewards.items || rewards.items.length === 0))) {
        ctx.fillStyle = '#888';
        ctx.fillText('  Bragging rights', detX + 14, ty);
        ty += 13;
      } else {
        if (rewards.money) {
          ctx.fillStyle = '#ffd700';
          ctx.fillText(`  💰 $${rewards.money}`, detX + 14, ty);
          ty += 13;
        }
        if (rewards.items) {
          for (const it of rewards.items) {
            const itemDef = this.itemDatabase.getItem(it.itemId);
            ctx.fillStyle = '#8f8';
            ctx.fillText(`  ${itemDef?.icon ?? '📦'} ${it.quantity}x ${itemDef?.name ?? it.itemId}`, detX + 14, ty);
            ty += 13;
          }
        }
        ctx.font = '8px monospace';
        ctx.fillStyle = '#777';
        ctx.fillText(selected.unlocked ? '  (granted on unlock)' : '  (granted automatically on unlock)', detX + 14, ty);
        ty += 13;
      }

      // Footer box for status
      const fbY = detY + detH - 40;
      ctx.fillStyle = selected.unlocked ? 'rgba(80, 200, 80, 0.15)' : 'rgba(255, 200, 80, 0.10)';
      ctx.fillRect(detX + 10, fbY, detW - 20, 30);
      ctx.strokeStyle = selected.unlocked ? 'rgba(80, 200, 80, 0.5)' : 'rgba(255, 200, 80, 0.4)';
      ctx.strokeRect(detX + 10, fbY, detW - 20, 30);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = selected.unlocked ? '#8f8' : '#fc6';
      const remaining = progress ? progress.target - progress.current : 0;
      ctx.fillText(selected.unlocked ? 'Achievement complete!' : `${remaining} more to go`, detX + detW / 2, fbY + 15);
    } else {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '11px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText('Select an achievement', detX + detW / 2, detY + detH / 2);
    }

    // Footer
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '8px monospace';
    ctx.fillStyle = '#555';
    ctx.fillText(`Achievements v1 | ${count} total | ${unlockedCount} unlocked | ${system.getNearlyComplete(50).length} nearly there (≥50%)`, screenWidth / 2, boxY + boxH - 14);

    ctx.restore();
  }

  /** Small hint (top-right, y=160) when something is ≥50% or recently unlocked. */
  renderQuickHint(ctx: CanvasRenderingContext2D, screenWidth: number, _screenHeight: number, system: AchievementSystem): void {
    if (this.showAchievements) return;
    const nearly = system.getNearlyComplete(50);
    if (nearly.length === 0) return;

    ctx.save();
    const w = 260;
    const h = 22 + Math.min(nearly.length, 2) * 12;
    const x = screenWidth - w - 20;
    const y = 160;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255, 200, 80, 0.4)';
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#fc6';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🏆 Achievements: ${system.getUnlockedCount()}/${system.getCount()} - ${nearly.length} nearly there! Shift+T`, x + 8, y + 11);

    let ty = y + 22;
    ctx.fillStyle = '#ccc';
    ctx.font = '8px monospace';
    for (const inst of nearly.slice(0, 2)) {
      const p = system.getProgress(inst.definition.id);
      ctx.fillText(`  ${inst.definition.icon} ${inst.definition.name.substring(0, 18)} ${p?.current}/${p?.target}`, x + 8, ty + 5);
      ty += 12;
    }
    ctx.restore();
  }

  // ==================== HELPERS ====================

  private wrapText(text: string, maxChars: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > maxChars) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = (current + ' ' + word).trim();
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private formatGameTime(totalSeconds: number): string {
    // Matches TimeManager: 1 game day = 24h * 3600s of game seconds
    const day = Math.floor(totalSeconds / 86400) + 1;
    const rem = totalSeconds % 86400;
    const h = Math.floor(rem / 3600);
    const m = Math.floor((rem % 3600) / 60);
    return `Day ${day} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
