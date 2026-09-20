/**
 * QuestDatabase - Phase 17 Quest System
 * Data-driven quest definitions, 3 quests small controlled phase
 */

import { QuestDefinition, QuestStatus, QuestObjectiveType } from './Quest';

export class QuestDatabase {
  private static instance: QuestDatabase | null = null;
  private quests: Map<string, QuestDefinition> = new Map();

  private constructor() {
    this.loadDefaultQuests();
  }

  static getInstance(): QuestDatabase {
    if (!QuestDatabase.instance) {
      QuestDatabase.instance = new QuestDatabase();
    }
    return QuestDatabase.instance;
  }

  private loadDefaultQuests(): void {
    const defs: QuestDefinition[] = [
      {
        id: 'quest_first_harvest',
        name: 'First Harvest',
        icon: '🌾',
        description: 'Learn the basics of farming. Till soil, plant seeds, and harvest your first crop. Talk to the farmer to get started.',
        status: QuestStatus.AVAILABLE,
        giverNpcId: 'NPC001',
        mapId: 'village_01',
        x: 20,
        y: 20,
        tags: ['farming', 'beginner', 'tutorial'],
        objectives: [
          {
            id: 'obj_collect_wheat_seed',
            type: QuestObjectiveType.COLLECT_ITEM,
            targetId: 'wheat_seed',
            description: 'Collect 3x wheat_seed (buy from general store or find)',
            requiredAmount: 3
          },
          {
            id: 'obj_harvest_wheat',
            type: QuestObjectiveType.HARVEST_CROP,
            targetId: 'wheat',
            description: 'Harvest 1x wheat crop (till, plant, water, wait, harvest)',
            requiredAmount: 1
          },
          {
            id: 'obj_collect_wheat',
            type: QuestObjectiveType.COLLECT_ITEM,
            targetId: 'wheat',
            description: 'Have 3x wheat in inventory',
            requiredAmount: 3
          }
        ],
        rewards: {
          money: 50,
          items: [
            { itemId: 'bread', quantity: 2 },
            { itemId: 'carrot_seed', quantity: 5 }
          ],
          xp: 10
        }
      },
      {
        id: 'quest_talk_to_elders',
        name: 'Talk to Elders',
        icon: '💬',
        description: 'The village elders have wisdom to share. Talk to them to learn about the world, and visit the village center.',
        status: QuestStatus.AVAILABLE,
        giverNpcId: 'NPC002',
        mapId: 'village_01',
        x: 25,
        y: 20,
        tags: ['social', 'exploration', 'tutorial'],
        objectives: [
          {
            id: 'obj_talk_npc001',
            type: QuestObjectiveType.TALK_NPC,
            targetId: 'NPC001',
            description: 'Talk to Farmer (NPC001)',
            requiredAmount: 1
          },
          {
            id: 'obj_talk_npc002',
            type: QuestObjectiveType.TALK_NPC,
            targetId: 'NPC002',
            description: 'Talk to Elder (NPC002)',
            requiredAmount: 1
          },
          {
            id: 'obj_visit_village',
            type: QuestObjectiveType.VISIT_MAP,
            targetId: 'village_01',
            description: 'Visit Village (village_01) - stand in center',
            requiredAmount: 1
          }
        ],
        rewards: {
          money: 30,
          items: [
            { itemId: 'apple', quantity: 5 },
            { itemId: 'coin', quantity: 10 }
          ],
          xp: 15
        }
      },
      {
        id: 'quest_explorer',
        name: 'Explorer',
        icon: '🗺️',
        description: 'The world is bigger than the village! Visit all 3 maps, collect wood for the journey, and earn the explorer title.',
        status: QuestStatus.AVAILABLE,
        prerequisites: ['quest_talk_to_elders'],
        mapId: 'village_01',
        x: 24,
        y: 19,
        tags: ['exploration', 'adventure'],
        objectives: [
          {
            id: 'obj_visit_village_01',
            type: QuestObjectiveType.VISIT_MAP,
            targetId: 'village_01',
            description: 'Visit Village (village_01)',
            requiredAmount: 1
          },
          {
            id: 'obj_visit_forest_01',
            type: QuestObjectiveType.VISIT_MAP,
            targetId: 'forest_01',
            description: 'Visit Forest (forest_01) via north/south edge',
            requiredAmount: 1
          },
          {
            id: 'obj_visit_lake_01',
            type: QuestObjectiveType.VISIT_MAP,
            targetId: 'lake_01',
            description: 'Visit Lake (lake_01) via east/west edge',
            requiredAmount: 1
          },
          {
            id: 'obj_collect_wood',
            type: QuestObjectiveType.COLLECT_ITEM,
            targetId: 'wood',
            description: 'Collect 10x wood (for crafting)',
            requiredAmount: 10
          }
        ],
        rewards: {
          money: 100,
          items: [
            { itemId: 'axe', quantity: 1 },
            { itemId: 'bread', quantity: 3 }
          ],
          xp: 25
        }
      }
    ];

    for (const d of defs) {
      this.quests.set(d.id, d);
    }
    console.log(`[QuestDatabase] Loaded ${this.quests.size} quests`);
  }

  getQuest(id: string): QuestDefinition | null {
    return this.quests.get(id.toLowerCase()) ?? null;
  }

  getAllQuests(): QuestDefinition[] {
    return Array.from(this.quests.values());
  }

  getQuestsByStatus(status: QuestStatus): QuestDefinition[] {
    return this.getAllQuests().filter(q => q.status === status);
  }

  getQuestsByTag(tag: string): QuestDefinition[] {
    return this.getAllQuests().filter(q => q.tags?.includes(tag));
  }

  getCount(): number {
    return this.quests.size;
  }

  hasQuest(id: string): boolean {
    return this.quests.has(id.toLowerCase());
  }

  registerQuest(def: QuestDefinition): void {
    this.quests.set(def.id, def);
  }

  unregisterQuest(id: string): boolean {
    return this.quests.delete(id.toLowerCase());
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const quest of this.quests.values()) {
      if (!quest.id) errors.push(`Quest missing id`);
      if (!quest.name) errors.push(`Quest ${quest.id} missing name`);
      if (!quest.description) errors.push(`Quest ${quest.id} missing description`);
      if (!quest.objectives || quest.objectives.length === 0) errors.push(`Quest ${quest.id} has no objectives`);
      for (const obj of quest.objectives) {
        if (!obj.id) errors.push(`Quest ${quest.id} objective missing id`);
        if (!obj.type) errors.push(`Quest ${quest.id} objective ${obj.id} missing type`);
        if (!obj.targetId) errors.push(`Quest ${quest.id} objective ${obj.id} missing targetId`);
        if (obj.requiredAmount <= 0) errors.push(`Quest ${quest.id} objective ${obj.id} invalid requiredAmount`);
      }
      if (quest.prerequisites) {
        for (const pre of quest.prerequisites) {
          if (!this.hasQuest(pre)) {
            errors.push(`Quest ${quest.id} prerequisite ${pre} not found`);
          }
        }
      }
    }
    return { valid: errors.length === 0, errors };
  }

  getDebugString(): string {
    return `${this.quests.size} quests: ${Array.from(this.quests.keys()).join(', ')}`;
  }
}
