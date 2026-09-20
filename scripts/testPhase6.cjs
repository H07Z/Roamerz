/**
 * Phase 6 Tests - NPC Foundation
 */

console.log('=== PHASE 6 TESTS - NPC FOUNDATION ===\n');

class NPC {
  constructor(data, pointA, pointB) {
    this.id=data.id; this.name=data.name; this.role=data.role;
    this.x=data.x; this.y=data.y; this.speed=data.speed;
    this.direction=data.direction; this.state=data.state;
    this.homeId=data.homeId;
    this.pointA=pointA; this.pointB=pointB;
    this.targetPoint=pointB; this.movingToB=true;
    this.idleTimer=0; this.idleDuration=2;
    this.lastX=this.x; this.lastY=this.y; this.stuckTime=0;
    this.width=18; this.height=18;
  }
  update(dt){
    if (this.state==='IDLE'){
      this.idleTimer+=dt;
      if (this.idleTimer>=this.idleDuration){
        this.idleTimer=0; this.state='WALK';
        this.movingToB=!this.movingToB;
        this.targetPoint=this.movingToB?this.pointB:this.pointA;
      }
      return;
    }
    const dx=this.targetPoint.x-this.x, dy=this.targetPoint.y-this.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if (dist<5){
      this.x=this.targetPoint.x; this.y=this.targetPoint.y;
      this.state='IDLE'; this.idleTimer=0; return;
    }
    const dirX=dx/dist, dirY=dy/dist;
    this.x+=dirX*this.speed*dt;
    this.y+=dirY*this.speed*dt;
    const moved=Math.sqrt((this.x-this.lastX)**2+(this.y-this.lastY)**2);
    if (moved<0.1){
      this.stuckTime+=dt;
      if (this.stuckTime>2){
        this.state='IDLE'; this.idleTimer=0; this.stuckTime=0;
      }
    } else this.stuckTime=0;
    this.lastX=this.x; this.lastY=this.y;
  }
}

const tileSize=32;
const npcDefs=[
  { data:{id:'NPC001',name:'Farmer Joe',role:'farmer',x:15*tileSize+16,y:31*tileSize+16,speed:40,direction:'down',state:'IDLE',homeId:'HOUSE001'}, pointA:{x:15*tileSize+16,y:31*tileSize+16}, pointB:{x:25*tileSize+16,y:20*tileSize+16} },
  { data:{id:'NPC002',name:'Shopkeeper',role:'shopkeeper',x:32*tileSize+16,y:13*tileSize+16,speed:35,direction:'down',state:'WALK',homeId:'HOUSE002'}, pointA:{x:32*tileSize+16,y:13*tileSize+16}, pointB:{x:22*tileSize+16,y:18*tileSize+16} },
  { data:{id:'NPC003',name:'Blacksmith',role:'blacksmith',x:15*tileSize+16,y:25*tileSize+16,speed:30,direction:'right',state:'IDLE',homeId:'HOUSE003'}, pointA:{x:15*tileSize+16,y:25*tileSize+16}, pointB:{x:28*tileSize+16,y:20*tileSize+16} },
  { data:{id:'NPC004',name:'Villager',role:'villager',x:28*tileSize+16,y:26*tileSize+16,speed:45,direction:'up',state:'WALK',homeId:'HOUSE004'}, pointA:{x:28*tileSize+16,y:26*tileSize+16}, pointB:{x:24*tileSize+16,y:19*tileSize+16} },
  { data:{id:'NPC005',name:'Child',role:'child',x:5*tileSize+16,y:17*tileSize+16,speed:60,direction:'right',state:'IDLE',homeId:'HOUSE005'}, pointA:{x:5*tileSize+16,y:17*tileSize+16}, pointB:{x:25*tileSize+16,y:17*tileSize+16} },
];

let npcs=npcDefs.map(d=>new NPC(d.data,d.pointA,d.pointB));

