const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {setup,root}=require('./game-harness.cjs');
test('ordinary and boss homing missiles launch and fly below 2.2px/frame',()=>{
 for(const [level,type,v,oldSpeed,oldFrames] of [[3,'missile',0,3.74,220],[10,'missile',0,4.3,220],[5,'boss',2,3.5,210],[10,'boss',4,4,220]]){
  const s=setup();s.run(`state=1;level=${level};wave=0;boss=true;inv=100000;fireEnemy({type:'${type}',v:${v},x:240,y:120,hp:100,max:100});eb=eb.filter(b=>b.track);`);
  const initial=JSON.parse(s.run('JSON.stringify(eb)'));
  assert.ok(initial.length);for(const b of initial){assert.ok(Math.hypot(b.vx,b.vy)<=2.2+1e-9);assert.ok(b.sp<=2.2);assert.ok(b.sp*b.l>=oldSpeed*oldFrames);}
  const maximum=s.run('(()=>{let max=0;for(let i=0;i<240;i++){p.x=240+Math.sin(i*.04)*130;update();for(const b of eb)max=Math.max(max,Math.hypot(b.vx,b.vy));}return max;})()');
  assert.ok(maximum<=2.2+1e-9,maximum);
 }
});
test('laser and untracked final-boss projectiles retain their speeds',()=>{
 const s=setup();s.run("level=10;eb=[];fireEnemy({type:'boss',v:4,x:240,y:120,hp:100,max:100})");
 const b=JSON.parse(s.run('JSON.stringify(eb.filter(b=>!b.track))'));assert.ok(b.length);
 for(const p of b){assert.ok(Math.abs(Math.hypot(p.vx,p.vy)-3.9)<1e-9);assert.equal(p.l,220);}
 s.run("eb=[];fireEnemy({type:'boss',v:3,x:240,y:120,hp:100,max:100})");assert.equal(s.run('eb[0].vy'),8.3);
});
test('second finger bombs once without interrupting the flight pointer',()=>{
 const s=setup();s.run('state=1;p.x=240;p.y=680;bombs=3');
 s.dispatch('canvas','pointerdown',{pointerId:11});
 s.dispatch('bomb','pointerdown',{pointerId:22});s.dispatch('bomb','click',{detail:1});
 s.dispatch('window','pointerup',{pointerId:22});
 assert.equal(s.run('bombs'),2);assert.equal(s.run('touch'),true);assert.equal(s.run('activePointerId'),11);
 s.dispatch('canvas','pointermove',{pointerId:11,clientX:300,clientY:630});assert.equal(s.run('p.x'),300);assert.equal(s.run('p.y'),630);
 s.dispatch('window','pointerup',{pointerId:11});assert.equal(s.run('touch'),false);assert.equal(s.run('activePointerId'),null);
 assert.deepEqual(s.stats().captures,[11]);
});
test('bomb is guarded when paused, empty or outside a round; keyboard activation works',()=>{
 const s=setup();for(const state of [0,2,3,4]){s.run(`state=${state};bombs=3;syncBombControl()`);s.dispatch('bomb','pointerdown');assert.equal(s.run('bombs'),3);assert.equal(s.bomb.disabled,true);}
 s.run('state=1;bombs=1;eb=[{}];enemies=[{hp:20}];syncBombControl()');s.dispatch('bomb','click',{detail:0});assert.equal(s.run('bombs'),0);assert.equal(s.run('eb.length'),0);assert.equal(s.run('enemies[0].hp'),8);assert.equal(s.bomb.disabled,true);
 s.dispatch('bomb','pointerdown');assert.equal(s.run('bombs'),0);
});
test('pointer cancellation and blur release flight control',()=>{
 for(const action of ['pointercancel','blur']){const s=setup();s.run('state=1');s.dispatch('canvas','pointerdown',{pointerId:4});s.dispatch('window',action,{pointerId:4});assert.equal(s.run('touch'),false);assert.equal(s.run('activePointerId'),null);}
});
test('aircraft no longer bank or squash when the movement direction changes',()=>{
 const s=setup();s.run("{const a=aircraftImages.get('player-1');a.image.naturalWidth=256;a.image.naturalHeight=256;a.image.onload();}p.bank=.4;player()");assert.deepEqual(s.stats().rotations,[]);
 s.run("{const a=aircraftImages.get('scout');a.image.naturalWidth=256;a.image.naturalHeight=256;a.image.onload();}enemy({type:'scout',x:120,y:120,bank:.3,hp:2,max:2})");assert.deepEqual(s.stats().rotations,[Math.PI]);
});
test('six pickup models load independently and retain the existing fallback',()=>{
 const s=setup(),m=JSON.parse(fs.readFileSync(path.join(root,'assets/pickups/manifest.json')));
 assert.equal(Object.keys(m.sprites).length,6);
 for(const [key,entry] of Object.entries(m.sprites)){
  const b=fs.readFileSync(path.join(root,'assets/pickups',key+'.png'));assert.equal(b.readUInt32BE(16),192);assert.equal(b[25],6);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),entry.sha256);
  const before=s.stats().draws;s.run(`item({type:'${key}',x:20,y:20})`);assert.equal(s.stats().draws,before);
  s.run(`{const a=pickupImages.get('${key}');a.image.naturalWidth=192;a.image.naturalHeight=192;a.image.onload();}item({type:'${key}',x:20,y:20})`);assert.equal(s.stats().draws,before+1);
  s.run(`pickupImages.get('${key}').image.onerror();item({type:'${key}',x:20,y:20})`);assert.equal(s.stats().draws,before+1);
 }
 assert.equal(s.stats().depth,0);
});
