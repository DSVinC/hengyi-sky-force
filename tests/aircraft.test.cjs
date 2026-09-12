const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {setup,root}=require('./game-harness.cjs');
function load(s,key) {s.run(`{const a=aircraftImages.get(${JSON.stringify(key)});a.image.naturalWidth=256;a.image.naturalHeight=256;a.image.onload();}`);}
test('22 valid PNGs match their manifest hashes and padded sizes',()=>{
  const crypto=require('node:crypto');
  const m=JSON.parse(fs.readFileSync(path.join(root,'assets/aircraft/manifest.json')));
  assert.equal(Object.keys(m.sprites).length,22);
  for(const [key,entry] of Object.entries(m.sprites)){
    const b=fs.readFileSync(path.join(root,'assets/aircraft',key+'.png'));
    assert.equal(b.subarray(1,4).toString(),'PNG');
    assert.equal(b.readUInt32BE(16),entry.size);assert.equal(b.readUInt32BE(20),entry.size);
    assert.equal(b[25],6,'RGBA transparency');
    assert.equal(crypto.createHash('sha256').update(b).digest('hex'),entry.sha256);
  }
});
test('all 22 skins are reachable through the existing ten-level pools and upgrades',()=>{
  const s=setup();const keys=JSON.parse(s.run(`JSON.stringify((()=>{const keys=new Set();for(level=1;level<=10;level++){keys.add(playerAircraftKey());for(const type of pool())keys.add(enemyAircraftKey({type}));}for(let v=1;v<=4;v++)keys.add(enemyAircraftKey({type:'boss',v}));return [...keys];})())`));
  const all=JSON.parse(s.run('JSON.stringify(Object.keys(aircraftCatalog))'));
  assert.deepEqual(keys.sort(),all.sort());
  assert.equal(s.run("level=1;wp=3;playerAircraftKey()"),'player-2');
  assert.equal(s.run("wp=6;playerAircraftKey()"),'player-3');
});
test('pending, failed and partially loaded images use detailed vectors independently',()=>{
  const s=setup();const before=s.stats();
  s.run("player();enemy({type:'scout',x:100,y:100,bank:0,hp:2,max:2,ph:0});bossDraw({type:'boss',v:4,x:240,y:130,bank:0,hp:100,max:100});");
  assert.equal(s.stats().draws,before.draws);assert.ok(s.stats().fills>before.fills+10);
  load(s,'player-1');const loaded=s.stats().draws;s.run('player()');assert.ok(s.stats().draws>loaded);
  s.run("aircraftImages.get('player-1').image.onerror()");const failed=s.stats().draws;s.run('player()');assert.equal(s.stats().draws,failed);
  assert.equal(s.stats().depth,0);
});
test('PNG effects draw all aircraft and restore canvas state, hit flash decays',()=>{
  const s=setup(), keys=JSON.parse(s.run('JSON.stringify(Object.keys(aircraftCatalog))'));
  keys.forEach(k=>load(s,k));
  for(const k of keys)s.run(`drawAircraft({x:240,y:200,bank:.3,type:${JSON.stringify(k.startsWith('boss')?'boss':'scout')},hp:2,max:10,ph:1},${JSON.stringify(k)},140,120,${k.startsWith('player')})`);
  assert.equal(s.stats().depth,0);
  assert.equal(s.run("var probe={};frame=10;aircraftHitAlpha(probe,10);frame=11;aircraftHitAlpha(probe,8)"),.85);
  assert.equal(s.run('frame=20;aircraftHitAlpha(probe,8)'),0);
  assert.ok(s.stats().draws>=44);
});
test('fallback renderers retain their full detailed hull drawing',()=>{
  const s=setup();
  assert.ok(s.run('playerVector.toString().includes("createLinearGradient")'));
  assert.ok(s.run('enemyVector.toString().includes("bezierCurveTo")'));
  assert.ok(s.run('bossVector.toString().includes("createRadialGradient")'));
});
