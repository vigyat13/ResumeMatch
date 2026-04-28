# ResumeMatch — Concepts & Architecture (Teaching File)

> **Goal.** Read this once and you'll understand *why* this codebase looks the
> way it does. Each section starts from the problem, then explains the
> pattern, then ties it to a specific file in this repo.
>
> Updated incrementally. New concepts appended at the **bottom**; index at
> the top stays sorted.

## Index

1. [App Router & Route Groups](#1-app-router--route-groups)
2. [Auth-at-Download (a.k.a. "Builder First, Auth Last")](#2-auth-at-download-aka-builder-first-auth-last)
3. [Design Tokens & Why We Just Added Marketing Tokens](#3-design-tokens--why-we-just-added-marketing-tokens)
4. [Server vs Client Components](#4-server-vs-client-components)
5. [Supabase Server Client + RLS](#5-supabase-server-client--rls)
6. [Templated HTML Resume Rendering](#6-templated-html-resume-rendering)
7. [Round-Trip LaTeX (generate + parse)](#7-round-trip-latex-generate--parse)

---

## 1. App Router & Route Groups

**Problem.** A real app has many pages with different layouts: a marketing
landing page, an authenticated dashboard, a full-screen builder, an admin
panel. They shouldn't share a single layout.

**Pattern: Next.js App Router with route groups.** Folders in parentheses
like `(dashboard)` or `(builder)` are *route groups*: they affect file
organization and let you scope a `layout.tsx`, but they **don't appear in the
URL**. So `src/app/(dashboard)/dashboard/resumes/page.tsx` renders at
`/dashboard/resumes`, but it inherits `src/app/(dashboard)/layout.tsx` —
which can do auth checks, render a sidebar, etc. The marketing landing
(`src/app/page.tsx`) sits at the root and doesn't get any of that wrapper.

**Where to look:**
- `src/app/page.tsx` — public landing, root layout only.
- `src/app/(dashboard)/layout.tsx` — sidebar + auth gate.
- `src/app/(builder)/layout.tsx` — full-screen, no sidebar.
- `src/app/(auth)/login/page.tsx` — auth pages share their own layout.

---

## 2. Auth-at-Download (a.k.a. "Builder First, Auth Last")

**Problem.** Most resume tools force sign-up before the user has built
anything. Conversion data says ~50% drop off at that gate. The user has no
emotional investment yet, so why would they hand over their email?

**Pattern.** Let the user do everything *valuable* without an account. Save
to `localStorage` so refreshes don't lose work. Only require auth at the
exact moment they want to extract value out of the system (download a PDF).
At that point they've spent 10 minutes on their resume — sign-up conversion
typically jumps to ~80%.

**Where to look:**
- `src/components/builder/BuilderEditor.tsx`:
  - `localStorage` draft key auto-saves the working resume (line ~23).
  - `handleDownload()` checks `isLoggedIn` and shows `<AuthModal>` only if
    needed (line ~119).
- `src/components/builder/AuthModal.tsx` — the JIT auth prompt with a
  comment explaining the why (top of file).
- The landing page now reinforces this with a "100% free editing · sign in
  only when you download" callout under the hero.

---

## 3. Design Tokens & Why We Just Added Marketing Tokens

**Problem.** When colors live as raw hex values inside JSX (`color: "#34d399"`)
you can't theme the app, you can't dark-mode it, and changes ripple across
50 files. We had two stylistically different surfaces: a warm light app
shell (using `--color-background`, `--color-foreground` etc.) and a dark
emerald landing page that hard-coded its hex values inline.

**Pattern.** Promote every brand color to a CSS custom property living in one
place (`src/app/globals.css`). Components reference `var(--color-marketing-bg)`
instead of `#080808`. To re-theme an entire surface, change one line.

**Why the `--color-marketing-*` namespace?** The app shell uses
"semantic by mode" tokens (`--color-background` swaps in `.dark`). The
landing/marketing surface is *always* dark — it's a brand statement, not a
mode. Putting it under a separate namespace says: "This is the showcase
surface. It looks the same regardless of the user's theme preference."

**Where to look:**
- `src/app/globals.css` — `@theme { --color-marketing-* … }`.
- `src/app/page.tsx` — every formerly hex-coded color now reads a token.

---

## 4. Server vs Client Components

**Problem.** Sending React + every component's JS to the browser bloats
bundle size and hurts time-to-interactive. But some components (forms,
modals, anything with `useState`) genuinely need to run in the browser.

**Pattern.** App Router treats every component as a **Server Component** by
default. Fetch from a database, read cookies, generate HTML — all on the
server, zero JS shipped. The moment you need React state or events, you opt
in with `"use client"` at the top of the file. Server components can import
client components, but not vice-versa.

**Where to look:**
- `src/app/(builder)/builder/page.tsx` — Server Component (note: no
  `"use client"`). It runs `await createClient()` (Supabase) and queries
  the `templates` table at request time.
- `src/components/builder/BuilderEditor.tsx` — Client Component
  (`"use client"`) because it owns form state, Monaco, modals.

---

## 5. Supabase Server Client + RLS

**Problem.** Talking to a database from a Next.js server requires the right
auth context — you want queries to run *as the logged-in user* so Row Level
Security (RLS) policies in Postgres can decide what they can see. You also
can't share a single client across requests because each carries its own
cookie-derived session.

**Pattern.** Build a fresh Supabase client per request that knows how to
read/write the auth cookies. Postgres RLS does the rest: even if your API
code has a bug, a user can never read another user's resumes because the
database itself filters rows by `auth.uid()`.

**Where to look:**
- `src/lib/supabase/server.ts` — `createClient()` that wires up cookies.
- `src/lib/supabase/middleware.ts` — refreshes the session on every request.
- `src/lib/supabase/client.ts` — browser client for client components.

---

## 6. Templated HTML Resume Rendering

**Problem.** A resume template needs to render with the user's data. We
don't want to ship 30 React components — one per template. We want
non-developers to be able to drop in a new template (`html_content` +
`css_content`) via the database.

**Pattern.** Store HTML strings with `{{handlebar}}`-style placeholders in
Supabase. At render time, walk the user's `ResumeData` object and substitute
placeholders. The resulting HTML is dropped into the page via
`dangerouslySetInnerHTML`. CSS is scoped (`body{` → `.preview-sheet{`) so
templates don't leak styles into the rest of the app.

**Where to look:**
- `src/lib/builder/render.ts` — the template engine.
- `src/lib/builder/types.ts` — `ResumeData` shape.
- `src/components/builder/LivePreview.tsx` — renders + scopes CSS.

---

## 7. Round-Trip LaTeX (generate + parse)

**Problem.** Power users want to drop into raw LaTeX and edit. But our app's
source of truth is a structured `ResumeData` object — not a `.tex` file. So
edits made in the LaTeX tab need to round-trip back into the form.

**Pattern.**
- `generateLatex(data)` → string. Deterministic. Always emits the same
  template structure (Jake's Resume style, MIT-licensed) so we can parse it.
- `parseLatex(string)` → `Partial<ResumeData>`. Walks the string looking for
  the structural macros (`\section{Experience}`, `\resumeSubheading{}{}{}{}`
  etc.) and reconstructs an object. Because both sides agree on the
  template structure, round-tripping is lossless for the supported sections.
- The "Recompile" button calls `parseLatex` and merges the result back into
  the form's `data` state.

**Why we just touched this file.** The original `generateLatex` always
prefixed `https://` to URLs without checking whether the user's input
already had a scheme. Result: `\href{https://https://github.com/me}` — a
broken link. The new `normalizeUrl()` helper strips any existing scheme and
trailing slash, then re-prefixes once. The visible link text strips the
scheme too, so `github.com/me` reads cleaner than `https://github.com/me`.

**Where to look:**
- `src/lib/builder/latex.ts` — generator (now with `normalizeUrl()`).
- `src/lib/builder/parseLatex.ts` — parser (uses balanced-brace extraction).

---

> **Add a new section** when you introduce a non-obvious pattern that a
> future reader (you, in 6 months) would have to reverse-engineer.
> Lead with **Problem**, then **Pattern**, then a **Where to look** list of
> exact file paths with a one-line note about each.
