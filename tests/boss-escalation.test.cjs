const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('./game-harness.cjs');
test('all ten stages double CURRENT stage-start-to-last-spawn time and enemy count',()=>{
 for(let level=1;level<=10;level++){
  const s=setup();s.run(`state=1;level=${level};prepare();inv=100000;p.shot=-100000;firePlayerMissiles=()=>{};var emitted=0;spawnEnemy=()=>{emitted++}`);
  const interval=Math.max(18,58-level*3),oldCount=2*(8+level*4),oldEnd=80-interval+(oldCount-1)*interval;
  assert.equal(s.run('wave'),oldCount*2);
  s.run(`for(let i=0;i<${oldEnd*2-1};i++)update()`);assert.equal(s.run('wave'),1);assert.equal(s.run('emitted'),oldCount*2-1);
  s.run('update()');assert.equal(s.run('wave'),0);assert.equal(s.run('emitted'),oldCount*2);
 }
});
test('pause does not consume the extended wave schedule and prepare resets it',()=>{
 const s=setup();s.run('state=1;level=5;prepare();update();state=2');const before=s.run('[wave,spawn].join()');
 s.run('for(let i=0;i<100;i++)update()');assert.equal(s.run('[wave,spawn].join()'),before);
 s.run('prepare()');assert.equal(s.run('wave'),112);assert.equal(s.run('spawn'),37);
});
test('every boss emits at least three actual weapon kinds and a mixed salvo',()=>{
 for(const [level,v,signature] of [[3,1,1],[5,2,2],[8,3,3],[10,4,4]]){
  const s=setup();s.run(`level=${level};spawnBoss();enemies[0].y=120;fireEnemy(enemies[0])`);
  assert.equal(s.run('enemies[0].lastWeapons[0]'),signature);
  s.run('fireEnemy(enemies[0])');assert.equal(s.run('enemies[0].lastWeapons.length'),2);
  s.run('for(let i=0;i<8;i++)fireEnemy(enemies[0])');
  const types=JSON.parse(s.run('JSON.stringify([...new Set(eb.map(b=>b.kind))])'));
  assert.ok(types.length>=3);assert.ok(types.includes('missile'));assert.ok(types.includes('plasma'));assert.ok(types.includes('heavy'));
  if(v>=2)assert.ok(types.includes('laser'));
 }
});
test('low-health bosses combine weapons without unbounded or invalid salvos',()=>{
 for(const [level,v] of [[3,1],[5,2],[8,3],[10,4]]){
  const s=setup();s.run(`level=${level};spawnBoss();var e=enemies[0];e.y=120;e.hp=e.max*.3`);
  for(let i=0;i<12;i++){
   s.run('eb=[];fireEnemy(e)');assert.equal(s.run('e.lastWeapons.length'),2);assert.notEqual(s.run('e.lastWeapons[0]'),s.run('e.lastWeapons[1]'));
   assert.ok(s.run('eb.length<=14'));assert.ok(s.run('e.rate>=50'));
   assert.equal(s.run('eb.every(b=>[b.x,b.y,b.vx,b.vy,b.r,b.l].every(Number.isFinite)&&b.l>0)'),true);
  }
 }
});
test('pause, bomb, death and clear leave no delayed boss attacks',()=>{
 const s=setup();s.run('state=1;level=3;spawnBoss();var e=enemies[0];e.y=120;fireEnemy(e);state=2;var shots=e.weaponTurn');
 s.run('for(let i=0;i<120;i++)update()');assert.equal(s.run('e.weaponTurn'),s.run('shots'));
 s.run('state=1;bomb()');assert.equal(s.run('eb.length'),0);
 s.run('e.hp=0;fireEnemy(e)');assert.equal(s.run('eb.length'),0);
 s.run('clear();state=0;for(let i=0;i<120;i++)update()');assert.equal(s.run('eb.length'),0);assert.equal(s.run('enemies.length'),0);
 s.run('spawnBoss()');assert.equal(s.run('enemies[0].weaponTurn'),undefined);
});
test('boss HP rises at equal power and even after a player power loss',()=>{
 const s=setup();let hp=0;
 for(const level of [3,5,8,10]){s.run(`level=${level};spawnBoss()`);const next=s.run('lastBossHealth');assert.ok(next>hp);hp=next;}
 s.run('wp=100;level=3;spawnBoss()');const strong=s.run('lastBossHealth');
 s.run('wp=1;level=5;spawnBoss()');assert.ok(s.run('lastBossHealth')>=strong*1.35);
});
