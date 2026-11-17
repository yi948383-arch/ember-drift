// Ember Drift — the things that move. One clear job: factories and tiny
// updates for the player, bullets, enemies, sparks and particles. Rules
// (waves, damage, scoring) live in world.js, not here.

import { ENEMIES, VIEW } from './config.js';

export function makePlayer(x, y, base) {
  return {
    x, y, vx: 0, vy: 0, radius: base.radius,
    angle: -Math.PI / 2,
    hp: base.hp, maxHp: base.hp,
    speed: base.speed,
    fireInterval: base.fireInterval,
    bulletSpeed: base.bulletSpeed,
    bulletDamage: base.bulletDamage,
    bulletRadius: base.bulletRadius,
    dashCooldown: base.dashCooldown,
    magnet: base.magnet,
    sparkValue: base.sparkValue,
    shots: 1, pierce: 0, armor: 0,
    fireTimer: 0, dashTimer: 0, dashLeft: 0, dashX: 0, dashY: 0,
    hurtTimer: 0, flicker: 0,
  };
}

export function makeBullet(x, y, angle, p) {
  return {
    x, y, angle,
    vx: Math.cos(angle) * p.bulletSpeed,
    vy: Math.sin(angle) * p.bulletSpeed,
    radius: p.bulletRadius, damage: p.bulletDamage,
    pierce: p.pierce, life: 1.1, hitSet: new Set(),
  };
}

export function updateBullet(b, dt) {
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.life -= dt;
  return b.life > 0 && b.x > -20 && b.x < VIEW.w + 20 && b.y > -20 && b.y < VIEW.h + 20;
}

export function makeEnemy(kind, x, y, wave, rng) {
  const def = ENEMIES[kind];
  const hpScale = 1 + (wave - 1) * 0.16;
  const speedScale = 1 + (wave - 1) * 0.03;
  return {
    kind, x, y, radius: def.radius,
    hp: def.hp * hpScale, maxHp: def.hp * hpScale,
    speed: def.speed * speedScale * rng.range(0.9, 1.1),
    damage: def.damage, score: def.score, sparks: def.sparks,
    color: def.color, name: def.name,
    angle: 0, wobble: rng.range(0, Math.PI * 2),
    shootTimer: rng.range(1.2, 2.2), lungeTimer: rng.range(1.5, 3),
    flash: 0, spawnT: 0.35,
  };
}

// Steer one enemy for a frame. Returns a bullet object when a spitter fires.
export function updateEnemy(e, p, dt, rng, time) {
  e.flash = Math.max(0, e.flash - dt);
  e.spawnT = Math.max(0, e.spawnT - dt);
  if (e.spawnT > 0) return null;
  const dx = p.x - e.x, dy = p.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const nx = dx / d, ny = dy / d;
  e.angle = Math.atan2(dy, dx);
  if (e.kind === 'wisp') {
    const w = Math.sin(time * 2.2 + e.wobble) * 0.6;
    e.x += (nx + -ny * w) * e.speed * dt;
    e.y += (ny + nx * w) * e.speed * dt;
  } else if (e.kind === 'darter') {
    e.lungeTimer -= dt;
    if (e.lungeTimer <= 0) { e.lungeTimer = 1.6 + rng.next() * 1.2; e.lunge = 0.45; }
    const boost = (e.lunge || 0) > 0 ? 2.4 : 1;
    if (e.lunge) e.lunge -= dt;
    e.x += nx * e.speed * boost * dt;
    e.y += ny * e.speed * boost * dt;
  } else if (e.kind === 'brute') {
    e.x += nx * e.speed * dt;
    e.y += ny * e.speed * dt;
  } else if (e.kind === 'spitter') {
    // Keep some distance, strafe, and spit a slow orb.
    const want = 240;
    const toward = d > want + 30 ? 1 : d < want - 30 ? -0.7 : 0;
    const strafe = Math.sin(time * 1.4 + e.wobble);
    e.x += (nx * toward + -ny * strafe * 0.5) * e.speed * dt;
    e.y += (ny * toward + nx * strafe * 0.5) * e.speed * dt;
    e.shootTimer -= dt;
    if (e.shootTimer <= 0 && d < 460) {
      e.shootTimer = 2.4 + rng.next();
      return {
        x: e.x, y: e.y, angle: e.angle,
        vx: nx * 170, vy: ny * 170,
        radius: 7, damage: e.damage, pierce: 0, life: 4,
        hitSet: new Set(), enemy: true,
      };
    }
  }
  return null;
}

export function makeSpark(x, y, value, rng) {
  const a = rng.angle();
  const sp = rng.range(40, 130);
  return {
    x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
    value, radius: 6, life: 9, t: 0,
  };
}

export function updateSpark(s, p, dt) {
  s.t += dt;
  s.life -= dt;
  const dx = p.x - s.x, dy = p.y - s.y;
  const d = Math.hypot(dx, dy) || 1;
  if (d < p.magnet) {
    const pull = 900 * (1 - d / (p.magnet + 60));
    s.vx += (dx / d) * pull * dt;
    s.vy += (dy / d) * pull * dt;
  } else {
    s.vx *= (1 - 2.2 * dt);
    s.vy *= (1 - 2.2 * dt);
  }
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  return s.life > 0;
}

export function makeParticle(x, y, color, count, speed, life, size) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = speed * (0.3 + Math.random() * 0.7);
    parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      color, life: life * (0.5 + Math.random() * 0.5), maxLife: life,
      size: size * (0.6 + Math.random() * 0.8),
    });
  }
  return parts;
}

export function updateParticles(parts, dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const pt = parts[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= (1 - 2.5 * dt);
    pt.vy *= (1 - 2.5 * dt);
    pt.life -= dt;
    if (pt.life <= 0) parts.splice(i, 1);
  }
}
