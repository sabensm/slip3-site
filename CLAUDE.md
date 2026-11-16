# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Hand-written static site for Slip3 Studios, an independent app studio. Deployed on Vercel with `public/` as the deploy root and no build step on Vercel: everything in `public/` is committed, including the output of the scripts below. No package.json; scripts are plain Node (no dependencies).

```bash
node scripts/build.mjs          # sync partials, journal list, RSS feed, sitemap into public/
node scripts/build.mjs --check  # CI: fail if public/ is out of date
node scripts/check-links.mjs    # every internal href/src/srcset/#fragment resolves
npx --yes html-validate@11.21.1 "public/**/*.html"   # needs Node 22+
python3 -m http.server 8000 -d public                 # local preview (`site` in .claude/launch.json)
```

**After editing any page, partial or journal post, run `node scripts/build.mjs`.** CI (`.github/workflows/site.yml`) runs the check mode, the link checker, html-validate and Lighthouse with budgets in `lighthouserc.json`.

Vercel-only behavior in `public/vercel.json` (cleanUrls, trailing slashes, the preview-host redirect, immutable caching for `/img/`, `/fonts/`, `/media/`) won't apply under a plain static server. Vercel Web Analytics is loaded only on the `slip3studios.com` host.

## How pages are put together

- **Partials** (`partials/head.html`, `header.html`, `footer.html`) are copied into every studio page between `<!-- partial:NAME -->` / `<!-- /partial:NAME -->` markers by `build.mjs`. Edit the partial, never the copy in a page. The build sets `aria-current="page"` on partial links matching the page's route and fills `{{year}}`. Page-specific head tags (title, description, canonical, OG, JSON-LD, preloads) sit above the head partial.
- **New page:** copy an existing one (e.g. `public/press/index.html`), keep the markers empty, give it an absolute `canonical`/`og:url`/`og:image` on `https://slip3studios.com`, then run the build. The sitemap picks it up from its canonical (pages with `noindex` are skipped).
- **Journal posts** live in `public/journal/<slug>/index.html`. The build reads `og:title`, `description`, `article:published_time` and `article:section` from each post to generate the list between `<!-- generated:journal-list -->` markers (on `/` and `/journal/`) and `public/journal/feed.xml`.
- **`/about/`** covers the studio and its founder (there is no separate personal page). **`/contact/`** is the single contact page for every Slip3 game: support, privacy requests and press, all at slip3studios@gmail.com. Each game keeps its own privacy and terms pages (e.g. `/plonk/privacy/`); Formation Lab and The Starting 5 have their own sites and support pages, linked from `/contact/`. `public/404.html` is Vercel's not-found page.

## Design system (studio.css)

The palette is navy `#1c2430`, cream `#f3efe6`, sea-glass `#8ec8c8` and amber `#e39b2b`, plus the derived tints in `public/studio.css`. Light cream is the default. Dark navy follows `prefers-color-scheme` and the header theme toggle. Dark token values are written twice and must stay in sync: under `@media (prefers-color-scheme:dark){:root:not([data-theme=light])}` and under `:root[data-theme=dark]`. `theme.js` toggles `data-theme` and stores it as `s3-theme` in localStorage. `<meta name="theme-color">` in the head partial is cream in light mode and navy in dark mode.

The mark is the horizontal lockup: three-bar icon, "Slip", and a sea-glass "3" whose SVG outline is already dropped and tilted. `.mark .three` is the only element with `view-transition-name: slip-three`. A hover may add a little more drop and tilt; it must not redraw the resting outline. Amber is the small buoy (eyebrows, counters), used sparingly. The only webfont is the self-hosted Space Grotesk Latin subset in `public/fonts/` (license in `public/fonts/LICENSES.md` and `OFL-SpaceGrotesk.txt`).

Homepage lineup tiles use `.g-fl`, `.g-plonk`, `.g-s5` and `.g-fold` for the icon well only. App pages use a cream case hero and a navy closing panel.

Buttons are only for actions: `.btn` for the main way to play an app, `.btn.ghost` for the second. App Store links use Apple's official badge (`.store-badge` with `/img/app-store-badge-black.svg`, from toolbox.marketingtools.apple.com); don't recolor, crop or add text to it. Journal, privacy, terms and support are plain text links.

The About page bio paragraphs are locked copy; don't reword them.

## Demos

`public/demos.js` powers the interactive pieces, each started from a `data-demo` element: `play` (Formation Lab SVG play animation), `quiz` (Starting 5 shot-clock sample; the questions are real NBA facts, keep them verifiable). A right quiz answer is a sea-glass fill with navy text; a wrong answer is a navy outline and a strike. Plonk has no browser demo on purpose: it didn't match the iPhone game, so the Plonk page shows a self-hosted click-to-play trailer (poster only until the button is activated) and store screenshots.

## Images and media

- `raw/` holds sources (not deployed). `node scripts/images.mjs` makes `public/img/<source>-<width>.webp` for the sources listed in its `JOBS` table (needs `cwebp`). `/img/` is cached immutably for a year, so **give a changed image a new filename instead of overwriting it.** Older single-size images (`fl-shot1.webp`, icons) predate the script.
- Latest store art lives outside the repo in `~/App Resources/<App>/screenshots/` (Plonk: `iphone-6.3`; Formation Lab: `store-v2/iphone61`; Starting 5: `store-v2/leather/iphone61`). Copy into `raw/` as JPG, then run the image script.
- `public/media/` holds the web-encoded Plonk trailer (ffmpeg, 444px wide, no audio) and its poster.
- OG cards: `og-src/*.html` layouts rendered at 1200×630 to `public/og/*-v2.png` (WebKit via `scripts/render-og.swift`, or headless Chrome). App pages and journal posts each point at a `-v2` card. Give a replaced card a new filename; `/og/` is not in the immutable cache, but old filenames stay in crawlers.
- Press kit: `scripts/press-kit.sh` builds `public/press/slip3-studios-press-kit.zip` from `raw/`, `press/README.txt` and `public/brand/`. Update the size in the download button on `/press/` when it changes. Brand SVGs in `public/brand/` are linked from the press page.

## Content rules

Facts on app pages (launch dates, versions, ratings, pipeline details) come from the app repos in `~/Development` (`Juke` = Formation Lab, `the-starting-five`, `TheFold`, `godot-games/plonk-ios`) and the public iTunes lookup API. Don't invent metrics, testimonials or claims; update the facts when an app ships a release. When adding or renaming an app, update the homepage spotlight and lineup, its app page, the footer partial, `/about/`, `/press/` (page and kit), the OG cards in `og-src/`, and the README.

Commit subjects are one plain imperative sentence, often with a short body saying what changed and what was deliberately left alone.
