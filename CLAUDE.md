# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Hand-written static site for Slip3 Studios (an independent app studio) plus Mike Sabens' personal page. No build step, no package manager, no tests, no linter. Deployed on Vercel with `public/` as the deploy root.

Preview locally by serving `public/` with any static server (`.claude/launch.json` defines this as `site` for the browser pane), e.g.:

```bash
python3 -m http.server 8000 -d public
```

Note that Vercel-only behavior in `public/vercel.json` (`cleanUrls`, `trailingSlash`, the `/contact` → `/about/` redirect, `/img/*` immutable caching) won't apply under a plain static server.

## Layout

- `public/` — everything that ships. Each route is a directory with an `index.html` (`/`, `/about/`, `/plonk/`, `/plonk/privacy/`, `/plonk/terms/`, `/mike/`). `/contact/` is a stub that redirects to `/about/` (also redirected in `vercel.json`).
- `public/img/` — optimized `.webp` assets used by pages. Served with a one-year immutable cache, so **rename a file rather than overwrite it** when an image changes.
- `public/og/` — 1200×630 Open Graph PNGs referenced by each page's `og:image`.
- `raw/` — original JPG/PNG sources for the webp images. Not deployed.
- `og-src/` — standalone HTML layouts (fixed 1200×630 body) rendered to `public/og/*.png` with `scripts/render-og.swift` (usage in its header comment). They reference images via `../public/img/`.
- `public/` root also holds `robots.txt`, `sitemap.xml` (add new routes here), `404.html` (served by Vercel for unknown paths), `manifest.webmanifest`, and the PNG icons (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) rendered from `favicon.svg` without its rounded corners.

Every indexable page carries an absolute `canonical`, `og:url`, and `og:image` on `https://slip3studios.com` (relative OG URLs break link previews). `vercel.json` redirects the `slip3-site.vercel.app` host to that domain.

## Two separate design systems

1. **Studio pages** (`/`, `/about/`, `/plonk/**`) share `public/studio.css` and `public/theme.js`. Each page repeats the same head boilerplate: Bricolage Grotesque from Google Fonts, `/studio.css`, and an inline script that applies the saved `s3-theme` from `localStorage` to `<html data-theme>` before paint; `/theme.js` (deferred, at the end of body) wires the `.theme` toggle button. The header (`.top` with the `.mark` "slip3" wordmark and nav) and footer are duplicated in every page — update all of them when nav/footer changes.
2. **`/mike/`** is self-contained: its own `mike.css`, fonts (Instrument Serif + JetBrains Mono), favicon, and palette. It follows system dark mode only (no toggle, no `theme.js`).

### Theming convention (studio.css)

Colors are CSS custom properties on `:root` (`--bg`, `--ink`, `--muted`, `--line`, `--card`, `--accent` = `#ff5a1f`). Dark values are defined twice and must stay in sync: under `@media (prefers-color-scheme:dark){:root:not([data-theme=light])}` and under `:root[data-theme=dark]`. The `<meta name="theme-color">` tags in each page mirror `--bg` (`#f3efe6` light / `#0e0d0c` dark).

The brand motif is the tilted, offset orange "3" (`--tilt:-10deg`, `.mark .three`); "slipped" elements elsewhere (e.g. `h1 .slip`, the About portrait's back plane) reuse `--accent` to match it.

## Conventions

- Commit subjects are one plain imperative sentence (e.g. "Add the Plonk product page"), often with a short body saying what changed and what was deliberately left alone.
- Products are listed in several places: the homepage (meta description, hero lede, fan, ticker, work section), the `/mike/` project list, the `og-src/` cards, and the README. Keep them consistent when adding or renaming one.
