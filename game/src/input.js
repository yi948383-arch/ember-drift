// Ember Drift — keyboard and mouse. One clear job: turn raw DOM events
// into a tidy state the game reads once per frame (held keys, aim point,
// clicks as one-frame edges). Nothing here knows about the game itself.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: canvas.width / 2, y: canvas.height / 2, down: false };
  const clicks = [];

  function keyName(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    return k;
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (!keys.has(k)) pressed.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(keyName(e)));
  window.addEventListener('blur', () => { keys.clear(); mouse.down = false; });

  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  }
  canvas.addEventListener('mousemove', (e) => {
    const p = toGame(e);
    mouse.x = p.x; mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = toGame(e);
    mouse.x = p.x; mouse.y = p.y; mouse.down = true;
    clicks.push({ x: p.x, y: p.y, button: e.button });
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    keys,
    mouse,
    isDown(...names) { return names.some((n) => keys.has(n)); },
    wasPressed(name) { return pressed.has(name); },
    takeClicks() { const c = clicks.splice(0, clicks.length); return c; },
    endFrame() { pressed.clear(); },
  };
}
