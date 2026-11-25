// The screenshot scenes behind ?shot=start|play|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a
// simple autopilot that works the first order like a player would — fetch the
// missing ingredient, grill or chop it, build the plate and serve it — so the
// frame is what a short game really looks like and the same seed always gives
// the same frame.
import { CHOP_SECONDS, GRILL_COOK_SECONDS, INTERACT_RANGE, STEP, STATIONS, nextMissingIngredient, plateMatchesOrder } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 48;
const END_LIMIT_SECONDS = 400;
const SAMPLE = STEP;

/** The front point of a station, where the chef stands to use it. */
function frontOf(stationId) {
  return STATIONS.find((station) => station.id === stationId).front;
}

/** The bin station that hands out one ingredient. */
function binFront(ingredient) {
  return STATIONS.find((station) => station.kind === 'bin' && station.ingredient === ingredient).front;
}

/**
 * What the autopilot wants to do this step: a point to walk toward and whether
 * to press interact when it gets there. It serves the first order on the board.
 */
function autopilot(state) {
  const player = state.player;
  const order = state.orders[0];
  const move = { x: player.x, y: player.y, interact: false };
  const goTo = (point, interactWhenClose = true) => {
    move.x = point.x;
    move.y = point.y;
    move.interact = interactWhenClose && Math.hypot(player.x - point.x, player.y - point.y) < 42;
    return move;
  };
  if (order === undefined) return move;
  if (plateMatchesOrder(state.plate, order)) return goTo(frontOf('plate'));
  const missing = nextMissingIngredient(state.plate, order);
  if (missing === null) return move;
  if (player.carry !== null && player.carry !== missing && player.carry !== 'patty' && player.carry !== 'tomato' && player.carry !== 'lettuce') {
    return goTo(frontOf('bin'));
  }
  if (missing === 'pattyCooked') {
    if (player.carry === 'pattyCooked') return goTo(frontOf('plate'));
    if (state.grill.item !== null) {
      if (state.grill.progress >= GRILL_COOK_SECONDS && player.carry === null) return goTo(frontOf('grill'));
      return goTo(frontOf('grill'), false);
    }
    if (player.carry === 'patty') return goTo(frontOf('grill'));
    if (player.carry === null) return goTo(binFront('patty'));
    return goTo(frontOf('bin'));
  }
  if (missing === 'tomatoChopped' || missing === 'lettuceChopped') {
    const raw = missing === 'tomatoChopped' ? 'tomato' : 'lettuce';
    if (player.carry === missing) return goTo(frontOf('plate'));
    if (state.board.item !== null) {
      if (state.board.progress >= CHOP_SECONDS && player.carry === null) return goTo(frontOf('board'));
      return goTo(frontOf('board'), false);
    }
    if (player.carry === raw) return goTo(frontOf('board'));
    if (player.carry === null) return goTo(binFront(raw));
    return goTo(frontOf('bin'));
  }
  if (player.carry === missing) return goTo(frontOf('plate'));
  if (player.carry === null) return goTo(binFront(missing));
  return goTo(frontOf('bin'));
}

/** One autopilot step: steer toward the goal and press interact on arrival. */
function pilotStep(world) {
  const state = world.state;
  const goal = autopilot(state);
  const dx = goal.x - state.player.x;
  const dy = goal.y - state.player.y;
  const distance = Math.hypot(dx, dy);
  const input = {
    dx: distance > 4 ? dx / distance : 0,
    dy: distance > 4 ? dy / distance : 0,
    interact: goal.interact,
  };
  return world.step(SAMPLE, input);
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / SAMPLE; index += 1) {
      world.step(SAMPLE, { dx: 0, dy: 0, interact: false });
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  for (let index = 0; index < limit / SAMPLE; index += 1) {
    pilotStep(world);
    if (world.state.over) break;
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.coins };
}

/** The range inside which a station answers an interact press (for the pilot). */
export const PILOT_RANGE = INTERACT_RANGE;
