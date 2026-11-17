// Ember Drift — best-game-01 entry (Node 22, standard library only).
// The game is plain static files under game/: index.html plus ES modules,
// no build step, no network request at run time. This program hands it in:
// it copies game/ and screenshots/ from beside this file to /output and
// writes /output/dossier.json with the vendored make.fun library, so the
// judge can read the game, its screenshots and its source outline.
//
// Play it locally with any static server, e.g. `python3 -m http.server`
// from game/, then open http://localhost:8000.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Caps from the scorer's gate: at most 4 screenshots, each at most 256 KiB;
// at most 993 files and 48 MiB under game/; dossier text at most 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
