// Ember Drift — the loop and the wiring. One clear job: run the game at a
// fixed step, hand clicks and keys to the right screen, and draw each frame.

import { VIEW } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, startGame, updateWorld, applyChoice } from './world.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.w;
canvas.height = VIEW.h;
const ctx = canvas.getContext('2d');

const audio = createAudio();
const input = createInput(canvas);
const world = createWorld(20261117, audio);
world.audio = audio;
window.__ember = world; // debug handle: lets a playtest read the live state

const seedBase = (Date.now() % 2147483647) || 1;
let shotMode = false;

function inRect(c, x, y, w, h) {
  return c.x >= x && c.x <= x + w && c.y >= y && c.y <= y + h;
}

function handleClicks() {
  for (const c of input.takeClicks()) {
    audio.unlock();
    if (world.state === 'title') {
      if (inRect(c, VIEW.w / 2 - 130, 368, 260, 56)) {
        audio.click();
        startGame(world, seedBase);
      }
    } else if (world.state === 'upgrade') {
      world.choices.forEach((u, i) => {
        if (inRect(c, 110 + i * 260, 180, 230, 210)) applyChoice(world, i);
      });
    } else if (world.state === 'victory' || world.state === 'gameover') {
      if (inRect(c, VIEW.w / 2 - 130, 452, 260, 56)) {
        audio.click();
        startGame(world, (seedBase + 7) % 2147483647);
      }
    }
  }
}

function handleKeys() {
  if (input.wasPressed('m')) {
    const muted = audio.toggleMute();
    document.getElementById('mute').textContent = muted ? '🔇 muted' : '🔊 sound on';
  }
  if (input.wasPressed('p') || input.wasPressed('escape')) {
    if (world.state === 'playing') { world.state = 'paused'; audio.click(); }
    else if (world.state === 'paused') { world.state = 'playing'; audio.click(); }
  }
  if (input.wasPressed('r')) {
    if (world.state === 'playing' || world.state === 'paused' || world.state === 'victory' || world.state === 'gameover') {
      startGame(world, (seedBase + 13) % 2147483647);
    }
  }
  if (input.wasPressed('enter') || input.wasPressed(' ')) {
    if (world.state === 'title') startGame(world, seedBase);
  }
  if (world.state === 'upgrade') {
    if (input.wasPressed('1')) applyChoice(world, 0);
    if (input.wasPressed('2')) applyChoice(world, 1);
    if (input.wasPressed('3')) applyChoice(world, 2);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotMode) {
    handleKeys();
    handleClicks();
    updateWorld(world, input, dt);
  }
  render(ctx, world);
  input.endFrame();
  requestAnimationFrame(frame);
}

shotMode = applyShot(world, input);
if (shotMode) {
  // In shot mode the world is already posed; draw one settled frame,
  // then keep drawing so particles and flicker settle naturally.
  updateWorld(world, input, 0.016);
  render(ctx, world);
  window.__shotReady = true;
}
requestAnimationFrame(frame);
