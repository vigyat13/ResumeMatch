# ResumeMatch

**[resumematch.live](https://resumematch.live)**

An AI resume platform that reads a CV in any format, scores it against a specific job description, and rewrites it without inventing experience. Around 200 resumes have been processed through it.

Most resume tools do one of two things: a keyword counter that tells you to "add more skills", or a template builder that makes a pretty document nobody tailors. ResumeMatch does the part in between — it parses what you already have, works out what a job actually asks for, and shows you every change it made so you can reject the ones that aren't true.

---

## What it does

**Parse any resume.** PDF, DOCX, PNG, JPG and WebP. Text-layer PDFs go through `pdf-parse`/`pdfjs-dist`; scanned pages and screenshots go through Tesseract OCR. A regex section detector handles 11 section types and pulls email, phone, LinkedIn and GitHub out of the header; an LLM pass then turns the text into structured data with per-field confidence scores. Either layer can fail and the other still returns something useful.

**Tailor to a job description.** Paste a JD and it returns a match score, a tailored resume, and a cover letter. Bullets get rewritten to carry the JD's language, but the rule is that it never adds experience you don't have. Every edit comes back as a labelled change (section, type, what changed), so the output is reviewable rather than something you have to trust.

**Audit a resume.** An ATS-readability and content report with a score ring and specific fixes, not a grade.

**Build one from scratch.** Template gallery, live preview, inline editor, and an AI panel that suggests per-section improvements.

**Import from LinkedIn.** Paste a profile URL or the profile text — no LinkedIn API, since they don't hand out profile access. Rate limited to 10/hour per user.

**Find and track applications.** Job search across Adzuna and JSearch, an applications board, and a per-application intelligence view.

**Admin side.** Metrics and audit logs, because the parser's failure cases are only visible in aggregate.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Base UI |
| Database / auth | Supabase (Postgres + SSR auth), Google One Tap, JWT via `jose` |
| LLM | Groq (Llama 3.3 70B) through the OpenAI-compatible SDK; provider and model are env-swappable, with a configurable fallback |
| Parsing | `pdf-parse`, `pdfjs-dist`, `mammoth` (DOCX), `tesseract.js` (OCR) |
| Rendering | `@napi-rs/canvas` for server-side resume rendering |
| Jobs data | Adzuna, JSearch, Google CSE |
| Browser automation | Browserbase (assisted form fill) |
| Email | Resend |
| Payments | Stripe |
| Rate limiting | Upstash Redis |
| Validation | Zod |

API routes live under `src/app/api/v1/`, grouped by resource: `resumes`, `tailor`, `builder`, `jobs`, `applications`, `matches`, `linkedin`, `auth`, `profile`.

---

## Running it

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Required:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GROQ_API_KEY
```

Optional, each enabling one feature: `OPENAI_API_KEY` / `OPENAI_BASE_URL` (swap the LLM provider), `AI_PROVIDER` / `AI_MODEL` / `AI_FALLBACK_PROVIDER` / `AI_FALLBACK_MODEL`, `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` and `JSEARCH_API_KEY` (job search), `GOOGLE_CSE_ID` / `GOOGLE_CSE_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (One Tap), `RESEND_API_KEY` / `RESEND_FROM_EMAIL`, `BROWSERBASE_API_KEY` / `BROWSERBASE_PROJECT_ID`, `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.

Database schema is in `supabase/migrations/`. Apply it with `supabase db push`.

---

## Design notes

**Why both regex and an LLM for parsing?** Resume layouts vary enormously. Regex handles maybe 40% of real files and costs nothing; an LLM handles 90%+ but costs money and latency. Text extraction from PDF and DOCX is instant and free, so the LLM is used only for the structure step, and the two outputs are merged — the LLM's structure plus regex-detected skills and header fields — so neither one's blind spots decide the result.

**Why changes are tracked.** An AI that silently rewrites your work history is worse than useless for a job application, because you have to defend every line of it in an interview. Returning the diff makes the tool something you can audit.

**Rate limits are per user, per hour** on the two expensive paths (LinkedIn import and tailoring), set at 10 each.

---

## Status

Live and in use. The parser is the part under active work — new resume layouts still surface edge cases, and the aggregate failure data in the admin view is what drives changes to it.

Built by [Vigyat Singh](https://github.com/vigyat13).
