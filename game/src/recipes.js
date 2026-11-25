// recipes.js — every ingredient and dish in Sizzle & Serve.
// An ingredient has a raw form, a prepared form, and the station that prepares it.
// A recipe is a set of prepared ingredients that must all sit on one plate.

export const INGREDIENTS = {
  tomato:  { name: 'Tomato',  color: '#e5484d', dark: '#a92c31', prep: 'chop',  prepared: 'tomatoChopped',  emoji: '🍅' },
  lettuce:  { name: 'Lettuce', color: '#5fb53a', dark: '#3a7d24', prep: 'chop',  prepared: 'lettuceChopped',  emoji: '🥬' },
  cheese:   { name: 'Cheese',  color: '#f5c542', dark: '#c79a1e', prep: 'none',  prepared: 'cheese',          emoji: '🧀' },
  bread:    { name: 'Bread',   color: '#e0a458', dark: '#a8763a', prep: 'none',  prepared: 'bread',           emoji: '🍞' },
  patty:    { name: 'Patty',   color: '#b06a4a', dark: '#7c452c', prep: 'grill', prepared: 'pattyCooked',     emoji: '🥩' },
  tomatoChopped: { name: 'Chopped Tomato',  color: '#e5484d', dark: '#a92c31', prep: 'done', prepared: null, emoji: '🍅' },
  lettuceChopped:{ name: 'Chopped Lettuce', color: '#5fb53a', dark: '#3a7d24', prep: 'done', prepared: null, emoji: '🥬' },
  pattyCooked:   { name: 'Grilled Patty',   color: '#8a4f2e', dark: '#5f3018', prep: 'done', prepared: null, emoji: '🍔' },
  pattyBurnt:    { name: 'Burnt Patty',     color: '#2b211c', dark: '#171110', prep: 'done', prepared: null, emoji: '🔥' },
};

export const RAW_INGREDIENTS = ['tomato', 'lettuce', 'cheese', 'bread', 'patty'];

// A recipe lists prepared ingredient ids. The same ingredient may appear twice
// (the Double Stack takes two grilled patties), so matching counts duplicates.
export const RECIPES = [
  { id: 'salad',   name: 'Garden Salad',   needs: ['tomatoChopped', 'lettuceChopped'],            price: 90,  minTime: 0 },
  { id: 'caprese', name: 'Caprese Plate',  needs: ['tomatoChopped', 'cheese'],                    price: 100, minTime: 0 },
  { id: 'burger',  name: 'Classic Burger', needs: ['bread', 'pattyCooked', 'lettuceChopped'],     price: 140, minTime: 0 },
  { id: 'melt',    name: 'Cheese Melt',    needs: ['bread', 'cheese', 'pattyCooked'],             price: 150, minTime: 25 },
  { id: 'stack',   name: 'Double Stack',   needs: ['bread', 'pattyCooked', 'cheese', 'pattyCooked', 'lettuceChopped'], price: 220, minTime: 60 },
];

export function recipesAvailableAt(elapsedSeconds) {
  return RECIPES.filter((r) => elapsedSeconds >= r.minTime);
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? null;
}

// True when the plate's items are exactly the recipe's needs, order aside.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const have = [...plateItems].sort();
  const want = [...recipe.needs].sort();
  return have.every((item, i) => item === want[i]);
}

// How many of the recipe's needs the plate already covers (for the ticket ticks).
export function plateProgress(plateItems, recipe) {
  const remaining = [...recipe.needs];
  let done = 0;
  for (const item of plateItems) {
    const at = remaining.indexOf(item);
    if (at !== -1) { remaining.splice(at, 1); done += 1; }
  }
  return done;
}
