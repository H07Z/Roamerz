/**
 * Phase 3 Manual Tests - Player Movement
 * Tests without browser, using simulated input
 */

// Mock InputManager
class MockInput {
  constructor() {
    this.keys = new Set();
  }
  down(key) { this.keys.add(key.toLowerCase()); }
  up(key) { this.keys.delete(key.toLowerCase()); }
  isKeyDown(key) { return this.keys.has(key.toLowerCase()); }
  isKeyJustPressed() { return false; }
}

// Simplified Player logic for testing (copy from TS)
class Player {
  constructor(x, y, speed=150) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.direction = 'down';
    this.state = 'IDLE';
    this.width = 20;
    this.height = 20;
    this.totalDistance = 0;
  }
  update(deltaTime, input, worldMap) {
    let moveX = 0, moveY = 0;
    if (input.isKeyDown('w') || input.isKeyDown('arrowup')) moveY -= 1;
    if (input.isKeyDown('s') || input.isKeyDown('arrowdown')) moveY += 1;
    if (input.isKeyDown('a') || input.isKeyDown('arrowleft')) moveX -= 1;
    if (input.isKeyDown('d') || input.isKeyDown('arrowright') || input.isKeyDown('e')) moveX += 1;

    const isMoving = moveX !== 0 || moveY !== 0;
    if (isMoving) {
      if (moveX !== 0 && moveY !== 0) {
        const len = Math.sqrt(moveX*moveX + moveY*moveY);
        moveX /= len;
        moveY /= len;
      }
      const deltaX = moveX * this.speed * deltaTime;
      const deltaY = moveY * this.speed * deltaTime;
      let newX = this.x + deltaX;
      let newY = this.y + deltaY;
      if (worldMap) {
        const mapW = worldMap.width * 32;
        const mapH = worldMap.height * 32;
        const halfW = this.width/2;
        const halfH = this.height/2;
        newX = Math.max(halfW, Math.min(newX, mapW - halfW));
        newY = Math.max(halfH, Math.min(newY, mapH - halfH));
      }
      const dist = Math.sqrt((newX-this.x)**2 + (newY-this.y)**2);
      this.totalDistance += dist;
      this.x = newX;
      this.y = newY;
      this.state = 'WALK';
      // direction
      if (moveX===0 && moveY<0) this.direction='up';
      else if (moveX===0 && moveY>0) this.direction='down';
      else if (moveX<0 && moveY===0) this.direction='left';
      else if (moveX>0 && moveY===0) this.direction='right';
      else if (moveX<0 && moveY<0) this.direction='up-left';
      else if (moveX>0 && moveY<0) this.direction='up-right';
      else if (moveX<0 && moveY>0) this.direction='down-left';
      else if (moveX>0 && moveY>0) this.direction='down-right';
    } else {
      this.state = 'IDLE';
    }
  }
}

console.log('=== PHASE 3 TESTS ===\n');

const worldMap = { width: 50, height: 40 };

console.log('Test 1: Player moves up');
let player = new Player(800, 640);
let input = new MockInput();
input.down('w');
player.update(1.0, input, worldMap); // 1 second
console.log(`  Start: 800,640 -> After 1s W: ${player.x.toFixed(1)},${player.y.toFixed(1)} (expected y=640-150=490)`);
console.log(`  ${Math.abs(player.y - 490) < 1 ? 'PASS' : 'FAIL'}: Up movement\n`);

console.log('Test 2: Player moves down');
player = new Player(800, 640);
input = new MockInput();
input.down('s');
player.update(1.0, input, worldMap);
console.log(`  After 1s S: ${player.x.toFixed(1)},${player.y.toFixed(1)} (expected y=790)`);
console.log(`  ${Math.abs(player.y - 790) < 1 ? 'PASS' : 'FAIL'}: Down movement\n`);

console.log('Test 3: Player moves left');
player = new Player(800, 640);
input = new MockInput();
input.down('a');
player.update(1.0, input, worldMap);
console.log(`  After 1s A: ${player.x.toFixed(1)},${player.y.toFixed(1)} (expected x=650)`);
console.log(`  ${Math.abs(player.x - 650) < 1 ? 'PASS' : 'FAIL'}: Left movement\n`);

