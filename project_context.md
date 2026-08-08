# Silk101 Project Context & Memory

Full context (brand narrative, design tokens, decluttering decision log, performance guardrails, file/module map, phase status tracker) lives in **[docs/BRAND_SPEC.md](docs/BRAND_SPEC.md)** — read that first in any new session.

## Quick architecture reference

* **Frontend (Vite)**:
  * `index.html` & `src/main.js` (Main portal)
  * `admin.html` & `src/admin.js` (Curator administration dashboard)
  * `articles.html` & `src/articles.js` (Editorial section)
  * Styling: `src/style.css` and `src/hyper3d.css`
* **Backend (Node/Express)**:
  * Running from `server/index.js`
  * Database: SQLite `server/database.db` initialized via `server/db.js` and `server/seed.js`

Feature scope, what's been cut/kept/converted, and open follow-up items are all tracked in BRAND_SPEC.md — don't assume anything about interactive features (minigames, canvas animations, chatbots) without checking there first, since a significant decluttering pass has already changed what exists.
