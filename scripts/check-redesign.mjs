#!/usr/bin/env node
// Fails if the built site drifts from the 2026 redesign invariants.
// No dependencies. Run from the repo root: node scripts/check-redesign.mjs

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PUB = path.join(ROOT, 'public');
const errors = [];
const fail = (msg) => errors.push(msg);

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p, ext);
    return p.endsWith(ext) ? [p] : [];
  });
}
const read = (p) => fs.readFileSync(p, 'utf8');
const rel = (p) => path.relative(ROOT, p);

const htmlFiles = walk(PUB, '.html');
const trees = {
  youth: [PUB, path.join(ROOT, 'press'), path.join(ROOT, 'partials'), path.join(ROOT, 'og-src')],
  phrase: [PUB, path.join(ROOT, 'og-src'), path.join(ROOT, 'partials'), path.join(ROOT, 'press'), path.join(ROOT, 'scripts'), path.join(ROOT, 'README.md'), path.join(ROOT, 'CLAUDE.md')],
};

function filesIn(entries, exts) {
  const out = [];
  for (const entry of entries) {
    if (!fs.existsSync(entry)) continue;
    const st = fs.statSync(entry);
    if (st.isFile()) out.push(entry);
    else out.push(...walk(entry, '').filter((f) => exts.some((ext) => f.endsWith(ext))));
  }
  return out;
}
// walk with ext '' returns nothing useful; list all text files directly.
function listText(entry) {
  if (!fs.existsSync(entry)) return [];
  const st = fs.statSync(entry);
  if (st.isFile()) return [entry];
  return fs.readdirSync(entry, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(entry, e.name);
    if (e.name === 'node_modules' || e.name === '.git') return [];
    return e.isDirectory() ? listText(p) : [p];
  });
}

const textExt = /\.(html|css|js|mjs|json|txt|md|webmanifest|xml|svg)$/;
for (const file of trees.youth.flatMap(listText).filter((f) => textExt.test(f))) {
  if (/\byouth\b/i.test(read(file))) fail(`youth in ${rel(file)}`);
}
for (const file of trees.phrase.flatMap(listText).filter((f) => textExt.test(f))) {
  if (/one\s+studio|every\s+detail/i.test(read(file))) fail(`removed phrase in ${rel(file)}`);
}

const bannedHex = /#(?:ff5a1f|bf3f0e|e8501a|0e0d0c)\b/i;
const fontBan = new RegExp(['Brico', 'lage'].join('') + '|fonts\\.' + 'googleapis|fonts\\.' + 'gstatic', 'i');
const previewHost = ['slip3-site', 'vercel.app'].join('.');
for (const file of [PUB, path.join(ROOT, 'partials'), path.join(ROOT, 'og-src'), path.join(ROOT, 'press'), path.join(ROOT, 'scripts')].flatMap(listText).filter((f) => textExt.test(f))) {
  const text = read(file);
  if (bannedHex.test(text)) fail(`banned color in ${rel(file)}`);
  if (fontBan.test(text)) fail(`third-party or retired font in ${rel(file)}`);
}
for (const file of listText(ROOT).filter((f) => textExt.test(f) && !f.includes(`${path.sep}mark-explorations`))) {
  if (!read(file).includes(previewHost)) continue;
  if (path.resolve(file) !== path.join(PUB, 'vercel.json')) fail(`preview host outside vercel.json: ${rel(file)}`);
}

for (const file of htmlFiles) {
  const html = read(file);
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  if (!noindex) {
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/);
    if (!canonical || !canonical[1].startsWith('https://slip3studios.com')) fail(`canonical ${rel(file)}`);
    if (!ogUrl || ogUrl[1] !== canonical[1]) fail(`og:url ${rel(file)}`);
    const image = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (!image || !/^https:\/\/slip3studios\.com\/og\/[a-z0-9-]+-v2\.png$/.test(image[1])) fail(`og:image ${rel(file)}`);
    if (!/<meta property="og:image:width" content="1200">/.test(html) || !/<meta property="og:image:height" content="630">/.test(html)) fail(`og size ${rel(file)}`);
  }
  for (const m of html.matchAll(/<(section|ul)\b[^>]*class="[^"]*\b(?:follow|social)\b[^"]*"[^>]*>/g)) {
    if (!/\shidden\b/.test(m[0]) && !m[0].endsWith('hidden>')) fail(`social or follow not hidden in ${rel(file)}: ${m[0].slice(0, 140)}`);
  }
}

const home = read(path.join(PUB, 'index.html'));
const main = home.slice(home.indexOf('<main'), home.indexOf('</main>'));
const sections = [...main.matchAll(/<section\b([^>]*)>/g)].map((m) => m[1]);
const expect = [/spotlight/, /id="work"/, /id="studio"/, /proof/, /journal-home/, /follow/];
if (sections.length < expect.length) fail(`home has ${sections.length} sections`);
expect.forEach((re, i) => {
  if (!sections[i] || !re.test(sections[i])) fail(`home section ${i} is not ${re}`);
});
if (!/hidden/.test(sections[5] || '')) fail('follow section is not hidden');
if (!home.includes('>How we build<') || !home.includes('By the numbers') || !home.includes('Learn more')) fail('home headings or Learn more missing');
const visibleBands = ['spotlight', 'work', 'studio', 'proof', 'journal', 'foot'];
let prevNavy = false;
for (const name of visibleBands) {
  const chunk = name === 'foot' ? home.slice(home.indexOf('<footer')) : sections.find((s) => s.includes(name)) || '';
  const navy = /band-navy/.test(chunk);
  if (navy && prevNavy) fail(`two navy bands touch around ${name}`);
  prevNavy = navy;
}

