'use strict';
const aircraftCatalog = {
  "player-1": {
    "size": 256,
    "bodyWidth": 208,
    "bodyHeight": 224
  },
  "player-2": {
    "size": 256,
    "bodyWidth": 186,
    "bodyHeight": 224
  },
  "player-3": {
    "size": 256,
    "bodyWidth": 197,
    "bodyHeight": 224
  },
  "scout": {
    "size": 256,
    "bodyWidth": 145,
    "bodyHeight": 224
  },
  "interceptor": {
    "size": 256,
    "bodyWidth": 224,
    "bodyHeight": 219
  },
  "bomber": {
    "size": 256,
    "bodyWidth": 217,
    "bodyHeight": 224
  },
  "missile": {
    "size": 256,
    "bodyWidth": 182,
    "bodyHeight": 224
  },
  "laser-elite": {
    "size": 256,
    "bodyWidth": 169,
    "bodyHeight": 224
  },
  "gunship": {
    "size": 256,
    "bodyWidth": 199,
    "bodyHeight": 224
  },
  "laser": {
    "size": 256,
    "bodyWidth": 168,
    "bodyHeight": 224
  },
  "heavy": {
    "size": 256,
    "bodyWidth": 171,
    "bodyHeight": 224
  },
  "plasma": {
    "size": 256,
    "bodyWidth": 166,
    "bodyHeight": 224
  },
  "phantom": {
    "size": 256,
    "bodyWidth": 181,
    "bodyHeight": 224
  },
  "plasma-elite": {
    "size": 256,
    "bodyWidth": 168,
    "bodyHeight": 224
  },
  "gunship-elite": {
    "size": 256,
    "bodyWidth": 203,
    "bodyHeight": 224
  },
  "elite": {
    "size": 256,
    "bodyWidth": 176,
    "bodyHeight": 224
  },
  "missile-elite": {
    "size": 256,
    "bodyWidth": 156,
    "bodyHeight": 224
  },
  "heavy-elite": {
    "size": 256,
    "bodyWidth": 162,
    "bodyHeight": 224
  },
  "boss-3": {
    "size": 512,
    "bodyWidth": 448,
    "bodyHeight": 385
  },
  "boss-5": {
    "size": 512,
    "bodyWidth": 448,
    "bodyHeight": 364
  },
  "boss-8": {
    "size": 512,
    "bodyWidth": 448,
    "bodyHeight": 328
  },
  "boss-10": {
    "size": 512,
    "bodyWidth": 448,
    "bodyHeight": 364
  }
};
// Visual-only aircraft layer. Gameplay continues to use the original enemy types.
const aircraftImages = new Map();
const aircraftHealth = new WeakMap();
for (const key of Object.keys(aircraftCatalog)) {
  const image = new Image();
  const asset = { image, ready: false, flash: null };
  aircraftImages.set(key, asset);
  image.onload = () => {
    if (!image.naturalWidth || !image.naturalHeight) return;
    // Cache a white silhouette once, avoiding per-frame pixel processing.
    const flash = document.createElement('canvas');
    flash.width = image.naturalWidth;
    flash.height = image.naturalHeight;
    const context = flash.getContext('2d');
    context.drawImage(image, 0, 0);
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = '#fff';
    context.fillRect(0, 0, flash.width, flash.height);
    asset.flash = flash;
    asset.ready = true;
  };
  image.onerror = () => { asset.ready = false; };
  image.src = 'assets/aircraft/' + key + '.png';
}

function playerAircraftKey() {
  return 'player-' + (level >= 7 || wp >= 6 ? 3 : level >= 4 || wp >= 3 ? 2 : 1);
}

function enemyAircraftKey(e) {
  if (e.type === 'boss') return 'boss-' + ([3, 5, 8, 10][(e.v || 1) - 1] || 3);
  if (level <= 2) return e.type;
  const stage = level <= 4 ? {interceptor:'laser-elite',bomber:'gunship'}
    : level <= 6 ? {bomber:'heavy',gunship:'plasma'}
    : level <= 8 ? {laser:'plasma-elite',gunship:'gunship-elite'}
    : {phantom:'elite',missile:'missile-elite',gunship:'heavy-elite',laser:'plasma'};
  return stage[e.type] || e.type;
}

function aircraftHitAlpha(e, hp) {
  let record = aircraftHealth.get(e);
  if (!record) { record = { hp, hitAt: -100 }; aircraftHealth.set(e, record); }
  if (hp < record.hp) record.hitAt = frame;
  record.hp = hp;
  return Math.max(0, 1 - (frame - record.hitAt) / 9) * .85;
}

