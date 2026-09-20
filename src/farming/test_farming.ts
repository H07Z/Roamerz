import { CropDatabase } from './CropDatabase';
import { FarmingSystem } from './FarmingSystem';
import { GrowthStage, PlotState } from './Crop';

let failed = false;
function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    failed = true;
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

console.log('=== PHASE 15 TEST - FARMING SYSTEM MANUAL ===');

const cropDb = CropDatabase.getInstance();
console.log(`CropDatabase: ${cropDb.getDebugString()}`);
assert(cropDb.getCount() === 4, 'CropDatabase count 4');
const validation = cropDb.validate();
assert(validation.valid, `CropDatabase validation valid, errors: ${validation.errors.join(',')}`);

const farming = new FarmingSystem(cropDb);
farming.initialize([{ mapId: 'village_01', width: 50, height: 50 }]);
console.log(`FarmingSystem initial: ${farming.getDebugString()}`);

let totalSeconds = 0;

// Test createPlot
const plot = farming.createPlot(10, 30, 'village_01', totalSeconds);
assert(!!plot, 'createPlot at 10,30 village_01');
assert(plot?.getState() === PlotState.TILLED, 'new plot state TILLED');
assert(plot?.getGrowthStage() === GrowthStage.TILLED, 'new plot growthStage TILLED');

// Test plantSeed
const planted = farming.plantSeed(10, 30, 'village_01', 'wheat_seed', totalSeconds);
assert(planted, 'plantSeed wheat_seed');
assert(farming.getPlot(10,30,'village_01')?.getCropId() === 'wheat', 'cropId wheat after planting');
assert(farming.getPlot(10,30,'village_01')?.getState() === PlotState.PLANTED, 'state PLANTED after planting');

// Test water boost
const watered = farming.waterPlot(10,30,'village_01', totalSeconds);
assert(watered, 'waterPlot');
assert(farming.getPlot(10,30,'village_01')?.isWatered() === true, 'isWatered true');

// Test growth progression 2 days
const twoDaysLater = totalSeconds + 2*24*60*60;
farming.update(twoDaysLater);
const plotAfter = farming.getPlot(10,30,'village_01');
assert(!!plotAfter, 'plot exists after 2 days');
assert(plotAfter!.getProgress() > 0.9, `progress >0.9 after 2 days, got ${plotAfter!.getProgress()}`);
assert(plotAfter!.getGrowthStage() === GrowthStage.READY, `stage READY after 2 days, got ${plotAfter!.getGrowthStage()}`);
assert(plotAfter!.isReady(), 'isReady after 2 days');

// Test harvest
const harvest = farming.harvestPlot(10,30,'village_01', twoDaysLater);
assert(harvest.success, 'harvestPlot success');
assert(harvest.cropId === 'wheat', `harvest cropId wheat, got ${harvest.cropId}`);
assert(harvest.yield >= 2 && harvest.yield <=4, `yield 2-4, got ${harvest.yield}`);
console.log(`Harvest result: ${JSON.stringify(harvest)}`);

// Test wither
const testX2 = 11, testY2 = 30;
farming.createPlot(testX2, testY2, 'village_01', totalSeconds);
farming.plantSeed(testX2, testY2, 'village_01', 'carrot_seed', totalSeconds);
const carrotReady = totalSeconds + 2*24*60*60;
farming.update(carrotReady);
assert(farming.getPlot(testX2,testY2,'village_01')?.isReady() === true, 'carrot ready after 2 days');
const witherTime = carrotReady + 2*24*60*60;
farming.update(witherTime);
assert(farming.getPlot(testX2,testY2,'village_01')?.isWithered() === true, 'carrot withered after extra 2 days');
const cleared = farming.getPlot(testX2,testY2,'village_01')?.clearWithered(witherTime);
assert(!!cleared, 'clearWithered');

// Test save/load
farming.createPlot(12,30,'village_01', totalSeconds);
farming.plantSeed(12,30,'village_01','berry', totalSeconds);
const saveData = farming.getSaveData();
assert(Object.keys(saveData.plots).length >0, `saveData has plots ${Object.keys(saveData.plots).length}`);
const newFarming = new FarmingSystem(cropDb);
newFarming.loadSaveData(saveData);
assert(newFarming.getPlot(12,30,'village_01')?.getCropId() === 'berry_bush', 'loadSaveData berry_bush');

// Test nearby
const nearby = farming.getNearbyPlots(10,30,'village_01',2);
assert(nearby.length >=1, `getNearbyPlots radius 2 found ${nearby.length}`);

// Test till after harvest should work
const plot10 = farming.getPlot(10,30,'village_01');
assert(plot10?.isTilled() === true, 'plot tilled after harvest');

// Cleanup
farming.clear();
assert(farming.getPlotCount()===0, 'clear all plots');

console.log('=== END PHASE 15 TESTS ===');
if (failed) {
  console.log('Some tests FAILED');
} else {
  console.log('All Phase 15 tests PASSED');
}