console.log('Test 4: Player moves right');
player = new Player(800, 640);
input = new MockInput();
input.down('d');
player.update(1.0, input, worldMap);
console.log(`  After 1s D: ${player.x.toFixed(1)},${player.y.toFixed(1)} (expected x=950)`);
console.log(`  ${Math.abs(player.x - 950) < 1 ? 'PASS' : 'FAIL'}: Right movement\n`);

console.log('Test 5: Diagonal movement behaves correctly (not faster)');
player = new Player(800, 640);
input = new MockInput();
input.down('w');
input.down('d');
player.update(1.0, input, worldMap);
const diagDist = Math.sqrt((player.x-800)**2 + (player.y-640)**2);
console.log(`  After 1s W+D diagonal: ${player.x.toFixed(1)},${player.y.toFixed(1)} distance=${diagDist.toFixed(1)} (expected 150, not 212)`);
console.log(`  ${Math.abs(diagDist - 150) < 1 ? 'PASS' : 'FAIL'}: Diagonal normalized\n`);

console.log('Test 6: Movement speed consistent at different FPS (deltaTime)');
player = new Player(800, 640);
input = new MockInput();
input.down('w');
// Simulate 60 FPS for 1 second: 60 * (1/60)
for (let i=0;i<60;i++) player.update(1/60, input, worldMap);
const pos60 = player.y;
player = new Player(800, 640);
input = new MockInput();
input.down('w');
// Simulate 30 FPS for 1 second: 30 * (1/30)
for (let i=0;i<30;i++) player.update(1/30, input, worldMap);
const pos30 = player.y;
player = new Player(800, 640);
input = new MockInput();
input.down('w');
// Simulate 10 FPS for 1 second: 10 * (1/10)
for (let i=0;i<10;i++) player.update(1/10, input, worldMap);
const pos10 = player.y;
console.log(`  60 FPS y=${pos60.toFixed(1)}, 30 FPS y=${pos30.toFixed(1)}, 10 FPS y=${pos10.toFixed(1)} (all should be 490)`);
const consistent = Math.abs(pos60-490)<0.1 && Math.abs(pos30-490)<0.1 && Math.abs(pos10-490)<0.1;
console.log(`  ${consistent ? 'PASS' : 'FAIL'}: DeltaTime consistent\n`);

console.log('Test 7: Player cannot leave world boundaries');
player = new Player(10, 10); // near top-left
input = new MockInput();
input.down('a');
input.down('w');
for (let i=0;i<10;i++) player.update(0.1, input, worldMap);
console.log(`  After trying to leave top-left: ${player.x.toFixed(1)},${player.y.toFixed(1)} (should be >=10,10 clamped)`);
console.log(`  ${player.x>=10 && player.y>=10 ? 'PASS' : 'FAIL'}: Top-left boundary`);

player = new Player(50*32-10, 40*32-10); // near bottom-right
input = new MockInput();
input.down('d');
input.down('s');
for (let i=0;i<10;i++) player.update(0.1, input, worldMap);
const maxX = 50*32-10;
const maxY = 40*32-10;
console.log(`  After trying to leave bottom-right: ${player.x.toFixed(1)},${player.y.toFixed(1)} (should be <=${maxX},${maxY})`);
console.log(`  ${player.x<=maxX && player.y<=maxY ? 'PASS' : 'FAIL'}: Bottom-right boundary\n`);

console.log('Test 8: Player states');
player = new Player(800,640);
input = new MockInput();
player.update(0.016, input, worldMap);
console.log(`  No input state: ${player.state} (expected IDLE) - ${player.state==='IDLE'?'PASS':'FAIL'}`);
input.down('w');
player.update(0.016, input, worldMap);
console.log(`  With input state: ${player.state} (expected WALK) - ${player.state==='WALK'?'PASS':'FAIL'}\n`);

console.log('=== ALL TESTS COMPLETE ===');
console.log('Ready for Phase 4: YES if all PASS');
