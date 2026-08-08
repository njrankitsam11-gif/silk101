# The Loom of Time — Brand & Codebase Spec

This is the persistent source of truth for this project. Read this file first in any new session — it replaces re-deriving context from an 8,000-line `main.js` or from stale/conflicting notes in `.agents/AGENTS.md` and `project_context.md`.

## 1. Brand narrative facts

- **Product:** handloom sarees woven by named Odisha artisans (Khandua, Sambalpuri, temple/Ratha Yatra motifs, Pipili applique, etc.).
- **Audience:** NRIs and the top 10% of earners in India — buyers who respond to restraint and craft specificity, not feature density or "innovation" theater.
- **Tone rule — concierge, not checkout:** every purchase-adjacent CTA routes to a human (WhatsApp/phone/curator consultation), never a generic self-serve checkout form. This is a hard brand constraint, not a technical default.
- **Named artisans** and their bios are the brand's strongest differentiator — always prefer expanding real artisan storytelling over adding new interactive gimmicks.

## 2. Design tokens (from `src/style.css:43-66`)

```css
--color-bg: #111111;               /* Deep Matte Charcoal */
--color-surface: #181818;
--color-surface-2: #222222;
--color-text: #faf9f6;             /* Alabaster White */
--color-text-muted: #9e9e9e;

--color-accent: #e5d3b3;           /* Matte Champagne Gold */
--color-accent-bright: #f8f1e5;
--color-accent-deep: #a69477;      /* Muted Bronze */
--color-zari: #e5d3b3;             /* alias of accent, used widely as "gold" */

--color-sapphire: #2a3441;
--color-crimson: #4a2c2a;
--color-jade: #2c3a32;

--font-sans: 'Outfit', 'Inter', -apple-system, sans-serif;
--font-serif: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
```

Motion-language rules (easing, pacing, concrete "heavy but tasteful" reference examples) are **not yet defined** — these get reverse-engineered from owner-supplied reference links/screenshots in a future session (Phase C), then recorded here.

## 3. Declutter decision log (executed, not just proposed)

Test applied throughout: *does this feature deepen belief in the object's authenticity and craft, or is it performing "innovation" for its own sake?*

