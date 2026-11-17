// Ember Drift — screenshot mode. One clear job: given ?shot=start|play|
// upgrade|end and a seed, put the world into a fixed, lively pose so a
// screenshot shows the game at its best, the same way every run. Real
// players never see this file's states except through normal play.

import { VIEW, UPGRADES } from './config.js';
import { makeEnemy, makeSpark, makeParticle } from './entities.js';
import { startGame, applyChoice } from './world.js';

export function applyShot(w, input) {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  const seed = Number(q.get('seed') || 1);
  if (!shot) return false;

  if (shot === 'start') {
    w.state = 'title';
    window.__shotReady = true;
    return true;
  }

  startGame(w, seed * 7919 + 13);
  const p = w.player;
  if (shot === 'play') {
    // Mid-wave-3 fight: a spread of enemies, bullets in flight, sparks.
    w.wave = 3;
    w.score = 1240;
    w.sparks = 87;
    w.combo = 5;
    w.comboTimer = 2;
    w.time = 24.5;
    p.x = 430; p.y = 320;
    p.angle = -0.5;
    const spots = [
      ['wisp', 640, 180], ['wisp', 700, 330], ['darter', 580, 430],
      ['brute', 760, 250], ['spitter', 220, 180], ['wisp', 300, 420],
      ['darter', 520, 140], ['wisp', 180, 300],
    ];
    for (const [kind, x, y] of spots) {
      const e = makeEnemy(kind, x, y, 3, w.rng);
      e.spawnT = 0;
      w.enemies.push(e);
    }
    for (let i = 0; i < 4; i++) {
      w.bullets.push({ x: 480 + i * 34, y: 300 - i * 12, angle: -0.5, vx: 300, vy: -160, radius: 5, damage: 12, pierce: 0, life: 1, hitSet: new Set() });
    }
    for (let i = 0; i < 6; i++) w.sparkList.push(makeSpark(380 + i * 26, 380 + (i % 3) * 22, 1, w.rng));
    w.particles.push(...makeParticle(640, 180, '#b388ff', 12, 160, 0.8, 3));
    w.banner = '';
    w.bannerTimer = 0;
    w.spawnQueue = ['wisp', 'darter', 'wisp'];
    window.__shotReady = true;
    return true;
  }

  if (shot === 'upgrade') {
    w.wave = 4;
    w.score = 2310;
    w.sparks = 142;
    w.kills = 41;
    w.state = 'upgrade';
    w.banner = '';
    w.bannerTimer = 0;
    w.waveActive = false;
    // Roll the same three choices the real game would offer after wave 4.
    const pool = [...UPGRADES];
    w.choices = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(w.rng.next() * pool.length);
      w.choices.push(pool.splice(idx, 1)[0]);
    }
    window.__shotReady = true;
    return true;
  }

  if (shot === 'end') {
    w.wave = 10;
    w.score = 9840;
    w.sparks = 486;
    w.kills = 173;
    w.bestCombo = 14;
    w.playTime = 542;
    w.state = 'victory';
    w.banner = '';
    w.bannerTimer = 0;
    w.waveActive = false;
    w.enemies = [];
    w.bullets = [];
    w.sparkList = [];
    w.victoryStats = { score: 9840, sparks: 486, kills: 173, bestCombo: 14, time: 542 };
    window.__shotReady = true;
    return true;
  }

  return false;
}
