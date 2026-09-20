# Roamerz - Living World Adventure Game

A 2D top-down living-world adventure where NPCs live independently.

## Phases

```
PHASE 1  — Project Foundation [COMPLETE]
PHASE 2  — World Map [COMPLETE]
PHASE 3  — Player Movement [COMPLETE]
PHASE 4  — Collision System [COMPLETE]
PHASE 5  — Camera System [COMPLETE]
PHASE 6  — NPC Foundation [COMPLETE]
PHASE 7  — NPC Pathfinding [COMPLETE]
PHASE 8  — NPC Homes & Buildings [COMPLETE]
PHASE 9  — Time & NPC Schedules [COMPLETE]
PHASE 10 — NPC Life Simulation [COMPLETE]
PHASE 11 — Player Interaction & Dialogue [COMPLETE]
PHASE 12 — Exploration & World Expansion [COMPLETE]
PHASE 13 — Save/Load & World Persistence [COMPLETE]
PHASE 14 — Inventory System [COMPLETE]
PHASE 15 — Farming System [COMPLETE]
PHASE 16.1 — Animals / Livestock System [COMPLETE]
PHASE 16.2 — Crafting System [COMPLETE]
PHASE 16.3 — Cooking System [COMPLETE]
PHASE 16.4 — Weather System [COMPLETE]
PHASE 16.5 — Economy / Shop System [CURRENT]
```

## Phase 16.5 - Economy / Shop System [CURRENT]

### Objective
Data-driven shops with buy/sell multipliers, inventory quantities/infinite flag, money + inventory space checks, transaction history totalSpent/totalEarned, persistence world.economy v20, EconomyRenderer UI overlay Shift+B toggle (B for bazaar), TAB buy/sell, Q/E cycle shops, W/S navigate, Enter transaction, debug overlay, small controlled phase, preserve all previous systems.

### Economy System
- **Shop.ts**: ShopType GENERAL/FOOD/TOOL/SEED/POTION/TREASURE, ShopItem {itemId,quantity,priceOverride?,infinite?}, ShopDefinition {id,type,name,icon,description,buyMultiplier,sellMultiplier,inventory[],infiniteStock?,ownerId?,mapId?,x?,y?,tags?}, ShopInventoryData {items:Record<itemId,qty>,version}, TransactionData {id,timestamp,shopId,itemId,quantity,pricePerUnit,totalPrice,type BUY/SELL,playerMoneyBefore/After}, EconomySaveData {shopInventories:Record<shopId,ShopInventoryData>,prices,transactionHistory,totalTransactions,totalSpent,totalEarned,version}, createDefaultEconomySaveData {empty,0,version1}
- **ShopDatabase.ts**: 3 shops data-driven:
  - general_store 🏪 GENERAL: buy x1.2 sell x0.7, infiniteStock false, map village_01 20,20 tags general/materials/food, inventory 9: wood 50, stone 30, fiber 20, bread 15, apple 20, coin 100 infinite, hay 25, wheat_seed 30, carrot_seed 20
  - food_stall 🍎 FOOD: buy x1.15 sell x0.8, map 22,22 tags food/cooked/farm, inventory 10: bread 20, apple 30, carrot 25, berry 30, egg 20, milk 15, cheese 10, soup 10, fried_egg 12, cake 5
  - tool_shop 🔨 TOOL: buy x1.3 sell x0.75, map 24,20 tags tools/weapons/rare, inventory 8: axe 5, pickaxe 3, fishing_rod 3, sickle 4, ore 20, gem 5, wood 30, stone 20
  Methods getShop, getAllShops, getShopsByType, getCount, hasShop, register/unregister, validate (id,name,type,buy/sell >0, inventory not empty, itemId, qty>=0), getDebugString
