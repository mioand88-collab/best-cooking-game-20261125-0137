// render.js — everything the player sees, drawn on one canvas.
// The kitchen is flat, warm colours with thick outlines so every counter
// reads at a glance, even shrunk into the judge's contact sheet. Food is
// drawn as simple shapes: a tomato is a red circle with a green star, a
// patty a brown rounded slab, a plate a white ellipse with its ingredients
// stacked on it.

import { INGREDIENTS, recipeById } from './recipes.js';
import { PANTRY, STATIONS, VIEW, BOARD_TOP } from './kitchen.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawIngredientIcon(ctx, id, x, y, size) {
  const def = INGREDIENTS[id];
  if (!def) return;
  const r = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'tomato' || id === 'tomatoChopped') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, 1, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f9e2e';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.4);
      ctx.lineTo(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45 - r * 0.35);
      ctx.lineTo(Math.cos(a + 0.5) * r * 0.3, Math.sin(a + 0.5) * r * 0.3 - r * 0.2);
      ctx.fill();
    }
    if (id === 'tomatoChopped') {
      ctx.strokeStyle = '#f6b8b8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.lineTo(0, r * 0.5); ctx.stroke();
    }
  } else if (id === 'lettuce' || id === 'lettuceChopped') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8ed06a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.2); ctx.quadraticCurveTo(0, r * 0.35, r * 0.7, -r * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.55, r * 0.15); ctx.quadraticCurveTo(0, r * 0.55, r * 0.55, r * 0.15); ctx.stroke();
    if (id === 'lettuceChopped') {
      ctx.strokeStyle = '#d9f2c2'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.3); ctx.lineTo(r * 0.5, r * 0.3); ctx.stroke();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.55); ctx.lineTo(r, r * 0.55); ctx.lineTo(r, -r * 0.15); ctx.lineTo(0, -r * 0.7); ctx.lineTo(-r, -r * 0.15);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d99a12';
    ctx.beginPath(); ctx.arc(-r * 0.35, r * 0.1, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.2, r * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.15, r * 0.32, r * 0.1, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'bread') {
    ctx.fillStyle = def.color;
    roundRect(ctx, -r, -r * 0.6, r * 2, r * 1.3, r * 0.5); ctx.fill();
    ctx.fillStyle = def.dark;
    ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.1, r * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.3, r * 0.15, r * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.08, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'patty' || id === 'pattyCooked' || id === 'pattyBurnt') {
    ctx.fillStyle = def.color;
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5); ctx.fill();
    ctx.fillStyle = def.dark;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.arc(i * r * 0.5, 0, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    if (id === 'pattyCooked') {
      ctx.strokeStyle = '#d98a4a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.2); ctx.lineTo(r * 0.7, -r * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.2); ctx.lineTo(r * 0.7, r * 0.2); ctx.stroke();
    }
    if (id === 'pattyBurnt') {
      ctx.strokeStyle = '#ff7847'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.5); ctx.quadraticCurveTo(-r * 0.5, -r * 0.9, -r * 0.3, -r * 1.0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.3, -r * 0.5); ctx.quadraticCurveTo(r * 0.4, -r * 0.95, r * 0.2, -r * 1.05); ctx.stroke();
    }
  }
  ctx.restore();
}

// A plate with its ingredients stacked: the dish mid-assembly.
export function drawPlate(ctx, items, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#f4efe6';
  ctx.beginPath(); ctx.ellipse(0, 0, 46, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9bfa9'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 46, 30, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#e3dcc9';
  ctx.beginPath(); ctx.ellipse(0, 0, 34, 21, 0, 0, Math.PI * 2); ctx.fill();
  items.forEach((item, i) => {
    const off = (i - (items.length - 1) / 2) * 8;
    drawIngredientIcon(ctx, item, off, -4 - i * 5, 34);
  });
  ctx.restore();
}

function drawFloor(ctx, time) {
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, BOARD_TOP, VIEW.w, VIEW.h - BOARD_TOP);
  ctx.fillStyle = '#43301e';
  for (let y = BOARD_TOP; y < VIEW.h; y += 64) {
    for (let x = ((y / 64) % 2 === 0 ? 0 : 32); x < VIEW.w; x += 64) {
      ctx.fillRect(x + 2, y + 2, 60, 60);
    }
  }
  // A warm rug in the middle of the floor where the chef runs.
  ctx.fillStyle = '#6b3f2a';
  roundRect(ctx, 420, 430, 440, 150, 18); ctx.fill();
  ctx.fillStyle = '#7d4a32';
  roundRect(ctx, 436, 446, 408, 118, 12); ctx.fill();
  void time;
}

