#!/usr/bin/env node
// Keeps the hand-written pages in public/ consistent. No dependencies.
//
//   node scripts/build.mjs          rewrite public/ in place
//   node scripts/build.mjs --check  exit 1 if anything is out of date (CI)
//
// 1. Partials: everything between <!-- partial:NAME --> and <!-- /partial:NAME --> is replaced
//    with partials/NAME.html. {{year}} becomes the current year, and any link in the partial whose
//    href is the page's own route gets aria-current="page".
// 2. Journal: the list between <!-- generated:journal-list --> markers on /journal/ and
//    public/journal/feed.xml are built from the posts in public/journal/<slug>/index.html.
// 3. public/sitemap.xml lists every page with a canonical URL and no noindex.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PUB = path.join(ROOT, 'public');
const SITE = 'https://slip3studios.com';
const check = process.argv.includes('--check');
const stale = [];

const read = (p) => fs.readFileSync(p, 'utf8');
function write(p, text) {
  if (fs.existsSync(p) && read(p) === text) return;
  stale.push(path.relative(ROOT, p));
  if (!check) fs.writeFileSync(p, text);
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith('.html') ? [p] : [];
  });
}
const routeOf = (file) => '/' + path.relative(PUB, file).replace(/index\.html$/, '').replace(/\\/g, '/');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const meta = (html, attr, key) => {
  const m = html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`));
  return m ? unesc(m[1]) : '';
};

const partials = Object.fromEntries(
  fs.readdirSync(path.join(ROOT, 'partials')).map((f) => [f.replace(/\.html$/, ''), read(path.join(ROOT, 'partials', f)).trimEnd()])
);
const year = String(new Date().getFullYear());

function renderPartial(name, route) {
  let out = partials[name].replaceAll('{{year}}', year);
  out = out.replace(/<a href="([^"]+)"/g, (m, href) => (href === route ? `<a href="${href}" aria-current="page"` : m));
  return out;
}

// --- journal ---
const journalDir = path.join(PUB, 'journal');
const posts = fs.existsSync(journalDir)
  ? fs.readdirSync(journalDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(journalDir, e.name, 'index.html')))
      .map((e) => {
        const html = read(path.join(journalDir, e.name, 'index.html'));
        return {
          url: `/journal/${e.name}/`,
          title: meta(html, 'property', 'og:title'),
          description: meta(html, 'name', 'description'),
          date: meta(html, 'property', 'article:published_time'),
          tag: meta(html, 'property', 'article:section'),
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)))
  : [];
const fmtDate = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const journalList = posts
  .map((p) => `  <li><a href="${p.url}"><span class="j-meta"><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${esc(p.tag)}</span><span class="j-title">${esc(p.title)}</span><span class="j-desc">${esc(p.description)}</span></a></li>`)
  .join('\n');

// --- pages ---
const sitemap = [];
for (const file of walk(PUB).sort()) {
  const route = routeOf(file);
  let html = read(file);
  html = html.replace(/<!-- partial:([\w-]+) -->[\s\S]*?<!-- \/partial:\1 -->/g, (m, name) => {
    if (!partials[name]) throw new Error(`${route}: unknown partial "${name}"`);
    return `<!-- partial:${name} -->\n${renderPartial(name, route)}\n<!-- /partial:${name} -->`;
  });
  html = html.replace(/<!-- generated:journal-list -->[\s\S]*?<!-- \/generated:journal-list -->/, () =>
    `<!-- generated:journal-list -->\n${journalList}\n<!-- /generated:journal-list -->`);
  write(file, html);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (canonical && !/<meta name="robots" content="[^"]*noindex/.test(html)) sitemap.push(canonical[1]);
}

write(path.join(PUB, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [...new Set(sitemap)].sort().map((u) => `  <url><loc>${u}</loc></url>`).join('\n') + `\n</urlset>\n`);

if (posts.length) {
  const rfc822 = (d) => new Date(d + 'T12:00:00Z').toUTCString();
  write(path.join(journalDir, 'feed.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n` +
    `  <title>Slip3 Studios Journal</title>\n  <link>${SITE}/journal/</link>\n` +
    `  <atom:link href="${SITE}/journal/feed.xml" rel="self" type="application/rss+xml"/>\n` +
    `  <description>Build notes and release stories from Slip3 Studios.</description>\n  <language>en-us</language>\n` +
    `  <lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>\n` +
    posts.map((p) => `  <item>\n    <title>${esc(p.title)}</title>\n    <link>${SITE}${p.url}</link>\n    <guid>${SITE}${p.url}</guid>\n    <pubDate>${rfc822(p.date)}</pubDate>\n    <category>${esc(p.tag)}</category>\n    <description>${esc(p.description)}</description>\n  </item>`).join('\n') +
    `\n</channel>\n</rss>\n`);
}

if (check && stale.length) {
  console.error('Out of date (run `node scripts/build.mjs`):\n  ' + stale.join('\n  '));
  process.exit(1);
}
console.log(check ? 'build: up to date' : stale.length ? `build: updated ${stale.length} file(s)` : 'build: nothing to change');
