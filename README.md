# Horus — marketing site

Static marketing site for **Horus**, a record-and-replay vision macro for Anime
Expeditions. Landing page + Setup guide + Changelog. Vanilla HTML/CSS/JS — no
build step, no framework.

## Structure

```
index.html       Landing (hero, demo, features, pricing, FAQ, CTA)
setup.html       6-step setup guide
changelog.html   Version timeline
styles.css       All styles + 3 themes (blue / red / teal) + responsive + reduced-motion
app.js           Theme switcher, FAQ accordion, mobile nav
favicon.svg      Ship-wheel mark
assets/          (add) og.png social image, screenshots, demo video
```

## Run locally

It's plain static files — open `index.html` in a browser, or serve the folder:

```bash
# any static server works; e.g. Python
python -m http.server 8080
# then visit http://localhost:8080
```

## Before you ship — fill in the real links

Search the HTML for `TODO` and the placeholder anchors, then replace:

| Placeholder | Replace with |
|---|---|
| `href="#discord"` | Your **permanent** Discord invite URL (never-expiring) |
| `href="#buy"` | Your **Sellix** storefront/product URL (card + crypto) |
| Demo slot in `index.html` (`.demo-slot`) | Real `<video>` or a YouTube/embed `<iframe>` |
| `assets/og.png` | A 1200×630 social share image |

Keep payment off personal Stripe/PayPal — route it through Sellix (see the
`DEPLOY_AND_MONETIZE.md` playbook in the handoff for the full funnel).

## Deploy — Cloudflare Pages

**Git-connected (recommended):**
1. Push this repo to GitHub.
2. Cloudflare dashboard → **Pages → Create → Connect to Git** → pick this repo.
3. Build command: *(none)*. Build output directory: `/` (repo root).
4. Deploy. Add your custom domain; HTTPS is automatic.

**Or drag-and-drop:** Pages → Create → Upload assets → drop this folder.

Works the same on GitHub Pages, Netlify, or Vercel — it's just static files.

## Themes

The site cycles blue → red → teal every ~4.2s on load. Clicking a swatch locks a
theme (persisted in `localStorage`); **AUTO** resumes cycling. The auto-cycle is
disabled under `prefers-reduced-motion`.

## Notes

- No secrets live in this repo — it's a public marketing site. Keep the Horus
  **app source** in a separate, private repo.
- Not affiliated with the game or its developers. Automating a game can violate
  its Terms of Service; the footer/FAQ state this.
