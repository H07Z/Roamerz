/**
 * QuestSystem - Phase 17 Quest System
 * Manages quest instances, objectives tracking, rewards, persistence
 */

import { QuestDatabase } from './QuestDatabase';
import { QuestDefinition, QuestStatus, QuestObjectiveType, QuestObjective, QuestInstanceSaveData, QuestSystemSaveData, createDefaultQuestSystemSaveData, QuestObjectiveSaveData } from './Quest';
import { ItemDatabase } from '../inventory/ItemDatabase';
import { Inventory } from '../inventory/Inventory';

export interface QuestInstance {
  definition: QuestDefinition;
  status: QuestStatus;
  objectives: QuestObjective[];
  startedAt?: number;
  completedAt?: number;
  version: number;
}

export class QuestSystem {
  private database: QuestDatabase;
  private itemDatabase: ItemDatabase;
  private quests: Map<string, QuestInstance> = new Map();
  private totalStarted: number = 0;
  private totalCompleted: number = 0;
  private totalFailed: number = 0;
  private version: number = 1;

  // Tracking for talk, visits, etc.
  private talkedNPCs: Set<string> = new Set();
  private visitedMaps: Set<string> = new Set();
  private harvestedCrops: Map<string, number> = new Map(); // cropId -> count
  private collectedAnimalProduce: Map<string, number> = new Map();
  private craftedItems: Map<string, number> = new Map();
  private cookedItems: Map<string, number> = new Map();
  private boughtItems: Map<string, number> = new Map();
  private soldItems: Map<string, number> = new Map();

  constructor(database?: QuestDatabase, itemDatabase?: ItemDatabase) {
    this.database = database ?? QuestDatabase.getInstance();
    this.itemDatabase = itemDatabase ?? ItemDatabase.getInstance();
  }

  initialize(): void {
    this.quests.clear();
    this.talkedNPCs.clear();
    this.visitedMaps.clear();
    this.harvestedCrops.clear();
    this.collectedAnimalProduce.clear();
    this.craftedItems.clear();
    this.cookedItems.clear();
    this.boughtItems.clear();
    this.soldItems.clear();
    this.totalStarted = 0;
    this.totalCompleted = 0;
    this.totalFailed = 0;

    for (const def of this.database.getAllQuests()) {
      const instance: QuestInstance = {
        definition: def,
        status: def.status,
        objectives: def.objectives.map(objDef => ({
          ...objDef,
          currentAmount: 0,
          completed: false
        })),
        version: 1
      };
      // Check prerequisites - if not met, lock
      if (def.prerequisites && def.prerequisites.length > 0) {
        // For initialization, prerequisites not met, so lock
        // But we will have all quests AVAILABLE by default except those with prereqs? For simplicity, lock if prereq not completed
        // Since no quests completed at init, lock those with prereqs
        if (def.prerequisites.length > 0) {
          instance.status = QuestStatus.LOCKED;
        }
      }
      this.quests.set(def.id, instance);
    }

    console.log(`[QuestSystem] Initialized with ${this.quests.size} quests, ${this.getAvailableQuests().length} available`);
  }

  getQuestInstance(id: string): QuestInstance | null {
    return this.quests.get(id.toLowerCase()) ?? null;
  }

  getAllQuestInstances(): QuestInstance[] {
    return Array.from(this.quests.values());
  }

  getQuestsByStatus(status: QuestStatus): QuestInstance[] {
    return this.getAllQuestInstances().filter(q => q.status === status);
  }

  getAvailableQuests(): QuestInstance[] {
    return this.getQuestsByStatus(QuestStatus.AVAILABLE);
  }

  getActiveQuests(): QuestInstance[] {
    return this.getQuestsByStatus(QuestStatus.ACTIVE);
  }

  getCompletedQuests(): QuestInstance[] {
    return this.getQuestsByStatus(QuestStatus.COMPLETED);
  }

  getLockedQuests(): QuestInstance[] {
    return this.getQuestsByStatus(QuestStatus.LOCKED);
  }

  getCount(): number {
    return this.quests.size;
  }

  getDatabase(): QuestDatabase {
    return this.database;
  }

  canStartQuest(id: string): { can: boolean; reason?: string } {
    const inst = this.getQuestInstance(id);
    if (!inst) return { can: false, reason: `Quest ${id} not found` };
    if (inst.status !== QuestStatus.AVAILABLE) return { can: false, reason: `Quest not available, status ${inst.status}` };
    // Check prerequisites
    if (inst.definition.prerequisites) {
      for (const preId of inst.definition.prerequisites) {
        const pre = this.getQuestInstance(preId);
        if (!pre || pre.status !== QuestStatus.COMPLETED) {
          return { can: false, reason: `Prerequisite ${preId} not completed` };
        }
      }
    }
    return { can: true };
  }

