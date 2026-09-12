# Pickup models

Six 192×192 transparent PNGs, generated as a sci-fi collectible atlas with the
built-in imagegen tool. A separate silhouette matte removes the background;
each physical model is centered and fitted proportionally with 12px padding.
`manifest.json` records the final asset dimensions and hashes.

| File | Existing effect | Chinese badge |
|---|---|---|
| power.png | Main cannon damage | 威 |
| rate.png | Fire rate | 速 |
| count.png | Spread count | 散 |
| missile.png | Missile upgrade | 弹 |
| shield.png | Shield | 盾 |
| life.png | Life | 命 |

`pickups.js` only changes rendering. Drop probability, fall speed, collision
radius and collection effects remain unchanged. Each image loads independently;
a missing or pending image uses the previous colored badge renderer.