- **EconomySystem.ts**: manager database, itemDatabase, shopInventories Map<shopId, Map<itemId,qty>>, shopInfinite Map<shopId,Map<itemId,bool>>, transactionHistory TransactionData[], totalTransactions, totalSpent, totalEarned, version1. initialize() clears, rebuilds inventories from database with infinite flags, logs. getShopInventory, getShopStock, isInfiniteStock, getBuyPrice shopDef buyMultiplier * item value floor max1 or override, getSellPrice sellMultiplier, canBuy(shopId,itemId,qty,playerMoney,playerInventory) checks shop exists, stock if not infinite, money, inventory space (if stackable existing stack space else hasSpace), returns can, reason, pricePerUnit,totalPrice,missingMoney,missingSpace. buy(shopId,itemId,qty,player{money,getInventory,addItem},totalSeconds) uses canBuy, deducts money, addItem to player inventory, if not infinite deduct shop stock, create TransactionData id tx_Date_random, timestamp totalSeconds, shopId,itemId,qty,pricePerUnit,totalPrice, type BUY, moneyBefore/After, push history limit 100, totalTransactions++, totalSpent+=totalPrice, logs. canSell(shopId,itemId,qty,playerInventory) checks have qty, price sell. sell similar: removeItem, add money, add to shop stock, transaction SELL, totalEarned. getAllShops, getShopCount, getTotalStockCount sum all qtys, getTransactionHistory copy, getTotalTransactions/Spent/Earned, getDatabase, getSaveData {shopInventories Record<shopId,{items:Record,qty,version}>, prices{}, transactionHistory, totalTransactions,totalSpent,totalEarned,version}, loadSaveData clears, rebuilds from data.shopInventories, ensures all shops from database have at least default if missing, rebuilds infinite map from database plus extra sold items not infinite, transactionHistory, totalTransactions, totalSpent, totalEarned, version, logs. clear resets and initialize, getDebugString shops stock tx spent earned, debugPrint shop icons buy/sell + stock list + last 5 tx
- **EconomyRenderer.ts**: setShowEconomy, isShowing, toggle, selectedShopIndex, selectedItemIndex, buyMode true=buy from shop false=sell to shop, filterCategory null, itemDatabase, shopDatabase. get/set selectedShop/Item, getBuyMode/set/toggleBuyMode resets item index, filterCategory set resets, navigate up/down totalItems clamped, navigateShop left/right/up/down totalShops. getCurrentShop from economySystem.getAllShops()[selectedShopIndex]. getFilteredShopItems: inv from economySystem, for each itemId qty, if qty<=0 and not infinite skip, price getBuyPrice, infinite isInfiniteStock, def itemDatabase, filterCategory check, push {itemId,quantity,price,infinite}, sort by category then name. getFilteredPlayerItems inventory getNonEmptySlots grouped by itemId sum qty, filterCategory, sort. render(ctx,w,h,economySystem,playerInventory,playerMoney) shop current, buyItems filtered shop, sellItems filtered player, currentItems = buyMode ? buyItems : sellItems, totalItems, selected clamping, selected item. Box 700x520 centered black 0.95 gold border, title 🏪 icon name BUY/SELL, subline shops idx/total Q/E cycle, buying/selling name, Player $money Tx spent earned Filter ALL/C mode BUY/SELL, hint Shift+B/ESC close W/S nav Q/E cycle shop TAB toggle BUY/SELL C filter Enter buy/sell 1 Shift+Enter x5. Shop tabs row 65y tab 22h 120w each: selected gold 0.3 bg gold border, others gray, icon name. Left panel list 20, tabH+10, 280w 360h 34 row: dark bg, border, clip, visibleRows = floor(listH/rowH), scrollOffset max(0,selected-visible+2). For each currentItems i y = listY+(i-scroll)*rowH if visible, if selected gold 0.25 bg gold border else alternating gray. Buy mode: def icon, name 16 chars, price $price x qty/∞ gold, canBuy indicator green check red cross right. Sell mode: def icon, name, $sellPrice x qty green, check. Right panel detail 360w: dark bg, if selected: buyMode shows icon name, ID cat rarity stock, desc 40 chars wrap 2 lines, Buy Price $price each value $def.value x multiplier gold bold 12px, canBuy 1 price reason green/red, canBuy 5, Player Money before->after, Player Has qty name Inv used/cap, Shop desc 55 chars, if can buy show gold box Press ENTER to Buy 1! centered. Sell mode similar: icon name x qty, ID cat rarity have, desc, Sell Price $sellPrice value x multiplier green bold, canSell 1/5, Money after, Shop Stock After, green box Press ENTER to Sell 1!. Recent transactions last 3: type qty icon itemId $total @shopId gold/green 8px. Else No items. Footer gray 8px Economy v1 shops stock tx Player $money Inv used/cap. renderQuickHint if showEconomy return, if money<10 return, affordable count from first shop buy price <= money, if 0 return, else show box 220x22 top-right 110y black 0.7 gold border text 🏪 Shop: affordable affordable! Press Shift+B gold 9px
- **test_economy.ts**: manual tsx 12 checks: count 3, validation, general_store name buy 1.2 sell 0.7 inventory 9, total stock >50, canBuy wood 1 with $100 price 3 PASS, buy 2 wood money 94 inv 7 shop 48 PASS, canSell wood 1 price 2 PASS, sell 3 wood money 100 inv 4 shop 51 PASS, saveData shops 3 tx 2 spent 6 earned 6 PASS, load wood 51 tx 2 PASS, insufficient money gem with $1 false PASS, infinite stock coin before after same PASS buy success PASS, bread value 12 buy 13 sell 9 PASS, integration migration v19→v20 preserves weather rainy cooking 2 economy exists PASS