function drawPantry(ctx, state) {
  for (const bin of PANTRY) {
    const def = INGREDIENTS[bin.id];
    ctx.fillStyle = '#5d4126';
    roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 10); ctx.fill();
    ctx.fillStyle = '#7a5732';
    roundRect(ctx, bin.x + 4, bin.y + 4, bin.w - 8, bin.h - 8, 8); ctx.fill();
    drawIngredientIcon(ctx, bin.id, bin.x + 34, bin.y + bin.h / 2, 44);
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.name, bin.x + 62, bin.y + bin.h / 2 - 8);
    ctx.fillStyle = '#d8c49a';
    ctx.font = '12px sans-serif';
    ctx.fillText(def.prep === 'none' ? 'ready' : def.prep === 'chop' ? 'chop it' : 'grill it', bin.x + 62, bin.y + bin.h / 2 + 12);
    if (state.nearest && state.nearest.kind === 'pantry' && state.nearest.id === bin.id) {
      ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 3;
      roundRect(ctx, bin.x - 3, bin.y - 3, bin.w + 6, bin.h + 6, 12); ctx.stroke();
    }
  }
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PANTRY', 28, 100);
}

function drawCounter(ctx, station, state, drawInside) {
  const active = state.nearest && state.nearest.kind === 'station' && state.nearest.id === station.id;
  ctx.fillStyle = '#8a6a45';
  roundRect(ctx, station.x, station.y, station.w, station.h, 12); ctx.fill();
  ctx.fillStyle = '#a8825a';
  roundRect(ctx, station.x + 5, station.y + 5, station.w - 10, station.h - 10, 9); ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(station.label.toUpperCase(), station.x + station.w / 2, station.y + 16);
  drawInside(ctx, station);
  if (active) {
    ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 3;
    roundRect(ctx, station.x - 3, station.y - 3, station.w + 6, station.h + 6, 14); ctx.stroke();
  }
}

function drawGrillSlots(ctx, state) {
  const grill = STATIONS.grill;
  state.grill.forEach((slot, i) => {
    const cx = grill.x + 55 + i * 110;
    const cy = grill.y + 62;
    ctx.fillStyle = '#2e2a26';
    roundRect(ctx, cx - 46, cy - 30, 92, 60, 10); ctx.fill();
    ctx.strokeStyle = '#55504a'; ctx.lineWidth = 2;
    for (let g = -2; g <= 2; g++) {
      ctx.beginPath(); ctx.moveTo(cx - 40, cy + g * 11); ctx.lineTo(cx + 40, cy + g * 11); ctx.stroke();
    }
    if (slot) {
      drawIngredientIcon(ctx, slot.item, cx, cy - 2, 52);
      const total = slot.burnAt - slot.startAt;
      const done = Math.min(1, (state.time - slot.startAt) / total);
      ctx.fillStyle = '#241d18';
      roundRect(ctx, cx - 40, cy + 34, 80, 8, 4); ctx.fill();
      ctx.fillStyle = slot.item === 'pattyBurnt' ? '#ff5a2a' : done > 0.66 ? '#ffb02e' : '#7ec850';
      roundRect(ctx, cx - 40, cy + 34, 80 * done, 8, 4); ctx.fill();
      if (slot.item === 'pattyBurnt') {
        ctx.fillStyle = '#ff5a2a';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('BURNT!', cx, cy - 34);
      } else if (done > 0.66 && slot.item === 'pattyCooked') {
        ctx.fillStyle = '#ffd94d';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('READY', cx, cy - 34);
      }
    }
  });
}

