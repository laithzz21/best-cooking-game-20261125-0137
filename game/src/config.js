// Sizzle & Serve — shared constants: the kitchen's size, the shift length, the
// stations and every recipe the order board can ask for. Nothing here knows how
// the game is drawn or stepped; it only names the pieces the other files share.
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const HUD_HEIGHT = 104;
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const PLAYER_SPEED = 280;
export const PLAYER_RADIUS = 22;
export const INTERACT_RANGE = 96;
export const GRILL_COOK_SECONDS = 4;
export const GRILL_BURN_SECONDS = 9;
export const CHOP_SECONDS = 1.5;
export const ORDER_PATIENCE = 50;
export const MAX_ORDERS = 3;
export const BEST_KEY = 'sizzle-and-serve-best-coins';

/** One ingredient, raw or finished, with the colour and label the board draws. */
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b96a', raw: true },
  patty: { name: 'Patty', color: '#8a5a3b', raw: true },
  pattyCooked: { name: 'Grilled patty', color: '#6b4226', raw: false },
  pattyBurnt: { name: 'Burnt patty', color: '#2b2b2b', raw: false },
  tomato: { name: 'Tomato', color: '#d94f3d', raw: true },
  tomatoChopped: { name: 'Chopped tomato', color: '#e86a55', raw: false },
  lettuce: { name: 'Lettuce', color: '#7fb069', raw: true },
  lettuceChopped: { name: 'Chopped lettuce', color: '#9ccb7f', raw: false },
  cheese: { name: 'Cheese', color: '#f2c94c', raw: true },
};

/** What a raw ingredient becomes on its station: grill or chopping board. */
export const TRANSFORMS = {
  patty: { station: 'grill', result: 'pattyCooked', seconds: GRILL_COOK_SECONDS },
  tomato: { station: 'board', result: 'tomatoChopped', seconds: CHOP_SECONDS },
  lettuce: { station: 'board', result: 'lettuceChopped', seconds: CHOP_SECONDS },
};

/** The dishes the order board asks for: a name, a price and the plate it needs. */
export const RECIPES = [
  { id: 'sunny-burger', name: 'Sunny Burger', price: 14, items: ['bun', 'pattyCooked', 'tomatoChopped'] },
  { id: 'garden-salad', name: 'Garden Salad', price: 11, items: ['lettuceChopped', 'tomatoChopped', 'cheese'] },
  { id: 'cheesy-melt', name: 'Cheesy Melt', price: 13, items: ['bun', 'cheese', 'pattyCooked'] },
  { id: 'sunny-double', name: 'Sunny Double', price: 18, items: ['bun', 'pattyCooked', 'pattyCooked', 'cheese'] },
];

/**
 * Every station: where it sits, the point the chef stands at to use it, and the
 * ingredient its bins hand out (bins only). The counters are the walls of the
 * kitchen; the middle of the floor stays open so the chef can run a route.
 */
export const STATIONS = [
  { id: 'bin-bun', kind: 'bin', ingredient: 'bun', label: 'Buns', x: 24, y: 124, w: 120, h: 84, front: { x: 84, y: 236 } },
  { id: 'bin-patty', kind: 'bin', ingredient: 'patty', label: 'Patties', x: 156, y: 124, w: 120, h: 84, front: { x: 216, y: 236 } },
  { id: 'bin-tomato', kind: 'bin', ingredient: 'tomato', label: 'Tomatoes', x: 288, y: 124, w: 120, h: 84, front: { x: 348, y: 236 } },
  { id: 'bin-lettuce', kind: 'bin', ingredient: 'lettuce', label: 'Lettuce', x: 420, y: 124, w: 120, h: 84, front: { x: 480, y: 236 } },
  { id: 'bin-cheese', kind: 'bin', ingredient: 'cheese', label: 'Cheese', x: 552, y: 124, w: 120, h: 84, front: { x: 612, y: 236 } },
  { id: 'grill', kind: 'grill', ingredient: null, label: 'Grill', x: 1064, y: 124, w: 192, h: 120, front: { x: 1160, y: 272 } },
  { id: 'board', kind: 'board', ingredient: null, label: 'Chopping board', x: 24, y: 300, w: 192, h: 120, front: { x: 120, y: 448 } },
  { id: 'plate', kind: 'plate', ingredient: null, label: 'Assembly counter', x: 440, y: 576, w: 400, h: 112, front: { x: 640, y: 548 } },
  { id: 'bin', kind: 'trash', ingredient: null, label: 'Bin', x: 1064, y: 576, w: 192, h: 112, front: { x: 1160, y: 548 } },
];

/** Where the chef starts a shift, in the middle of the open floor. */
export const SPAWN = { x: 640, y: 400 };

/** A plate's ingredients, in the order they were added, match an order exactly. */
export function plateMatchesOrder(plate, order) {
  if (plate.length !== order.recipe.items.length) return false;
  const sortedPlate = [...plate].sort();
  const sortedNeed = [...order.recipe.items].sort();
  return sortedPlate.every((item, index) => item === sortedNeed[index]);
}

/** The first ingredient of an order the plate still needs, or null when done. */
export function nextMissingIngredient(plate, order) {
  const remaining = [...order.recipe.items];
  for (const item of plate) {
    const at = remaining.indexOf(item);
    if (at >= 0) remaining.splice(at, 1);
  }
  return remaining.length > 0 ? remaining[0] : null;
}
