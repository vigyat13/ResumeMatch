# ResumeMatch — Working Context

> **One file, append-only.** Every edit Claude makes appends a dated entry here.
> Read this before starting a session to know "what changed and why" without
> needing to diff git history. Most-recent entries at the **top**.

---

## 2026-04-28 — Sample data overhaul + per-template persona variety

**Files touched**
- `src/lib/builder/types.ts` — three new realistic samples + picker
- `src/app/(builder)/builder/page.tsx` — gallery uses `pickSampleForTemplate`
- `src/components/templates/TemplateCarousel.tsx` — same picker in dashboard carousel

**What changed**

1. Replaced the generic "Alex Rivera" placeholder with three full,
   India-relevant samples:
   - `SAMPLE_ENGINEER` — Priya Sharma (Razorpay → Flipkart, IIT Roorkee)
   - `SAMPLE_PM` — Aditya Krishnan (Swiggy → CRED, IIM-B)
   - `SAMPLE_DESIGNER` — Ananya Iyer (CRED → Razorpay, NID Ahmedabad)
   Bullets are quantified, real-sounding, and tuned to what hiring
   managers in those tracks actually look for.

2. `EXAMPLE_RESUME_DATA` is now an alias of `SAMPLE_ENGINEER`, so every
   existing import (`TemplateCarousel`, hero showcase on `/builder`)
   keeps compiling without any call-site change.

