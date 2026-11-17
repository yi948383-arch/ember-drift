// Ember Drift — everything the eye sees. One clear job: draw the world,
// the HUD and every screen from the state world.js owns. No rules here.

import { VIEW, TOTAL_WAVES, PALETTE } from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = '700') {
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function drawBackground(ctx, w, time) {
  const g = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, 60, VIEW.w / 2, VIEW.h / 2, 620);
  g.addColorStop(0, PALETTE.bg1);
  g.addColorStop(1, PALETTE.bg0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  // Drifting stars.
  ctx.fillStyle = 'rgba(244, 240, 255, 0.5)';
  for (let i = 0; i < 70; i++) {
    const x = (i * 137.5) % VIEW.w;
    const y = (i * 89.3 + time * (6 + (i % 5))) % VIEW.h;
    const s = (i % 3) * 0.7 + 0.8;
    ctx.globalAlpha = 0.25 + ((i * 7) % 10) / 22;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
  // Faint grid.
  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= VIEW.w; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, VIEW.h); }
  for (let y = 0; y <= VIEW.h; y += 60) { ctx.moveTo(0, y); ctx.lineTo(VIEW.w, y); }
  ctx.stroke();
}

function drawPlayer(ctx, p, time) {
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.hurtTimer > 0 && Math.floor(time * 20) % 2 === 0) ctx.globalAlpha = 0.45;
  // Flame glow.
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
  glow.addColorStop(0, 'rgba(255, 154, 60, 0.55)');
  glow.addColorStop(1, 'rgba(255, 154, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.fill();
  // Dash trail.
  if (p.dashLeft > 0) {
    ctx.strokeStyle = 'rgba(77, 227, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-p.dashX * 34, -p.dashY * 34);
    ctx.lineTo(0, 0);
    ctx.stroke();
  }
  // Body: a little ember with a flickering flame tail.
  const flick = Math.sin(time * 11 + p.flicker) * 3;
  ctx.rotate(p.angle);
  ctx.fillStyle = PALETTE.flame;
  ctx.beginPath();
  ctx.moveTo(-p.radius - 6 - flick, 0);
  ctx.quadraticCurveTo(-p.radius - 14, -9, -p.radius - 4, 0);
  ctx.quadraticCurveTo(-p.radius - 14, 9, -p.radius - 6 - flick, 0);
  ctx.fill();
  ctx.fillStyle = PALETTE.ember;
  ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.emberCore;
  ctx.beginPath(); ctx.arc(3, -2, p.radius * 0.55, 0, Math.PI * 2); ctx.fill();
  // Aim tick.
  ctx.strokeStyle = PALETTE.white;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.radius + 4, 0);
  ctx.lineTo(p.radius + 12, 0);
  ctx.stroke();
  ctx.restore();
}

function drawEnemy(ctx, e, time) {
  ctx.save();
  ctx.translate(e.x, e.y);
  const spawnScale = e.spawnT > 0 ? 1 - e.spawnT / 0.35 : 1;
  ctx.scale(spawnScale, spawnScale);
  ctx.globalAlpha = e.spawnT > 0 ? 0.5 : 1;
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, e.radius + 16);
  glow.addColorStop(0, e.color + '66');
  glow.addColorStop(1, e.color + '00');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, e.radius + 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.color;
  if (e.kind === 'wisp') {
    ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(11, 7, 20, 0.85)';
    ctx.beginPath(); ctx.arc(-4, -2, 3, 0, Math.PI * 2); ctx.arc(5, -2, 3, 0, Math.PI * 2); ctx.fill();
  } else if (e.kind === 'darter') {
    ctx.rotate(e.angle);
    ctx.beginPath();
    ctx.moveTo(e.radius + 6, 0);
    ctx.lineTo(-e.radius, -e.radius * 0.8);
    ctx.lineTo(-e.radius * 0.4, 0);
    ctx.lineTo(-e.radius, e.radius * 0.8);
    ctx.closePath(); ctx.fill();
  } else if (e.kind === 'brute') {
    const rot = Math.sin(time * 1.5 + e.wobble) * 0.15;
    ctx.rotate(rot);
    rr(ctx, -e.radius, -e.radius, e.radius * 2, e.radius * 2, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(11, 7, 20, 0.6)';
    rr(ctx, -e.radius + 6, -e.radius + 6, e.radius * 2 - 12, e.radius * 2 - 12, 5);
    ctx.fill();
  } else {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + time * 0.8;
      const px = Math.cos(a) * e.radius, py = Math.sin(a) * e.radius;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(11, 7, 20, 0.85)';
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  }
  // HP bar for hurt enemies.
  if (e.hp < e.maxHp) {
    const bw = e.radius * 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(-bw / 2, -e.radius - 10, bw, 4);
    ctx.fillStyle = PALETTE.danger;
    ctx.fillRect(-bw / 2, -e.radius - 10, bw * Math.max(0, e.hp / e.maxHp), 4);
  }
  ctx.restore();
}

