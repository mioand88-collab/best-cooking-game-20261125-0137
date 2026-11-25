// main.js — Sizzle & Serve: boot, the game loop, and every interaction.
// The shift lasts 150 seconds. Orders arrive on the board, the chef runs
// the route pantry → board / grill → plating counter → serve window, and
// the score is the day's takings. One file owns the loop; the other files
// own the kitchen, the orders, the chef, the drawing and the sound.

import { INGREDIENTS } from './recipes.js';
import { STATIONS, nearestStation } from './kitchen.js';
import { makeOrder, spawnInterval, maxActiveOrders, tickOrders, removeOrder, scoreServe, matchingOrder } from './orders.js';
import { makeChef, moveChef, chopStep, stopChopping, chefIsCarryingPlate } from './chef.js';
import { makeInput, bindInput } from './input.js';
import { makeAudio, unlockAudio, sfx, musicStep, setMuted } from './audio.js';
import { render } from './render.js';
import { applyStage } from './stage.js';

const SHIFT_LENGTH = 150;
const GRILL_COOK_SECONDS = 7;
const GRILL_BURN_SECONDS = 13;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function makeState() {
  return {
    screen: 'title',           // title | play | over
    paused: false,
    time: 0,                   // seconds into the shift
    shiftLength: SHIFT_LENGTH,
    score: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    chef: makeChef(),
    plate: [],                 // prepared items on the plating counter
    grill: [null, null],       // { item, startAt, burnAt } per slot, or null
    orders: [],
    nextOrderIn: 4,            // seconds until the next ticket arrives
    nearest: null,             // station the chef stands beside
    frozen: false,             // staged screenshot states hold the clock still
    particles: [],
    floats: [],
    flashServe: 0,
    lastTickSecond: -1,
  };
}

const state = makeState();
const input = makeInput();
const audio = makeAudio();
bindInput(canvas, input);

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function burst(x, y, color, count = 14) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 90;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      life: 0.6 + Math.random() * 0.4,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function floatText(x, y, text, color) {
  state.floats.push({ x, y, text, color, life: 1.4 });
}

function startShift() {
  const fresh = makeState();
  Object.assign(state, fresh);
  state.screen = 'play';
  state.nextOrderIn = 3;
  sfx.start(audio);
  announce('Shift started. First order coming in — grab ingredients from the pantry.');
}

function endShift() {
  state.screen = 'over';
  sfx.gameOver(audio);
  announce(`Shift over. You earned $${state.score} and served ${state.served} dishes.`);
}

// --- Interactions ---------------------------------------------------------

function interactAtStation() {
  const near = state.nearest;
  const chef = state.chef;
  if (!near) return;
  if (near.kind === 'pantry') {
    if (chef.held !== null) return;
    chef.held = near.id;
    sfx.pickup(audio);
    announce(`Picked up ${INGREDIENTS[near.id].name}.`);
    return;
  }
  const id = near.id;
  if (id === 'board') {
    // Chopping is a held action handled in update(); a tap does nothing.
    return;
  }
  if (id === 'grill') {
    if (chef.held === 'patty') {
      const slot = state.grill.findIndex((s) => s === null);
      if (slot !== -1) {
        state.grill[slot] = { item: 'patty', startAt: state.time, burnAt: state.time + GRILL_BURN_SECONDS };
        chef.held = null;
        sfx.sizzleStart(audio);
        announce('Patty on the grill.');
      }
      return;
    }
    if (chef.held !== null) return;
    const slot = state.grill.findIndex((s) => s && s.item !== 'patty');
    if (slot !== -1) {
      chef.held = state.grill[slot].item;
      state.grill[slot] = null;
      sfx.pickup(audio);
      announce(chef.held === 'pattyBurnt' ? 'Burnt patty — bin it.' : 'Grilled patty, hot off the grill.');
    }
    return;
  }
  if (id === 'plating') {
    if (typeof chef.held === 'string') {
      state.plate.push(chef.held);
      chef.held = null;
      sfx.place(audio);
      announce(`Added to the plate: ${state.plate.length} item${state.plate.length === 1 ? '' : 's'} on it.`);
      return;
    }
    if (chef.held === null && state.plate.length > 0) {
      chef.held = { plate: [...state.plate] };
      state.plate = [];
      sfx.pickup(audio);
      announce('Picked up the plate. Serve it at the window!');
      return;
    }
    return;
  }
  if (id === 'serve') {
    if (!chefIsCarryingPlate(chef)) return;
    const items = chef.held.plate;
    const order = matchingOrder(state.orders, items);
    if (order) {
      const result = scoreServe(order, state.combo);
      state.score += result.points;
      state.served += 1;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      removeOrder(state.orders, order.id);
      chef.held = null;
      state.flashServe = 1;
      sfx.serve(audio);
      burst(1060, 130, '#ffd94d', 22);
      floatText(1060, 110, `+$${result.points} ${result.name}!`, '#ffd94d');
      announce(`Served ${result.name} for $${result.points}. Combo x${state.combo}.`);
    } else {
      state.score = Math.max(0, state.score - 25);
      state.combo = 0;
      chef.held = null;
      sfx.wrong(audio);
      floatText(1060, 110, 'Wrong dish! -$25', '#ff5a2a');
      announce('That plate matches no order. Minus $25, combo lost.');
    }
    return;
  }
  if (id === 'trash') {
    if (chef.held === null) return;
    if (typeof chef.held === 'object') {
      state.plate = [];
    }
    chef.held = null;
    state.chef.chopProgress = 0;
    sfx.place(audio);
    announce('Thrown away.');
  }
}