for (const route of ['plonk', 'formation-lab', 'starting-5', 'the-fold']) {
  const html = read(path.join(PUB, route, 'index.html'));
  const heroAt = html.indexOf('case-hero');
  const heroEnd = html.indexOf('</section>', heroAt);
  const next = html.slice(heroEnd).match(/<section\b[\s\S]*?<\/section>/);
  if (!next || !next[0].includes('class="gallery"')) fail(`${route} gallery is not the first section after the case hero`);
}
const plonk = read(path.join(PUB, 'plonk', 'index.html'));
if (/<video\b/i.test(plonk) || /\ssrc="[^"]*\.mp4/.test(plonk)) fail('Plonk references the trailer mp4 before the click control');
if (!plonk.includes('data-src="/media/plonk-preview-444.mp4"')) fail('Plonk trailer control is missing data-src');
if (/<(?:iframe|embed|object)\b[^>]*(?:youtube\.com|youtu\.be|ytimg\.com|vimeo\.com)/i.test(plonk)) fail('third-party video on Plonk');
if (/(?:src|poster)="[^"]*(?:youtube\.com|youtu\.be|ytimg\.com|vimeo\.com)/i.test(plonk)) fail('third-party video on Plonk');

function element(tag) {
  return {
    tag,
    attrs: {},
    children: [],
    parent: null,
    listeners: {},
    className: '',
    textContent: '',
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    appendChild(child) { child.parent = this; this.children.push(child); return child; },
    replaceWith(node) {
      const p = this.parent;
      const i = p.children.indexOf(this);
      p.children.splice(i, 1, node);
      node.parent = p;
    },
    addEventListener(type, fn) { (this.listeners[type] || (this.listeners[type] = [])).push(fn); },
    querySelector(sel) { return queryAll(this, sel)[0] || null; },
    querySelectorAll(sel) { return queryAll(this, sel); },
  };
}
function matches(el, sel) {
  if (sel.startsWith('.')) return (el.attrs.class || '').split(/\s+/).includes(sel.slice(1));
  if (sel.startsWith('[')) return el.getAttribute(sel.slice(1, -1)) != null;
  return el.tag === sel;
}
function queryAll(root, sel) {
  const out = [];
  (function walk(node) {
    for (const child of node.children || []) {
      if (child.tag && matches(child, sel)) out.push(child);
      walk(child);
    }
  })(root);
  return out;
}
function videosUnder(root) {
  return queryAll(root, 'video');
}

const trailerBtn = element('button');
trailerBtn.setAttribute('class', 'trailer-lite');
trailerBtn.setAttribute('data-src', '/media/plonk-preview-444.mp4');
trailerBtn.setAttribute('data-poster', '/media/plonk-preview-poster-444.webp');
const doc = element('document');
doc.appendChild(trailerBtn);
const themeBtn = element('button');
themeBtn.setAttribute('class', 'theme');
doc.appendChild(themeBtn);
const store = new Map();
const context = {
  console,
  document: {
    documentElement: { dataset: {} },
    createElement: (tag) => element(tag),
    createElementNS: () => element('svg'),
    querySelector: (sel) => queryAll(doc, sel)[0] || null,
    querySelectorAll: (sel) => queryAll(doc, sel),
  },
  matchMedia: () => ({ matches: false }),
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  },
  performance: { now: () => 0 },
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

for (const script of ['public/theme.js', 'public/demos.js']) {
  const source = read(path.join(ROOT, script));
  if (/\brequire\s*\(|module\.exports|\bimport\s+/.test(source)) fail(`${script} is not a browser script`);
  try { vm.runInContext(source, context, { filename: script }); }
  catch (err) { fail(`${script} threw ${err.message}`); }
}
if (typeof context.s3ToggleTheme !== 'function') fail('theme.js did not install s3ToggleTheme');
if (typeof context.s3ActivateTrailer !== 'function') fail('demos.js did not install s3ActivateTrailer');
context.s3ToggleTheme();
if (store.get('s3-theme') !== 'dark' || context.document.documentElement.dataset.theme !== 'dark') fail('theme toggle did not persist s3-theme');
if (!themeBtn.listeners.click || !themeBtn.listeners.click.length) fail('theme button has no click handler');
if (videosUnder(doc).length !== 0) fail('trailer video exists before activation');
const click = trailerBtn.listeners.click && trailerBtn.listeners.click[0];
if (typeof click !== 'function') fail('trailer button has no click handler');
click({ currentTarget: trailerBtn });
const videos = videosUnder(doc);
if (videos.length !== 1) fail(`expected one trailer video after click, found ${videos.length}`);
else if (videos[0].getAttribute('src') !== '/media/plonk-preview-444.mp4') fail(`trailer src is ${videos[0].getAttribute('src')}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`redesign: invariants hold (${htmlFiles.length} pages)`);