3. New `pickSampleForTemplate(name)` heuristic picks the persona that
   matches each template's intended audience: PM keywords (`Product
   Manager`, `Consulting`, `Executive`, `Finance`, `LinkedIn`,
   `Academic`, `Corporate`, `Harvard`) → PM sample. Designer keywords
   (`Minimal`, `Modern`, `Sharp`, `Startup`, `Bold Header`,
   `Left Accent`, `Elegant`, `Designer`) → designer sample. Everything
   else (FAANG, Classic, Two Column, Technical, Data Scientist) →
   engineer sample.

4. Gallery + dashboard carousel both call the picker per card, so
   thumbnails no longer all show the same person. Live curl against
   `/builder` confirms three distinct names rendering across the
   gallery.

**Why not pre-rendered PNG thumbnails?** Skipped per the spec —
puppeteer + sparticuz/chromium adds a build-time dependency and a
deploy story (Vercel function size limits) that wasn't worth it for
this iteration. Live HTML scaling is fast enough; the perceived
fakeness was the data, not the rendering technique.

---

## 2026-04-28 — App-wide theme alignment + landing polish + INR pricing

**Files touched**
- `src/app/page.tsx` — tightened section padding (120px → 84px),
  shortened scroll-runway spacer (110vh → 70vh), Pro plan now ₹50/month
- `src/app/globals.css` — flipped default semantic tokens to marketing
  dark/emerald palette; added legacy `--color-text-*` and
  `--color-surface-*` aliases so existing components inherit the theme
  without per-file edits; light mode is now opt-in via `class="light"`
- `src/app/(admin)/admin/layout.tsx` — fixed pre-existing `p/**` typo
  that was breaking `tsc`

**What changed**

1. **The "gap" on the landing page** was a 110vh invisible scroll
   spacer that drives the sticky-scene animation in "How it works".
   Tightened it to 70vh and reduced every section's vertical padding
   from 120px → 84px. The page now reads as a single coherent narrative
   instead of feeling like islands of content separated by dead space.

2. **Pro pricing is now ₹50/month** with the copy "Priced for India —
   less than a coffee." Free remains $0 / forever.

3. **Theme alignment, no per-page rewrites.** Instead of editing every
   page to use the marketing dark palette, the default values of the
   semantic tokens (`--color-background`, `--color-foreground`,
   `--color-card`, `--color-primary`, etc.) in `globals.css` now point
   at the marketing colors. The legacy `--color-text-primary`,
   `--color-text-secondary`, `--color-text-muted`, `--color-surface*`
   aliases (used by `Sidebar`, `AuthModal`, dashboard cards, settings,
   admin) were also defined for the first time — the codebase referenced
   them but they had no values. Result: `/login`, `/signup`, `/builder`,
   `/dashboard/*`, `/admin/*` now all share the dark/emerald shell with
   zero component-level changes.

4. **Light mode is now opt-in.** The previous `.dark` override is now a
   `.light` override. Add `class="light"` to a wrapper to switch back to
   the warm light palette (e.g. potentially the resume-preview surface
   if we want it to read as printed paper inside the editor — currently
   left dark since `bg-white` is hard-coded on those preview elements).

**Verification** — `npx tsc --noEmit` clean. `curl http://localhost:3000`
returns 200 with the new copy (`Build for free`, `₹50`, `free editing`,
`color-marketing` tokens). `curl /login` returns 200.

---

## 2026-04-28 — Landing page connections + free-edit framing + LaTeX URL fix

**Files touched**
- `src/app/page.tsx` (landing) — major refactor of links, colors, copy
- `src/app/globals.css` — added `--color-marketing-*` tokens
- `src/lib/builder/latex.ts` — fixed double-`https://` URL bug

**What changed**

1. **All landing-page CTAs now point at real product routes.**
   The previous version sent every "Start free" CTA to `/signup`, which contradicts
   the auth-at-download model that's already implemented in `BuilderEditor.tsx`.
   New mapping:
   - Header `Build for free` (was `Get started`) → `/builder`
   - Header nav adds `Builder` and `Templates` → `/builder`
   - Hero primary `Build for free` → `/builder`
   - Each "How it works" step now exposes a `cta` + `href` and renders a deep
     link inside the sticky panel (Upload → `/dashboard/resumes`,
     Audit → `/dashboard/resumes`, Match → `/dashboard/matches`,
     Rewrite → `/builder`).
   - Features grid: each card is now a `<Link>` to its product surface.
   - Pricing: `Free` → `/builder`, `Pro` → `/signup?plan=pro`. Cards now
     include a feature bullet list, a sub-price label, and CTAs.
   - Bottom CTA `Start building free` → `/builder`.
   - Footer: `#` placeholders replaced with real routes; columns regrouped
     into `Product`, `Account`, `Resources`.
   - Brand wordmarks (header) wrapped in `<Link href="/">`.

2. **"Free editing, sign-in only at download" callout** lives directly under
   the hero buttons. Reinforces the conversion model the product is built around.

3. **Theme tokens.** All raw hex colors on the landing page (`#080808`,
   `#0e0e0e`, `#f5f0e8`, `#34d399`, `#fbbf24`, `#f87171`) are now references to
   `var(--color-marketing-*)` tokens defined in `globals.css`. This is the
   first step toward the "same theme everywhere" goal — every other page can
   now opt into the marketing dark surface by referencing the same tokens
   instead of redefining hex values inline.

4. **LaTeX URL bug.** `generateLatex` previously wrote `\href{https://${url}}`
   unconditionally. If the user typed `https://github.com/foo` the output was
   `https://https://github.com/foo`. New `normalizeUrl()` strips any leading
   scheme and trailing slash before building the href. Same fix applied to the
   project-link branch. Display text strips the scheme so links read cleanly
   ("github.com/foo" rather than "https://github.com/foo").

**What's next** (per `tasks/todo.md`)
- Page-by-page theme alignment: builder, dashboard, login/signup, settings.
- Wire `?plan=pro` query param on `/signup` to preselect the Pro plan.
- Make sure `/dashboard/*` routes redirect unauthenticated users back to the
  landing builder rather than 404'ing — they currently rely on
  `lib/auth/guards.ts`.

---

## How to use this file (for future sessions)

- **Append, don't rewrite.** Add a new dated section at the top.
- **Mention every file you touched** so the next reader can grep for context.
- **Explain *why*, not just *what*.** Diffs already show the what.
- **Cross-link `STUDY.md`** when you introduce a new concept worth teaching.
