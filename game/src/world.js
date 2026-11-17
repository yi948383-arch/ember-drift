// Ember Drift — the rules. One clear job: the game state machine, waves,
// spawning, collisions, pickups, combos, upgrades and win/lose. Drawing
// lives in render.js; this file only decides what happens.

import { VIEW, TOTAL_WAVES, PLAYER, WAVES, UPGRADES, COMBO_WINDOW } from './config.js';
import { makeRng, clamp } from './random.js';
import { makePlayer, makeBullet, updateBullet, makeEnemy, updateEnemy, makeSpark, updateSpark, makeParticle, updateParticles } from './entities.js';

export function createWorld(seed, audio) {
  const rng = makeRng(seed);
  const w = {
    state: 'title', // title | playing | upgrade | paused | victory | gameover
    time: 0, wave: 0, score: 0, sparks: 0, kills: 0,
    combo: 0, comboTimer: 0, bestCombo: 0,
    player: makePlayer(VIEW.w / 2, VIEW.h / 2, PLAYER),
    bullets: [], enemies: [], enemyBullets: [], sparkList: [], particles: [], texts: [],
    spawnQueue: [], spawnTimer: 0, waveActive: false,
    banner: '', bannerTimer: 0,
    choices: [], choiceSeed: 0,
    shake: 0, playTime: 0, victoryStats: null,
    audio, rng,
  };
  return w;
}

export function startGame(w, seed) {
  w.rng = makeRng(seed);
  w.state = 'playing';
  w.time = 0; w.wave = 0; w.score = 0; w.sparks = 0; w.kills = 0;
  w.combo = 0; w.comboTimer = 0; w.bestCombo = 0;
  w.player = makePlayer(VIEW.w / 2, VIEW.h / 2, PLAYER);
  w.bullets = []; w.enemies = []; w.enemyBullets = [];
  w.sparkList = []; w.particles = []; w.texts = [];
  w.spawnQueue = []; w.waveActive = false;
  w.playTime = 0; w.victoryStats = null;
  w.audio.unlock();
  nextWave(w);
}

function nextWave(w) {
  w.wave += 1;
  const def = WAVES[w.wave - 1];
  w.spawnQueue = [];
  for (const kind of ['wisp', 'darter', 'brute', 'spitter']) {
    for (let i = 0; i < (def[kind] || 0); i++) w.spawnQueue.push(kind);
  }
  // Shuffle the queue so the wave never arrives in kind order.
  for (let i = w.spawnQueue.length - 1; i > 0; i--) {
    const j = Math.floor(w.rng.next() * (i + 1));
    [w.spawnQueue[i], w.spawnQueue[j]] = [w.spawnQueue[j], w.spawnQueue[i]];
  }
  w.spawnTimer = 0.6;
  w.waveActive = true;
  w.banner = `WAVE ${w.wave} / ${TOTAL_WAVES}`;
  w.bannerTimer = 2.2;
  w.audio.wave();
}

function rollChoices(w) {
  const pool = [...UPGRADES];
  w.choices = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(w.rng.next() * pool.length);
    w.choices.push(pool.splice(idx, 1)[0]);
  }
}

export function applyChoice(w, idx) {
  const u = w.choices[idx];
  if (!u) return;
  u.apply(w.player);
  w.audio.upgrade();
  addText(w, w.player.x, w.player.y - 30, u.name, '#ffd166');
  if (w.wave >= TOTAL_WAVES) { winGame(w); return; }
  w.state = 'playing';
  nextWave(w);
}

function winGame(w) {
  w.state = 'victory';
  w.victoryStats = {
    score: w.score, sparks: w.sparks, kills: w.kills,
    bestCombo: w.bestCombo, time: w.playTime,
  };
  w.audio.victory();
  burst(w, w.player.x, w.player.y, '#ffd166', 60, 320, 1.2);
}

function loseGame(w) {
  w.state = 'gameover';
  w.audio.gameover();
  burst(w, w.player.x, w.player.y, '#ff5d3b', 50, 300, 1.1);
}

function burst(w, x, y, color, count, speed, life) {
  w.particles.push(...makeParticle(x, y, color, count, speed, life, 3));
}

