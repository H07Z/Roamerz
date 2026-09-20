# Farming System - Phase 15

## Overview
Data-driven farming with tilled plots, seed planting, growth stages, watering boost, harvest, wither, and persistence.

## Files
- `Crop.ts` - GrowthStage, PlotState, CropDefinition, FarmPlotData, FarmingSaveData, helpers
- `CropDatabase.ts` - Data-driven crops (wheat 2 days, carrot 1.5 days, berry_bush 1 day, herb 0.8 days), validation, extensible
- `FarmPlot.ts` - Single plot: till, plant, plantBySeed, water, update (growth progress based on totalSeconds), harvest (yield + bonus seeds), clearWithered
- `FarmingSystem.ts` - Manager: createPlot, tillPlot, plantSeed, plantCrop, waterPlot, harvestPlot, getPlot, hasPlot, getPlotsForMap, getNearbyPlots, update, save/load, debug
- `FarmingRenderer.ts` - Renders plots with stage icons, progress bar, watered indicator, ready glow, withered skull, plot info UI

## Crop Definition (data-driven)
```ts
{
  id: 'wheat',
  seedItemId: 'wheat_seed',
  harvestItemId: 'wheat',
  bonusSeedItemId: 'wheat_seed',
  growthTimeSeconds: 2*86400,
  stages: [PLANTED, SPROUT, GROWING, MATURE, READY],
  thresholds: [0,0.25,0.5,0.75,1.0],
  yieldMin:2, yieldMax:4,
  bonusSeedChance:0.5,
  waterBoost:1.5,
  witherTimeSeconds: 86400,
  icon:'🌾'
}
```

## Plot Lifecycle
UNTILLED → TILLED (createPlot/till) → PLANTED (plantSeed consumes seed from inventory) → GROWING (update progress based on TimeManager totalSeconds, watered boosts x1.5) → READY (gold highlight) → HARVESTED → TILLED
→ WITHERED if not harvested in witherTime → needs clear/till

## API
- `createPlot(x,y,mapId,totalSeconds,worldMap?)` → FarmPlot | null (checks FARMLAND/GRASS)
- `tillPlot(x,y,mapId,totalSeconds,worldMap?)` → boolean
- `plantSeed(x,y,mapId,seedItemId,totalSeconds)` → boolean
- `plantCrop(x,y,mapId,cropId,totalSeconds)` → boolean
- `waterPlot(x,y,mapId,totalSeconds)` → boolean
- `harvestPlot(x,y,mapId,totalSeconds)` → {success, cropId, yield, bonusSeeds, bonusSeedId}
- `getPlot`, `hasPlot`, `getPlotsForMap`, `getNearbyPlots`
- `update(totalSeconds)` — advances growth, handles wither and water dry (0.5 days)
- `getSaveData()/loadSaveData()` — persists plots, counts, version
- `getDebugString()`, `debugPrint()`

## Integration
- **World**: plots only on FARMLAND or GRASS tiles, walkable
- **Inventory**: planting consumes seed, harvesting adds harvestItem + bonus seeds
- **Time**: uses TimeManager totalSeconds for growth, water expiration, wither
- **Save**: world.farming.plots persisted, versioned, migration v15
- **Interaction**: E near plot to plant/water/harvest, R to water, F to toggle farming overlay
- **Player**: farmingData placeholder kept for future stats

## Controls (Phase 15)
- F — toggle farming overlay (was fog, now Shift+F fog, F farming)
- Shift+F — toggle fog (moved)
- E — when near farm plot: till if no plot, plant if tilled (requires seed), water if growing, harvest if ready, clear if withered
- R — water nearby plot
- Shift+R — reveal all (exploration) still works, but farming uses R for water when near plot
- P — prints farming debug
- T — runs all tests including Phase15

## Testing
- Test1 CropDatabase count 4 crops
- Test2 validation
- Test3 createPlot
- Test4 tillPlot
- Test5 plantSeed
- Test6 water boost
- Test7 growth progression (simulate time advance)
- Test8 harvest yield
- Test9 wither
- Test10 save/load round-trip
- Test11 player integration (plant consumes seed, harvest adds)
- Test12 multiple plots, nearby search
