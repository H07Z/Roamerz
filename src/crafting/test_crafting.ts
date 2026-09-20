/**
 * test_crafting.ts - Phase 16.2 Crafting System tests
 */

import { ItemDatabase } from '../inventory/ItemDatabase';
import { Inventory } from '../inventory/Inventory';
import { RecipeDatabase } from './RecipeDatabase';
import { CraftingSystem } from './CraftingSystem';
import { RecipeCategory } from './Recipe';

function runTests() {
  console.log('=== PHASE 16.2 CRAFTING TESTS ===');

  const itemDb = ItemDatabase.getInstance();
  const recipeDb = RecipeDatabase.getInstance();
  const craftingSystem = new CraftingSystem(recipeDb);
  craftingSystem.initialize();

  // Test1 count
  const count = recipeDb.getCount();
  console.log(`Test1 RecipeDatabase count: ${count} expected 12 -> ${count===12 ? 'PASS' : 'FAIL'}`);
  console.log(`  ${recipeDb.getDebugString()}`);

  // Test2 validation
  const validation = recipeDb.validate();
  console.log(`Test2 validation: valid=${validation.valid} errors=${validation.errors.length} -> ${validation.valid ? 'PASS' : 'FAIL'}`);

  // Test3 categories
  const tools = recipeDb.getRecipesByCategory(RecipeCategory.TOOL);
  console.log(`Test3 TOOL recipes: ${tools.length} expected 4 -> ${tools.length===4 ? 'PASS' : 'FAIL'} ${tools.map(r=>r.id).join(',')}`);

  const feed = recipeDb.getRecipesByCategory(RecipeCategory.FEED);
  console.log(`Test4 FEED recipes: ${feed.length} expected 2 -> ${feed.length===2 ? 'PASS' : 'FAIL'}`);

  // Test5 inventory + canCraft
  const inv = new Inventory(20, itemDb);
  inv.addItem('wood', 5);
  inv.addItem('stone', 3);
  console.log(`Test5 inv wood=${inv.getItemQuantity('wood')} stone=${inv.getItemQuantity('stone')} -> PASS`);

  const canAxe = craftingSystem.canCraft('craft_axe', inv);
  console.log(`Test6 canCraft axe: ${canAxe.can ? 'PASS' : 'FAIL'} ${canAxe.reason ?? ''}`);

  // Test7 craft axe
  const craftAxe = craftingSystem.craft('craft_axe', inv);
  console.log(`Test7 craft axe: success=${craftAxe.success} result=${craftAxe.resultItemId} qty=${craftAxe.resultQuantity} -> ${craftAxe.success && craftAxe.resultItemId==='axe' ? 'PASS' : 'FAIL'}`);
  console.log(`  After: wood=${inv.getItemQuantity('wood')} expected 2, stone=${inv.getItemQuantity('stone')} expected 1, axe=${inv.getItemQuantity('axe')} expected 1 -> ${inv.getItemQuantity('wood')===2 && inv.getItemQuantity('stone')===1 && inv.getItemQuantity('axe')===1 ? 'PASS' : 'FAIL'}`);

  // Test8 craft fails when missing
  const canAgain = craftingSystem.canCraft('craft_axe', inv);
  console.log(`Test8 canCraft axe again should fail: ${!canAgain.can ? 'PASS' : 'FAIL'} missing=${canAgain.missing?.map(m=>m.itemId).join(',')}`);

  // Test9 bread
  inv.clearInventory();
  inv.addItem('wheat', 3);
  const canBread = craftingSystem.canCraft('craft_bread', inv);
  console.log(`Test9 canCraft bread: ${canBread.can ? 'PASS' : 'FAIL'}`);
  const craftBread = craftingSystem.craft('craft_bread', inv);
  console.log(`Test9b craft bread: success=${craftBread.success} bread=${inv.getItemQuantity('bread')} expected 1 -> ${craftBread.success && inv.getItemQuantity('bread')===1 ? 'PASS' : 'FAIL'}`);

  // Test10 hay
  inv.clearInventory();
  inv.addItem('wheat', 2);
  const craftHay = craftingSystem.craft('craft_hay', inv);
  console.log(`Test10 craft hay: success=${craftHay.success} hay=${inv.getItemQuantity('hay')} expected 2 -> ${craftHay.success && inv.getItemQuantity('hay')===2 ? 'PASS' : 'FAIL'}`);

  // Test11 animal_feed
  inv.clearInventory();
  inv.addItem('hay', 2);
  inv.addItem('wheat', 1);
  inv.addItem('carrot', 1);
  const craftFeed = craftingSystem.craft('craft_animal_feed', inv);
  console.log(`Test11 craft animal_feed: success=${craftFeed.success} feed=${inv.getItemQuantity('animal_feed')} expected 3 -> ${craftFeed.success && inv.getItemQuantity('animal_feed')===3 ? 'PASS' : 'FAIL'}`);

  // Test12 craftable list
  inv.clearInventory();
  inv.addItem('wood', 10);
  inv.addItem('stone', 10);
  inv.addItem('ore', 5);
  inv.addItem('fiber', 5);
  inv.addItem('wheat', 5);
  inv.addItem('herb', 5);
  inv.addItem('mushroom', 5);
  inv.addItem('berry', 5);
  const craftable = craftingSystem.getCraftableRecipes(inv);
  console.log(`Test12 craftable with many mats: found ${craftable.length} -> ${craftable.length>=6 ? 'PASS' : 'FAIL'} ${craftable.map(r=>r.id).join(',')}`);

  // Test13 save/load
  const saveData = craftingSystem.getSaveData();
  console.log(`Test13 saveData: totalCrafted=${saveData.totalCrafted} unlocked=${saveData.recipesUnlocked.length} -> ${saveData.totalCrafted>=4 ? 'PASS' : 'FAIL'}`);
  const newSystem = new CraftingSystem(recipeDb);
  newSystem.loadSaveData(saveData);
  console.log(`Test13b load: totalCrafted=${newSystem.getTotalCrafted()} expected ${saveData.totalCrafted} -> ${newSystem.getTotalCrafted()===saveData.totalCrafted ? 'PASS' : 'FAIL'}`);

  // Test14 coin crafting
  inv.clearInventory();
  inv.addItem('ore', 1);
  const craftCoin = craftingSystem.craft('craft_coin', inv);
  console.log(`Test14 craft coin 1 ore -> 10 coin: success=${craftCoin.success} coin=${inv.getItemQuantity('coin')} expected 10 -> ${craftCoin.success && inv.getItemQuantity('coin')===10 ? 'PASS' : 'FAIL'}`);

  // Test15 health potion
  inv.clearInventory();
  inv.addItem('herb', 2);
  inv.addItem('mushroom', 1);
  const craftHealth = craftingSystem.craft('craft_health_potion', inv);
  console.log(`Test15 craft health_potion: success=${craftHealth.success} potion=${inv.getItemQuantity('health_potion')} expected 1 -> ${craftHealth.success && inv.getItemQuantity('health_potion')===1 ? 'PASS' : 'FAIL'}`);

  console.log('=== END PHASE 16.2 TESTS ===');
  console.log(`[Crafting] ${craftingSystem.getDebugString()}`);
}

runTests();