  startQuest(id: string, totalSeconds: number = 0): { success: boolean; reason?: string } {
    const can = this.canStartQuest(id);
    if (!can.can) return { success: false, reason: can.reason };

    const inst = this.getQuestInstance(id);
    if (!inst) return { success: false, reason: `Quest ${id} not found` };

    inst.status = QuestStatus.ACTIVE;
    inst.startedAt = totalSeconds;
    this.totalStarted++;

    console.log(`[QuestSystem] Started quest ${id} ${inst.definition.icon} ${inst.definition.name}`);

    return { success: true };
  }

  completeQuest(id: string, totalSeconds: number = 0, player?: { money: number; getInventory: () => Inventory; addItem: (id: string, qty: number) => boolean }): { success: boolean; reason?: string } {
    const inst = this.getQuestInstance(id);
    if (!inst) return { success: false, reason: `Quest ${id} not found` };
    if (inst.status !== QuestStatus.ACTIVE) return { success: false, reason: `Quest not active, status ${inst.status}` };

    // Check all objectives completed
    const allDone = inst.objectives.every(o => o.completed || o.optional);
    if (!allDone) {
      return { success: false, reason: `Not all objectives completed` };
    }

    inst.status = QuestStatus.COMPLETED;
    inst.completedAt = totalSeconds;
    this.totalCompleted++;

    // Give rewards
    if (player) {
      const rewards = inst.definition.rewards;
      if (rewards.money) {
        player.money += rewards.money;
      }
      if (rewards.items) {
        for (const item of rewards.items) {
          player.addItem(item.itemId, item.quantity);
        }
      }
    }

    // Unlock next quests that had this as prerequisite
    for (const q of this.quests.values()) {
      if (q.status === QuestStatus.LOCKED && q.definition.prerequisites?.includes(id)) {
        const allPreCompleted = q.definition.prerequisites.every(preId => {
          const pre = this.getQuestInstance(preId);
          return pre && pre.status === QuestStatus.COMPLETED;
        });
        if (allPreCompleted) {
          q.status = QuestStatus.AVAILABLE;
          console.log(`[QuestSystem] Unlocked quest ${q.definition.id} after completing ${id}`);
        }
      }
    }

    console.log(`[QuestSystem] Completed quest ${id} ${inst.definition.icon} ${inst.definition.name} rewards money ${inst.definition.rewards.money ?? 0}`);

    return { success: true };
  }

  failQuest(id: string, totalSeconds: number = 0): { success: boolean; reason?: string } {
    const inst = this.getQuestInstance(id);
    if (!inst) return { success: false, reason: `Quest ${id} not found` };
    if (inst.status !== QuestStatus.ACTIVE) return { success: false, reason: `Quest not active` };

    inst.status = QuestStatus.FAILED;
    inst.completedAt = totalSeconds;
    this.totalFailed++;

    console.log(`[QuestSystem] Failed quest ${id}`);

    return { success: true };
  }

  // Objective tracking methods
  recordTalkedNPC(npcId: string): void {
    this.talkedNPCs.add(npcId);
  }

  recordVisitedMap(mapId: string): void {
    this.visitedMaps.add(mapId);
  }

  recordHarvestedCrop(cropId: string, amount: number = 1): void {
    const current = this.harvestedCrops.get(cropId) ?? 0;
    this.harvestedCrops.set(cropId, current + amount);
  }

  recordAnimalProduce(itemId: string, amount: number = 1): void {
    const current = this.collectedAnimalProduce.get(itemId) ?? 0;
    this.collectedAnimalProduce.set(itemId, current + amount);
  }

  recordCrafted(itemId: string, amount: number = 1): void {
    const current = this.craftedItems.get(itemId) ?? 0;
    this.craftedItems.set(itemId, current + amount);
  }

  recordCooked(itemId: string, amount: number = 1): void {
    const current = this.cookedItems.get(itemId) ?? 0;
    this.cookedItems.set(itemId, current + amount);
  }

  recordBought(itemId: string, amount: number = 1): void {
    const current = this.boughtItems.get(itemId) ?? 0;
    this.boughtItems.set(itemId, current + amount);
  }

  recordSold(itemId: string, amount: number = 1): void {
    const current = this.soldItems.get(itemId) ?? 0;
    this.soldItems.set(itemId, current + amount);
  }

