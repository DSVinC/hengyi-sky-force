const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('./game-harness.cjs');
test('all ten stages double the actual first-to-last spawn schedule',()=>{
 for(let level=1;level<=10;level++){
  const s=setup();s.run(`level=${level};prepare()`);
  const interval=Math.max(18,58-level*3),oldEnd=40+(8+level*4-1)*interval;
  assert.equal(s.run('spawn+(wave-1)*Math.max(18,58-level*3)'),oldEnd*2);
  assert.equal(s.run('wave'),2*(8+level*4));
 }
});
test('successive bosses gain weapon types through their real firing cycle',()=>{
 for(const [level,v,count] of [[3,1,1],[5,2,2],[8,3,3],[10,4,4]]){
  const s=setup();s.run(`level=${level};spawnBoss();enemies[0].y=120;for(let i=0;i<8;i++)fireEnemy(enemies[0])`);
  const types=JSON.parse(s.run('JSON.stringify([...new Set(eb.map(b=>b.kind))])'));
  assert.equal(types.length,count);assert.ok(types.includes('plasma'));
  if(v>=2)assert.ok(types.includes('missile'));if(v>=3)assert.ok(types.includes('laser'));if(v===4)assert.ok(types.includes('heavy'));
 }
});
test('boss HP rises at equal power and even after a player power loss',()=>{
 const s=setup();let hp=0;
 for(const level of [3,5,8,10]){
  s.run(`level=${level};spawnBoss()`);const next=s.run('lastBossHealth');assert.ok(next>hp);hp=next;
 }
 s.run('wp=100;level=3;spawnBoss()');const strong=s.run('lastBossHealth');
 s.run('wp=1;level=5;spawnBoss()');assert.ok(s.run('lastBossHealth')>=strong*1.35);
});
