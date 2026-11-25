// kitchen.js — the floor plan: where every station sits and what it does.
// Coordinates are in the 1280x720 canvas space. The top 76 px are the order
// board; the kitchen floor runs below it. Counters are solid; the chef walks
// the open floor between them.

export const VIEW = { w: 1280, h: 720 };
export const BOARD_TOP = 76;

// Pantry bins run down the left wall; each hands out one raw ingredient.
export const PANTRY = [
  { id: 'tomato',  x: 24,  y: 110, w: 120, h: 76 },
  { id: 'lettuce', x: 24,  y: 198, w: 120, h: 76 },
  { id: 'cheese',  x: 24,  y: 286, w: 120, h: 76 },
  { id: 'bread',   x: 24,  y: 374, w: 120, h: 76 },
  { id: 'patty',   x: 24,  y: 462, w: 120, h: 76 },
];

export const STATIONS = {
  // One chopping board: hold E beside it to chop what you carry.
  board:   { id: 'board',   label: 'Chopping Board', x: 300, y: 250, w: 190, h: 110 },
  // The grill has two slots; a patty cooks on its own once placed.
  grill:   { id: 'grill',   label: 'Grill',          x: 560, y: 250, w: 220, h: 110 },
  // The plating counter holds the dish being assembled.
  plating: { id: 'plating', label: 'Plating Counter', x: 880, y: 250, w: 220, h: 110 },
  // Finished plates go out through the serve window.
  serve:   { id: 'serve',   label: 'Serve Window',   x: 880, y: 92,  w: 360, h: 84 },
  // Anything ruined goes in the bin.
  trash:   { id: 'trash',   label: 'Trash',          x: 1080, y: 560, w: 160, h: 120 },
};

// Every solid rectangle the chef cannot walk through (counters + walls).
export function solidRects() {
  const rects = [];
  for (const bin of PANTRY) rects.push({ x: bin.x, y: bin.y, w: bin.w, h: bin.h });
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    rects.push({ x: s.x, y: s.y, w: s.w, h: s.h });
  }
  // Decorative sink block at the bottom left, and the stove hood block.
  rects.push({ x: 300, y: 600, w: 190, h: 96 });
  rects.push({ x: 560, y: 600, w: 220, h: 96 });
  return rects;
}

// The chef's walkable floor: inside the kitchen, below the board, above the floor edge.
export function clampToFloor(x, y) {
  return {
    x: Math.max(170, Math.min(1240, x)),
    y: Math.max(BOARD_TOP + 30, Math.min(700, y)),
  };
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Push a circle (the chef) out of a solid rectangle, axis by axis.
export function pushOutOfRect(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= circle.r * circle.r) return;
  if (distSq === 0) { circle.y = rect.y + rect.h + circle.r; return; }
  const dist = Math.sqrt(distSq);
  circle.x = closestX + (dx / dist) * circle.r;
  circle.y = closestY + (dy / dist) * circle.r;
}

function centreOf(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

// The nearest station (pantry bin or named station) within reach of a point.
export function nearestStation(x, y) {
  const reach = 96;
  let best = null;
  let bestDist = Infinity;
  const consider = (kind, id, rect) => {
    const c = centreOf(rect);
    const d = Math.hypot(x - c.x, y - c.y);
    if (d < bestDist && d < reach + Math.max(rect.w, rect.h) / 2) {
      bestDist = d;
      best = { kind, id, rect };
    }
  };
  for (const bin of PANTRY) consider('pantry', bin.id, bin);
  for (const key of Object.keys(STATIONS)) consider('station', STATIONS[key].id, STATIONS[key]);
  return best;
}