  /**
   * Update all active quests objectives based on current game state
   * Call each frame or on relevant events
   */
  updateObjectives(player: { money: number; getInventory: () => Inventory }, explorationVisited?: Set<string>, totalSeconds: number = 0): { completedQuests: string[] } {
    const completedQuests: string[] = [];

    // Merge visited maps from param if provided
    if (explorationVisited) {
      for (const mapId of explorationVisited) {
        this.visitedMaps.add(mapId);
      }
    }

    const inventory = player.getInventory();

    for (const quest of this.getActiveQuests()) {
      let anyUpdated = false;

      for (const obj of quest.objectives) {
        if (obj.completed) continue;

        let current = 0;

        switch (obj.type) {
          case QuestObjectiveType.COLLECT_ITEM:
            current = inventory.getItemQuantity(obj.targetId);
            break;
          case QuestObjectiveType.TALK_NPC:
            current = this.talkedNPCs.has(obj.targetId) ? 1 : 0;
            break;
          case QuestObjectiveType.VISIT_MAP:
            current = this.visitedMaps.has(obj.targetId) ? 1 : 0;
            break;
          case QuestObjectiveType.HARVEST_CROP:
            current = this.harvestedCrops.get(obj.targetId) ?? 0;
            break;
          case QuestObjectiveType.COLLECT_ANIMAL_PRODUCE:
            current = this.collectedAnimalProduce.get(obj.targetId) ?? 0;
            break;
          case QuestObjectiveType.CRAFT_ITEM:
            current = this.craftedItems.get(obj.targetId) ?? 0;
            break;
          case QuestObjectiveType.COOK_ITEM:
            current = this.cookedItems.get(obj.targetId) ?? 0;
            break;
          case QuestObjectiveType.EARN_MONEY:
            current = player.money; // total money, not earned, but for simplicity check have >= required
            break;
          case QuestObjectiveType.BUY_ITEM:
            current = this.boughtItems.get(obj.targetId) ?? 0;
            break;
          case QuestObjectiveType.SELL_ITEM:
            current = this.soldItems.get(obj.targetId) ?? 0;
            break;
        }

        const prev = obj.currentAmount;
        obj.currentAmount = Math.min(current, obj.requiredAmount);
        if (obj.currentAmount >= obj.requiredAmount) {
          if (!obj.completed) {
            obj.completed = true;
            anyUpdated = true;
            console.log(`[QuestSystem] Objective completed ${quest.definition.id} ${obj.id} ${obj.description}`);
          }
        } else if (prev !== obj.currentAmount) {
          anyUpdated = true;
        }
      }

      // Check if all objectives completed -> auto-complete quest
      if (quest.objectives.every(o => o.completed || o.optional)) {
        const result = this.completeQuest(quest.definition.id, totalSeconds, player as any);
        if (result.success) {
          completedQuests.push(quest.definition.id);
        }
      } else if (anyUpdated) {
        // Progress updated but not completed
      }
    }

    return { completedQuests };
  }

