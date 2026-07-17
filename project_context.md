# Silk101 Project Context & Memory

This document is prepared to bootstrap context for Claude or other LLM assistants when working on the `silk101` codebase.

---

## 🗺️ Project Blueprint (Architecture & Stack)
The project, **silk101**, is a hybrid frontend/backend web application featuring a bespoke, premium styling interface with interactive elements (minigames, canvas animations, and parallax effects).

* **Frontend (Vite)**: 
  * `index.html` & `src/main.js` (Main portal)
  * `admin.html` & `src/admin.js` (Curator administration dashboard)
  * `articles.html` & `src/articles.js` (Editorial section)
  * Styling: `src/style.css` and `src/matchmaker.css`
* **Backend (Node/Express)**:
  * Running from `server/index.js`
  * Database: SQLite `server/database.db` initialized via `server/db.js` and `server/seed.js`

---

## 📜 Core Guidelines & Constraints (`AGENTS.md`)
Whenever modifying this codebase, we must adhere to these project rules:

1. **Bespoke Luxury Tone**:
   * Showroom Call-to-Actions (CTAs) must direct users to bespoke human styling consultations ("Request Curator Consultation", WhatsApp, phone callbacks) rather than standard checkout forms.
   * Provide active loom queue scarcity text dynamically calculated per weaver to maintain exclusivity.
2. **Interactive Features Stability**:
   * Canvas animations, tactile loom minigames, and parallax scroll triggers must not be broken.
   * Always verify builds with `npm run build` after modifying visual scripts.
3. **SEO & NRI Geo-Targeting**:
   * Maintain alternate regional language and location routing schemas (USA, UK, Canada, UAE, Singapore, India) that dynamically update page metadata and localized shipping estimators.

---

## 📂 File Directory Structure
```text
silk101/
├── .agents/
│   └── AGENTS.md (Project Rules)
├── server/
│   ├── database.db
│   ├── db.js
│   ├── index.js
│   └── seed.js
├── src/
│   ├── assets/
│   ├── admin.js
│   ├── articles.js
│   ├── main.js
│   ├── matchmaker.css
│   └── style.css
├── admin.html
├── articles.html
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```
