#!/usr/bin/env node
// Builds the responsive .webp files in public/img/ from the sources in raw/. Needs `cwebp`
// (brew install webp). Outputs are named <source>-<width>.webp; existing outputs are left alone,
// because /img/ is served with a one-year immutable cache: if a source changes, give it a new name.
//
//   node scripts/images.mjs           build missing outputs
//   node scripts/images.mjs --force   rebuild every output (only for files not yet deployed)

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const force = process.argv.includes('--force');

// [source glob prefix in raw/, widths, quality]
const JOBS = [
  ['plonk-0', [540, 1080], 82],   // Plonk store frames (App Store art, iPhone 6.3")
  ['fl-store-', [540, 1080], 82], // Formation Lab store frames (store-v2)
  ['s5-store-', [540, 1080], 82], // Starting 5 store frames (store-v2, leather)
  ['plonk-home', [603], 86],      // Plonk home screen, rendered from the game at 1.5x
  ['plonk-icon', [256], 88],
];

const raws = fs.readdirSync(path.join(ROOT, 'raw')).filter((f) => /\.(png|jpe?g)$/i.test(f));
let made = 0;
for (const [prefix, widths, q] of JOBS) {
  for (const f of raws.filter((r) => r.startsWith(prefix))) {
    const base = f.replace(/\.[^.]+$/, '');
    for (const w of widths) {
      const out = path.join(ROOT, 'public/img', `${base}-${w}.webp`);
      if (!force && fs.existsSync(out)) continue;
      execFileSync('cwebp', ['-quiet', '-q', String(q), '-m', '6', '-resize', String(w), '0', path.join(ROOT, 'raw', f), '-o', out]);
      made++;
    }
  }
}
console.log(`images: built ${made} file(s)`);
