// stage.js — staged states for screenshots, driven by ?stage= in the URL.
// Each stage starts a real game and arranges a believable mid-shift moment:
// orders on the board, a dish mid-assembly, a patty on the grill, a live
// timer. The game itself is running; these are just starting positions so
// the screenshots show a kitchen in full swing, not a title screen.

import { makeOrder } from './orders.js';

function seedOrders(state, recipeIds, patienceShare) {
  state.orders = [];
  recipeIds.forEach((recipeId, i) => {
    const order = makeOrder(state.time);
    order.recipeId = recipeId;
    order.patience = order.maxPatience * patienceShare[i];
    state.orders.push(order);
  });
}

export function applyStage(state, name) {
  state.screen = 'play';
  if (name === 'cover') {
    // The classic mid-shift frame: two orders up, a burger half-built on
    // the plating counter, a patty sizzling, chef on the way to the grill.
    state.time = 32;
    state.score = 180;
    state.served = 2;
    state.combo = 1;
    seedOrders(state, ['burger', 'salad'], [0.7, 0.9]);
    state.plate = ['bread', 'pattyCooked'];
    state.grill = [{ item: 'pattyCooked', startAt: 28, burnAt: 40 }, null];
    state.chef.x = 520;
    state.chef.y = 430;
    state.chef.held = 'lettuce';
    state.chef.dirX = 0.6;
    state.chef.dirY = -0.8;
  } else if (name === 'serve') {
    // A finished plate in hand at the serve window, timer still healthy.
    state.time = 54;
    state.score = 340;
    state.served = 3;
    state.combo = 2;
    seedOrders(state, ['burger', 'melt', 'caprese'], [0.45, 0.8, 0.95]);
    state.plate = [];
    state.grill = [null, null];
    state.chef.x = 1010;
    state.chef.y = 250;
    state.chef.held = { plate: ['bread', 'pattyCooked', 'lettuceChopped'] };
    state.chef.dirX = 0;
    state.chef.dirY = -1;
    state.flashServe = 0.5;
  } else if (name === 'rush') {
    // The last half-minute: four tickets, one about to walk out, a burnt
    // patty on the grill, a salad half-plated, score on the climb.
    state.time = 122;
    state.score = 720;
    state.served = 6;
    state.combo = 3;
    seedOrders(state, ['stack', 'burger', 'salad', 'melt'], [0.12, 0.5, 0.75, 0.9]);
    state.plate = ['tomatoChopped'];
    state.grill = [{ item: 'pattyBurnt', startAt: 100, burnAt: 112 }, { item: 'pattyCooked', startAt: 118, burnAt: 130 }];
    state.chef.x = 420;
    state.chef.y = 380;
    state.chef.held = 'lettuceChopped';
    state.chef.dirX = 1;
    state.chef.dirY = 0;
  }
}
