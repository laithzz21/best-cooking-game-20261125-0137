// The kitchen's state and rules: the chef, what their hands and the plate hold,
// the grill and the chopping board, the order board and the shift timer. The
// world knows nothing about keys or pixels; it takes a step's movement and one
// interact press and reports what happened as events.
import {
  CHOP_SECONDS,
  GRILL_BURN_SECONDS,
  GRILL_COOK_SECONDS,
  HUD_HEIGHT,
  INGREDIENTS,
  INTERACT_RANGE,
  MAX_ORDERS,
  ORDER_PATIENCE,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  RECIPES,
  SHIFT_SECONDS,
  SPAWN,
  STATIONS,
  TRANSFORMS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  nextMissingIngredient,
  plateMatchesOrder,
} from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;
export const EVENT_BURNT = 8;

/** A fresh order: a recipe, the patience it arrived with, and its own number. */
function makeOrder(random, number) {
  return { number, recipe: random.pick(RECIPES), patience: ORDER_PATIENCE, maxPatience: ORDER_PATIENCE };
}

/** The chef's starting place, hands empty, in the middle of the floor. */
function freshPlayer() {
  return { x: SPAWN.x, y: SPAWN.y, carry: null };
}

export function createWorld(random) {
  const world = {
    random,
    state: null,
    /** Build a fresh shift: orders on the board, empty stations, full timer. */
    reset() {
      const state = {
        player: freshPlayer(),
        plate: [],
        grill: { item: null, progress: 0, burnt: false },
        board: { item: null, progress: 0 },
        orders: [],
        nextOrderNumber: 1,
        coins: 0,
        served: 0,
        expired: 0,
        timeLeft: SHIFT_SECONDS,
        elapsed: 0,
        over: false,
        message: 'Welcome to Sizzle & Serve! Grab ingredients from the counter.',
        messageTime: 0,
      };
      for (let index = 0; index < MAX_ORDERS; index += 1) {
        state.orders.push(makeOrder(random, state.nextOrderNumber));
        state.nextOrderNumber += 1;
      }
      world.state = state;
      return state;
    },
    /** Say something on the screen for a few seconds. */
    say(text) {
      const state = world.state;
      state.message = text;
      state.messageTime = 4;
    },
    /** The station whose front the chef stands nearest, when it is in reach. */
    nearestStation() {
      const player = world.state.player;
      let best = null;
      let bestDistance = INTERACT_RANGE;
      for (const station of STATIONS) {
        const dx = player.x - station.front.x;
        const dy = player.y - station.front.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= bestDistance) {
          bestDistance = distance;
          best = station;
        }
      }
      return best;
    },
    /** What one interact press does at the nearest station, if anything. */
    interact() {
      const state = world.state;
      const station = world.nearestStation();
      if (station === null) return;
      const player = state.player;
      if (station.kind === 'bin') {
        if (player.carry !== null) {
          world.say('Hands full — serve or bin what you carry first.');
          return;
        }
        player.carry = station.ingredient;
        world.say(`Picked up ${INGREDIENTS[station.ingredient].name}.`);
        return;
      }
      if (station.kind === 'grill') {
        if (state.grill.item === null) {
          if (player.carry === 'patty') {
            state.grill.item = 'patty';
            state.grill.progress = 0;
            state.grill.burnt = false;
            player.carry = null;
            world.say('Patty on the grill — watch it cook!');
          } else if (player.carry !== null) {
            world.say('Only a raw patty goes on the grill.');
          } else {
            world.say('The grill is empty. Bring a raw patty.');
          }
          return;
        }
        if (player.carry !== null) {
          world.say('Hands full — empty them before taking the patty.');
          return;
        }
        if (state.grill.progress < GRILL_COOK_SECONDS) {
          world.say('Still cooking — give it a moment.');
          return;
        }
        const wasBurnt = state.grill.burnt;
        player.carry = wasBurnt ? 'pattyBurnt' : 'pattyCooked';
        state.grill.item = null;
        state.grill.progress = 0;
        state.grill.burnt = false;
        world.say(wasBurnt ? 'Burnt patty! Bin it.' : 'Grilled patty, ready to plate.');
        return;
      }
      if (station.kind === 'board') {
        if (state.board.item === null) {
          if (player.carry === 'tomato' || player.carry === 'lettuce') {
            state.board.item = player.carry;
            state.board.progress = 0;
            player.carry = null;
            world.say('Chopping…');
          } else if (player.carry !== null) {
            world.say('Only tomato or lettuce goes on the chopping board.');
          } else {
            world.say('The board is empty. Bring tomato or lettuce.');
          }
          return;
        }
        if (player.carry !== null) {
          world.say('Hands full — empty them before taking the chopped veg.');
          return;
        }
        if (state.board.progress < CHOP_SECONDS) {
          world.say('Still chopping…');
          return;
        }
        player.carry = TRANSFORMS[state.board.item].result;
        state.board.item = null;
        state.board.progress = 0;
        world.say('Chopped and ready.');
        return;
      }
      if (station.kind === 'plate') {
        if (player.carry !== null) {
          if (state.plate.includes(player.carry)) {
            world.say('That is already on the plate.');
            return;
          }
          state.plate.push(player.carry);
          world.say(`${INGREDIENTS[player.carry]?.name ?? 'Burnt patty'} added to the plate.`);
          player.carry = null;
          return;
        }
        const orderIndex = state.orders.findIndex((order) => plateMatchesOrder(state.plate, order));
        if (orderIndex >= 0) {
          world.serveOrder(orderIndex);
          return;
        }
        if (state.plate.length === 0) world.say('The plate is empty. Add ingredients first.');
        else world.say('That plate does not match any order yet.');
        return;
      }
      if (station.kind === 'trash') {
        if (player.carry !== null) {
          world.say(`Binned the ${INGREDIENTS[player.carry]?.name ?? 'burnt patty'}.`);
          player.carry = null;
          return;
        }
        if (state.plate.length > 0) {
          state.plate = [];
          world.say('Plate cleared.');
          return;
        }
        world.say('Nothing to bin.');
      }
    },
    /** Serve the matching order: coins for the dish plus a patience bonus. */
    serveOrder(orderIndex) {
      const state = world.state;
      const order = state.orders[orderIndex];
      const bonus = Math.round((order.patience / order.maxPatience) * 6);
      const earned = order.recipe.price + bonus;
      state.coins += earned;
      state.served += 1;
      state.orders.splice(orderIndex, 1);
      state.orders.push(makeOrder(world.random, state.nextOrderNumber));
      state.nextOrderNumber += 1;
      state.plate = [];
      world.say(`Served ${order.recipe.name}! +${earned} coins.`);
    },
    /** Push the chef out of a counter rectangle they walked into. */
    collide(player) {
      for (const station of STATIONS) {
        const nearestX = Math.max(station.x, Math.min(player.x, station.x + station.w));
        const nearestY = Math.max(station.y, Math.min(player.y, station.y + station.h));
        const dx = player.x - nearestX;
        const dy = player.y - nearestY;
        const distance = Math.hypot(dx, dy);
        if (distance < PLAYER_RADIUS && distance > 0) {
          player.x = nearestX + (dx / distance) * PLAYER_RADIUS;
          player.y = nearestY + (dy / distance) * PLAYER_RADIUS;
        } else if (distance === 0) {
          player.y = station.y + station.h + PLAYER_RADIUS;
        }
      }
      player.x = Math.max(PLAYER_RADIUS, Math.min(VIEW_WIDTH - PLAYER_RADIUS, player.x));
      player.y = Math.max(HUD_HEIGHT + PLAYER_RADIUS, Math.min(VIEW_HEIGHT - PLAYER_RADIUS, player.y));
    },
    /**
     * Advance the world by dt seconds. input is { dx, dy, interact }: a unit
     * movement direction and whether this step presses interact. Returns the
     * events that happened, as a bitmask of EVENT_*.
     */
    step(dt, input) {
      const state = world.state;
      if (state.over) return 0;
      let events = 0;
      state.elapsed += dt;
      state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
      if (state.messageTime > 0) state.messageTime -= dt;
      const length = Math.hypot(input.dx, input.dy);
      if (length > 0) {
        state.player.x += (input.dx / length) * PLAYER_SPEED * dt;
        state.player.y += (input.dy / length) * PLAYER_SPEED * dt;
        world.collide(state.player);
      }
      if (input.interact) world.interact();
      if (state.grill.item !== null) {
        state.grill.progress += dt;
        if (!state.grill.burnt && state.grill.progress >= GRILL_BURN_SECONDS) {
          state.grill.burnt = true;
          world.say('The patty burnt! Take it off the grill.');
          events |= EVENT_BURNT;
        }
      }
      if (state.board.item !== null && state.board.progress < CHOP_SECONDS) {
        state.board.progress += dt;
        if (state.board.progress >= CHOP_SECONDS) world.say('Chopped! Pick it up from the board.');
      }
      for (let index = state.orders.length - 1; index >= 0; index -= 1) {
        const order = state.orders[index];
        order.patience -= dt;
        if (order.patience <= 0) {
          state.orders.splice(index, 1);
          state.orders.push(makeOrder(world.random, state.nextOrderNumber));
          state.nextOrderNumber += 1;
          state.expired += 1;
          world.say(`Order #${order.number} walked out — too slow!`);
          events |= EVENT_EXPIRED;
        }
      }
      if (state.timeLeft <= 0) {
        state.over = true;
        events |= EVENT_OVER;
      }
      return events;
    },
  };
  world.reset();
  return world;
}
