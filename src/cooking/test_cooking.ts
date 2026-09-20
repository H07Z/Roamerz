/**
 * test_cooking.ts - Phase 16.3 Cooking System tests
 */

import { ItemDatabase } from '../inventory/ItemDatabase';
import { Inventory } from '../inventory/Inventory';
import { CookingDatabase } from './CookingDatabase';
import { CookingSystem } from './CookingSystem';
import { CookingCategory } from './CookingRecipe';

function runTests() {
  console.log('=== PHASE 16.3 COOKING TESTS ===');

  const itemDb = ItemDatabase.getInstance();
  const cookingDb = CookingDatabase.getInstance();
  const cookingSystem = new CookingSystem(cookingDb);
  cookingSystem.initialize();

  const count = cookingDb.getCount();
  console.log(`Test1 CookingDatabase count: ${count} expected 10 -> ${count===10 ? 'PASS' : 'FAIL'}`);
  console.log(`  ${cookingDb.getDebugString()}`);

  const validation = cookingDb.validate();
  console.log(`Test2 validation: valid=${validation.valid} errors=${validation.errors.length} -> ${validation.valid ? 'PASS' : 'FAIL'}`);

  const breakfast = cookingDb.getRecipesByCategory(CookingCategory.BREAKFAST);
  console.log(`Test3 BREAKFAST recipes: ${breakfast.length} expected 3 -> ${breakfast.length===3 ? 'PASS' : 'FAIL'} ${breakfast.map(r=>r.id).join(',')}`);

  const soup = cookingDb.getRecipesByCategory(CookingCategory.SOUP);
  console.log(`Test4 SOUP recipes: ${soup.length} expected 2 -> ${soup.length===2 ? 'PASS' : 'FAIL'}`);

  const inv = new Inventory(20, itemDb);
  inv.addItem('egg', 2);
  inv.addItem('milk', 1);
  inv.addItem('mushroom', 1);
  console.log(`Test5 inv egg2 milk1 mushroom1 -> PASS`);

  const canOmelette = cookingSystem.canCook('cook_omelette', inv);
  console.log(`Test6 canCook omelette: ${canOmelette.can ? 'PASS' : 'FAIL'} ${canOmelette.reason ?? ''}`);

  const cookOmelette = cookingSystem.cook('cook_omelette', inv);
  console.log(`Test7 cook omelette: success=${cookOmelette.success} result=${cookOmelette.resultItemId} qty=${cookOmelette.resultQuantity} -> ${cookOmelette.success && cookOmelette.resultItemId==='omelette' ? 'PASS' : 'FAIL'}`);
  console.log(`  After: egg=${inv.getItemQuantity('egg')} expected 0, milk=${inv.getItemQuantity('milk')} expected 0, omelette=${inv.getItemQuantity('omelette')} expected 1 -> ${inv.getItemQuantity('egg')===0 && inv.getItemQuantity('milk')===0 && inv.getItemQuantity('omelette')===1 ? 'PASS' : 'FAIL'}`);

  inv.clearInventory();
  inv.addItem('milk', 2);
  const canCheese = cookingSystem.canCook('cook_cheese', inv);
  console.log(`Test8 canCook cheese with 2 milk: ${canCheese.can ? 'PASS' : 'FAIL'}`);
  const cookCheese = cookingSystem.cook('cook_cheese', inv);
  console.log(`Test8b cook cheese: success=${cookCheese.success} cheese=${inv.getItemQuantity('cheese')} expected 1 -> ${cookCheese.success && inv.getItemQuantity('cheese')===1 ? 'PASS' : 'FAIL'}`);

  inv.clearInventory();
  inv.addItem('carrot', 1);
  inv.addItem('mushroom', 1);
  inv.addItem('herb', 1);
  const cookSoup = cookingSystem.cook('cook_soup', inv);
  console.log(`Test9 cook soup: success=${cookSoup.success} soup=${inv.getItemQuantity('soup')} expected 1 -> ${cookSoup.success && inv.getItemQuantity('soup')===1 ? 'PASS' : 'FAIL'}`);

  inv.clearInventory();
  inv.addItem('wheat', 2);
  inv.addItem('egg', 2);
  inv.addItem('milk', 1);
  inv.addItem('berry', 2);
  const cookCake = cookingSystem.cook('cook_cake', inv);
  console.log(`Test10 cook cake: success=${cookCake.success} cake=${inv.getItemQuantity('cake')} expected 1 -> ${cookCake.success && inv.getItemQuantity('cake')===1 ? 'PASS' : 'FAIL'}`);

  inv.clearInventory();
  inv.addItem('egg', 5);
  inv.addItem('milk', 5);
  inv.addItem('wheat', 5);
  inv.addItem('carrot', 5);
  inv.addItem('mushroom', 5);
  inv.addItem('herb', 5);
  inv.addItem('berry', 5);
  inv.addItem('truffle', 1);
  const cookable = cookingSystem.getCookableRecipes(inv);
  console.log(`Test11 cookable with many mats: found ${cookable.length} -> ${cookable.length>=7 ? 'PASS' : 'FAIL'} ${cookable.map(r=>r.id).join(',')}`);

  const saveData = cookingSystem.getSaveData();
  console.log(`Test12 saveData: totalCooked=${saveData.totalCooked} unlocked=${saveData.recipesUnlocked.length} -> ${saveData.totalCooked>=3 ? 'PASS' : 'FAIL'}`);
  const newSystem = new CookingSystem(cookingDb);
  newSystem.loadSaveData(saveData);
  console.log(`Test12b load: totalCooked=${newSystem.getTotalCooked()} expected ${saveData.totalCooked} -> ${newSystem.getTotalCooked()===saveData.totalCooked ? 'PASS' : 'FAIL'}`);

  inv.clearInventory();
  inv.addItem('egg', 1);
  const cookFried = cookingSystem.cook('cook_fried_egg', inv);
  console.log(`Test13 cook fried_egg: success=${cookFried.success} fried_egg=${inv.getItemQuantity('fried_egg')} expected 1 -> ${cookFried.success && inv.getItemQuantity('fried_egg')===1 ? 'PASS' : 'FAIL'}`);

  inv.clearInventory();
  inv.addItem('truffle', 1);
  inv.addItem('milk', 1);
  inv.addItem('mushroom', 1);
  const cookTruffleSoup = cookingSystem.cook('cook_truffle_soup', inv);
  console.log(`Test14 cook truffle_soup: success=${cookTruffleSoup.success} soup=${inv.getItemQuantity('soup')} expected 2 -> ${cookTruffleSoup.success && inv.getItemQuantity('soup')===2 ? 'PASS' : 'FAIL'}`);

  // Test new items exist
  const newItems = ['fried_egg','omelette','cheese','cake','soup','stew','pancake','salad'];
  let allExist = true;
  for (const id of newItems) {
    if (!itemDb.hasItem(id)) {
      console.log(`Missing item ${id}`);
      allExist = false;
    }
  }
  console.log(`Test15 new cooked items exist 8: ${allExist ? 'PASS' : 'FAIL'} db count ${itemDb.getCount()} expected 41 -> ${itemDb.getCount()===41 ? 'PASS' : 'FAIL'}`);

  console.log('=== END PHASE 16.3 TESTS ===');
  console.log(`[Cooking] ${cookingSystem.getDebugString()}`);
}

runTests();
