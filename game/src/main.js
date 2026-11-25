// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play,
// paused and game over.
//
// ?seed=N fixes the order the board deals. ?shot=start|play|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER } from './world.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function describe() {
    const state = world.state;
    if (screen === SCREEN_TITLE) return 'Sizzle and Serve. Press Enter to start the shift.';
    if (screen === SCREEN_OVER) return `Shift over. ${state.served} dishes served, ${state.coins} coins. Press Enter to play again.`;
    if (screen === SCREEN_PAUSED) return 'Paused. Press P to continue.';
    const order = state.orders[0];
    const carrying = state.player.carry === null ? 'hands empty' : `carrying ${state.player.carry}`;
    return order === undefined
      ? `${state.coins} coins, ${carrying}.`
      : `Order ${order.recipe.name}. ${state.coins} coins, ${Math.ceil(state.timeLeft)} seconds left, ${carrying}.`;
  }

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const snap = input.snapshot(world.state.player);
    if (snap.pause && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      if (snap.interact) {
        world.reset();
        screen = SCREEN_PLAY;
      }
    } else if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const events = world.step(STEP, snap);
        if (events & EVENT_OVER) {
          screen = SCREEN_OVER;
          best = Math.max(best, world.state.coins);
          saveBest(best);
          break;
        }
      }
    }
    renderer.draw(world.state, screen, best, input.clickTarget);
    status.textContent = describe();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot !== null) runShot(shot);
else runGame();
