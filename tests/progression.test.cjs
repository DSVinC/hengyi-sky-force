const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('./game-harness.cjs');
test('level one has one-hit passive scouts and two-hit interceptors',()=>{
 const s=setup();s.run('level=1;Math.random=()=>.1;spawnEnemy()');assert.equal(s.run('enemies[0].hp'),1);assert.equal(s.run('enemies[0].canFire'),false);
 s.run('fireEnemy(enemies[0])');assert.equal(s.run('eb.length'),0);
 s.run('Math.random=()=>.99;spawnEnemy()');assert.equal(s.run('enemies[1].type'),'interceptor');assert.equal(s.run('enemies[1].hp'),2);assert.equal(s.run('enemies[1].canFire'),true);
});
test('a collected missile actually launches, tracks, damages, scores and clears the stage',()=>{
 const s=setup();s.run("state=1;level=2;wave=0;boss=false;inv=1000;p.x=240;p.y=680;p.shot=-10000;Math.random=()=>.99;enemies=[{type:'scout',x:280,y:330,hp:4,max:4,sp:0,ph:0,shot:10000,rate:10000,bank:0}];collect({type:'missile'});update()");
 assert.equal(s.run('mc'),1);assert.equal(s.run('playerMissiles.length'),1);assert.equal(s.run('playerMissiles[0].target===enemies[0]'),true);
 s.run('for(let i=0;i<150&&state===1;i++)update()');assert.equal(s.run('enemies.length'),0);assert.equal(s.run('score'),140);assert.equal(s.run('state'),5);
 assert.equal(s.run('playerMissiles.length'),0);assert.ok(s.run('parts.some(q=>q.ring)'));
});
test('three missile tiers have actual volley counts and a 90-frame cooldown',()=>{
 for(let mc=1;mc<=3;mc++){const s=setup();s.run(`state=1;mc=${mc};enemies=[{x:100,y:100,hp:1000}];firePlayerMissiles()`);assert.equal(s.run('playerMissiles.length'),mc);
  s.run('for(let i=0;i<89;i++)firePlayerMissiles()');assert.equal(s.run('playerMissiles.length'),mc);s.run('firePlayerMissiles()');assert.equal(s.run('playerMissiles.length'),mc*2);}
});
test('missiles reacquire destroyed targets and respect pause and restart',()=>{
 const s=setup();s.run('state=1;mc=1;enemies=[{x:100,y:100,hp:20},{x:200,y:100,hp:20}];firePlayerMissiles();var oldTarget=playerMissiles[0].target;oldTarget.hp=0;updatePlayerMissiles()');assert.equal(s.run('playerMissiles[0].target!==oldTarget'),true);
 const y=s.run('playerMissiles[0].y'),cd=s.run('missileCD');s.run('state=2;update()');assert.equal(s.run('playerMissiles[0].y'),y);assert.equal(s.run('missileCD'),cd);
 s.run('clear()');assert.equal(s.run('playerMissiles.length'),0);assert.equal(s.run('missileCD'),0);
});
test('enemy HP considers damage, rate, lanes and missiles; existing HP stays fixed',()=>{
 const s=setup();s.run("level=6;wp=1;wr=0;wc=0;mc=0;var baseHp=enemyDurability('gunship',13)");
 for(const change of ['wp=6','wr=6','wc=4','mc=3']){s.run('wp=1;wr=0;wc=0;mc=0;'+change);assert.ok(s.run("enemyDurability('gunship',13)>baseHp"),change);}
 s.run('wp=2;wr=0;wc=0;mc=0;spawnEnemy();var saved= enemies[0].hp;wp=15;wr=6;wc=4;mc=3;spawnEnemy()');assert.equal(s.run('enemies[0].hp'),s.run('saved'));
});
test('all bosses survive at least eight seconds of theoretical spawn-time DPS',()=>{
 const s=setup();for(const level of [3,5,8,10])for(const wp of [1,3,10,30,100]){s.run(`level=${level};wp=${wp};wr=6;wc=4;mc=3;spawnBoss()`);assert.ok(s.run('enemies.at(-1).hp>=weaponDps()*8'));}
});
test('stage transition clears hazards, carries pickups, blends, and advances once',()=>{
 const s=setup();s.run("state=1;level=2;p.x=70;p.y=500;wp=2;score=100;bombs=2;eb=[{}];bullets=[{}];playerMissiles=[{}];items=[{type:'power',x:400,y:200}];touch=true;activePointerId=4;beginStageTransition()");
 assert.equal(s.run('state'),5);assert.equal(s.run('touch'),false);assert.equal(s.run('eb.length+bullets.length+playerMissiles.length'),0);
 s.run('bomb();next();advanceStageTransition(1500)');assert.equal(s.run('bombs'),2);assert.equal(s.run('level'),2);assert.ok(s.run('stageBlend()>0&&stageBlend()<1'));
 s.run('advanceStageTransition(1500)');assert.equal(s.run('state'),1);assert.equal(s.run('level'),3);assert.equal(s.run('wp'),3);assert.equal(s.run('score'),100);assert.equal(s.run('items.length'),0);assert.equal(s.run('inv'),90);assert.equal(s.run('stageTransition'),null);
});
test('final victory stops at the results screen, and death cannot trigger progression',()=>{
 const s=setup();s.run('state=1;level=10;beginStageTransition();advanceStageTransition(3000)');assert.equal(s.run('state'),4);assert.equal(s.run('level'),10);s.run('next()');assert.equal(s.run('state'),0);
 s.run('state=1;level=2;lives=1;inv=0;wave=0;boss=false;enemies=[];p.x=240;p.y=680;eb=[{x:240,y:680,vx:0,vy:0,r:5}];update()');assert.equal(s.run('state'),3);assert.equal(s.run('stageTransition'),null);
});
