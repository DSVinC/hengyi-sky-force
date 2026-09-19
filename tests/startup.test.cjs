const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('./game-harness.cjs');
function loadBackground(s){return s.run('bgSheet.complete=true;bgSheet.naturalWidth=1536;bgSheet.naturalHeight=1024;bgSheet.onload()');}
function loadPlayer(s){s.run("{const a=aircraftImages.get('player-1');a.image.naturalWidth=256;a.image.naturalHeight=256;a.image.onload();}");}
test('pending startup draws no fallback art and rejects pointer and keyboard starts',()=>{
 const s=setup();s.run('render();start()');s.dispatch('canvas','pointerdown');s.dispatch('window','keydown',{key:'Enter'});
 assert.equal(s.run('state'),0);assert.equal(s.stats().draws,0);assert.equal(s.stats().fills,0);assert.equal(s.run('startupReady()'),false);
 loadPlayer(s);assert.equal(s.run('startupReady()'),false);loadBackground(s);assert.equal(s.run('startupReady()'),true);
});
test('ten seconds and sixty seconds never grant readiness to a stalled background',()=>{
 for(const delay of [10001,60000]){
  const s=setup();loadPlayer(s);s.run(`Date.now=()=>startupAt+${delay};render()`);
  assert.equal(s.run('startupReady()'),false);assert.equal(s.run('state'),0);assert.equal(s.run('startupRetryAvailable()'),true);
  s.dispatch('window','keydown',{key:'Enter'});assert.equal(s.run('state'),0);assert.equal(s.run('backgroundAttempt'),2);
 }
});
test('a failed background stays on loading screen, retries and starts only on a new input',()=>{
 const s=setup();loadPlayer(s);s.run('bgSheet.onerror();render()');
 assert.equal(s.run('startupReady()'),false);assert.equal(s.run('bgFailed'),true);
 s.dispatch('canvas','pointerdown');assert.equal(s.run('state'),0);assert.equal(s.run('bgFailed'),false);assert.match(s.run('bgSheet.src'),/\?retry=/);
 const attempt=s.run('backgroundAttempt');s.dispatch('window','keydown',{key:'Enter'});assert.equal(s.run('backgroundAttempt'),attempt);
 loadBackground(s);assert.equal(s.run('state'),0);assert.equal(s.run('startupReady()'),true);
 s.dispatch('window','keydown',{key:'Enter'});assert.equal(s.run('state'),1);
});
test('decode completion, not merely complete/naturalWidth, unlocks the game',async()=>{
 const s=setup();loadPlayer(s);s.run('var finishDecode;bgSheet.decode=()=>new Promise(resolve=>finishDecode=resolve)');
 const pending=loadBackground(s);assert.equal(s.run('startupReady()'),false);s.run('start()');assert.equal(s.run('state'),0);
 s.run('finishDecode()');await pending;assert.equal(s.run('startupReady()'),true);
});
test('decode rejection and invalid dimensions are failures rather than fallback readiness',async()=>{
 const s=setup();loadPlayer(s);s.run("bgSheet.decode=()=>Promise.reject(new Error('bad image'))");await loadBackground(s);
 assert.equal(s.run('bgFailed'),true);assert.equal(s.run('startupReady()'),false);
 const t=setup();loadPlayer(t);await t.run('bgSheet.complete=true;bgSheet.naturalWidth=1;bgSheet.naturalHeight=1;bgSheet.onload()');
 assert.equal(t.run('bgFailed'),true);assert.equal(t.run('startupReady()'),false);
});
test('a stale decode resolution cannot unlock or overwrite a newer retry',async()=>{
 const s=setup();loadPlayer(s);s.run('var finishOld;bgSheet.decode=()=>new Promise(resolve=>finishOld=resolve)');
 const old=loadBackground(s);s.run('Date.now=()=>startupAt+10001;retryStartupAssets();finishOld()');await old;
 assert.equal(s.run('backgroundReady'),false);assert.equal(s.run('startupReady()'),false);
 s.run('bgSheet.decode=()=>Promise.resolve()');await loadBackground(s);assert.equal(s.run('startupReady()'),true);
});
test('a failed player blocks startup and retries without reloading the valid background',()=>{
 const s=setup();loadBackground(s);s.run("aircraftImages.get('player-1').image.onerror();render()");
 const attempt=s.run('backgroundAttempt');assert.equal(s.run('startupReady()'),false);s.run('start()');
 assert.equal(s.run('backgroundAttempt'),attempt);assert.match(s.run("aircraftImages.get('player-1').image.src"),/\?retry=/);
 loadPlayer(s);assert.equal(s.run('startupReady()'),true);s.run('start()');assert.equal(s.run('state'),1);
});
test('warm successful loads start immediately; no startup canvas save/restore leak',()=>{
 const s=setup();loadPlayer(s);loadBackground(s);s.run('render();start();render()');
 assert.equal(s.run('state'),1);assert.equal(s.stats().depth,0);assert.equal(s.bomb.hidden,false);assert.equal(s.run('wave'),48);
});