function drawHud(ctx, w) {
  const p = w.player;
  // Top bar.
  ctx.fillStyle = 'rgba(11, 7, 20, 0.55)';
  ctx.fillRect(0, 0, VIEW.w, 46);
  text(ctx, `WAVE ${Math.max(1, w.wave)} / ${TOTAL_WAVES}`, 16, 24, 17, PALETTE.white, 'left');
  text(ctx, `SCORE ${w.score}`, VIEW.w / 2, 24, 19, PALETTE.spark);
  text(ctx, `✦ ${w.sparks}`, VIEW.w - 16, 24, 17, PALETTE.spark, 'right');
  // HP bar.
  const bw = 180, bx = 16, by = 56;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  rr(ctx, bx, by, bw, 14, 7); ctx.fill();
  ctx.fillStyle = p.hp / p.maxHp > 0.35 ? PALETTE.ember : PALETTE.danger;
  rr(ctx, bx, by, bw * Math.max(0, p.hp / p.maxHp), 14, 7); ctx.fill();
  text(ctx, `${Math.ceil(p.hp)} / ${p.maxHp}`, bx + bw + 10, by + 7, 13, PALETTE.dim, 'left');
  // Dash cooldown.
  const dReady = p.dashTimer <= 0;
  text(ctx, dReady ? 'DASH READY [SPACE]' : `DASH ${p.dashTimer.toFixed(1)}s`, VIEW.w - 16, 63, 13, dReady ? PALETTE.cyan : PALETTE.faint, 'right');
  // Combo.
  if (w.combo >= 3) {
    const mult = (1 + Math.min(9, w.combo - 1) * 0.1).toFixed(1);
    text(ctx, `COMBO x${w.combo}  ·  ${mult}x SCORE`, VIEW.w / 2, 76, 16, PALETTE.pink);
  }
  // Wave banner.
  if (w.bannerTimer > 0) {
    ctx.globalAlpha = Math.min(1, w.bannerTimer);
    text(ctx, w.banner, VIEW.w / 2, 150, 44, PALETTE.white);
    ctx.globalAlpha = 1;
  }
  // Wave progress: enemies left.
  const left = w.enemies.length + w.spawnQueue.length;
  if (w.waveActive) text(ctx, `${left} shadows remain`, VIEW.w / 2, 108, 14, PALETTE.dim);
}

function drawTitle(ctx, w) {
  ctx.fillStyle = 'rgba(11, 7, 20, 0.62)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, 'EMBER DRIFT', VIEW.w / 2, 150, 64, PALETTE.ember);
  text(ctx, 'a little light against the dark', VIEW.w / 2, 196, 18, PALETTE.dim, 'center', '400');
  text(ctx, 'Survive 10 waves. Gather sparks. Choose your upgrades.', VIEW.w / 2, 248, 17, PALETTE.white, 'center', '400');
  text(ctx, 'WASD / Arrows — move      Mouse — aim      Hold click — fire', VIEW.w / 2, 292, 15, PALETTE.dim, 'center', '400');
  text(ctx, 'SPACE — dash through danger      P — pause      M — mute', VIEW.w / 2, 320, 15, PALETTE.dim, 'center', '400');
  // Start button.
  ctx.fillStyle = PALETTE.ember;
  rr(ctx, VIEW.w / 2 - 130, 368, 260, 56, 12); ctx.fill();
  text(ctx, '▶  START DRIFTING', VIEW.w / 2, 397, 21, '#1a0e02');
  const best = Number(window.localStorage.getItem('ember-drift-best') || 0);
  if (best > 0) text(ctx, `Best score: ${best}`, VIEW.w / 2, 460, 15, PALETTE.spark, 'center', '400');
  text(ctx, '10 waves · 4 shadow kinds · 10 upgrades · one little ember', VIEW.w / 2, 500, 14, PALETTE.faint, 'center', '400');
}

function drawUpgrade(ctx, w) {
  ctx.fillStyle = 'rgba(11, 7, 20, 0.72)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, `WAVE ${w.wave} CLEARED`, VIEW.w / 2, 96, 34, PALETTE.spark);
  text(ctx, 'Choose one upgrade — press 1, 2 or 3, or click a card', VIEW.w / 2, 134, 16, PALETTE.dim, 'center', '400');
  w.choices.forEach((u, i) => {
    const x = 110 + i * 260, y = 180, cw = 230, ch = 210;
    ctx.fillStyle = PALETTE.panel;
    rr(ctx, x, y, cw, ch, 14); ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 2;
    rr(ctx, x, y, cw, ch, 14); ctx.stroke();
    text(ctx, u.icon, x + cw / 2, y + 52, 44, PALETTE.ember);
    text(ctx, u.name, x + cw / 2, y + 108, 18, PALETTE.white);
    text(ctx, `[${i + 1}]`, x + cw / 2, y + 140, 13, PALETTE.faint, 'center', '400');
    ctx.save();
    ctx.font = '400 14px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = PALETTE.dim;
    ctx.textAlign = 'center';
    wrapText(ctx, u.desc, x + cw / 2, y + 168, cw - 28, 19);
    ctx.restore();
  });
  text(ctx, `Score ${w.score}   ·   Sparks ${w.sparks}   ·   Next: wave ${w.wave + 1}`, VIEW.w / 2, 452, 16, PALETTE.white, 'center', '400');
}

