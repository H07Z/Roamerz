/**
 * test_quests.ts - Phase 17 Quest System tests
 */

import { ItemDatabase } from '../inventory/ItemDatabase';
import { Inventory } from '../inventory/Inventory';
import { QuestDatabase } from './QuestDatabase';
import { QuestSystem } from './QuestSystem';
import { QuestStatus } from './Quest';

function runTests() {
  console.log('=== PHASE 17 QUEST TESTS ===');

  const itemDb = ItemDatabase.getInstance();
  const questDb = QuestDatabase.getInstance();
  const questSystem = new QuestSystem(questDb, itemDb);
  questSystem.initialize();

  const count = questDb.getCount();
  console.log(`Test1 QuestDatabase count: ${count} expected 3 -> ${count===3 ? 'PASS' : 'FAIL'}`);
  console.log(`  ${questDb.getDebugString()}`);

  const validation = questDb.validate();
  console.log(`Test2 validation: valid=${validation.valid} errors=${validation.errors.length} -> ${validation.valid ? 'PASS' : 'FAIL'}`);
  if (validation.errors.length) console.log(`  Errors: ${validation.errors.join(', ')}`);

  const firstHarvest = questDb.getQuest('quest_first_harvest');
  console.log(`Test3 first_harvest: ${firstHarvest?.name} objectives ${firstHarvest?.objectives.length} expected 3 -> ${firstHarvest?.objectives.length===3 ? 'PASS' : 'FAIL'}`);

  const available = questSystem.getAvailableQuests();
  console.log(`Test4 available quests: ${available.length} expected 2 (first_harvest, talk_to_elders) explorer locked -> ${available.length===2 ? 'PASS' : 'FAIL'}`);
  console.log(`  Available: ${available.map(q=>q.definition.id).join(', ')}`);

  const locked = questSystem.getLockedQuests();
  console.log(`Test5 locked quests: ${locked.length} expected 1 (explorer) -> ${locked.length===1 ? 'PASS' : 'FAIL'}`);

  const inv = new Inventory(20, itemDb);
  inv.addItem('wheat_seed', 5);
  inv.addItem('wheat', 5);
  inv.addItem('wood', 15);
  const player = {
    money: 100,
    getInventory: () => inv,
    addItem: (id: string, qty: number) => inv.addItem(id, qty),
    removeItem: (id: string, qty: number) => inv.removeItem(id, qty)
  };

  const canStart = questSystem.canStartQuest('quest_first_harvest');
  console.log(`Test6 canStart first_harvest: can=${canStart.can} -> ${canStart.can ? 'PASS' : 'FAIL'}`);

  const startResult = questSystem.startQuest('quest_first_harvest', 0);
  console.log(`Test7 start first_harvest: success=${startResult.success} -> ${startResult.success ? 'PASS' : 'FAIL'}`);
  console.log(`  active count ${questSystem.getActiveQuests().length} expected 1 -> ${questSystem.getActiveQuests().length===1 ? 'PASS' : 'FAIL'}`);

  // Simulate farming harvest
  questSystem.recordHarvestedCrop('wheat', 1);
  const update1 = questSystem.updateObjectives(player as any, new Set(['village_01']), 100);
  console.log(`Test8 update after wheat_seed 5 wheat 5 + harvest 1: completedQuests ${update1.completedQuests.length} expected 1 (first_harvest) -> ${update1.completedQuests.length===1 ? 'PASS' : 'FAIL'}`);
  console.log(`  totalCompleted ${questSystem.getTotalCompleted()} expected 1 -> ${questSystem.getTotalCompleted()===1 ? 'PASS' : 'FAIL'}`);
  console.log(`  player money ${player.money} expected 150 (100+50 reward) -> ${player.money===150 ? 'PASS' : 'FAIL'}`);
  console.log(`  inv bread ${inv.getItemQuantity('bread')} expected 2 -> ${inv.getItemQuantity('bread')===2 ? 'PASS' : 'FAIL'}`);

  // Test talk quest
  questSystem.recordTalkedNPC('NPC001');
  questSystem.recordTalkedNPC('NPC002');
  questSystem.recordVisitedMap('village_01');
  const startTalk = questSystem.startQuest('quest_talk_to_elders', 200);
  console.log(`Test9 start talk_to_elders: success=${startTalk.success} -> ${startTalk.success ? 'PASS' : 'FAIL'}`);

  const update2 = questSystem.updateObjectives(player as any, new Set(['village_01']), 200);
  console.log(`Test9b update talk quest after talking NPCs + visit: completed ${update2.completedQuests.length} expected 1 -> ${update2.completedQuests.length===1 ? 'PASS' : 'FAIL'}`);
  console.log(`  totalCompleted ${questSystem.getTotalCompleted()} expected 2 -> ${questSystem.getTotalCompleted()===2 ? 'PASS' : 'FAIL'}`);

  // Explorer should now be unlocked
  const explorerInst = questSystem.getQuestInstance('quest_explorer');
  console.log(`Test10 explorer unlocked after talk_to_elders: status ${explorerInst?.status} expected AVAILABLE -> ${explorerInst?.status===QuestStatus.AVAILABLE ? 'PASS' : 'FAIL'}`);

  const startExplorer = questSystem.startQuest('quest_explorer', 300);
  console.log(`Test10b start explorer: success=${startExplorer.success} -> ${startExplorer.success ? 'PASS' : 'FAIL'}`);

  questSystem.recordVisitedMap('forest_01');
  questSystem.recordVisitedMap('lake_01');
  // wood already 15 in inv
  const update3 = questSystem.updateObjectives(player as any, new Set(['village_01','forest_01','lake_01']), 400);
  console.log(`Test11 update explorer after visiting all maps + wood 15: completed ${update3.completedQuests.length} expected 1 -> ${update3.completedQuests.length===1 ? 'PASS' : 'FAIL'}`);
  console.log(`  totalCompleted ${questSystem.getTotalCompleted()} expected 3 -> ${questSystem.getTotalCompleted()===3 ? 'PASS' : 'FAIL'}`);

  const saveData = questSystem.getSaveData();
  console.log(`Test12 saveData: quests=${Object.keys(saveData.quests).length} completed=${saveData.totalCompleted} started=${saveData.totalStarted} -> ${saveData.totalCompleted===3 ? 'PASS' : 'FAIL'}`);

  const newSystem = new QuestSystem(questDb, itemDb);
  newSystem.loadSaveData(saveData);
  console.log(`Test12b load: completed ${newSystem.getTotalCompleted()} expected 3 -> ${newSystem.getTotalCompleted()===3 ? 'PASS' : 'FAIL'}`);
  console.log(`  explorer status ${newSystem.getQuestInstance('quest_explorer')?.status} expected COMPLETED -> ${newSystem.getQuestInstance('quest_explorer')?.status===QuestStatus.COMPLETED ? 'PASS' : 'FAIL'}`);

  console.log('=== END PHASE 17 TESTS ===');
  console.log(`[Quests] ${questSystem.getDebugString()}`);
}

runTests();
