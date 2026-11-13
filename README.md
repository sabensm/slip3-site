# Slip3 Studios

Static site for Slip3 Studios, an independent app studio.

- `/` — studio home: Formation Lab, The Starting 5, The Fold, and Plonk (coming soon)
- `/formation-lab/`, `/starting-5/`, `/the-fold/`, `/plonk/` — case studies with interactive demos
- `/journal/` — build notes, with an RSS feed at `/journal/feed.xml`
- `/about/` — the studio and its founder, Mike Sabens
- `/contact/` — one contact page for support, privacy requests and press across the games
- `/press/`, `/privacy/` — press kit, website privacy

Deploy root is `public/`; Vercel serves it as-is. Run `node scripts/build.mjs` after editing pages (shared head/header/footer, journal list, feed, sitemap). Source images are in `raw/`, OG card sources in `og-src/`. See CLAUDE.md for the full workflow.
