# Aircraft sprites

22 transparent PNGs extracted from the user-supplied aircraft sheet. An imagegen
silhouette matte was applied to the original RGB pixels, preserving the source
colors and hull texture. Normal aircraft use 256×256 canvases; bosses use 512×512.
Opaque bounds are centered with transparent padding. `manifest.json` records
dimensions and SHA-256 values for the actual files in this directory.

`aircraft.js` fits the hull proportionally and anchors it at its center. Source
noses point upward; enemy sprites rotate 180 degrees. Player skins advance at
levels 4/7 or main-cannon strengths 3/6. Enemy skins change with the existing
level pools. Elite names describe appearances, not new enemy behaviors.

Bosses map to levels 3, 5, 8 and 10. The source sheet labels its second boss as
level 3 again; the agreed level-5 mapping takes precedence.

Images load independently. Pending or failed files fall back to the detailed
vector renderers retained in `index.html` from commit `ac12b63`. The old Base64
atlas remains in the repository for history but is no longer downloaded by the
game. The separate original PNG background sheet replaces the corrupt JPEG;
the game crops the same ten panels while excluding their labels and dividers.

Validation: `node --test tests/aircraft.test.cjs` from the repository root.