function drawBoard(ctx, state) {
  const board = STATIONS.board;
  ctx.fillStyle = '#d9b078';
  roundRect(ctx, board.x + 30, board.y + 34, board.w - 60, board.h - 52, 8); ctx.fill();
  ctx.strokeStyle = '#a8763a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(board.x + 45, board.y + 55); ctx.lineTo(board.x + board.w - 45, board.y + 55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(board.x + 45, board.y + 75); ctx.lineTo(board.x + board.w - 45, board.y + 75); ctx.stroke();
  const chef = state.chef;
  if (chef.held && typeof chef.held === 'string' && INGREDIENTS[chef.held]?.prep === 'chop') {
    drawIngredientIcon(ctx, chef.held, board.x + board.w / 2, board.y + 62, 46);
    if (chef.chopProgress > 0) {
      ctx.fillStyle = '#241d18';
      roundRect(ctx, board.x + 40, board.y + board.h - 22, board.w - 80, 10, 5); ctx.fill();
      ctx.fillStyle = '#ffd94d';
      roundRect(ctx, board.x + 40, board.y + board.h - 22, (board.w - 80) * chef.chopProgress, 10, 5); ctx.fill();
    }
  } else {
    ctx.fillStyle = '#8a6a45';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('hold E to chop', board.x + board.w / 2, board.y + 62);
  }
}

function drawPlating(ctx, state) {
  const plating = STATIONS.plating;
  if (state.plate.length > 0) {
    drawPlate(ctx, state.plate, plating.x + plating.w / 2, plating.y + 66, 1.05);
  } else {
    ctx.strokeStyle = '#d8c49a';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.ellipse(plating.x + plating.w / 2, plating.y + 66, 46, 30, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#d8c49a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('empty plate', plating.x + plating.w / 2, plating.y + 66);
  }
}

function drawServeWindow(ctx, state) {
  const serve = STATIONS.serve;
  ctx.fillStyle = '#4a3220';
  roundRect(ctx, serve.x, serve.y, serve.w, serve.h, 10); ctx.fill();
  ctx.fillStyle = '#2c1e12';
  roundRect(ctx, serve.x + 8, serve.y + 8, serve.w - 16, serve.h - 16, 8); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ SERVE ★', serve.x + serve.w / 2, serve.y + 26);
  ctx.fillStyle = '#fff3d6';
  ctx.font = '13px sans-serif';
  const hint = state.chef.held && typeof state.chef.held === 'object'
    ? 'press E to serve the plate!'
    : 'bring a finished plate here';
  ctx.fillText(hint, serve.x + serve.w / 2, serve.y + 50);
  if (state.flashServe) {
    ctx.fillStyle = `rgba(255, 217, 77, ${state.flashServe})`;
    roundRect(ctx, serve.x, serve.y, serve.w, serve.h, 10); ctx.fill();
  }
}

function drawTrash(ctx) {
  const trash = STATIONS.trash;
  ctx.fillStyle = '#5d4126';
  roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 12); ctx.fill();
  ctx.fillStyle = '#3d2b18';
  roundRect(ctx, trash.x + 14, trash.y + 14, trash.w - 28, trash.h - 28, 8); ctx.fill();
  ctx.fillStyle = '#8a6a45';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TRASH', trash.x + trash.w / 2, trash.y + 28);
  ctx.fillStyle = '#6b4a2a';
  ctx.beginPath();
  ctx.moveTo(trash.x + 55, trash.y + 45); ctx.lineTo(trash.x + 105, trash.y + 45);
  ctx.lineTo(trash.x + 98, trash.y + 95); ctx.lineTo(trash.x + 62, trash.y + 95);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a6a45';
  ctx.fillRect(trash.x + 48, trash.y + 38, 64, 8);
}

