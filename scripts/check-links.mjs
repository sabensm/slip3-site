#!/usr/bin/env node
// Checks every internal link, image, video, srcset entry and #fragment in public/*.html.
// Absolute URLs on https://slip3studios.com are checked as internal paths. No dependencies.
//   node scripts/check-links.mjs

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PUB = path.join(ROOT, 'public');
const SITE = 'https://slip3studios.com';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith('.html') ? [p] : [];
  });
}
function resolveFile(urlPath) {
  const p = decodeURIComponent(urlPath);
  const candidates = p.endsWith('/') ? [p + 'index.html'] : [p, p + '.html', p + '/index.html'];
  for (const c of candidates) {
    const f = path.join(PUB, c);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
}
const ids = new Map();
function idsOf(file) {
  if (!ids.has(file)) ids.set(file, new Set([...fs.readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
}

const errors = [];
for (const file of walk(PUB)) {
  const html = fs.readFileSync(file, 'utf8');
  const route = '/' + path.relative(PUB, file).replace(/index\.html$/, '');
  const refs = [];
  for (const m of html.matchAll(/\s(?:href|src|poster)="([^"]+)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/g)) for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  for (const m of html.matchAll(/<meta (?:property|name)="(?:og:image|twitter:image|og:url)" content="([^"]+)"/g)) refs.push(m[1]);
  for (let ref of refs) {
    if (/^(mailto:|tel:|data:|javascript:)/.test(ref)) continue;
    if (ref.startsWith(SITE)) ref = ref.slice(SITE.length) || '/';
    if (/^[a-z]+:\/\//i.test(ref) || ref.startsWith('//')) continue;
    if (ref.startsWith('/_vercel/')) continue; // injected by Vercel at deploy time
    const [pathPart, frag] = ref.split('#');
    const target = pathPart === '' ? file : resolveFile(pathPart.startsWith('/') ? pathPart.split('?')[0] : path.posix.join(route, pathPart.split('?')[0]));
    if (!target) { errors.push(`${route}: missing ${ref}`); continue; }
    if (frag && frag !== 'top' && target.endsWith('.html') && !idsOf(target).has(frag)) errors.push(`${route}: no #${frag} in ${ref}`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`links: all internal references resolve (${walk(PUB).length} pages)`);
