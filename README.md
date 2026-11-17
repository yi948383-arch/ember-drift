# Ember Drift

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/yi948383-arch/ember-drift/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/yi948383-arch/ember-drift/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Built for [make.fun's Build the best game bounty](https://make.fun/bounty/best-game-01) — $1,000 in USDC.

A little light against the dark. A neon arena survival game: pilot an
ember spirit through 10 waves of shadow wisps, darters, brutes and
spitters, gather sparks, and choose one of three upgrades between waves.
Clear wave 10 to win.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static server). No build step, no network request at run time.

- **WASD / Arrows** — move
- **Mouse** — aim, **hold click** — fire
- **SPACE** — dash through danger (brief invulnerability)
- **P** — pause, **M** — mute, **R** — restart
- Between waves: pick 1 of 3 upgrades with keys **1 / 2 / 3** or a click

## What is in the game

- 4 enemy kinds with different behaviour: chasing wisps, lunging darters,
  tanky brutes, ranged spitters
- 10 escalating waves, 10 upgrades (fire rate, damage, multishot, pierce,
  speed, dash, health, magnet, spark value, armour)
- Combo multiplier, spark pickups with magnet pull, screen shake,
  particles, floating text
- Synthesized sound effects (WebAudio, no audio files): shots, hits,
  explosions, pickups, dash, wave horns, victory and game-over themes
- Title, upgrade, pause, victory and game-over screens; best score kept
  in local storage

## Files

- `game/index.html` — the page, canvas and HUD shell
- `game/src/config.js` — tuning, palette, waves, upgrades
- `game/src/random.js` — seeded randomness
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized sound effects
- `game/src/entities.js` — player, enemies, bullets, sparks, particles
- `game/src/world.js` — rules: state machine, waves, collisions, scoring
- `game/src/render.js` — everything the eye sees
- `game/src/shots.js` — fixed poses for the screenshots
- `game/src/main.js` — the loop and the wiring
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json`
