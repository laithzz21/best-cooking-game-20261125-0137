// Everything the player sees, painted on one canvas: the tiled kitchen floor,
// the counters with their ingredients, the order board and the shift timer,
// the chef and what they carry, and the title, pause and game-over screens.
// All art is drawn shapes — no images, no network, nothing to load.
import {
  CHOP_SECONDS,
  GRILL_BURN_SECONDS,
  GRILL_COOK_SECONDS,
  HUD_HEIGHT,
  INGREDIENTS,
  PLAYER_RADIUS,
  SHIFT_SECONDS,
  STATIONS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const TILE = 64;

/** One ingredient as a little drawn dish: a bun, a patty, a tomato and more. */
export function drawIngredient(ctx, id, x, y, radius) {
  const info = INGREDIENTS[id];
  if (info === undefined) return;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = '#e8b96a';
    ctx.beginPath();
    ctx.arc(0, 2, radius, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d9a24f';
    ctx.fillRect(-radius, 0, radius * 2, radius * 0.35);
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(-radius * 0.5, -radius * 0.55, radius * 0.16, radius * 0.12);
    ctx.fillRect(radius * 0.2, -radius * 0.7, radius * 0.16, radius * 0.12);
  } else if (id === 'patty' || id === 'pattyCooked' || id === 'pattyBurnt') {
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (id === 'tomato' || id === 'tomatoChopped') {
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4c9a4c';
    ctx.beginPath();
    ctx.arc(0, -radius * 0.7, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'lettuce' || id === 'lettuceChopped') {
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.arc(-radius * 0.4, 0, radius * 0.55, 0, Math.PI * 2);
    ctx.arc(radius * 0.4, 0, radius * 0.55, 0, Math.PI * 2);
    ctx.arc(0, -radius * 0.3, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.moveTo(-radius, radius * 0.5);
    ctx.lineTo(radius, radius * 0.5);
    ctx.lineTo(radius, -radius * 0.4);
    ctx.lineTo(-radius, radius * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.arc(-radius * 0.3, radius * 0.1, radius * 0.12, 0, Math.PI * 2);
    ctx.arc(radius * 0.3, -radius * 0.05, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A thin progress bar, used for the grill, the board and the order timers. */
function progressBar(ctx, x, y, w, h, fraction, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, fraction)), h);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;

  function drawFloor() {
    for (let y = HUD_HEIGHT; y < VIEW_HEIGHT; y += TILE) {
      for (let x = 0; x < VIEW_WIDTH; x += TILE) {
        const light = ((x / TILE + y / TILE) % 2 === 0);
        ctx.fillStyle = light ? '#d8c49a' : '#cdb586';
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = HUD_HEIGHT; y < VIEW_HEIGHT; y += TILE) ctx.fillRect(0, y, VIEW_WIDTH, 2);
    for (let x = 0; x < VIEW_WIDTH; x += TILE) ctx.fillRect(x, HUD_HEIGHT, 2, VIEW_HEIGHT - HUD_HEIGHT);
  }

  function drawStation(station, state) {
    const { x, y, w, h } = station;
    ctx.fillStyle = '#8d6e4a';
    ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    ctx.fillStyle = station.kind === 'grill' ? '#5b5f66' : '#a9805a';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x, y, w, 10);
    ctx.fillStyle = '#fff8ec';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(station.label, x + w / 2, y + h - 8);
    if (station.kind === 'bin') {
      drawIngredient(ctx, station.ingredient, x + w / 2, y + h / 2 - 6, 26);
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = '#fff8ec';
      ctx.fillText('press E', x + w / 2, y + h / 2 + 30);
    }
    if (station.kind === 'grill') {
      ctx.fillStyle = '#2f3236';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2 - 8, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 34, y + h / 2 - 8 + i * 12);
        ctx.lineTo(x + w / 2 + 34, y + h / 2 - 8 + i * 12);
        ctx.stroke();
      }
      if (state.grill.item !== null) {
        drawIngredient(ctx, state.grill.burnt ? 'pattyBurnt' : 'pattyCooked', x + w / 2, y + h / 2 - 8, 24);
        const color = state.grill.burnt ? '#d94f3d' : state.grill.progress >= GRILL_COOK_SECONDS ? '#7fb069' : '#f2c94c';
        progressBar(ctx, x + 14, y + h - 26, w - 28, 8, state.grill.progress / GRILL_BURN_SECONDS, color);
      }
    }
    if (station.kind === 'board') {
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(x + 14, y + 12, w - 28, h - 44);
      if (state.board.item !== null) {
        drawIngredient(ctx, state.board.item, x + w / 2, y + h / 2 - 8, 26);
        progressBar(ctx, x + 14, y + h - 26, w - 28, 8, state.board.progress / CHOP_SECONDS, '#7fb069');
      } else {
        ctx.fillStyle = '#8d6e4a';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText('tomato / lettuce', x + w / 2, y + h / 2);
      }
    }
    if (station.kind === 'plate') {
      ctx.fillStyle = '#f4efe6';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2 - 6, 110, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9bda6';
      ctx.lineWidth = 3;
      ctx.stroke();
      state.plate.forEach((item, index) => {
        drawIngredient(ctx, item, x + w / 2 + (index - (state.plate.length - 1) / 2) * 44, y + h / 2 - 10 - index * 4, 20);
      });
      if (state.plate.length === 0) {
        ctx.fillStyle = '#8d6e4a';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText('build the dish here', x + w / 2, y + h / 2 - 2);
      }
    }
    if (station.kind === 'trash') {
      ctx.fillStyle = '#3f4a3f';
      ctx.fillRect(x + w / 2 - 34, y + 14, 68, h - 44);
      ctx.fillStyle = '#5a6b5a';
      ctx.fillRect(x + w / 2 - 40, y + 8, 80, 10);
    }
  }

  function drawOrderTicket(order, x) {
    const w = 250;
    const y = 8;
    const h = HUD_HEIGHT - 16;
    const urgent = order.patience < 15;
    ctx.fillStyle = urgent ? '#f6d7d2' : '#fff8ec';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = urgent ? '#d94f3d' : '#8d6e4a';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#3a2e22';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`#${order.number} ${order.recipe.name}`, x + 10, y + 24);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#6b5a44';
    ctx.fillText(`$${order.recipe.price}  ·  ${order.recipe.items.length} items`, x + 10, y + 44);
    order.recipe.items.forEach((item, index) => {
      drawIngredient(ctx, item, x + 24 + index * 34, y + 66, 13);
    });
    progressBar(ctx, x + 10, y + h - 12, w - 20, 6, order.patience / order.maxPatience, urgent ? '#d94f3d' : '#7fb069');
  }

  function drawHud(state, best) {
    ctx.fillStyle = '#3a2e22';
    ctx.fillRect(0, 0, VIEW_WIDTH, HUD_HEIGHT);
    ctx.fillStyle = '#f2c94c';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ORDER BOARD', 24, 24);
    state.orders.forEach((order, index) => drawOrderTicket(order, 24 + index * 262));
    const timerX = 830;
    ctx.fillStyle = '#fff8ec';
    ctx.font = 'bold 26px system-ui, sans-serif';
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = Math.floor(state.timeLeft % 60);
    ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, timerX, 40);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('SHIFT TIMER', timerX, 58);
    progressBar(ctx, timerX, 66, 150, 8, state.timeLeft / SHIFT_SECONDS, state.timeLeft < 30 ? '#d94f3d' : '#f2c94c');
    ctx.fillStyle = '#f2c94c';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(`🪙 ${state.coins}`, 1010, 40);
    ctx.fillStyle = '#fff8ec';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`served ${state.served}  ·  best ${Math.max(best, state.coins)}`, 1010, 58);
    ctx.fillStyle = '#c9bda6';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('WASD / arrows move · E use · P pause · click a station', VIEW_WIDTH - 16, HUD_HEIGHT - 8);
    ctx.textAlign = 'left';
  }

  function drawChef(state, clickTarget) {
    const player = state.player;
    if (clickTarget !== null) {
      ctx.strokeStyle = 'rgba(58,46,34,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(clickTarget.x, clickTarget.y, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 20, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a90d9';
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath();
    ctx.arc(player.x - 8, player.y - 4, 4, 0, Math.PI * 2);
    ctx.arc(player.x + 8, player.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y - 20, 18, 10, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(player.x - 18, player.y - 22, 36, 6);
    if (player.carry !== null) {
      ctx.fillStyle = 'rgba(255,248,236,0.95)';
      ctx.beginPath();
      ctx.arc(player.x, player.y - 44, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8d6e4a';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawIngredient(ctx, player.carry, player.x, player.y - 44, 15);
    }
  }

  function drawMessage(state) {
    if (state.messageTime <= 0) return;
    ctx.font = 'bold 17px system-ui, sans-serif';
    const width = ctx.measureText(state.message).width + 32;
    ctx.fillStyle = 'rgba(58,46,34,0.92)';
    ctx.fillRect((VIEW_WIDTH - width) / 2, VIEW_HEIGHT - 52, width, 36);
    ctx.fillStyle = '#fff8ec';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, VIEW_WIDTH / 2, VIEW_HEIGHT - 28);
    ctx.textAlign = 'left';
  }

  function overlay(title, lines) {
    ctx.fillStyle = 'rgba(30,22,16,0.72)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = '#fff8ec';
    ctx.textAlign = 'center';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.fillText(title, VIEW_WIDTH / 2, 220);
    ctx.font = '20px system-ui, sans-serif';
    lines.forEach((line, index) => ctx.fillText(line, VIEW_WIDTH / 2, 280 + index * 34));
    ctx.textAlign = 'left';
  }

  return {
    /** Paint the world on the current screen, with the best score for the HUD. */
    draw(state, screen, best, clickTarget = null) {
      ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      drawFloor();
      for (const station of STATIONS) drawStation(station, state);
      drawChef(state, clickTarget);
      drawHud(state, best);
      drawMessage(state);
      if (screen === SCREEN_TITLE) {
        overlay('SIZZLE & SERVE', [
          'Run the kitchen! Take orders from the board, grab ingredients,',
          'grill the patty, chop the veg, build the dish and serve it.',
          '',
          'WASD or arrows to move · E to use a station · click a station to walk to it',
          'Serve fast: orders walk out when their patience runs out.',
          '',
          'Press Enter to start the shift',
        ]);
      } else if (screen === SCREEN_PAUSED) {
        overlay('PAUSED', ['Take a breath, chef.', '', 'Press P to get back to the kitchen']);
      } else if (screen === SCREEN_OVER) {
        const stars = state.coins >= 120 ? '★★★' : state.coins >= 60 ? '★★' : state.coins >= 25 ? '★' : '—';
        overlay('SHIFT OVER!', [
          `You served ${state.served} dish${state.served === 1 ? '' : 'es'} and earned ${state.coins} coins ${stars}`,
          `${state.expired} order${state.expired === 1 ? '' : 's'} walked out. Best shift: ${Math.max(best, state.coins)} coins.`,
          '',
          'Press Enter to work another shift',
        ]);
      }
    },
  };
}
