// orders.js — the order board: tickets arrive, patience drains, serving pays.
// An order is { id, recipeId, patience, maxPatience, bornAt }. Patience is
// seconds of goodwill left; when it hits zero the customer walks out.

import { recipesAvailableAt, recipeById, plateMatchesRecipe } from './recipes.js';

let nextOrderId = 1;

export function makeOrder(elapsedSeconds) {
  const pool = recipesAvailableAt(elapsedSeconds);
  const recipe = pool[Math.floor(Math.random() * pool.length)];
  const maxPatience = Math.max(26, 48 - elapsedSeconds * 0.08);
  return {
    id: nextOrderId,
    recipeId: recipe.id,
    patience: maxPatience,
    maxPatience,
    bornAt: elapsedSeconds,
  };
}

// How often a new ticket arrives: brisk at first, a rush by the end.
export function spawnInterval(elapsedSeconds) {
  return Math.max(7, 15 - elapsedSeconds * 0.06);
}

export function maxActiveOrders(elapsedSeconds) {
  return elapsedSeconds > 90 ? 5 : 4;
}

// Drain patience; returns the ids of orders that just expired.
export function tickOrders(orders, dt) {
  const expired = [];
  for (const order of orders) {
    order.patience -= dt;
    if (order.patience <= 0) expired.push(order.id);
  }
  return expired;
}

export function removeOrder(orders, id) {
  const at = orders.findIndex((o) => o.id === id);
  if (at !== -1) orders.splice(at, 1);
}

// Score a served plate. The base price comes from the recipe, plus a tip for
// serving with patience to spare, plus a combo bonus for serving in a row.
export function scoreServe(order, combo) {
  const recipe = recipeById(order.recipeId);
  const patienceShare = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(50 * patienceShare);
  const comboBonus = combo * 10;
  return { points: recipe.price + tip + comboBonus, tip, comboBonus, name: recipe.name };
}

// Find the order a plate completes, if any. Returns the order or null.
export function matchingOrder(orders, plateItems) {
  for (const order of orders) {
    const recipe = recipeById(order.recipeId);
    if (recipe && plateMatchesRecipe(plateItems, recipe)) return order;
  }
  return null;
}

// The ticket a plate is closest to finishing (for the "almost there" hint).
export function closestOrder(orders, plateItems) {
  let best = null;
  let bestDone = -1;
  for (const order of orders) {
    const recipe = recipeById(order.recipeId);
    if (!recipe) continue;
    let done = 0;
    const remaining = [...recipe.needs];
    for (const item of plateItems) {
      const at = remaining.indexOf(item);
      if (at !== -1) { remaining.splice(at, 1); done += 1; }
    }
    if (done > bestDone) { bestDone = done; best = order; }
  }
  return best;
}