function addText(w, x, y, text, color) {
  w.texts.push({ x, y, text, color, life: 1.1 });
}

function spawnEnemy(w) {
  const kind = w.spawnQueue.shift();
  const edge = Math.floor(w.rng.next() * 4);
  const m = 30;
  let x, y;
  if (edge === 0) { x = w.rng.range(0, VIEW.w); y = -m; }
  else if (edge === 1) { x = w.rng.range(0, VIEW.w); y = VIEW.h + m; }
  else if (edge === 2) { x = -m; y = w.rng.range(0, VIEW.h); }
  else { x = VIEW.w + m; y = w.rng.range(0, VIEW.h); }
  w.enemies.push(makeEnemy(kind, x, y, w.wave, w.rng));
}

function damagePlayer(w, dmg) {
  const p = w.player;
  if (p.dashLeft > 0 || p.hurtTimer > 0) return;
  const real = Math.round(dmg * (1 - (p.armor || 0)));
  p.hp -= real;
  p.hurtTimer = 0.9;
  w.shake = 10;
  w.combo = 0; w.comboTimer = 0;
  w.audio.hurt();
  burst(w, p.x, p.y, '#ff4d6d', 14, 200, 0.6);
  if (p.hp <= 0) { p.hp = 0; loseGame(w); }
}

function killEnemy(w, e) {
  w.kills += 1;
  w.combo += 1;
  w.comboTimer = COMBO_WINDOW;
  w.bestCombo = Math.max(w.bestCombo, w.combo);
  const mult = 1 + Math.min(9, w.combo - 1) * 0.1;
  w.score += Math.round(e.score * mult);
  for (let i = 0; i < e.sparks; i++) {
    w.sparkList.push(makeSpark(e.x, e.y, w.player.sparkValue, w.rng));
  }
  burst(w, e.x, e.y, e.color, 18, 240, 0.7);
  w.audio.explode();
  w.shake = Math.max(w.shake, 4);
}

