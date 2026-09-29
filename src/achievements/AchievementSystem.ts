/**
 * AchievementSystem - Phase 18.1 Achievements System
 * Tracks stats fed by Game.ts hooks, unlocks achievements when targets are reached,
 * grants rewards, persists progress. Independent of other systems (no direct reads).
 */

import { AchievementDatabase } from './AchievementDatabase';
import {
  AchievementDefinition,
  AchievementInstance,
  AchievementProgress,
  AchievementSystemSaveData,
  AchievementCategory,
  createDefaultAchievementSystemSaveData
} from './Achievement';
import { ItemDatabase } from '../inventory/ItemDatabase';

/** Minimal player shape needed to grant rewards (Player satisfies this). */
export interface AchievementRewardTarget {
  money: number;
  addItem: (itemId: string, quantity: number) => boolean;
}

export interface AchievementUpdateResult {
  unlocked: string[];  // ids unlocked during this update
}

export class AchievementSystem {
  private database: AchievementDatabase;
  private itemDatabase: ItemDatabase;
  private achievements: Map<string, AchievementInstance> = new Map();
  private stats: Map<string, number> = new Map();
  private uniques: Map<string, Set<string>> = new Map();
  private totalUnlocked: number = 0;
  private version: number = 1;
  private lastUnlockedIds: string[] = [];  // most recent unlocks (newest last), for UI

  constructor(database?: AchievementDatabase, itemDatabase?: ItemDatabase) {
    this.database = database ?? AchievementDatabase.getInstance();
    this.itemDatabase = itemDatabase ?? ItemDatabase.getInstance();
  }

  initialize(): void {
    this.achievements.clear();
    this.stats.clear();
    this.uniques.clear();
    this.totalUnlocked = 0;
    this.lastUnlockedIds = [];

    for (const def of this.database.getAllAchievements()) {
      this.achievements.set(def.id, {
        definition: def,
        progress: 0,
        unlocked: false
      });
    }
    console.log(`[AchievementSystem] Initialized ${this.achievements.size} achievements`);
  }

  // ==================== STAT TRACKING (called by Game.ts hooks) ====================

  /** Counter stat: stats[key] += amount */
  recordStat(key: string, amount: number = 1): void {
    if (amount <= 0) return;
    this.stats.set(key, (this.stats.get(key) ?? 0) + amount);
  }

  /** Unique-set stat: stats[key] = number of distinct ids recorded */
  recordUnique(key: string, id: string): void {
    if (!id) return;
    let set = this.uniques.get(key);
    if (!set) {
      set = new Set();
      this.uniques.set(key, set);
    }
    set.add(id);
    this.stats.set(key, set.size);
  }

  /** Max stat: stats[key] = max(stats[key], value) */
  recordMax(key: string, value: number): void {
    const current = this.stats.get(key) ?? 0;
    if (value > current) this.stats.set(key, value);
  }

  getStat(key: string): number {
    return this.stats.get(key) ?? 0;
  }