  getQuestProgress(id: string): { completed: number; total: number; percentage: number } | null {
    const inst = this.getQuestInstance(id);
    if (!inst) return null;
    const total = inst.objectives.length;
    const completed = inst.objectives.filter(o => o.completed).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, percentage };
  }

  getTotalStarted(): number {
    return this.totalStarted;
  }

  getTotalCompleted(): number {
    return this.totalCompleted;
  }

  getTotalFailed(): number {
    return this.totalFailed;
  }

  getSaveData(): QuestSystemSaveData {
    const quests: Record<string, QuestInstanceSaveData> = {};
    for (const [id, inst] of this.quests.entries()) {
      quests[id] = {
        id,
        status: inst.status,
        objectives: inst.objectives.map(o => ({
          id: o.id,
          currentAmount: o.currentAmount,
          completed: o.completed
        })),
        startedAt: inst.startedAt,
        completedAt: inst.completedAt,
        version: inst.version
      };
    }

    return {
      quests,
      totalStarted: this.totalStarted,
      totalCompleted: this.totalCompleted,
      totalFailed: this.totalFailed,
      version: this.version
    };
  }

  loadSaveData(data: QuestSystemSaveData | any): void {
    if (!data) return;
    try {
      this.quests.clear();
      this.talkedNPCs.clear();
      this.visitedMaps.clear();
      this.harvestedCrops.clear();

      const questsData = data.quests ?? {};

      for (const def of this.database.getAllQuests()) {
        const saved = questsData[def.id];
        const objectives: QuestObjective[] = def.objectives.map(objDef => {
          const savedObj = saved?.objectives?.find((o: any) => o.id === objDef.id);
          return {
            ...objDef,
            currentAmount: savedObj?.currentAmount ?? 0,
            completed: savedObj?.completed ?? false
          };
        });

        const instance: QuestInstance = {
          definition: def,
          status: saved?.status ?? def.status,
          objectives,
          startedAt: saved?.startedAt,
          completedAt: saved?.completedAt,
          version: saved?.version ?? 1
        };

        // Re-evaluate locked if prerequisites not met and not already completed
        if (instance.status === QuestStatus.LOCKED || instance.status === QuestStatus.AVAILABLE) {
          if (def.prerequisites && def.prerequisites.length > 0) {
            const allPreCompleted = def.prerequisites.every(preId => {
              const preSaved = questsData[preId];
              return preSaved && preSaved.status === QuestStatus.COMPLETED;
            });
            if (!allPreCompleted) {
              if (instance.status === QuestStatus.AVAILABLE) {
                const anyPreNotCompleted = def.prerequisites.some(preId => {
                  const preSaved = questsData[preId];
                  return !preSaved || preSaved.status !== QuestStatus.COMPLETED;
                });
                if (anyPreNotCompleted) {
                  instance.status = QuestStatus.LOCKED;
                }
              }
            } else if (instance.status === QuestStatus.LOCKED) {
              instance.status = QuestStatus.AVAILABLE;
            }
          }
        }

        this.quests.set(def.id, instance);
      }

      // For any extra quests in save that not in database, preserve them? For now ignore

      this.totalStarted = typeof data.totalStarted === 'number' ? data.totalStarted : 0;
      this.totalCompleted = typeof data.totalCompleted === 'number' ? data.totalCompleted : 0;
      this.totalFailed = typeof data.totalFailed === 'number' ? data.totalFailed : 0;
      this.version = typeof data.version === 'number' ? data.version : 1;

      // Restore tracking sets from completed objectives? For simplicity, reconstruct from active quests progress
      // Talked NPCs: any TALK_NPC objective completed implies talked
      for (const quest of this.quests.values()) {
        for (const obj of quest.objectives) {
          if (obj.completed) {
            if (obj.type === QuestObjectiveType.TALK_NPC) {
              this.talkedNPCs.add(obj.targetId);
            } else if (obj.type === QuestObjectiveType.VISIT_MAP) {
              this.visitedMaps.add(obj.targetId);
            }
          }
        }
      }

      console.log(`[QuestSystem] Loaded ${this.quests.size} quests, ${this.totalCompleted} completed, ${this.totalStarted} started`);
    } catch (e) {
      console.error('[QuestSystem] Failed to load save data:', e);
    }
  }

  clear(): void {
    this.quests.clear();
    this.talkedNPCs.clear();
    this.visitedMaps.clear();
    this.harvestedCrops.clear();
    this.collectedAnimalProduce.clear();
    this.craftedItems.clear();
    this.cookedItems.clear();
    this.boughtItems.clear();
    this.soldItems.clear();
    this.totalStarted = 0;
    this.totalCompleted = 0;
    this.totalFailed = 0;
    console.log('[QuestSystem] Cleared');
    this.initialize();
  }

  getDebugString(): string {
    return `${this.quests.size} quests, ${this.getAvailableQuests().length} avail, ${this.getActiveQuests().length} active, ${this.getCompletedQuests().length} done, ${this.totalStarted} started, ${this.totalCompleted} completed`;
  }

  debugPrint(): void {
    console.log(`[QuestSystem] ${this.getDebugString()}`);
    for (const quest of this.getAllQuestInstances()) {
      const progress = this.getQuestProgress(quest.definition.id);
      console.log(`  ${quest.definition.icon} ${quest.definition.id} ${quest.definition.name} ${quest.status} ${progress?.completed}/${progress?.total} (${progress?.percentage.toFixed(0)}%) rewards $${quest.definition.rewards.money ?? 0}`);
      for (const obj of quest.objectives) {
        console.log(`    ${obj.completed ? '✓' : '○'} ${obj.type} ${obj.targetId} ${obj.currentAmount}/${obj.requiredAmount} ${obj.description}`);
      }
    }
    console.log(`  Tracked: talked ${Array.from(this.talkedNPCs).join(',')} visited ${Array.from(this.visitedMaps).join(',')} harvested ${Array.from(this.harvestedCrops.entries()).map(([k,v])=>`${k}:${v}`).join(',')}`);
  }
}
