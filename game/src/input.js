// input.js — keyboard and mouse, in one place.
// WASD or arrows move the chef. E or Space interacts with the nearest station.
// Clicking the floor sets a walk target; clicking a station walks over and
// interacts when close. M toggles the music, P pauses, Enter starts.

export function makeInput() {
  return {
    left: false, right: false, up: false, down: false,
    interactHeld: false,
    interactPressed: false,   // set on keydown / click, consumed by the loop
    startPressed: false,
    pausePressed: false,
    mutePressed: false,
    click: null,              // { x, y } in canvas space, consumed by the loop
    mouse: { x: 0, y: 0 },
  };
}

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
};

export function bindInput(canvas, input) {
  const down = (event) => {
    if (event.repeat) return;
    const dir = KEYMAP[event.code];
    if (dir) { input[dir] = true; event.preventDefault(); return; }
    if (event.code === 'KeyE' || event.code === 'Space') {
      input.interactHeld = true;
      input.interactPressed = true;
      event.preventDefault();
    }
    if (event.code === 'Enter') input.startPressed = true;
    if (event.code === 'KeyP') input.pausePressed = true;
    if (event.code === 'KeyM') input.mutePressed = true;
  };
  const up = (event) => {
    const dir = KEYMAP[event.code];
    if (dir) { input[dir] = false; return; }
    if (event.code === 'KeyE' || event.code === 'Space') input.interactHeld = false;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);

  const toCanvas = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };
  canvas.addEventListener('pointerdown', (event) => {
    const point = toCanvas(event);
    input.mouse = point;
    input.click = point;
    input.interactPressed = true;
  });
  canvas.addEventListener('pointermove', (event) => {
    input.mouse = toCanvas(event);
  });
  // Keep the page from scrolling when the game has the keys.
  window.addEventListener('blur', () => {
    input.left = input.right = input.up = input.down = false;
    input.interactHeld = false;
  });
}
