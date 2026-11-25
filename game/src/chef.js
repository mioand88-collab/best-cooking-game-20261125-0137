// chef.js — the cook: movement, carrying one thing, and the chopping timer.
// The chef carries at most one item (an ingredient or a finished plate).
// Chopping is a held action: stand at the board with something choppable and
// hold the interact key until the chop bar fills.

import { INGREDIENTS } from './recipes.js';
import { clampToFloor, pushOutOfRect, solidRects } from './kitchen.js';

export const CHEF_SPEED = 265;
export const CHOP_SECONDS = 1.6;

export function makeChef() {
  return {
    x: 640, y: 520, r: 22,
    dirX: 0, dirY: 1,
    moving: false,
    target: null,          // click-to-move destination, or null
    held: null,            // ingredient id, or { plate: [...] }
    chopProgress: 0,       // 0..1 while chopping
    chopTarget: null,      // ingredient being chopped
    bob: 0,                // walk-cycle phase for the draw step
  };
}

export function chefIsCarryingPlate(chef) {
  return chef.held !== null && typeof chef.held === 'object';
}

export function chefHeldName(chef) {
  if (chef.held === null) return 'empty hands';
  if (typeof chef.held === 'object') return 'a finished plate';
  return INGREDIENTS[chef.held]?.name ?? 'something';
}

export function moveChef(chef, input, dt) {
  let vx = 0;
  let vy = 0;
  if (input.left) vx -= 1;
  if (input.right) vx += 1;
  if (input.up) vy -= 1;
  if (input.down) vy += 1;

  if (vx !== 0 || vy !== 0) {
    chef.target = null;
    const len = Math.hypot(vx, vy);
    vx /= len;
    vy /= len;
  } else if (chef.target) {
    const dx = chef.target.x - chef.x;
    const dy = chef.target.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      chef.target = null;
    } else {
      vx = dx / dist;
      vy = dy / dist;
    }
  }

  chef.moving = vx !== 0 || vy !== 0;
  if (chef.moving) {
    chef.dirX = vx;
    chef.dirY = vy;
    chef.bob += dt * 11;
    chef.x += vx * CHEF_SPEED * dt;
    chef.y += vy * CHEF_SPEED * dt;
  }

  const clamped = clampToFloor(chef.x, chef.y);
  chef.x = clamped.x;
  chef.y = clamped.y;
  for (const rect of solidRects()) pushOutOfRect(chef, rect);
}

// Advance a chop while the interact key is held at the board. Returns the
// finished prepared ingredient id, or null while still chopping.
export function chopStep(chef, dt) {
  if (!chef.held || typeof chef.held !== 'object') {
    const def = chef.held ? INGREDIENTS[chef.held] : null;
    if (!def || def.prep !== 'chop') { chef.chopProgress = 0; chef.chopTarget = null; return null; }
    if (chef.chopTarget !== chef.held) { chef.chopTarget = chef.held; chef.chopProgress = 0; }
    chef.chopProgress += dt / CHOP_SECONDS;
    if (chef.chopProgress >= 1) {
      const done = def.prepared;
      chef.held = done;
      chef.chopProgress = 0;
      chef.chopTarget = null;
      return done;
    }
  }
  return null;
}

export function stopChopping(chef, dt) {
  // Letting go mid-chop keeps most of the progress, so a chop feels forgiving.
  chef.chopProgress = Math.max(0, chef.chopProgress - dt * 0.5);
  if (chef.chopProgress === 0) chef.chopTarget = null;
}