function wrapText(ctx, s, x, y, maxW, lh) {
  const words = s.split(' ');
  let line = '', yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word; yy += lh;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
}

function drawEnd(ctx, w, victory) {
  ctx.fillStyle = 'rgba(11, 7, 20, 0.78)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const stats = w.victoryStats || { score: w.score, sparks: w.sparks, kills: w.kills, bestCombo: w.bestCombo, time: w.playTime };
  text(ctx, victory ? 'THE DARK RECEDES' : 'THE EMBER FADES', VIEW.w / 2, 130, 46, victory ? PALETTE.spark : PALETTE.danger);
  text(ctx, victory ? 'You cleared all 10 waves. The drift is yours.' : `You fell on wave ${Math.max(1, w.wave)}. The ember will try again.`, VIEW.w / 2, 180, 17, PALETTE.dim, 'center', '400');
  const rows = [
    ['FINAL SCORE', `${stats.score}`],
    ['Sparks gathered', `${stats.sparks}`],
    ['Shadows banished', `${stats.kills}`],
    ['Best combo', `x${stats.bestCombo}`],
    ['Time drifting', fmtTime(stats.time)],
  ];
  rows.forEach(([k, v], i) => {
    const y = 240 + i * 34;
    text(ctx, k, VIEW.w / 2 - 130, y, 16, PALETTE.dim, 'left', '400');
    text(ctx, v, VIEW.w / 2 + 130, y, 16, PALETTE.white, 'right');
  });
  const best = Number(window.localStorage.getItem('ember-drift-best') || 0);
  if (stats.score > best) {
    window.localStorage.setItem('ember-drift-best', String(stats.score));
    text(ctx, '★ NEW BEST SCORE ★', VIEW.w / 2, 424, 18, PALETTE.spark);
  } else if (best > 0) {
    text(ctx, `Best score: ${best}`, VIEW.w / 2, 424, 15, PALETTE.faint, 'center', '400');
  }
  ctx.fillStyle = PALETTE.ember;
  rr(ctx, VIEW.w / 2 - 130, 452, 260, 56, 12); ctx.fill();
  text(ctx, '↻  DRIFT AGAIN  [R]', VIEW.w / 2, 481, 20, '#1a0e02');
}

function fmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function render(ctx, w) {
  ctx.save();
  if (w.shake > 0) ctx.translate((Math.random() - 0.5) * w.shake, (Math.random() - 0.5) * w.shake);
  drawBackground(ctx, w, w.time);
  if (w.state === 'title') { drawTitle(ctx, w); ctx.restore(); return; }
  // Sparks, bullets, enemies, player, particles, floating text.
  for (const s of w.sparkList) {
    const blink = s.life < 2 ? (Math.sin(w.time * 14) > 0 ? 1 : 0.35) : 1;
    ctx.globalAlpha = blink;
    ctx.fillStyle = PALETTE.spark;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(w.time * 2 + s.x);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = PALETTE.emberCore;
  for (const b of w.bullets) {
    ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#b7ff5e';
  for (const b of w.enemyBullets) {
    ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
  }
  for (const e of w.enemies) drawEnemy(ctx, e, w.time);
  if (w.state !== 'gameover' && w.state !== 'victory') drawPlayer(ctx, w.player, w.time);
  for (const pt of w.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
  for (const t of w.texts) {
    ctx.globalAlpha = Math.max(0, t.life);
    text(ctx, t.text, t.x, t.y, 16, t.color);
  }
  ctx.globalAlpha = 1;
  drawHud(ctx, w);
  if (w.state === 'upgrade') drawUpgrade(ctx, w);
  if (w.state === 'paused') {
    ctx.fillStyle = 'rgba(11, 7, 20, 0.66)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    text(ctx, 'PAUSED', VIEW.w / 2, 260, 44, PALETTE.white);
    text(ctx, 'P / Esc — resume      R — restart', VIEW.w / 2, 312, 16, PALETTE.dim, 'center', '400');
  }
  if (w.state === 'victory') drawEnd(ctx, w, true);
  if (w.state === 'gameover') drawEnd(ctx, w, false);
  ctx.restore();
}
