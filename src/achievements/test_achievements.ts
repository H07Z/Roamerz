/**
 * test_achievements.ts - Phase 18.1 Achievements System tests
 * Run: npx tsx src/achievements/test_achievements.ts
 */

import { ItemDatabase } from '../inventory/ItemDatabase';
import { Inventory } from '../inventory/Inventory';
import { AchievementDatabase } from './AchievementDatabase';
import { AchievementSystem } from './AchievementSystem';
import { AchievementStat, AchievementCategory } from './Achievement';

let failures = 0;
function check(name: string, condition: boolean, detail: string = ''): void {
  console.log(`${name}: ${detail}${detail ? ' ' : ''}-> ${condition ? 'PASS' : 'FAIL'}`);
  if (!condition) failures++;
}

function makePlayer(itemDb: ItemDatabase) {
  const inv = new Inventory(20, itemDb);
  return {
    money: 50,
    inv,
    addItem: (id: string, qty: number) => inv.addItem(id, qty)
  };
}

function runTests() {
  console.log('=== PHASE 18.1 ACHIEVEMENT TESTS ===');

  const itemDb = ItemDatabase.getInstance();
  const db = AchievementDatabase.getInstance();
  const system = new AchievementSystem(db, itemDb);
  system.initialize();

  // Test1 database
  check('Test1 AchievementDatabase count', db.getCount() === 12, `${db.getCount()} expected 12`);
  console.log(`  ${db.getDebugString()}`);

  // Test2 validation (ids, stats, reward items exist in ItemDatabase)
  const validation = db.validate(itemDb);
  check('Test2 validation', validation.valid, `valid=${validation.valid} errors=${validation.errors.length}`);
  if (validation.errors.length) console.log(`  Errors: ${validation.errors.join(', ')}`);

  // Test3 initial state
  check('Test3 initial unlocked', system.getUnlockedCount() === 0, `${system.getUnlockedCount()} expected 0`);
  check('Test3b initial percent', system.getCompletionPercent() === 0, `${system.getCompletionPercent()}% expected 0`);

  // Test4 counter stat -> unlock + rewards
  const player = makePlayer(itemDb);
  system.recordStat(AchievementStat.CROPS_HARVESTED, 1);
  let res = system.update(player, 3600);
  check('Test4 harvest 1 unlocks green_thumb', res.unlocked.length === 1 && res.unlocked[0] === 'ach_green_thumb', `unlocked=${res.unlocked.join(',')}`);
  check('Test4b money reward $10', player.money === 60, `money ${player.money} expected 60`);
  check('Test4c unlockedAt recorded', system.getAchievement('ach_green_thumb')?.unlockedAt === 3600, `unlockedAt=${system.getAchievement('ach_green_thumb')?.unlockedAt}`);

  // Test5 progress on partially complete
  system.recordStat(AchievementStat.CROPS_HARVESTED, 4); // total 5
  res = system.update(player, 4000);
  const farmerProg = system.getProgress('ach_farmer');
  check('Test5 farmer progress 5/10', farmerProg?.current === 5 && farmerProg?.target === 10 && farmerProg?.percent === 50, `${farmerProg?.current}/${farmerProg?.target} ${farmerProg?.percent}%`);
  check('Test5b no new unlock', res.unlocked.length === 0, `unlocked=${res.unlocked.length}`);
  check('Test5c nearly complete includes farmer', system.getNearlyComplete(50).some(a => a.definition.id === 'ach_farmer'), `nearly=${system.getNearlyComplete(50).map(a=>a.definition.id).join(',')}`);

  // Test6 reach farmer target -> item reward
  system.recordStat(AchievementStat.CROPS_HARVESTED, 5); // total 10
  res = system.update(player, 5000);
  check('Test6 farmer unlocked', res.unlocked.includes('ach_farmer'), `unlocked=${res.unlocked.join(',')}`);
  check('Test6b money +50', player.money === 110, `money ${player.money} expected 110`);
  check('Test6c wheat_seed 5 granted', player.inv.getItemQuantity('wheat_seed') === 5, `wheat_seed ${player.inv.getItemQuantity('wheat_seed')} expected 5`);

  // Test7 unique stat (same id twice counts once)
  system.recordUnique(AchievementStat.NPCS_TALKED, 'NPC001');
  system.recordUnique(AchievementStat.NPCS_TALKED, 'NPC001');
  system.recordUnique(AchievementStat.NPCS_TALKED, 'NPC002');
  res = system.update(player, 6000);
  check('Test7 unique npcs_talked = 2', system.getStat(AchievementStat.NPCS_TALKED) === 2, `stat ${system.getStat(AchievementStat.NPCS_TALKED)} expected 2`);
  check('Test7b friendly_face still locked', !system.isUnlocked('ach_friendly_face'), `unlocked=${system.isUnlocked('ach_friendly_face')}`);
  system.recordUnique(AchievementStat.NPCS_TALKED, 'NPC003');
  res = system.update(player, 6100);
  check('Test7c friendly_face unlocked at 3', res.unlocked.includes('ach_friendly_face'), `unlocked=${res.unlocked.join(',')}`);
  check('Test7d apple 3 granted', player.inv.getItemQuantity('apple') === 3, `apple ${player.inv.getItemQuantity('apple')} expected 3`);

  // Test8 max stat (money peak)
  system.recordMax(AchievementStat.MAX_MONEY, 300);
  system.recordMax(AchievementStat.MAX_MONEY, 120); // lower value must not reduce
  check('Test8 max_money stays 300', system.getStat(AchievementStat.MAX_MONEY) === 300, `stat ${system.getStat(AchievementStat.MAX_MONEY)}`);
  system.recordMax(AchievementStat.MAX_MONEY, 500);
  res = system.update(player, 7000);
  check('Test8b well_off unlocked at 500', res.unlocked.includes('ach_well_off'), `unlocked=${res.unlocked.join(',')}`);
  check('Test8c coin 20 granted', player.inv.getItemQuantity('coin') === 20, `coin ${player.inv.getItemQuantity('coin')} expected 20`);

  // Test9 two achievements on same stat unlock together when jumping past both
  system.recordStat(AchievementStat.QUESTS_COMPLETED, 3);
  res = system.update(player, 8000);
  check('Test9 quest_taker + quest_master both unlock', res.unlocked.includes('ach_quest_taker') && res.unlocked.includes('ach_quest_master'), `unlocked=${res.unlocked.join(',')}`);
  check('Test9b gem granted', player.inv.getItemQuantity('gem') === 1, `gem ${player.inv.getItemQuantity('gem')}`);

  // Test10 no double unlock / totals
  res = system.update(player, 9000);
  check('Test10 re-update unlocks nothing', res.unlocked.length === 0, `unlocked=${res.unlocked.length}`);
  check('Test10b unlocked count 6', system.getUnlockedCount() === 6, `${system.getUnlockedCount()} expected 6 (green_thumb, farmer, friendly_face, well_off, quest_taker, quest_master)`);
  check('Test10c totalUnlocked matches', system.getTotalUnlocked() === system.getUnlockedCount(), `${system.getTotalUnlocked()}`);

  // Test11 category filter
  const farming = system.getByCategory(AchievementCategory.FARMING);
  check('Test11 farming category 2', farming.length === 2, `${farming.length}`);

  // Test12 save / load roundtrip
  const save = system.getSaveData();
  check('Test12 saveData shape', Object.keys(save.achievements).length === 12 && save.uniques[AchievementStat.NPCS_TALKED]?.length === 3 && save.totalUnlocked === 6, `ach=${Object.keys(save.achievements).length} uniques npcs=${save.uniques[AchievementStat.NPCS_TALKED]?.length} total=${save.totalUnlocked}`);
  const json = JSON.stringify(save);
  const system2 = new AchievementSystem(db, itemDb);
  system2.loadSaveData(JSON.parse(json));
  check('Test12b loaded unlocked 6', system2.getUnlockedCount() === 6, `${system2.getUnlockedCount()}`);
  check('Test12c loaded stat crops 10', system2.getStat(AchievementStat.CROPS_HARVESTED) === 10, `${system2.getStat(AchievementStat.CROPS_HARVESTED)}`);
  check('Test12d loaded unique npcs 3', system2.getStat(AchievementStat.NPCS_TALKED) === 3, `${system2.getStat(AchievementStat.NPCS_TALKED)}`);
  check('Test12e loaded unlockedAt', system2.getAchievement('ach_green_thumb')?.unlockedAt === 3600, `${system2.getAchievement('ach_green_thumb')?.unlockedAt}`);
  const res2 = system2.update(player, 9999);
  check('Test12f no re-unlock after load (no duplicate rewards)', res2.unlocked.length === 0, `unlocked=${res2.unlocked.length}`);

  // Test13 corrupt / partial save data tolerated
  const system3 = new AchievementSystem(db, itemDb);
  system3.loadSaveData({ achievements: { ach_green_thumb: { unlocked: true }, ach_unknown_removed: { unlocked: true } }, stats: { crops_harvested: 'bad' as any } });
  check('Test13 partial load tolerated', system3.getUnlockedCount() === 1 && system3.getStat(AchievementStat.CROPS_HARVESTED) === 0, `unlocked=${system3.getUnlockedCount()} crops=${system3.getStat(AchievementStat.CROPS_HARVESTED)}`);
  system3.loadSaveData(null);
  check('Test13b null load resets', system3.getUnlockedCount() === 0 && system3.getCount() === 12, `unlocked=${system3.getUnlockedCount()} count=${system3.getCount()}`);

  // Test14 clear
  system.clear();
  check('Test14 clear resets', system.getUnlockedCount() === 0 && system.getStat(AchievementStat.CROPS_HARVESTED) === 0 && system.getTotalUnlocked() === 0, `unlocked=${system.getUnlockedCount()}`);

  // Test15 forceUnlock (debug helper)
  const forced = system.forceUnlock('ach_wanderer', player, 100);
  check('Test15 forceUnlock wanderer', forced && system.isUnlocked('ach_wanderer') && !system.forceUnlock('ach_wanderer'), `forced=${forced}`);

  console.log('=== END PHASE 18.1 TESTS ===');
  console.log(failures === 0 ? 'ALL ACHIEVEMENT TESTS PASS' : `${failures} ACHIEVEMENT TEST(S) FAILED`);
  system.debugPrint();
  const proc = (globalThis as any).process;
  if (failures > 0 && proc) proc.exitCode = 1;
}

runTests();
