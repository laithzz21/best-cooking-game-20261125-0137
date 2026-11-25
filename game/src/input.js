// Keyboard and mouse input: WASD or arrows to run, E or Space to use the
// station in front of the chef, P to pause, Enter to start again. Clicking a
// station walks the chef toward it and uses it on arrival; clicking the floor
// just walks there. The loop reads a fresh snapshot every frame.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';

const MOVE_KEYS = {
  ArrowUp: { dx: 0, dy: -1 },
  KeyW: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  KeyS: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  KeyA: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  KeyD: { dx: 1, dy: 0 },
};

export function createInput(canvas) {
  const held = new Set();
  let interactQueued = false;
  let pauseQueued = false;
  let clickTarget = null;

  function onKeyDown(event) {
    if (event.repeat) return;
    if (MOVE_KEYS[event.code] !== undefined) {
      held.add(event.code);
      clickTarget = null;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE' || event.code === 'Space' || event.code === 'Enter') {
      interactQueued = true;
      event.preventDefault();
    }
    if (event.code === 'KeyP' || event.code === 'Escape') pauseQueued = true;
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    clickTarget = { x, y };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    /** This frame's movement, interact press and pause press; clicks steer. */
    snapshot(player) {
      let dx = 0;
      let dy = 0;
      for (const code of held) {
        dx += MOVE_KEYS[code].dx;
        dy += MOVE_KEYS[code].dy;
      }
      let target = null;
      if ((dx !== 0 || dy !== 0) === false && clickTarget !== null) {
        const toX = clickTarget.x - player.x;
        const toY = clickTarget.y - player.y;
        const distance = Math.hypot(toX, toY);
        if (distance < 14) {
          clickTarget = null;
        } else {
          dx = toX / distance;
          dy = toY / distance;
          target = clickTarget;
        }
      }
      const out = { dx, dy, interact: interactQueued, pause: pauseQueued, clickTarget: target };
      interactQueued = false;
      pauseQueued = false;
      return out;
    },
    /** The point the player last clicked, for the renderer to show. */
    get clickTarget() {
      return clickTarget;
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
    },
  };
}