function drawSink(ctx) {
  ctx.fillStyle = '#5d7a8a';
  roundRect(ctx, 300, 600, 190, 96, 12); ctx.fill();
  ctx.fillStyle = '#7fa3b5';
  roundRect(ctx, 316, 616, 158, 64, 8); ctx.fill();
  ctx.fillStyle = '#cfe8f2';
  ctx.beginPath(); ctx.ellipse(395, 648, 60, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SINK', 395, 606);
  ctx.fillStyle = '#5d7a8a';
  roundRect(ctx, 560, 600, 220, 96, 12); ctx.fill();
  ctx.fillStyle = '#8a6a45';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('SPICE RACK', 670, 618);
  const spices = ['#e5484d', '#f5c542', '#5fb53a', '#c77dff'];
  spices.forEach((color, i) => {
    ctx.fillStyle = color;
    roundRect(ctx, 596 + i * 36, 632, 26, 44, 6); ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(600 + i * 36, 626, 18, 6);
  });
}

function drawChef(ctx, chef, time) {
  const bob = chef.moving ? Math.sin(chef.bob) * 3 : Math.sin(time * 2) * 1.2;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.4);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body: white apron over a teal shirt.
  ctx.fillStyle = '#2e8b8b';
  roundRect(ctx, -20, -8, 40, 34, 12); ctx.fill();
  ctx.fillStyle = '#f4efe6';
  roundRect(ctx, -13, -4, 26, 28, 8); ctx.fill();
  ctx.fillStyle = '#e5484d';
  ctx.fillRect(-13, 8, 26, 4);
  // Head and tall chef hat.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(0, -20, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-6, -36, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -36, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -40, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-14, -34, 28, 6);
  // Eyes look where the chef walks.
  ctx.fillStyle = '#241d18';
  const lookX = chef.dirX * 3;
  const lookY = chef.dirY * 2;
  ctx.beginPath(); ctx.arc(-5 + lookX, -21 + lookY, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 + lookX, -21 + lookY, 2.2, 0, Math.PI * 2); ctx.fill();
  // What the chef carries, held up high.
  if (chef.held) {
    ctx.save();
    ctx.translate(0, -56);
    if (typeof chef.held === 'object') {
      drawPlate(ctx, chef.held.plate, 0, 0, 0.72);
    } else {
      drawIngredientIcon(ctx, chef.held, 0, 0, 40);
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = recipeById(order.recipeId);
  const share = Math.max(0, order.patience / order.maxPatience);
  const urgent = share < 0.35;
  ctx.fillStyle = urgent ? '#fff0d6' : '#fff8e7';
  roundRect(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = urgent ? '#e5484d' : '#d8c49a';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 8); ctx.stroke();
  // Patience bar along the top of the ticket.
  ctx.fillStyle = '#e8dcc2';
  roundRect(ctx, x + 6, y + 5, w - 12, 7, 3); ctx.fill();
  ctx.fillStyle = share > 0.6 ? '#5fb53a' : share > 0.35 ? '#f5a623' : '#e5484d';
  roundRect(ctx, x + 6, y + 5, (w - 12) * share, 7, 3); ctx.fill();
  // Name left, price right on the middle line.
  ctx.fillStyle = '#3a2a1a';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(recipe.name, x + 8, y + 26);
  ctx.textAlign = 'right';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#7a5a34';
  ctx.fillText(`$${recipe.price}`, x + w - 8, y + 26);
  // Ingredient checklist along the bottom: every need as a small icon.
  const spacing = 22;
  const total = (recipe.needs.length - 1) * spacing;
  let cx = x + w / 2 - total / 2;
  for (const need of recipe.needs) {
    drawIngredientIcon(ctx, need, cx, y + 46, 18);
    cx += spacing;
  }
}

function drawHud(ctx, state) {
  // Order board strip: label on the left, tickets in a row after it.
  // Tickets are narrow (150 px) so five of them still end before the timer.
  ctx.fillStyle = '#241a10';
  ctx.fillRect(0, 0, VIEW.w, BOARD_TOP);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ORDERS', 16, 20);
  state.orders.forEach((order, i) => {
    drawOrderTicket(ctx, order, 92 + i * 156, 8, 150, 60);
  });
  if (state.orders.length === 0) {
    ctx.fillStyle = '#d8c49a';
    ctx.font = '13px sans-serif';
    ctx.fillText('No orders yet — the first customer is coming…', 100, 38);
  }
  // Timer: big, to the right of the tickets, impossible to miss.
  const timeLeft = Math.max(0, state.shiftLength - state.time);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  const timerText = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const urgent = timeLeft <= 30;
  const timerX = 1030;
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = urgent && Math.floor(state.time * 4) % 2 === 0 ? '#ff5a2a' : '#fff3d6';
  ctx.fillText(`⏱ ${timerText}`, timerX, 26);
  // Timer bar.
  ctx.fillStyle = '#3a2a1a';
  roundRect(ctx, timerX - 120, 46, 240, 12, 6); ctx.fill();
  ctx.fillStyle = urgent ? '#ff5a2a' : '#ffd94d';
  roundRect(ctx, timerX - 120, 46, 240 * (timeLeft / state.shiftLength), 12, 6); ctx.fill();
  ctx.fillStyle = '#d8c49a';
  ctx.font = '12px sans-serif';
  ctx.fillText(urgent ? 'RUSH! Last orders!' : 'SHIFT TIMER', timerX, 68);
  // Score block, top right.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`$${state.score}`, 1252, 22);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#d8c49a';
  ctx.fillText(`served ${state.served}  •  combo x${state.combo}`, 1252, 44);
  ctx.fillText('M mute  •  P pause', 1252, 62);
}

function drawHints(ctx, state) {
  const chef = state.chef;
  let hint = '';
  if (state.nearest) {
    if (state.nearest.kind === 'pantry') {
      hint = chef.held ? 'Hands full — serve or trash it first' : `E: grab ${INGREDIENTS[state.nearest.id].name}`;
    } else if (state.nearest.id === 'board') {
      hint = chef.held && INGREDIENTS[chef.held]?.prep === 'chop' ? 'Hold E to chop!' : 'Bring something to chop (tomato / lettuce)';
    } else if (state.nearest.id === 'grill') {
      hint = chef.held === 'patty' ? 'E: put the patty on the grill' : 'E: take a cooked patty off the grill';
    } else if (state.nearest.id === 'plating') {
      hint = chef.held && typeof chef.held === 'string' ? 'E: add it to the plate' : chef.held ? 'E: pick the plate up' : 'E: pick the plate up';
    } else if (state.nearest.id === 'serve') {
      hint = chef.held && typeof chef.held === 'object' ? 'E: SERVE IT!' : 'Bring a finished plate here';
    } else if (state.nearest.id === 'trash') {
      hint = chef.held ? 'E: throw it away' : 'Nothing to throw away';
    }
  } else {
    hint = 'WASD / arrows to move — click the floor to walk there';
  }
  ctx.fillStyle = 'rgba(20, 12, 6, 0.72)';
  roundRect(ctx, 330, 682, 620, 30, 8); ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(hint, 640, 697);
}

function drawFloats(ctx, state) {
  ctx.textAlign = 'center';
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20, 12, 6, 0.78)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText('SIZZLE & SERVE', 640, 190);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('One chef. One rush hour. Every order on time.', 640, 240);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#d8c49a';
  ctx.fillText('Grab ingredients from the pantry, chop them, grill the patties,', 640, 300);
  ctx.fillText('stack the plate, and serve before the customer walks out.', 640, 328);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('Move: WASD / arrows / click   •   Interact: E or Space   •   M: music   •   P: pause', 640, 392);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 26px sans-serif';
  const pulse = 1 + Math.sin(state.time * 4) * 0.04;
  ctx.save();
  ctx.translate(640, 470);
  ctx.scale(pulse, pulse);
  ctx.fillText('Press ENTER or click to start the shift', 0, 0);
  ctx.restore();
  ctx.fillStyle = '#d8c49a';
  ctx.font = '15px sans-serif';
  ctx.fillText('150-second shift  •  5 recipes to master  •  tips for fast, patient service', 640, 520);
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(20, 12, 6, 0.8)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText('SHIFT OVER!', 640, 230);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(`You earned $${state.score}`, 640, 300);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#d8c49a';
  ctx.fillText(`Dishes served: ${state.served}   •   Customers lost: ${state.missed}   •   Best combo: x${state.bestCombo}`, 640, 348);
  const rank = state.score >= 1200 ? 'Head Chef material!' : state.score >= 700 ? 'Solid line cook!' : state.score >= 350 ? 'A promising apprentice.' : 'The kitchen humbled you — try again!';
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(rank, 640, 400);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Press ENTER to run another shift', 640, 470);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 12, 6, 0.6)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 640, 360);
  ctx.font = '18px sans-serif';
  ctx.fillText('Press P to keep cooking', 640, 400);
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  drawFloor(ctx, state.time);
  drawPantry(ctx, state);
  drawCounter(ctx, STATIONS.board, state, () => drawBoard(ctx, state));
  drawCounter(ctx, STATIONS.grill, state, () => drawGrillSlots(ctx, state));
  drawCounter(ctx, STATIONS.plating, state, () => drawPlating(ctx, state));
  drawServeWindow(ctx, state);
  drawTrash(ctx);
  drawSink(ctx);
  drawChef(ctx, state.chef, state.time);
  drawParticles(ctx, state);
  drawFloats(ctx, state);
  drawHud(ctx, state);
  if (state.screen === 'play') drawHints(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'over') drawGameOver(ctx, state);
  if (state.paused) drawPaused(ctx);
}