export function updateWorld(w, input, dt) {
  w.time += dt;
  if (w.state === 'playing') w.playTime += dt;
  w.bannerTimer = Math.max(0, w.bannerTimer - dt);
  w.shake = Math.max(0, w.shake - dt * 30);
  updateParticles(w.particles, dt);
  for (let i = w.texts.length - 1; i >= 0; i--) {
    const t = w.texts[i];
    t.y -= 30 * dt; t.life -= dt;
    if (t.life <= 0) w.texts.splice(i, 1);
  }
  if (w.state !== 'playing') return;

  const p = w.player;
  p.hurtTimer = Math.max(0, p.hurtTimer - dt);
  p.flicker += dt;
  p.fireTimer -= dt;
  p.dashTimer = Math.max(0, p.dashTimer - dt);
  if (w.comboTimer > 0) {
    w.comboTimer -= dt;
    if (w.comboTimer <= 0) w.combo = 0;
  }

  // --- movement and dash ---
  let mx = (input.isDown('d', 'arrowright') ? 1 : 0) - (input.isDown('a', 'arrowleft') ? 1 : 0);
  let my = (input.isDown('s', 'arrowdown') ? 1 : 0) - (input.isDown('w', 'arrowup') ? 1 : 0);
  const mlen = Math.hypot(mx, my) || 1;
  mx /= mlen; my /= mlen;
  if (input.wasPressed(' ') && p.dashTimer <= 0 && (mx || my)) {
    p.dashLeft = PLAYER.dashTime;
    p.dashX = mx; p.dashY = my;
    p.dashTimer = p.dashCooldown;
    w.audio.dash();
    burst(w, p.x, p.y, '#4de3ff', 10, 160, 0.4);
  }
  if (p.dashLeft > 0) {
    p.dashLeft -= dt;
    p.x += p.dashX * PLAYER.dashSpeed * dt;
    p.y += p.dashY * PLAYER.dashSpeed * dt;
  } else {
    p.x += mx * p.speed * dt;
    p.y += my * p.speed * dt;
  }
  p.x = clamp(p.x, p.radius + 4, VIEW.w - p.radius - 4);
  p.y = clamp(p.y, p.radius + 4, VIEW.h - p.radius - 4);
  p.angle = Math.atan2(input.mouse.y - p.y, input.mouse.x - p.x);

  // --- shooting ---
  if (input.mouse.down && p.fireTimer <= 0) {
    p.fireTimer = p.fireInterval;
    const spread = 0.14;
    for (let i = 0; i < p.shots; i++) {
      const off = (i - (p.shots - 1) / 2) * spread;
      w.bullets.push(makeBullet(
        p.x + Math.cos(p.angle) * (p.radius + 6),
        p.y + Math.sin(p.angle) * (p.radius + 6),
        p.angle + off, p,
      ));
    }
    w.audio.shoot();
    burst(w, p.x + Math.cos(p.angle) * 20, p.y + Math.sin(p.angle) * 20, '#ff9a3c', 2, 80, 0.25);
  }

  // --- spawning ---
  if (w.waveActive) {
    w.spawnTimer -= dt;
    if (w.spawnQueue.length > 0 && w.spawnTimer <= 0) {
      spawnEnemy(w);
      w.spawnTimer = WAVES[w.wave - 1].interval;
    }
    if (w.spawnQueue.length === 0 && w.enemies.length === 0) {
      w.waveActive = false;
      if (w.wave >= TOTAL_WAVES) { winGame(w); return; }
      rollChoices(w);
      w.state = 'upgrade';
      w.audio.upgrade();
    }
  }

  // --- enemies ---
  for (const e of w.enemies) {
    const shot = updateEnemy(e, p, dt, w.rng, w.time);
    if (shot) w.enemyBullets.push(shot);
  }

  // --- bullets ---
  for (let i = w.bullets.length - 1; i >= 0; i--) {
    const b = w.bullets[i];
    if (!updateBullet(b, dt)) { w.bullets.splice(i, 1); continue; }
    for (let j = w.enemies.length - 1; j >= 0; j--) {
      const e = w.enemies[j];
      if (e.spawnT > 0 || b.hitSet.has(e)) continue;
      const rr = b.radius + e.radius;
      if ((b.x - e.x) ** 2 + (b.y - e.y) ** 2 < rr * rr) {
        b.hitSet.add(e);
        e.hp -= b.damage;
        e.flash = 0.12;
        w.audio.hit();
        burst(w, b.x, b.y, '#ffd166', 4, 120, 0.3);
        if (e.hp <= 0) {
          killEnemy(w, e);
          w.enemies.splice(j, 1);
        }
        if (b.pierce > 0) { b.pierce -= 1; } else { w.bullets.splice(i, 1); }
        break;
      }
    }
  }

  // --- enemy bullets and contact damage ---
  for (let i = w.enemyBullets.length - 1; i >= 0; i--) {
    const b = w.enemyBullets[i];
    if (!updateBullet(b, dt)) { w.enemyBullets.splice(i, 1); continue; }
    const rr = b.radius + p.radius;
    if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < rr * rr) {
      damagePlayer(w, b.damage);
      w.enemyBullets.splice(i, 1);
    }
  }
  for (const e of w.enemies) {
    if (e.spawnT > 0) continue;
    const rr = e.radius + p.radius - 2;
    if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < rr * rr) {
      damagePlayer(w, e.damage);
      // Push the enemy back so one touch is not a chain of hits.
      const dx = e.x - p.x, dy = e.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      e.x = p.x + (dx / d) * (rr + 6);
      e.y = p.y + (dy / d) * (rr + 6);
    }
  }

  // --- sparks ---
  for (let i = w.sparkList.length - 1; i >= 0; i--) {
    const s = w.sparkList[i];
    if (!updateSpark(s, p, dt)) { w.sparkList.splice(i, 1); continue; }
    const rr = s.radius + p.radius + 4;
    if ((s.x - p.x) ** 2 + (s.y - p.y) ** 2 < rr * rr) {
      w.sparks += s.value;
      w.score += s.value * 2;
      w.audio.pickup(Math.min(8, w.combo));
      w.sparkList.splice(i, 1);
    }
  }
}
