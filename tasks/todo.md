# ResumeMatch — Page-by-Page Refactor

> Per `CLAUDE.md`: plan first, verify each step, edit page by page.
> Tick items as they ship. Keep the **Review** section honest.

## Phase 1 — Landing page (in progress)

- [x] Wire every CTA/Link to a real route (no more `#` placeholders)
- [x] Add "free editing · sign-in only at download" callout under hero
- [x] Promote landing colors to `--color-marketing-*` tokens in `globals.css`
- [x] Make Pricing cards reflect the auth-at-download model (Free → builder,
      Pro → signup with `?plan=pro`)
- [x] Wrap header/footer brand wordmarks in `<Link href="/">`
- [x] Fix LaTeX `https://` double-prefix bug in `latex.ts`
- [ ] Add an Open Graph image and proper `metadata` for the landing page
- [ ] Animate hero stats on first scroll into view
- [ ] Smoke-test landing in dev (`npm run dev` → check every link in DevTools)

## Phase 2 — Theme alignment across all pages

- [ ] Decide: app shell stays warm-light + dark mode; landing stays brand
      dark. Document the rule in `STUDY.md` § 3.
- [ ] Replace any remaining inline hex on the builder pages with semantic
      tokens (`--color-background`, `--color-foreground`, etc.).
- [ ] Add a thin marketing-styled header component for `/login` and
      `/signup` so auth pages feel like part of the same brand surface.

## Phase 3 — Builder & Dashboard polish

- [ ] `/builder` (template gallery): apply `simplify` skill — remove the
      duplicate "Browse N templates" + "Start with X" tension.
- [ ] `/builder/[template_id]`: confirm the auth modal is wired correctly
      end-to-end (sign-up → save → print).
- [ ] `/dashboard/resumes`: ensure unauthenticated users land at `/builder`
      not a Supabase 401.
- [ ] `/dashboard/matches`: same.
- [ ] Settings, Admin: same.

## Phase 4 — Auth flow polish

- [ ] Honor `?plan=pro` on `/signup` — preselect Pro and pass through to
      checkout when payment is wired.
- [ ] Post-signup redirect: send users back to where they came from
      (`?next=/builder/<template_id>` already exists in `AuthModal` via the
      OAuth callback).

## Phase 5 — LaTeX hardening

- [x] Fix double `https://` prefix bug
- [ ] Round-trip property test: `parseLatex(generateLatex(d))` ≈ `d` for
      the supported field set.
- [ ] Show a friendlier error in the Recompile banner when the user has
      diverged too far from the template grammar.

---

## Review

### 2026-04-28
- Landing page is now the actual product entry point: every visible CTA
  routes into either `/builder`, `/dashboard/*`, or `/signup`.
- Theme is no longer hand-coded in the JSX. Adding the next page in the
  same brand surface is now a matter of referencing the `--color-marketing-*`
  tokens.
- LaTeX URL bug is fixed at the root; both generator (`linkPart`) and
  project-link path use the same `normalizeUrl()` helper. No callers left
  doing `https://${url}` by hand.
- Two new docs (`CONTEXT.md`, `STUDY.md`) — `CONTEXT.md` is the running
  edit log, `STUDY.md` is the teaching reference.
- **Outstanding:** verify the landing actually serves with `npm run dev`,
  click through every link, and check that `/dashboard/*` redirects
  unauthenticated users somewhere sensible (don't currently know).