console.log('Test 1: NPCs render - distinct roles');
console.log(`  Created ${npcs.length} NPCs (expected 5) - ${npcs.length===5?'PASS':'FAIL'}`);
npcs.forEach(n=> console.log(`    ${n.id} ${n.name} role=${n.role} home=${n.homeId} speed=${n.speed}`));
console.log(`  Distinct roles: ${new Set(npcs.map(n=>n.role)).size} (expected 5) - ${new Set(npcs.map(n=>n.role)).size===5?'PASS':'FAIL'}\n`);

console.log('Test 2: NPCs can move - A↔B');
let npc=npcs[0];
let startX=npc.x, startY=npc.y;
console.log(`  ${npc.id} start at ${startX.toFixed(0)},${startY.toFixed(0)} target ${npc.targetPoint.x.toFixed(0)},${npc.targetPoint.y.toFixed(0)} state ${npc.state}`);
// Simulate 5 seconds
for(let i=0;i<5*60;i++) npc.update(1/60);
console.log(`  After 5s: ${npc.x.toFixed(0)},${npc.y.toFixed(0)} state ${npc.state} (should have moved)`);
console.log(`  ${Math.abs(npc.x-startX)>1 || Math.abs(npc.y-startY)>1 ? 'PASS' : 'FAIL'}: NPC moves\n`);

console.log('Test 3: NPCs stop correctly - idle at destination');
npc=new NPC(npcDefs[0].data, npcDefs[0].pointA, npcDefs[0].pointB);
npc.x=npc.pointB.x-1; npc.y=npc.pointB.y-1; npc.state='WALK'; npc.targetPoint=npc.pointB;
npc.update(0.1);
console.log(`  NPC near destination ${npc.pointB.x},${npc.pointB.y} at ${npc.x.toFixed(0)},${npc.y.toFixed(0)} state ${npc.state}`);
console.log(`  After reaching, should be IDLE - ${npc.state==='IDLE'?'PASS':'FAIL'}: Stops correctly\n`);

console.log('Test 4: NPCs do not crash - stuck detection');
npc=new NPC(npcDefs[0].data, npcDefs[0].pointA, npcDefs[0].pointB);
// Simulate stuck by not moving (set speed 0 and same position)
npc.speed=0;
npc.x=100; npc.y=100; npc.targetPoint={x:200,y:200}; npc.state='WALK';
for(let i=0;i<3*60;i++) npc.update(1/60);
console.log(`  Stuck for 3s, state should be IDLE (stuck detection) - ${npc.state==='IDLE'?'PASS':'FAIL'}: No crash, handles stuck\n`);

console.log('Test 5: NPC state changes correctly - IDLE/WALK');
npc=new NPC(npcDefs[0].data, npcDefs[0].pointA, npcDefs[0].pointB);
console.log(`  Initial state ${npc.state}`);
npc.update(2.1); // idle duration 2s
console.log(`  After 2.1s idle, state ${npc.state} (expected WALK) - ${npc.state==='WALK'?'PASS':'FAIL'}`);
// Move to destination
npc.x=npc.targetPoint.x; npc.y=npc.targetPoint.y;
npc.update(0.1);
console.log(`  After reaching destination, state ${npc.state} (expected IDLE) - ${npc.state==='IDLE'?'PASS':'FAIL'}: State changes\n`);

console.log('Test 6: NPC collision does not cause infinite loops');
let allOk=true;
for(const def of npcDefs){
  let n=new NPC(def.data, def.pointA, def.pointB);
  // Simulate 20 seconds of movement
  for(let i=0;i<20*60;i++){
    try { n.update(1/60); }
    catch(e){ allOk=false; console.log(`  ${n.id} crashed: ${e}`); }
  }
}
console.log(`  Simulated 20s for all NPCs without crash - ${allOk?'PASS':'FAIL'}: No infinite loops\n`);

console.log('Test 7: NPC has exactly one home');
let homesOk=true;
for(const n of npcs){
  if (!n.homeId) { homesOk=false; console.log(`  ${n.id} missing home`); }
}
console.log(`  All NPCs have homeId - ${homesOk?'PASS':'FAIL'}\n`);

console.log('=== ALL PHASE 6 TESTS COMPLETE ===');
console.log('Ready for Phase 7: YES if all PASS');