### Cut — customer site
| Feature | Status | Notes |
|---|---|---|
| Silk Oracle chatbot | Removed | Consolidated to one human-routed contact: Curator Concierge |
| Curator Whisper easter egg | Removed | Bundled with Oracle cut |
| Glyph Hunt hidden-object hunt | Removed | Secret Vault reward panel also removed (was orphaned by this cut) |
| WebXR AR Drape try-on | Removed | Camera-based try-on; high friction, was also likely already broken (scope bug) |
| Live IoT Telemetry ("Live Loom Cam" fake sensor modal) | Removed | Fabricated sensor data (`Math.sin`+`Math.random`) presented as live |
| Fake Provenance Hash Seal (2 locations: Cert overlay + Warp Console) | Removed | Fake SHA-256-style hash display; real cert/console controls kept |
| Custom cursor + cursor trail | Removed | Both customer-site and admin-dashboard copies |
| Ambient soundscape / audio console | Removed | Full removal; kept sound-effect functions on other features intentionally left as silent no-ops (module-level audio state vars preserved on purpose — see `src/main.js:11-19`) |
| Heritage Matchmaker quiz | Removed | Hardcoded score table re-selecting an existing product; no real personalization |
| Handloom Map decorative particle canvas + mouse-parallax loop | Removed | Kept hotspots/swatches/oral-audio narration/GSAP scroll reveals |
| Custom Commission Studio preview canvas | **Converted**, not removed | Was a continuous ungated `requestAnimationFrame` loop; now renders once on load + once per slider/select change (owner's explicit choice — kept the visual, cut the perpetual animation cost) |

### Kept, explicitly (owner decisions — do not re-litigate without new input)
| Feature | Why |
|---|---|
| Curator Concierge chat | Sole human-routed contact surface |
| Deposit/Checkout modal | Already a deposit-*intent* form handed off to WhatsApp — no self-serve payment fields exist. Copy was cleaned up (see below) but no structural change needed. |
| CTA particle bursts (`initCTAParticleBurst`) | Cheap (event-triggered, not a loop), shares helpers with other kept features |
| Manual Shuttle Loom minigame | Real, cheap (visibility-gated, event-driven) discount-unlock mechanic. Note: the discount code it grants is **not server-enforced anywhere** — cosmetic at checkout time, flagged for owner awareness, not yet acted on. |
| Adopt-a-Loom WhatsApp CTA | Real subscription entry point; relocated (not removed) when its original host modal was cut |
| The 4 sitewide `hypereffects.js` ambient loops (floating 3D artifacts, kinematic silk cloth, volumetric gold dust, prismatic headings) | Owner explicitly chose to keep these despite them running continuously, ungated, sitewide — real performance cost, deliberate choice |
| Konark Chakra loader | Already capped at ~300ms in a prior session's perf work — not an artificial gate. No action needed. |

### Copy-accuracy fixes (not feature cuts, just fixing claims made stale by the cuts above)
- Deposit modal disclaimer no longer claims "Secure SSL" (there's no payment processing to secure — was a fabricated trust signal).
- Deposit modal milestone timeline no longer promises "Live cam access unlocked" (that feature was cut).
- Deposit modal milestone timeline no longer says "SHA-256 Cert" (softened to "Provenance Certificate" — the underlying cert generator still fabricates an ID/dates; see open item below).

### Cut — admin dashboard (`admin.html` / `src/admin.js`, audited for the first time this round)
| Feature | Status | Notes |
|---|---|---|
| Admin custom-cursor duplicate | Removed | Was already dead/invisible — its CSS had been stripped from `style.css` when the customer-site cursor was cut, leaving an orphaned JS+HTML shell |
| Impact Metrics section | Removed | 100% static hardcoded numbers, zero data source — same species of theater as the telemetry cut from the customer site. Dead nav button removed too. |

### Kept, explicitly — admin dashboard
| Feature | Why |
|---|---|
| Weavers Module | Owner did not select this for removal despite hardcoded mock data and a button calling an undefined function (throws on click). **Open issue, not fixed.** |
| Enquiry Kanban / Status board | Real data, real API — just not actually drag-and-drop despite the name |

### Still open — needs a future session
- **3 large scroll-pinned animation sections** (`setupHorizontalPulse` ~350 lines/2 loops, `setupMetamorphosis` ~600 lines/1 loop — the single largest function in the file, `setupHeritageSoulSection` ~475 lines) mix real content with heavy ungated canvas decoration. Flagged, not yet researched to the same precision as the items above. **This is very likely where the next real performance win is** — see the Lighthouse numbers below.
- Admin "Weavers Module" broken button (`generateProvenanceHash` is called but never defined — throws in console).
- Admin certificate generator (`generateCertHash`) labels its output `sha256:...` but is a fake rolling hash with a hardcoded constant suffix on every certificate — not real SHA-256. Not yet addressed.
- Two pre-existing production bugs were found and fixed during this work (not part of the declutter, but worth recording): `avatarCollections` (dead lookup, showroom canvas filter) and `playShowroomSound`/`activeItem` (defined in one function's scope, called from unrelated functions elsewhere — a scope-leak pattern; both promoted to module-level scope as the fix). Search for this pattern (`ReferenceError`-prone cross-scope calls) before assuming any given function/variable is safely scoped.

## 4. Performance guardrails (protect prior perf work — hard constraints on all future changes)

- Never gate hero paint behind an animation (fixed once already: "eliminate 3-second artificial loader delay").
- Register new scroll/canvas effects lazily; pause or gate them off-screen (the codebase has both good examples — `setupGenesisCanvas`'s `IntersectionObserver` gate, `setupShowroomDrape`'s proper `cancelAnimationFrame` cleanup — and bad ones — most of the large sections listed as "still open" above never cancel their rAF loops).
- Add a global `prefers-reduced-motion` check around GSAP timeline creation — **not currently confirmed to exist**, audit before Phase C.
- GSAP stays the only animation dependency (no Three.js/Lottie/Framer Motion).
- Re-run `npm run build` + a Lighthouse pass after each phase and compare against baseline.

**Baseline measured this session** (local preview, post-declutter, before any Phase C/motion work): Performance **40**, Accessibility 99, Best Practices 96, SEO 100; LCP 5.6s, TBT **9,190ms**, TTI 15.2s. The bundle is meaningfully smaller (~19% JS/CSS reduction) and 11 always-on animation loops were removed, but the score is still bad — the dominant remaining cost is almost certainly the "still open" items above (4 kept `hypereffects.js` loops + 3 unresearched large sections), which are known, named, and deliberately deferred, not a regression from this work.

## 5. File / module map

```
silk101/
├── docs/BRAND_SPEC.md          (this file)
├── .agents/AGENTS.md            (pointer only, see below)
├── project_context.md           (pointer only, see below)
├── index.html                   (1,392 lines — was 1,671)
├── admin.html                   (678 lines)
├── articles.html                (252 lines)
├── src/
│   ├── main.js                  (6,661 lines, ~94 top-level/nested functions — was 8,263/129)
│   ├── admin.js                 (1,242 lines)
│   ├── articles.js               (188 lines)
│   ├── hypereffects.js          (446 lines — 4 sitewide ambient loops, kept)
│   ├── style.css                (2,975 lines — design tokens live here)
│   ├── hyper3d.css              (268 lines)
│   └── counter.js
├── server/                      (Express + SQLite, real backend: inventory/artisans/enquiries/categories/articles)
└── vercel.json / vite.config.js
```

`main.js` is still a single large file (not yet modularized into `src/features/*.js` — that's the future "Phase B" from the original roadmap, distinct from the declutter rounds already done). 403 inline `style="..."` attributes remain in `index.html`, not yet migrated to `style.css`.

## 6. Phase status tracker

- **Declutter round 1** — ✅ Done. 7 features removed from customer site (Oracle, Whisper, Glyph Hunt, AR Drape, fake telemetry, fake hash seals, custom cursor, audio console). Two production bugs found + fixed during verification.
- **Declutter round 2** — ✅ Done. Heritage Matchmaker removed, Handloom Map decorative layer trimmed, Commission Studio canvas converted to render-on-change, admin dashboard audited for the first time (cursor duplicate + Impact Metrics removed), Deposit modal copy fixed.
- **Structure consolidation** (modularize `main.js`, migrate inline styles to `style.css`) — ⬜ Not started.
- **Motion language rebuild** (owner reference links/screenshots → reverse-engineered tokens → interactive mockups → owner picks, applied section by section starting with the hero) — ⬜ Not started. No visual/motion direction has been gathered from the owner yet.
- **New content/sections** (rebuilt commission studio UI, expanded artisan storytelling, final Lighthouse + reduced-motion pass) — ⬜ Not started.
- **Immediately available next step:** research the 3 large scroll-pinned sections (`setupHorizontalPulse`, `setupMetamorphosis`, `setupHeritageSoulSection`) with the same precision as the completed declutter rounds — likely the highest-leverage single action given the current Performance score of 40.