  getAllStats(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, v] of this.stats) out[k] = v;
    return out;
  }

  // ==================== UPDATE / UNLOCK ====================

  /**
   * Re-evaluate all locked achievements against current stats.
   * Newly unlocked achievements grant rewards to `player` (if provided).
   */
  update(player?: AchievementRewardTarget, totalSeconds: number = 0): AchievementUpdateResult {
    const unlocked: string[] = [];

    for (const inst of this.achievements.values()) {
      if (inst.unlocked) continue;
      const value = this.stats.get(inst.definition.stat) ?? 0;
      inst.progress = Math.min(value, inst.definition.target);
      if (value >= inst.definition.target) {
        this.unlock(inst, player, totalSeconds);
        unlocked.push(inst.definition.id);
      }
    }

    return { unlocked };
  }

  private unlock(inst: AchievementInstance, player: AchievementRewardTarget | undefined, totalSeconds: number): void {
    inst.unlocked = true;
    inst.unlockedAt = totalSeconds;
    inst.progress = inst.definition.target;
    this.totalUnlocked++;
    this.lastUnlockedIds.push(inst.definition.id);
    if (this.lastUnlockedIds.length > 5) this.lastUnlockedIds.shift();

    const rewards = inst.definition.rewards;
    let rewardLog = 'none';
    if (rewards && player) {
      const parts: string[] = [];
      if (rewards.money) {
        player.money += rewards.money;
        parts.push(`$${rewards.money}`);
      }
      if (rewards.items) {
        for (const item of rewards.items) {
          if (!this.itemDatabase.hasItem(item.itemId)) {
            console.warn(`[AchievementSystem] Reward item ${item.itemId} not found, skipping`);
            continue;
          }
          const ok = player.addItem(item.itemId, item.quantity);
          parts.push(`${item.quantity}x ${item.itemId}${ok ? '' : ' (inventory full!)'}`);
        }
      }
      rewardLog = parts.join(', ') || 'none';
    } else if (rewards && !player) {
      rewardLog = 'skipped (no player)';
    }

    console.log(`[AchievementSystem] 🏆 Unlocked ${inst.definition.icon} ${inst.definition.name} (${inst.definition.id}) rewards: ${rewardLog}`);
  }

  /** Debug helper: force-unlock by id (used by tests / debug key). */
  forceUnlock(id: string, player?: AchievementRewardTarget, totalSeconds: number = 0): boolean {
    const inst = this.achievements.get(id);
    if (!inst || inst.unlocked) return false;
    this.stats.set(inst.definition.stat, Math.max(this.getStat(inst.definition.stat), inst.definition.target));
    this.unlock(inst, player, totalSeconds);
    return true;
  }

  // ==================== QUERIES ====================

  getAchievement(id: string): AchievementInstance | undefined {
    return this.achievements.get(id);
  }

  getAllAchievements(): AchievementInstance[] {
    return Array.from(this.achievements.values());
  }

  getByCategory(category: AchievementCategory): AchievementInstance[] {
    return this.getAllAchievements().filter(a => a.definition.category === category);
  }

  getUnlocked(): AchievementInstance[] {
    return this.getAllAchievements().filter(a => a.unlocked);
  }

  getLocked(): AchievementInstance[] {
    return this.getAllAchievements().filter(a => !a.unlocked);
  }

  isUnlocked(id: string): boolean {
    return this.achievements.get(id)?.unlocked ?? false;
  }

  getCount(): number {
    return this.achievements.size;
  }

  getUnlockedCount(): number {
    return this.getUnlocked().length;
  }

  getTotalUnlocked(): number {
    return this.totalUnlocked;
  }

  getCompletionPercent(): number {
    if (this.achievements.size === 0) return 0;
    return (this.getUnlockedCount() / this.achievements.size) * 100;
  }

  getProgress(id: string): AchievementProgress | null {
    const inst = this.achievements.get(id);
    if (!inst) return null;
    const current = inst.unlocked ? inst.definition.target : Math.min(this.getStat(inst.definition.stat), inst.definition.target);
    const target = inst.definition.target;
    return { current, target, percent: target > 0 ? (current / target) * 100 : 0 };
  }

  /** Locked achievements with progress >= threshold percent (for "nearly there" hint). */
  getNearlyComplete(thresholdPercent: number = 50): AchievementInstance[] {
    return this.getLocked().filter(a => {
      const p = this.getProgress(a.definition.id);
      return p !== null && p.percent >= thresholdPercent;
    });
  }

  getLastUnlockedIds(): string[] {
    return [...this.lastUnlockedIds];
  }

  getDefinition(id: string): AchievementDefinition | undefined {
    return this.database.getAchievement(id);
  }

  // ==================== PERSISTENCE ====================

  getSaveData(): AchievementSystemSaveData {
    const achievements: Record<string, { progress: number; unlocked: boolean; unlockedAt?: number }> = {};
    for (const [id, inst] of this.achievements) {
      achievements[id] = {
        progress: inst.progress,
        unlocked: inst.unlocked,
        ...(inst.unlockedAt !== undefined ? { unlockedAt: inst.unlockedAt } : {})
      };
    }
    const uniques: Record<string, string[]> = {};
    for (const [k, set] of this.uniques) uniques[k] = Array.from(set);

    return {
      achievements,
      stats: this.getAllStats(),
      uniques,
      totalUnlocked: this.totalUnlocked,
      version: this.version
    };
  }

  loadSaveData(data: AchievementSystemSaveData | any): void {
    try {
      const safe = { ...createDefaultAchievementSystemSaveData(), ...(data ?? {}) };
      this.initialize();

      // Stats
      if (safe.stats && typeof safe.stats === 'object') {
        for (const [k, v] of Object.entries(safe.stats)) {
          if (typeof v === 'number' && isFinite(v)) this.stats.set(k, v);
        }
      }
      // Unique sets (re-derive stat from set size to stay consistent)
      if (safe.uniques && typeof safe.uniques === 'object') {
        for (const [k, arr] of Object.entries(safe.uniques)) {
          if (Array.isArray(arr)) {
            const set = new Set<string>(arr.filter((x: any) => typeof x === 'string'));
            this.uniques.set(k, set);
            this.stats.set(k, set.size);
          }
        }
      }
      // Instances
      let unlockedCount = 0;
      if (safe.achievements && typeof safe.achievements === 'object') {
        for (const [id, saved] of Object.entries(safe.achievements as Record<string, any>)) {
          const inst = this.achievements.get(id);
          if (!inst || !saved) continue; // unknown achievement id (removed from DB) - ignore
          inst.unlocked = !!saved.unlocked;
          inst.progress = typeof saved.progress === 'number' ? Math.min(saved.progress, inst.definition.target) : 0;
          if (typeof saved.unlockedAt === 'number') inst.unlockedAt = saved.unlockedAt;
          if (inst.unlocked) {
            inst.progress = inst.definition.target;
            unlockedCount++;
          }
        }
      }
      this.totalUnlocked = typeof safe.totalUnlocked === 'number' ? Math.max(safe.totalUnlocked, unlockedCount) : unlockedCount;
      this.version = typeof safe.version === 'number' ? safe.version : 1;

      console.log(`[AchievementSystem] Loaded ${this.achievements.size} achievements, ${unlockedCount} unlocked, ${this.stats.size} stats`);
    } catch (e) {
      console.error('[AchievementSystem] Failed to load save data, resetting', e);
      this.initialize();
    }
  }

  clear(): void {
    this.initialize();
  }

  // ==================== DEBUG ====================

  getDebugString(): string {
    const nearly = this.getNearlyComplete(50).length;
    return `${this.getUnlockedCount()}/${this.getCount()} unlocked (${this.getCompletionPercent().toFixed(0)}%) nearly:${nearly} stats:${this.stats.size}`;
  }

  debugPrint(): void {
    console.log(`[AchievementSystem] ${this.getDebugString()}`);
    for (const inst of this.achievements.values()) {
      const p = this.getProgress(inst.definition.id);
      console.log(`  ${inst.unlocked ? '✅' : '🔒'} ${inst.definition.icon} ${inst.definition.id} ${inst.definition.name} [${inst.definition.category}] ${p?.current}/${p?.target} (${p?.percent.toFixed(0)}%) stat=${inst.definition.stat}${inst.unlockedAt !== undefined ? ` unlockedAt=${inst.unlockedAt.toFixed(0)}s` : ''}`);
    }
    console.log(`  Stats: ${JSON.stringify(this.getAllStats())}`);
  }
}