### Save Extension Phase 16.5
- **SaveTypes.ts**: SAVE_VERSION 20 SAVE_GAME_VERSION 0.20.0, WorldSaveData.economy now {shopInventories,prices,transactionHistory,totalTransactions?,totalSpent?,totalEarned?,version} default {shopInventories:{},prices:{},transactionHistory:[],totalTransactions0,totalSpent0,totalEarned0,version1}, WorldSaveData.weather already totalChanges, economy added, createDefaultWorldSaveData economy with totals
- **SaveMigration.ts**: case 20 migrateToV20: oldEconomy shopInventories prices transactionHistory totalTransactions totalSpent totalEarned version, newEconomy same with defaults 0, preserves weather cooking crafting animals farming time exploration, version 20 game 0.20.0
- **SaveManager.ts**: ensureDefaults farming animals crafting cooking weather economy with totals, duplicate economy fixed

### Game Integration Phase 16.5
- **Fields**: economyDatabase singleton, economySystem, economyRenderer, showEconomy false modal, showEconomyDebug true
- **Constructor**: economyDatabase = ShopDatabase.getInstance(), economySystem = new EconomySystem(economyDatabase), economyRenderer = new EconomyRenderer()
- **Initialize**: economySystem.initialize(), ShopDatabase count 3 debug, validation PASS, EconomySystem debug, setShowEconomy false, logs Phase 16.5 controls
- **CollectSaveData**: economySave = economySystem.getSaveData() included in worldSave.economy
- **ApplySaveData**: if world.economy load via economySystem.loadSaveData
- **NewGame**: economySystem.clear, reset showEconomy false setShowEconomy false
- **handleEconomyInput**: new modal method: if showEconomy ESC or Shift+B close, W/S navigate up/down 50 approx, Q/arrowleft cycle left, E without shift cycle right, TAB toggle BUY/SELL, C filter category null/MATERIAL/FOOD/TOOL/POTION/TREASURE/SEED/MISC cycle, Enter buy/sell: get shops current idx shop, isShift qty 5 else 1, totalSeconds timeManager totalSeconds, if buyMode get filtered shop items same sort as renderer, selected index itemId, buy via economySystem.buy, message 🛒 Bought qty x itemId for $total gold or ❌ Buy failed reason red, else sell mode grouped player items filtered sorted, selected itemId, sellQty min qty have, sell via economySystem.sell, message 💰 Sold qty x itemId for $total green or fail. If not open and no dialogue/save/inventory/crafting/cooking, Shift+B toggles open: setShowEconomy true, selectedShop 0 selectedItem 0
- **Other inputs**: farming/animal now also block if economy open, map transitions auto-save blocked if economy open, time update blocked if economy open, NPC update blocked if economy open, life blocked, dialogue blocked, interaction prompt blocked, full map blocked, etc. handleDebugToggles blocked if economy open
- **Update**: no continuous economy update needed (buy/sell instant), but time, farming, animals, weather still update when economy closed
- **Render**: economy UI after crafting/cooking before quick hints: if showEconomy && player render economyRenderer.render, else if not inventory/dialogue/save show quick hints crafting/cooking/economy (affordable hint). Farming selected plot info and animals selected info now also require !showEconomy. Interaction prompt requires !showEconomy. Map edge travel hint requires !showEconomy
- **Debug**: EconomyDebugInfo interface {shopCount,shops,totalStock,totalTransactions,totalSpent,totalEarned,debug,showEconomy}, phase label 20, box height includes economyHeight, renders ECONOMY line gold #ffd700 with shops count stock tx spent earned debug UI open/closed
- **Tests**: runPhase16_5Tests 10 tests: count 3, validation, total stock >50, canBuy wood, buy 2 wood money inv, canSell, sell 3, save/load, bread buy/sell price check, transaction history. T runs 7-16.5, P prints economy + debugPrint
- **Controls**: Shift+B toggle shop/economy UI (B for bazaar, avoid WASD, debug toggle F2/`), Q/E cycle shops, W/S navigate, TAB toggle BUY/SELL, C filter category, Enter buy/sell 1, Shift+Enter x5, quick hint top-right shows affordable count if money
- **Help**: PHASE 16.5 ECONOMY / SHOP SYSTEM with controls

### DebugManager Phase 16.5
- Phase label 20, added EconomyDebugInfo interface, field economyInfo, setter setEconomyInfo, boxHeight includes economyHeight, renders ECONOMY line gold #ffd700

### Tests (Phase 16.5)
- Test1 ShopDatabase count 3 → PASS
- Test2 validation → PASS
- Test3 general_store 9 items buy 1.2 sell 0.7 → PASS
- Test4 total stock >50 (577) → PASS
- Test5 canBuy wood 1 $100 price 3 → PASS
- Test6 buy 2 wood money 94 inv 7 shop 48 → PASS
- Test7 canSell wood 1 price 2 → PASS
- Test8 sell 3 wood money 100 inv 4 shop 51 → PASS
- Test9 saveData shops 3 tx 2 spent 6 earned 6 → PASS
- Test9b load wood 51 tx 2 → PASS
- Test10 insufficient money gem $1 false → PASS
- Test11 infinite stock coin same after buy → PASS
- Test12 bread value buy 13 sell 9 → PASS
- Integration migration v19→v20 preserves weather rainy cooking 2 economy exists → PASS
- Build 87 modules 483.19kB → PASS
- Manual tsx economy lifecycle PASS

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 16.5)
- **WASD/Arrows** - Move player, walk to edge road to travel between maps
- **TAB** - Minimap, **F** farming overlay, **Shift+F** fog, **Shift+M** full map, **Shift+G** animals overlay, **Shift+C** crafting, **Shift+K** cooking, **Shift+W** weather overlay, **Shift+B** economy/shop (new), **Ctrl+Shift+W** cycle weather
- **E / Enter** - Interact: NPC/building highest priority, else animal produce ready collect, else feed, else pet, else farming till/plant/water/harvest/clear. Prioritizes closer animal vs farm plot, produce ready wins
- **R** - Water nearby farm plot, rain auto-waters growing plots when rainy/stormy
- **I** - Inventory 41 items, WASD/Arrows navigate, Shift+S sort, C filter, M merge, Shift+O random items (includes cooked foods)
- **Crafting UI (Shift+C)**: W/S navigate, C filter category (ALL→TOOL→FOOD→MATERIAL→FEED→POTION→MISC), Shift+C toggle craftable only, Enter craft, ESC close, quick hint 60px y
- **Cooking UI (Shift+K)**: W/S navigate, C filter category (ALL→BREAKFAST→MEAL→SOUP→DESSERT→DAIRY→MISC), Ctrl+Shift+K toggle cookable only, Enter cook, ESC or Shift+K close, quick hint 85px y
- **Weather Overlay (Shift+W)**: Toggle tint + particles, badge top-left shows icon name intensity%, auto-waters crops in rain, transitions every 0.2-3 days game time
- **Economy / Shop UI (Shift+B)**: NEW - Toggle shop UI modal, Q/E cycle shops (general_store 🏪, food_stall 🍎, tool_shop 🔨), W/S navigate items, TAB toggle BUY/SELL mode, C filter category (ALL→MATERIAL→FOOD→TOOL→POTION→TREASURE→SEED→MISC), Enter buy/sell 1, Shift+Enter x5, checks money + inventory space, transaction history, totalSpent/totalEarned, persistence v20
  - Shops: general_store buy x1.2 sell x0.7 materials/food/seeds, food_stall buy x1.15 sell x0.8 food/cooked, tool_shop buy x1.3 sell x0.75 tools/weapons/rare
  - Buy: price = item value x buyMultiplier, deducts money, adds to inventory, deducts shop stock unless infinite (coin infinite)
  - Sell: price = value x sellMultiplier, adds money, adds to shop stock, removes from inventory
  - Quick hint top-right 110y shows affordable count if money
- **Shift+P** test farm plots 6, **Shift+U** test animals 4, **Ctrl+Shift+K** toggle obstacle, **Ctrl+Shift+C** debug crafting
- **P** print all including economy, **T** run all tests 7-16.5
- **Ctrl+S/L** quick save/load Slot0, **Ctrl+Shift+S/L** Save/Load UI, **Ctrl+N** new game, Auto-save 60s + map transition
- **Shift+R** reveal all, **Ctrl+R** reset exploration, **Shift+[ / ]** vision, **F1/F3/F4** jump maps
- **Space** pause, =/+ faster, -/_ slower, ] +1h, [ -1h, \\ next phase, Shift+E clock
- **Q** schedule debug, ; , . needs/inventory/jobs, F10 boost 100%, F11 drain
- **C** center, **V** village, **Z** zoom, **X** smoothing, **K** collision, **N** paths, **M** nav grid, **J/L/U/Shift+I** building doors/labels/ownership/fronts, **G** grid, **B** coords, ` / F2 debug, **H** help, **R** reset

### Architecture

```
src/
├── economy/
│   ├── Shop.ts - ShopType, ShopDefinition, TransactionData, EconomySaveData
│   ├── ShopDatabase.ts - 3 shops general/food/tool, validation
│   ├── EconomySystem.ts - buy/sell, prices, transaction history, persistence
│   ├── EconomyRenderer.ts - 700x500 UI, BUY/SELL, Q/E shops, W/S items, TAB mode, C filter, Enter tx
│   └── test_economy.ts - manual tsx 12 checks
├── weather/ - 6 weathers, Shift+W overlay, Ctrl+Shift+W cycle, auto-waters farming, save v19
├── cooking/ - 10 recipes, Shift+K UI, save v18
├── crafting/ - 12 recipes, Shift+C UI, save v17
├── animals/ - 4 animals, feed/pet/produce/wander, 5 default spawn, minimap dots
├── farming/ - 4 crops, till/plant/water/harvest/wither, auto-watered by rain
├── inventory/ - 41 items, I UI
├── save/ - SAVE_VERSION 20, economy shopInventories/prices/transactionHistory/totalTransactions/totalSpent/totalEarned, migrateToV20 preserves weather rainy
├── exploration/ - fog, vision 8, minimap with animals
├── world/ - 3 maps, transitions
├── core/Game.ts - + economySystem/renderer/database, Shift+B modal UI, Q/E shops, W/S items, TAB BUY/SELL, C filter, Enter buy/sell, save/load economy, P prints economy, T runs 7-16.5
└── main.ts
```

### Previous Phases
- Phase16.4: Weather 6 weathers, tint+particles, auto-water farming, save v19, Shift+W/Ctrl+Shift+W, build 448.66kB
- Phase16.3: Cooking 10 recipes, 8 new cooked foods, inventory 41, save v18, Shift+K UI, build 424.20kB, inventory fix sync renderer flags
- Phase16.2: Crafting 12 recipes, ingredients consumption, persistence, Shift+C UI, save v17, build 391.79kB
- Phase16.1: Animals 4 types, feed/pet/produce/wander, hunger/happiness decay, 5 default spawn village, always visible after fog, minimap colored dots
- Phase15: Farming 4 crops, till/plant/water/harvest/wither, persistence, F overlay
- Phase14: Inventory 41 items, stackable/non-stackable, slots, sorting, save/load, I UI (fixed)
- Phase13: Save/Load 5 slots, validation, migration, auto-save, new game
- Phase12: Exploration fog, minimap, 3 maps transitions
- Phase11: Interaction & Dialogue
- Phase10: Life needs inventory jobs
- Phase9: Time & Schedules
- Phase8: Buildings homes
- Phase7: Pathfinding A*
- Phase6: NPC foundation
- Phase5: Camera
- Phase4: Collision
- Phase3: Player
- Phase2: World map
- Phase1: Foundation

## Principles
Small changes, test before expanding, no unnecessary complexity, modular, data-driven, debug everything, placeholder graphics first
