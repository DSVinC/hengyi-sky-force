'use strict';
let playerMissiles = [];
let lastBossHealth = 0;
// Preserve each boss signature opener, then rotate through its growing arsenal.
function nextBossWeapon(e) {
  const arsenal = {1:[1],2:[2,1],3:[3,1,2],4:[4,3,2,5]}[e.v] || [1];
  const turn = e.weaponTurn || 0;
  e.weaponTurn = turn + 1;
  return arsenal[turn % arsenal.length];
}
const PLAYER_MISSILE_INTERVAL = 90;
function playerMissileDamage() { return Math.max(4, wp * 3); }
function weaponDps(laneCoverage = 1, missileCoverage = 1) {
  return wp * 60 / Math.max(4, 17 - wr * 2) * (1 + Math.min(4, wc) * laneCoverage)
    + Math.min(3, mc) * playerMissileDamage() * 60 / PLAYER_MISSILE_INTERVAL * missileCoverage;
}
function enemyDurability(type, base) {
  if (level === 1) return type === 'scout' ? 1 : 2;
  const reference = 60 / 17;
  const scaled = reference * Math.pow(Math.max(1, weaponDps(.2, .25) / reference), .9);
  const seconds = .3 + base * .08 + level * .025;
  return Math.ceil(base * (1 + (level - 1) * .18) + (scaled - reference) * seconds);
}
function bossDurability() {
  const reference = 60 / 17;
  const scaled = reference * Math.pow(Math.max(1, weaponDps(.85) / reference), .9);
  // At least eight seconds of theoretical maximum sustained fire at spawn.
  const rank = Math.max(0, [3,5,8,10].indexOf(level));
  const strength = [1,1.4,1.9,2.5][rank];
  return Math.ceil(Math.max(lastBossHealth * 1.35, strength * Math.max(90 + level * 4, weaponDps() * 8, scaled * (20 + level))));
}
function missileTargets() {
  return enemies.filter(e => e.hp > 0 && e.y >= 0 && e.y <= H);
}
function firePlayerMissiles() {
  if (state !== 1 || mc <= 0) return;
  if (missileCD > 0) missileCD--;
  if (missileCD > 0) return;
  const targets = missileTargets().sort((a, b) => D(a, p) - D(b, p));
  if (!targets.length) return;
  const count = Math.min(3, mc);
  for (let i = 0; i < count; i++) {
    playerMissiles.push({x:p.x + (i - (count - 1) / 2) * 18, y:p.y - 12,
      vx:(i - (count - 1) / 2) * .8, vy:-3.8, life:180,
      damage:playerMissileDamage(), target:targets[i % targets.length]});
  }
  missileCD = PLAYER_MISSILE_INTERVAL;
  tone(260, .08);
}
function updatePlayerMissiles() {
  playerMissiles = playerMissiles.filter(m => {
    if (!enemies.includes(m.target) || m.target.hp <= 0 || m.target.y > H) {
      m.target = missileTargets().sort((a,b) => D(a,m) - D(b,m))[0] || null;
    }
    if (m.target) {
      const ax = m.target.x - m.x, ay = m.target.y - m.y, distance = Math.hypot(ax, ay) || 1;
      m.vx += (ax / distance * 6 - m.vx) * .15;
      m.vy += (ay / distance * 6 - m.vy) * .15;
    }
    m.x += m.vx; m.y += m.vy; m.life--;
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const radius = e.type === 'boss' ? 58 : ['bomber','gunship'].includes(e.type) ? 27 : 19;
      if (D(m, e) < radius + 3) {
        e.hp -= m.damage;
        particle(m.x, m.y, '#ffd39a', 14, 3);
        parts.push({x:m.x,y:m.y,l:14,m:14,r:2,ring:1,c:'#ffd39a'});
        return false;
      }
    }
    return m.life > 0 && m.x > -50 && m.x < W + 50 && m.y > -60 && m.y < H + 50;
  });
}
function drawPlayerMissile(m) {
  x.save();x.translate(m.x,m.y);x.rotate(Math.atan2(m.vy,m.vx)+Math.PI/2);
  const flame=x.createLinearGradient(0,6,0,23);
  flame.addColorStop(0,'#fff4c9');flame.addColorStop(.4,'#ff9d42');flame.addColorStop(1,'#ff704400');
  x.fillStyle=flame;x.beginPath();x.moveTo(-3,6);x.lineTo(0,22+Math.sin(frame*.6)*3);x.lineTo(3,6);x.fill();
  x.fillStyle='#bbc9df';x.fillRect(-3,-7,6,15);
  x.fillStyle='#eaefff';x.beginPath();x.moveTo(0,-13);x.lineTo(-3,-7);x.lineTo(3,-7);x.fill();
  x.fillStyle='#a782ff';x.fillRect(-3,-2,6,4);
  x.beginPath();x.moveTo(-3,3);x.lineTo(-6,10);x.lineTo(6,10);x.lineTo(3,3);x.fill();x.restore();
}
