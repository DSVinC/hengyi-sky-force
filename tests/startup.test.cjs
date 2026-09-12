const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('./game-harness.cjs');
test('pending startup never draws fallback scenery or aircraft and rejects starting',()=>{
 const s=setup();s.run('render();start()');assert.equal(s.run('state'),0);assert.equal(s.stats().draws,0);assert.equal(s.stats().fills,0);assert.equal(s.run('startupReady()'),false);
 s.run("aircraftImages.get('player-1').ready=true");assert.equal(s.run('startupReady()'),false);
 s.run('bgSheet.complete=true;bgSheet.naturalWidth=1536');assert.equal(s.run('startupReady()'),true);
});
test('failed startup assets release the loading screen to vector fallback',()=>{
 const s=setup();s.run("aircraftImages.get('player-1').image.onerror();bgSheet.onerror()");assert.equal(s.run('startupReady()'),true);s.run('render()');assert.ok(s.stats().fills>0);
});
test('a stalled asset request releases startup after ten seconds',()=>{
 const s=setup();s.run('Date.now=()=>startupAt+10001');assert.equal(s.run('startupReady()'),true);
});