// Click a station: walk toward it, then interact on arrival.
function handleClick() {
  const click = input.click;
  if (!click) return;
  input.click = null;
  unlockAudio(audio);
  if (state.screen === 'title' || state.screen === 'over') {
    startShift();
    return;
  }
  const near = nearestStation(click.x, click.y);
  if (near && Math.hypot(state.chef.x - click.x, state.chef.y - click.y) < 130) {
    // Close enough to touch it directly.
    state.nearest = near;
    interactAtStation();
    return;
  }
  state.chef.target = { x: click.x, y: click.y };
  if (near) state.chef.targetStation = near;
}

// --- Update ---------------------------------------------------------------

function updateGrill(dt) {
  void dt;
  state.grill.forEach((slot) => {
    if (!slot) return;
    if (slot.item === 'patty' && state.time - slot.startAt >= GRILL_COOK_SECONDS) {
      slot.item = 'pattyCooked';
    } else if (slot.item === 'pattyCooked' && state.time >= slot.burnAt) {
      slot.item = 'pattyBurnt';
      sfx.expired(audio);
    }
  });
}

function updateOrders(dt) {
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0 && state.orders.length < maxActiveOrders(state.time)) {
    state.orders.push(makeOrder(state.time));
    state.nextOrderIn = spawnInterval(state.time);
    sfx.newOrder(audio);
  }
  const expired = tickOrders(state.orders, dt);
  for (const id of expired) {
    removeOrder(state.orders, id);
    state.missed += 1;
    state.combo = 0;
    sfx.expired(audio);
    floatText(640, 120, 'A customer walked out!', '#ff5a2a');
    announce('An order expired — a customer walked out.');
  }
}

function update(dt) {
  state.time += dt;
  if (state.time >= state.shiftLength) {
    state.time = state.shiftLength;
    endShift();
    return;
  }
  // The last thirty seconds tick louder: the timer you can feel.
  const whole = Math.floor(state.shiftLength - state.time);
  if (whole <= 10 && whole !== state.lastTickSecond) {
    state.lastTickSecond = whole;
    sfx.tick(audio);
  }
  state.nearest = nearestStation(state.chef.x, state.chef.y);
  moveChef(state.chef, input, dt);
  if (state.chef.targetStation) {
    const target = state.chef.targetStation;
    const c = { x: target.rect.x + target.rect.w / 2, y: target.rect.y + target.rect.h / 2 };
    if (Math.hypot(state.chef.x - c.x, state.chef.y - c.y) < 120) {
      state.nearest = target;
      interactAtStation();
      state.chef.targetStation = null;
    } else if (!state.chef.target) {
      state.chef.targetStation = null;
    }
  }
  // Chopping: hold interact beside the board with something choppable.
  const atBoard = state.nearest && state.nearest.kind === 'station' && state.nearest.id === 'board';
  if (atBoard && input.interactHeld) {
    const before = state.chef.chopProgress;
    const done = chopStep(state.chef, dt);
    if (state.chef.chopProgress > before && Math.floor(state.chef.chopProgress * 6) !== Math.floor(before * 6)) {
      sfx.chop(audio);
    }
    if (done) {
      sfx.chopped(audio);
      burst(state.chef.x, state.chef.y - 40, '#8ed06a', 10);
      announce(`${INGREDIENTS[done].name} ready.`);
    }
  } else if (state.chef.chopProgress > 0 && !input.interactHeld) {
    stopChopping(state.chef, dt);
  }
  if (input.interactPressed) {
    input.interactPressed = false;
    interactAtStation();
  }
  updateGrill(dt);
  updateOrders(dt);
  // Particles and floating scores drift and fade.
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const f of state.floats) {
    f.y -= 34 * dt;
    f.life -= dt * 0.8;
  }
  state.floats = state.floats.filter((f) => f.life > 0);
  state.flashServe = Math.max(0, state.flashServe - dt * 1.5);
  musicStep(audio);
}

// --- Loop -----------------------------------------------------------------

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (input.startPressed) {
    input.startPressed = false;
    unlockAudio(audio);
    if (state.screen !== 'play') startShift();
  }
  if (input.pausePressed) {
    input.pausePressed = false;
    if (state.screen === 'play') state.paused = !state.paused;
  }
  if (input.mutePressed) {
    input.mutePressed = false;
    setMuted(audio, !audio.muted);
  }
  if (input.click) handleClick();
  if (state.screen === 'play' && !state.paused && !state.frozen) update(dt);
  render(ctx, state);
  requestAnimationFrame(frame);
}

// Staged screenshot states (?stage=cover|serve|rush) start a live game.
const params = new URLSearchParams(window.location.search);
const stageName = params.get('stage');
if (stageName) {
  startShift();
  applyStage(state, stageName);
  // Freeze the staged moment: the game draws live, but the clock, the
  // orders and the grill hold still so the shot is stable.
  state.frozen = true;
}

// Debug handle for play-testing in a headless browser: the live game state
// and input, reachable as window.__sizzle. Harmless in normal play.
window.__sizzle = { state, input, startShift };

requestAnimationFrame(frame);