function aircraftSmoke(w, h, damaged, phase) {
  if (!damaged) return;
  x.save();
  for (let i = 0; i < 4; i++) {
    const age = ((frame * .65 + i * 9 + phase) % 36) / 36;
    x.globalAlpha = (1 - age) * .3;
    x.fillStyle = '#9aa2ae';
    x.beginPath();
    x.arc(Math.sin(phase + i * 2 + age * 3) * w * .12,
      h * .3 + age * 28, 2 + age * 7, 0, T);
    x.fill();
  }
  x.restore();
}

function aircraftFlames(w, h, color, phase, large) {
  for (const q of (large ? [-.28, 0, .28] : [-.2, .2])) {
    const sx = q * w, sy = h * .35;
    const length = (large ? 22 : 15) + Math.sin(frame * .45 + phase + q * 7) * 4;
    const gradient = x.createLinearGradient(sx, sy, sx, sy + length);
    gradient.addColorStop(0, '#f7ffff');
    gradient.addColorStop(.3, color);
    gradient.addColorStop(1, color + '00');
    x.fillStyle = gradient;
    x.beginPath();
    x.moveTo(sx - (large ? 4 : 2.5), sy);
    x.lineTo(sx, sy + length);
    x.lineTo(sx + (large ? 4 : 2.5), sy);
    x.fill();
  }
}

function drawAircraft(e, key, maxWidth, maxHeight, isPlayer = false) {
  const asset = aircraftImages.get(key), meta = aircraftCatalog[key];
  if (!asset?.ready || !meta) return false;
  // Fit the opaque hull, not the padded square, without stretching its aspect.
  const scale = Math.min(maxWidth / meta.bodyWidth, maxHeight / meta.bodyHeight);
  const side = meta.size * scale, w = meta.bodyWidth * scale, h = meta.bodyHeight * scale;
  const large = e.type === 'boss';
  const color = isPlayer ? '#59caff' : /phantom|laser|plasma/.test(key) ? '#b86bff' : '#ff9754';
  const hit = aircraftHitAlpha(e, isPlayer ? lives : e.hp);
  x.save();
  x.translate(e.x, e.y);
  shadow(w * .55);
  // All source noses point up; incoming aircraft face their direction of travel.
  if (!isPlayer) x.rotate(Math.PI);
  aircraftFlames(w, h, color, e.ph || 0, large);
  x.drawImage(asset.image, -side / 2, -side / 2, side, side);
  if (hit > 0) {
    x.globalAlpha = hit;
    x.drawImage(asset.flash, -side / 2, -side / 2, side, side);
    x.globalAlpha = 1;
  }
  aircraftSmoke(w, h, isPlayer ? lives === 1 : e.hp / e.max < .5, e.ph || 0);
  if (large) {
    x.globalAlpha = .25 + Math.sin(frame * .12) * .12;
    x.fillStyle = color;
    x.shadowBlur = 16;
    x.shadowColor = color;
    x.beginPath();x.ellipse(0, 0, 7, 10, 0, 0, T);x.fill();
  }
  x.restore();
  return true;
}

function player() {
  if (!drawAircraft(p, playerAircraftKey(), 68, 64, true)) { playerVector(); return; }
  if (shield) {
    x.save();x.strokeStyle = '#61f4c888';x.lineWidth = 2;
    x.beginPath();x.ellipse(p.x, p.y, 40, 31, 0, 0, T);x.stroke();x.restore();
  }
}

function enemy(e) {
  if (e.type === 'boss') { bossDraw(e); return; }
  const [, , w, h] = cfg[e.type] || cfg.scout;
  if (!drawAircraft(e, enemyAircraftKey(e), w * 2, h * 2)) enemyVector(e);
}

function bossDraw(e) {
  if (!drawAircraft(e, enemyAircraftKey(e), 148, 132)) { bossVector(e); return; }
  const ratio = Math.max(0, Math.min(1, e.hp / e.max));
  x.save();x.translate(e.x, e.y);
  x.fillStyle = '#07101ccc';x.fillRect(-55, -79, 110, 7);
  x.fillStyle = ratio > .5 ? '#6dffc1' : ratio > .25 ? '#ffd15c' : '#ff5977';
  x.fillRect(-55, -79, 110 * ratio, 7);
  x.strokeStyle = '#ffffff88';x.strokeRect(-55, -79, 110, 7);x.restore();
}
