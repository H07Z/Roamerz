import { AnimalDatabase } from './AnimalDatabase';
import { AnimalSystem } from './AnimalSystem';
import { AnimalState } from './Animal';

let failed = false;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    failed = true;
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

console.log('=== PHASE 16.1 TEST - ANIMALS SYSTEM MANUAL ===');

const db = AnimalDatabase.getInstance();
console.log(`AnimalDatabase: ${db.getDebugString()}`);
assert(db.getCount() === 4, 'AnimalDatabase count 4');
const v = db.validate();
assert(v.valid, `AnimalDatabase validation valid errors: ${v.errors.join(',')}`);

const system = new AnimalSystem(db);
system.initialize([{ mapId: 'village_01', width: 50, height: 50 }]);
console.log(`AnimalSystem initial: ${system.getDebugString()}`);

let totalSeconds = 0;

// create chicken
const chicken = system.createAnimal(12, 32, 'village_01', 'chicken', totalSeconds);
assert(!!chicken, 'createAnimal chicken at 12,32');
assert(chicken?.getState() === AnimalState.IDLE, 'new chicken IDLE');
assert(chicken?.getHunger() === 80, 'hunger 80 initial');

// feed
const fed = system.feedAnimal(chicken!.getId(), 'wheat_seed', totalSeconds);
assert(fed, 'feed chicken wheat_seed');
assert(system.getAnimal(chicken!.getId())!.getHunger() > 80, 'hunger increased after feed');

// pet
const petted = system.petAnimal(chicken!.getId(), totalSeconds);
assert(petted, 'pet chicken');
assert(system.getAnimal(chicken!.getId())!.getHappiness() > 70, 'happiness increased after pet');

// produce after 0.6 days
const halfDayLater = totalSeconds + 0.6*24*60*60;
system.update(halfDayLater, 0.6*24*60*60);
const after = system.getAnimal(chicken!.getId());
assert(!!after?.isProduceReady(), `produce ready after 0.6d, ready=${after?.isProduceReady()} state=${after?.getState()}`);

// collect
const collect = system.collectProduce(chicken!.getId(), halfDayLater);
assert(collect.success, `collectProduce success item=${collect.itemId} qty=${collect.quantity}`);
assert(collect.itemId === 'egg', `produce item egg got ${collect.itemId}`);

// hunger decay after 3 days
const cow = system.createAnimal(13, 32, 'village_01', 'cow', totalSeconds);
if (cow) {
  const future = totalSeconds + 3*24*60*60;
  system.update(future, 3*24*60*60);
  const cowAfter = system.getAnimal(cow.getId());
  assert(!!cowAfter && cowAfter.getHunger() < 50, `cow hunger decay after 3d hunger=${cowAfter?.getHunger().toFixed(0)}% <50`);
  (system as any).animals.delete(cow.getId());
}

// save/load
const save = system.getSaveData();
assert(Object.keys(save.animals).length >0, `saveData has animals ${Object.keys(save.animals).length}`);
const newSystem = new AnimalSystem(db);
newSystem.loadSaveData(save);
assert(!!newSystem.getAnimal(chicken!.getId()), 'loadSaveData preserves chicken');
assert(newSystem.getAnimal(chicken!.getId())?.getType() === 'chicken', 'loaded type chicken');

// nearby
const nearby = system.getNearbyAnimals(12, 32, 'village_01', 2);
assert(nearby.length >=1, `nearby animals radius2 found ${nearby.length}`);

// cleanup
system.clear();
assert(system.getAnimalCount()===0, 'clear all animals');

console.log('=== END PHASE 16.1 TESTS ===');
console.log(failed ? 'Some tests FAILED' : 'All Phase 16.1 tests PASSED');
