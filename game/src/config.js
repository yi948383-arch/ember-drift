// Ember Drift — tuning, palette, waves and upgrades. One clear job: every
// number the game plays by lives here, so balancing never touches logic.

export const VIEW = { w: 960, h: 600 };
export const TOTAL_WAVES = 10;

export const PALETTE = {
  bg0: '#0b0714',
  bg1: '#171029',
  grid: 'rgba(148, 120, 255, 0.07)',
  ember: '#ff9a3c',
  emberCore: '#ffd166',
  flame: '#ff5d3b',
  spark: '#ffd166',
  cyan: '#4de3ff',
  violet: '#b388ff',
  pink: '#ff6b9d',
  green: '#7dff9e',
  white: '#f4f0ff',
  dim: 'rgba(244, 240, 255, 0.62)',
  faint: 'rgba(244, 240, 255, 0.34)',
  danger: '#ff4d6d',
  panel: 'rgba(16, 10, 32, 0.88)',
  panelEdge: 'rgba(255, 154, 60, 0.45)',
};

export const PLAYER = {
  radius: 14,
  speed: 265,
  hp: 100,
  fireInterval: 0.22,
  bulletSpeed: 560,
  bulletDamage: 12,
  bulletRadius: 5,
  dashSpeed: 720,
  dashTime: 0.16,
  dashCooldown: 1.6,
  magnet: 90,
  sparkValue: 1,
};

// Enemy kinds: hp scales with wave, speed and behaviour differ per kind.
export const ENEMIES = {
  wisp:   { radius: 13, hp: 18,  speed: 78,  damage: 8,  score: 10, sparks: 2, color: '#b388ff', name: 'Wisp' },
  darter: { radius: 10, hp: 12,  speed: 165, damage: 8,  score: 15, sparks: 2, color: '#4de3ff', name: 'Darter' },
  brute:  { radius: 22, hp: 70,  speed: 42,  damage: 18, score: 30, sparks: 5, color: '#ff6b9d', name: 'Brute' },
  spitter:{ radius: 12, hp: 22,  speed: 60,  damage: 8,  score: 20, sparks: 3, color: '#7dff9e', name: 'Spitter' },
};

// Each wave: how many of each kind spawn, and how fast they trickle in.
export const WAVES = [
  { wisp: 6,  darter: 0,  brute: 0, spitter: 0, interval: 1.1 },
  { wisp: 9,  darter: 3,  brute: 0, spitter: 0, interval: 1.0 },
  { wisp: 10, darter: 6,  brute: 1, spitter: 0, interval: 0.9 },
  { wisp: 12, darter: 8,  brute: 1, spitter: 3, interval: 0.85 },
  { wisp: 14, darter: 10, brute: 2, spitter: 4, interval: 0.8 },
  { wisp: 16, darter: 12, brute: 3, spitter: 5, interval: 0.75 },
  { wisp: 18, darter: 14, brute: 3, spitter: 7, interval: 0.7 },
  { wisp: 20, darter: 16, brute: 4, spitter: 8, interval: 0.65 },
  { wisp: 22, darter: 18, brute: 5, spitter: 10, interval: 0.6 },
  { wisp: 24, darter: 20, brute: 6, spitter: 12, interval: 0.55 },
];

// Between waves the player picks one of three. Each upgrade is a small,
// named change so the choice reads at a glance and matters next wave.
export const UPGRADES = [
  { id: 'rapid',    name: 'Rapid Cinders',   icon: '»', desc: 'Fire 18% faster.', apply: (p) => { p.fireInterval *= 0.82; } },
  { id: 'heavy',    name: 'Heavy Embers',    icon: '◆', desc: '+35% bullet damage.', apply: (p) => { p.bulletDamage *= 1.35; } },
  { id: 'twin',     name: 'Twin Flames',     icon: '✦', desc: '+1 bullet per shot.', apply: (p) => { p.shots += 1; } },
  { id: 'pierce',   name: 'Piercing Light',  icon: '→', desc: 'Bullets pass through +1 enemy.', apply: (p) => { p.pierce += 1; } },
  { id: 'swift',    name: 'Swift Drift',     icon: '≫', desc: '+12% move speed.', apply: (p) => { p.speed *= 1.12; } },
  { id: 'dash',     name: 'Blink Dash',      icon: '↯', desc: 'Dash recharges 35% faster.', apply: (p) => { p.dashCooldown *= 0.65; } },
  { id: 'heart',    name: 'Kindled Heart',   icon: '♥', desc: '+25 max HP and heal 25.', apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
  { id: 'magnet',   name: 'Spark Magnet',    icon: '◎', desc: 'Sparks fly to you from 70% further.', apply: (p) => { p.magnet *= 1.7; } },
  { id: 'rich',     name: 'Golden Sparks',   icon: '✧', desc: 'Every spark is worth +1.', apply: (p) => { p.sparkValue += 1; } },
  { id: 'guard',    name: 'Ember Guard',     icon: '⛨', desc: 'Take 15% less damage.', apply: (p) => { p.armor = Math.min(0.6, (p.armor || 0) + 0.15); } },
];

export const COMBO_WINDOW = 2.5;
export const SPARK_LIFE = 9;
