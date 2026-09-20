/**
 * test_economy.ts - Phase 16.5 Economy / Shop System tests
 */

import { ItemDatabase } from '../inventory/ItemDatabase';
import { Inventory } from '../inventory/Inventory';
import { ShopDatabase } from './ShopDatabase';
import { EconomySystem } from './EconomySystem';

function runTests() {
  console.log('=== PHASE 16.5 ECONOMY TESTS ===');

  const itemDb = ItemDatabase.getInstance();
  const shopDb = ShopDatabase.getInstance();
  const economySystem = new EconomySystem(shopDb, itemDb);
  economySystem.initialize();

  const count = shopDb.getCount();
  console.log(`Test1 ShopDatabase count: ${count} expected 3 -> ${count===3 ? 'PASS' : 'FAIL'}`);
  console.log(`  ${shopDb.getDebugString()}`);

  const validation = shopDb.validate();
  console.log(`Test2 validation: valid=${validation.valid} errors=${validation.errors.length} -> ${validation.valid ? 'PASS' : 'FAIL'}`);
  if (validation.errors.length) console.log(`  Errors: ${validation.errors.join(', ')}`);

  const general = shopDb.getShop('general_store');
  console.log(`Test3 general_store: ${general?.name} buy x${general?.buyMultiplier} sell x${general?.sellMultiplier} -> ${general?.id==='general_store' ? 'PASS' : 'FAIL'}`);
  console.log(`  inventory ${general?.inventory.length} expected 9 -> ${general?.inventory.length===9 ? 'PASS' : 'FAIL'}`);

  const stock = economySystem.getTotalStockCount();
  console.log(`Test4 total stock: ${stock} expected >50 -> ${stock>50 ? 'PASS' : 'FAIL'}`);

  const inv = new Inventory(20, itemDb);
  inv.addItem('wood', 5);
  const player = {
    money: 100,
    getInventory: () => inv,
    addItem: (id: string, qty: number) => inv.addItem(id, qty),
    removeItem: (id: string, qty: number) => inv.removeItem(id, qty)
  };

  const canBuyWood = economySystem.canBuy('general_store', 'wood', 1, player.money, inv);
  console.log(`Test5 canBuy wood 1 with $100: can=${canBuyWood.can} price=${canBuyWood.pricePerUnit} -> ${canBuyWood.can ? 'PASS' : 'FAIL'}`);

  const buyResult = economySystem.buy('general_store', 'wood', 2, player as any, 0);
  console.log(`Test6 buy 2 wood: success=${buyResult.success} money ${player.money} expected 100-2*price -> ${buyResult.success ? 'PASS' : 'FAIL'}`);
  console.log(`  inv wood=${inv.getItemQuantity('wood')} expected 7 -> ${inv.getItemQuantity('wood')===7 ? 'PASS' : 'FAIL'}`);
  console.log(`  shop stock wood=${economySystem.getShopStock('general_store','wood')} expected 48 -> ${economySystem.getShopStock('general_store','wood')===48 ? 'PASS' : 'FAIL'}`);

  const canSellWood = economySystem.canSell('general_store', 'wood', 1, inv);
  console.log(`Test7 canSell wood 1: can=${canSellWood.can} price=${canSellWood.pricePerUnit} -> ${canSellWood.can ? 'PASS' : 'FAIL'}`);

  const sellResult = economySystem.sell('general_store', 'wood', 3, player as any, 10);
  console.log(`Test8 sell 3 wood: success=${sellResult.success} money=${player.money} -> ${sellResult.success ? 'PASS' : 'FAIL'}`);
  console.log(`  inv wood=${inv.getItemQuantity('wood')} expected 4 -> ${inv.getItemQuantity('wood')===4 ? 'PASS' : 'FAIL'}`);
  console.log(`  shop stock wood=${economySystem.getShopStock('general_store','wood')} expected 51 -> ${economySystem.getShopStock('general_store','wood')===51 ? 'PASS' : 'FAIL'}`);

  const saveData = economySystem.getSaveData();
  console.log(`Test9 saveData: shops=${Object.keys(saveData.shopInventories).length} tx=${saveData.transactionHistory.length} spent=${saveData.totalSpent} earned=${saveData.totalEarned} -> ${saveData.transactionHistory.length===2 ? 'PASS' : 'FAIL'}`);

  const newSystem = new EconomySystem(shopDb, itemDb);
  newSystem.loadSaveData(saveData);
  console.log(`Test9b load: stock wood=${newSystem.getShopStock('general_store','wood')} expected 51 -> ${newSystem.getShopStock('general_store','wood')===51 ? 'PASS' : 'FAIL'}`);
  console.log(`  tx count ${newSystem.getTransactionHistory().length} expected 2 -> ${newSystem.getTransactionHistory().length===2 ? 'PASS' : 'FAIL'}`);

  // Test insufficient money
  player.money = 1;
  const canBuyExpensive = economySystem.canBuy('tool_shop', 'gem', 1, player.money, inv);
  console.log(`Test10 canBuy gem with $1: can=${canBuyExpensive.can} expected false -> ${!canBuyExpensive.can ? 'PASS' : 'FAIL'}`);

  // Test infinite stock
  const coinStockBefore = economySystem.getShopStock('general_store','coin');
  player.money = 1000;
  const buyCoin = economySystem.buy('general_store','coin',10,player as any,20);
  const coinStockAfter = economySystem.getShopStock('general_store','coin');
  console.log(`Test11 infinite stock coin: before ${coinStockBefore} after ${coinStockAfter} expected same (infinite) -> ${coinStockBefore===coinStockAfter ? 'PASS' : 'FAIL'}`);
  console.log(`  buy success=${buyCoin.success} -> ${buyCoin.success ? 'PASS' : 'FAIL'}`);

  // Test prices
  const buyPrice = economySystem.getBuyPrice('food_stall','bread');
  const sellPrice = economySystem.getSellPrice('food_stall','bread');
  const breadValue = itemDb.getItem('bread')?.value ?? 0;
  console.log(`Test12 bread value ${breadValue} buy $${buyPrice} expected ${Math.floor(breadValue*1.15)} -> ${buyPrice===Math.floor(breadValue*1.15) ? 'PASS' : 'FAIL'}`);
  console.log(`  sell $${sellPrice} expected ${Math.floor(breadValue*0.8)} -> ${sellPrice===Math.floor(breadValue*0.8) ? 'PASS' : 'FAIL'}`);

  console.log('=== END PHASE 16.5 TESTS ===');
  console.log(`[Economy] ${economySystem.getDebugString()}`);
}

runTests();
