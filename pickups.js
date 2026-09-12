'use strict';
const pickupCatalog={
  "power": {
    "size": 192,
    "bodyWidth": 123,
    "bodyHeight": 168
  },
  "rate": {
    "size": 192,
    "bodyWidth": 135,
    "bodyHeight": 168
  },
  "count": {
    "size": 192,
    "bodyWidth": 168,
    "bodyHeight": 155
  },
  "missile": {
    "size": 192,
    "bodyWidth": 166,
    "bodyHeight": 168
  },
  "shield": {
    "size": 192,
    "bodyWidth": 151,
    "bodyHeight": 168
  },
  "life": {
    "size": 192,
    "bodyWidth": 117,
    "bodyHeight": 168
  }
};
const pickupImages = new Map();
const pickupLabels = {power:['威','#ff6d45'],rate:['速','#ffce4f'],count:['散','#ff9e45'],missile:['弹','#be79ff'],shield:['盾','#56eddf'],life:['命','#ff79b8']};
for (const key of Object.keys(pickupCatalog)) {
  const image = new Image(), asset = {image, ready:false};
  pickupImages.set(key, asset);
  image.onload = () => { asset.ready = image.naturalWidth > 0 && image.naturalHeight > 0; };
  image.onerror = () => { asset.ready = false; };
  image.src = 'assets/pickups/' + key + '.png';
}
function item(i) {
  const asset = pickupImages.get(i.type), meta = pickupCatalog[i.type];
  if (!asset?.ready || !meta) { itemVector(i); return; }
  const [label, color] = pickupLabels[i.type];
  const size = 34 * meta.size / Math.max(meta.bodyWidth, meta.bodyHeight);
  x.save();
  x.translate(i.x, i.y);
  const glow = x.createRadialGradient(0,0,3,0,0,22);
  glow.addColorStop(0,color+'66');glow.addColorStop(1,color+'00');
  x.fillStyle=glow;x.beginPath();x.arc(0,0,22,0,T);x.fill();
  x.drawImage(asset.image,-size/2,-size/2,size,size);
  // Keep the established Chinese labels recognizable alongside the new models.
  x.fillStyle='#07101ddd';x.beginPath();x.arc(12,12,7,0,T);x.fill();
  x.fillStyle=color;x.font='bold 10px sans-serif';x.textAlign='center';x.fillText(label,12,15);
  x.restore();
}
