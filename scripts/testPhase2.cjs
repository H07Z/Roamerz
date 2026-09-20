/**
 * Phase 2 Manual Tests
 * Verify:
 * - Map loads
 * - Terrain renders correctly (via counts)
 * - Map boundaries exist
 * - Different terrain types visually distinguishable
 * - No missing tiles
 * - No corrupted map data
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'src', 'data', 'maps', 'village_01.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log('=== PHASE 2 TESTS ===\n');

console.log(`Test 1: Map loads`);
console.log(`  Map ID: ${data.mapId}`);
console.log(`  Name: ${data.name}`);
console.log(`  Size: ${data.width} x ${data.height}`);
console.log(`  PASS: Map loaded from JSON\n`);

console.log(`Test 2: No missing tiles`);
const expected = data.width * data.height;
const actual = data.tiles.length;
console.log(`  Expected: ${expected}, Actual: ${actual}`);
console.log(`  ${expected === actual ? 'PASS' : 'FAIL'}: Tile count\n`);

console.log(`Test 3: No corrupted map data`);
let corrupted = false;
for (let i = 0; i < data.tiles.length; i++) {
  const t = data.tiles[i];
  if (t < 0 || t > 7 || !Number.isInteger(t)) {
    console.log(`  FAIL: Invalid terrain ${t} at index ${i}`);
    corrupted = true;
    break;
  }
}
if (!corrupted) console.log(`  PASS: All ${actual} tiles valid (0-7)\n`);

console.log(`Test 4: Different terrain types visually distinguishable`);
const counts = data.tiles.reduce((acc, t) => {
  acc[t] = (acc[t]||0)+1;
  return acc;
}, {});
const terrainNames = ['GRASS','ROAD','WATER','BRIDGE','TREE','ROCK','HOUSE','FARMLAND'];
Object.entries(counts).forEach(([type, count]) => {
  console.log(`  ${terrainNames[type]} (${type}): ${count} tiles`);
});
const distinct = Object.keys(counts).length;
console.log(`  Distinct types: ${distinct}/8`);
console.log(`  ${distinct >= 5 ? 'PASS' : 'FAIL'}: Visually distinguishable (need >=5)\n`);

console.log(`Test 5: Map boundaries exist`);
const w = data.width, h = data.height;
let topEdge = 0, bottomEdge = 0, leftEdge = 0, rightEdge = 0;
let topBlocked = 0, bottomBlocked = 0, leftBlocked = 0, rightBlocked = 0;
for (let x = 0; x < w; x++) {
  const top = data.tiles[0 * w + x];
  const bottom = data.tiles[(h-1) * w + x];
  if (top === 4 || top === 5) topBlocked++;
  if (bottom === 4 || bottom === 5) bottomBlocked++;
}
for (let y = 0; y < h; y++) {
  const left = data.tiles[y * w + 0];
  const right = data.tiles[y * w + (w-1)];
  if (left === 4 || left === 5) leftBlocked++;
  if (right === 4 || right === 5) rightBlocked++;
}
console.log(`  Top edge blocked (TREE/ROCK): ${topBlocked}/${w}`);
console.log(`  Bottom edge blocked: ${bottomBlocked}/${w}`);
console.log(`  Left edge blocked: ${leftBlocked}/${h}`);
console.log(`  Right edge blocked: ${rightBlocked}/${h}`);
const boundariesOk = topBlocked > w*0.8 && bottomBlocked > w*0.8 && leftBlocked > h*0.8 && rightBlocked > h*0.8;
console.log(`  ${boundariesOk ? 'PASS' : 'FAIL'}: Boundaries exist (with road openings)\n`);

console.log(`Test 6: Village features`);
console.log(`  Houses: ${data.houses.length} (expected 5) - ${data.houses.length===5?'PASS':'FAIL'}`);
console.log(`  Entrances: ${data.entrances.length} (expected 4) - ${data.entrances.length===4?'PASS':'FAIL'}`);
const hasRiver = counts[2] > 0;
const hasBridge = counts[3] > 0;
const hasRoad = counts[1] > 0;
const hasFarm = counts[7] > 0;
console.log(`  River (WATER): ${hasRiver ? 'PASS' : 'FAIL'} (${counts[2]||0} tiles)`);
console.log(`  Bridge: ${hasBridge ? 'PASS' : 'FAIL'} (${counts[3]||0} tiles)`);
console.log(`  Road: ${hasRoad ? 'PASS' : 'FAIL'} (${counts[1]||0} tiles)`);
console.log(`  Farm: ${hasFarm ? 'PASS' : 'FAIL'} (${counts[7]||0} tiles)`);

console.log(`\n=== ALL TESTS COMPLETE ===`);
console.log(`Map: ${data.mapId} - ${data.name}`);
console.log(`Ready for Phase 3: YES if all PASS`);
