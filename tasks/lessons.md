# Lessons — Patterns to Repeat & Mistakes to Avoid

> Per `CLAUDE.md` § Self-Improvement Loop: after every correction, write
> down the *rule* that prevents the mistake next time. After every
> validated success, write down the *pattern* worth repeating.
>
> Read this at session start.

## Patterns to repeat

### L1 — Promote colors to tokens before wiring routes
When refactoring a page that mixes hex literals with broken links, do the
**color → token** sweep *first* using `replace_all`. The link wiring step
becomes pure structural work afterward instead of also fighting visual diff
noise. (Used 2026-04-28 on landing page.)

### L2 — Single-source URL normalization
Anywhere the codebase builds external links (`href`, `\href{}`, `<a>`),
funnel them through one helper that strips/re-applies the scheme. Never
let a `https://${rawInput}` exist anywhere. (`normalizeUrl()` in
`src/lib/builder/latex.ts` — pattern should generalize to any future
LinkedIn/portfolio fields.)

### L3 — Auth at download, not at entry
The "free until extraction" model is core to the product. Any new feature
that gates value behind auth needs explicit justification in
`CONTEXT.md`. Default = free; auth = at the moment value leaves the
system.

## Mistakes to avoid

### A1 — Don't hard-code `/signup` on free CTAs
Old landing page sent every "Start free" button to `/signup`, contradicting
the auth-at-download model the rest of the app already implemented. Always
ask: "what's the *cheapest* place this user can experience value?" and
route the CTA there.

### A2 — Don't use `<a href="/foo">` inside Next.js pages
Use `next/link`'s `<Link>` for any internal navigation. `<a>` triggers a
full page reload, kills the prefetch, and breaks the SPA feel. Reserve
`<a>` for hash anchors and external URLs only.

### A3 — Don't write a doc per session
Every "edit-log" or "what-changed" file goes into **`CONTEXT.md`** (one
file, append-only). Don't create `EDIT-2026-04-28.md` style scratch files.
The user has explicitly asked for one running context file.
