# CONTEXT — ResumeMatch Build Log

> This file tracks every significant change, architectural decision, and build instruction.  
> Append-only. One entry per session.

---

## 2026-05-15 — Dashboard Template Workspace Polish

### Overview

Replaced the dashboard templates placeholder with the real builder template flow, then refined the reusable template browser so `/dashboard/templates` feels like a functional workspace instead of a static list.

### Changes

- `/dashboard/templates` now fetches templates from Supabase and reuses the builder template browser.
- Added searchable template filtering by name, category, badge, description, and tier.
- Added compact library stats for total templates, ATS-safe templates, and pro layouts.
- Updated category controls for better mobile horizontal scrolling and desktop wrapping.
- Refined template cards with clearer hover/focus states, better mobile sizing, and direct builder affordances.
- Added contained preview support for landing-page resume previews to prevent misaligned/cropped CV thumbnails.

### Verification

```bash
npm run build
curl http://127.0.0.1:8000/health
```

Both passed. The live browser backend was started on `http://localhost:8000`.

---

## 2026-05-15 — Template UI Design-System Refinement

### Overview

Applied the installed Figma skill guidance manually because the Figma skills are installed on disk but not active in the current Codex session. No Figma URL or MCP node was provided, so this was treated as design-system cleanup rather than a 1:1 Figma implementation.

### Changes

- Simplified the `/dashboard/templates` header from a decorative hero into a calmer dashboard workspace header.
- Replaced pill-heavy decorative controls with rectangular, token-based controls.
- Reduced hover spectacle on template cards and made actions more utilitarian.
- Removed "FAANG-type" wording in favor of neutral "Company style" labeling.
- Kept mobile behavior focused on scanability: compact filters, responsive grid, stable card sizing.

### Verification

```bash
npm run build
curl -I http://localhost:3000/dashboard/templates
curl http://127.0.0.1:8000/health
```

Build passed. The Next dev server is running at `http://localhost:3000`, and the live browser backend is running at `http://localhost:8000`.

---

## 2026-05-15 — Job Search Command Prompt

### Overview

Updated the job search page interaction to use a centered command-style prompt, inspired by modern assistant/productivity interfaces, while preserving the existing RapidAPI search and live browser preview flow.

### Changes

- Replaced the initial split search/location form with a large centered command panel.
- Reused the same command panel as the docked bottom prompt during active searches.
- Added quick prompt chips for common job-search categories.
- Kept location as a secondary inline filter inside the prompt panel.
- Submit now supports Enter from the prompt textarea, with Shift+Enter reserved for a new line.

### Verification

```bash
npm run build
```

Build passed.

---

## 2026-05-15 — Job Search Preview Timing + Cleanup

### Overview

Refined the job search run UI so it feels less annotated and more like a focused command surface.

### Changes

- Removed visible helper copy from the job page header and prompt surface.
- Removed the unused plus action from the command bar.
- Reduced the live browser preview width to a medium-sized panel.
- Results are now fetched immediately but revealed after a short delay, giving the preview time to establish the agent run without making users wait on slow third-party sites.
- Simplified the jobs-found header and reduced the focused job card animation intensity.

### Verification

```bash
npm run build
```

Build passed.

---

## 2026-05-15 — Job Results List Refinement

### Overview

Redesigned job results into a cleaner comparison list. A brief Groq-backed prompt assistant experiment was removed before shipping.

### Changes

- Redesigned job result cards with stronger hierarchy: source badge, title, company, location/date/salary chips, concise snippet, and aligned actions.
- Preserved supervised application semantics: "Draft apply" instead of implying silent submission.
- Removed the temporary `/api/v1/jobs/assistant` route and all prompt-chat wiring.

### Verification

```bash
npm run build
curl -I http://localhost:3000/dashboard/jobs
curl http://127.0.0.1:8000/health
```

Build passed. Dashboard redirects signed-out users to login with `next=/dashboard/jobs`; live browser backend is healthy.

---

## 2026-05-11 — Intelligent Resume Parsing System + LinkedIn Import + AI Tailor

### Overview

Built a comprehensive AI-powered resume intelligence platform with three major feature verticals:

1. **Universal Resume Parser** — Accepts ANY CV format (PDF, DOCX, PNG, JPG, WebP), extracts structured ResumeData via multi-strategy pipeline
2. **LinkedIn Auto-Import** — Import LinkedIn profile data by URL or paste → structured ResumeData
3. **One-Click AI Tailor + Apply** — Paste any job description → AI tailors resume + generates cover letter

### Architecture Decisions

#### Parser Pipeline (src/lib/resume/)
```
File Upload → Format Detection → Text Extraction → Section Detection → AI Analysis → Skills Extraction → Structured ResumeData
                                                                     ↕
                                                            Regex Fallback (when AI unavailable)
```

**Multi-strategy approach:**
- **Primary**: AI-powered extraction via Groq (Llama 3.3 70B) — classifies sections, extracts structured data, assigns confidence scores
- **Fallback**: Regex-based section detection (`sectionDetector.ts`) — handles AI failures gracefully
- **OCR**: Tesseract.js for scanned PDFs and image-based resumes (PNG, JPG, WebP)
- **Merge Layer**: Combines AI output with regex-detected skills and header info (email, phone, LinkedIn) for maximum coverage

**Why not pure regex?**
Resume formats vary wildly (150+ formats exist). Regex handles maybe 40% of real-world resumes. AI handles 90%+. We use both for defense-in-depth.

**Why not pure AI?**
Cost and latency. For simple text extraction (PDF/DOCX), regex is instant and free. AI is used only for the structure extraction step.

#### LinkedIn Import (src/lib/linkedin/)
- No LinkedIn API dependency (they restrict profile API access)
- User pastes URL or profile text → Grok AI extracts structured profile data
- `linkedinProfileToResumeData()` transforms LinkedIn format → ResumeData format
- Rate limited: 10 imports/hour/user

#### AI Tailor System (src/lib/tailor/)
- **Three AI operations**: job analysis, resume tailoring, cover letter generation
- **Preserves truthfulness**: AI rewrites bullets with JD keywords but never invents experience
- **Change tracking**: returns list of every modification made (section, type, description)
- **Match scoring**: 0-100 based on skill overlap + experience alignment
- Rate limited: 10 tailoring requests/hour/user

### Files Created/Modified

#### New Library Files

| File | Purpose |
|------|---------|
| `src/lib/resume/types.ts` | Parser types: `SectionType` enum, `ParsedSection`, `AIParseResult`, `ParserOptions`, `ParseProgress` |
| `src/lib/resume/aiParser.ts` | AI-powered resume data extraction via Groq. Handles JSON parsing with recovery. |
| `src/lib/resume/sectionDetector.ts` | 11-category regex-based section detector (header, summary, experience, education, skills, projects, certifications, publications, honors, languages, volunteer, references). Includes `classifyHeaderInfo()` for email/phone/LinkedIn/GitHub extraction. |
| `src/lib/resume/ocr.ts` | OCR module using Tesseract.js for image/scanned PDF parsing. `isLikelyScanned()` heuristic detects OCR-needy documents. Lazy-loads Tesseract to avoid bundle bloat. |
| `src/lib/linkedin/types.ts` | `LinkedinProfile`, `LinkedinExperience`, `LinkedinEducation`, `LinkedinCertification`, etc. |
| `src/lib/linkedin/importer.ts` | `importLinkedinProfile()` — AI extraction from URL/paste. `linkedinProfileToResumeData()` — converts to builder format. |
| `src/lib/tailor/types.ts` | `JobPosting`, `TailoredResume`, `TailorChange`, `CoverLetter`, `TailorResult` |
| `src/lib/tailor/tailor.ts` | `tailorResumeForJob()` — full resume tailoring with change tracking. `identifyJobSource()` — detects LinkedIn/Indeed/Naukri/Glassdoor/Monster. |
| `src/lib/tailor/coverLetter.ts` | `generateCoverLetter()` — three tone options (professional/enthusiastic/concise). `formatCoverLetterForPrint()`. |
| `vitest.config.ts` | Vitest configuration with path aliases matching tsconfig |

#### Modified Library Files

| File | Changes |
|------|---------|
| `src/lib/resume/parser.ts` | **Complete rewrite**. Now returns `{ text, skills, parsed: AIParseResult | null, error? }`. Integrates OCR, AI parser, section detector. Accepts `ParserOptions` and `onProgress` callback. Handles PDF/DOCX/image. |

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/v1/resumes/parse-ai` | POST | Universal file upload + AI parsing. Accepts PDF/DOCX/PNG/JPG/WebP. Returns text + skills + structured ResumeData + confidence scores. Optionally updates DB record via `resume_id`. |
| `/api/v1/linkedin/import` | POST | LinkedIn import. Accepts `{ url }` or `{ text }`. Returns profile + ResumeData. Rate limited. |
| `/api/v1/tailor/generate` | POST | Resume tailoring. Accepts `{ resumeData, jobDescription, jobTitle?, company? }`. Returns tailored resume + cover letter + suggestions. |

#### New UI Components

| File | Purpose |
|------|---------|
| `src/components/resume/SmartUploadZone.tsx` | Modern drag-and-drop modal. Animated progress with stage labels. Accepts PDF/DOCX/PNG/JPG/WebP. Shows confidence scores, skill count, section count on success. |
| `src/components/linkedin/LinkedinImportModal.tsx` | Two-mode import (URL or paste). Profile preview with stats. Confidence indicator. LinkedIn-branded styling. |
| `src/components/tailor/TailorWizard.tsx` | Step-by-step wizard: input → processing animation → results. Shows match score, skill gaps, changes made, cover letter preview, suggestions. |
| `src/components/tailor/TailorButton.tsx` | FAB-style button that opens TailorWizard. Used in dashboard header. |

#### Updated Pages/Components

| File | Changes |
|------|---------|
| `src/components/resume/ResumesClient.tsx` | Added Smart Import, LinkedIn, and Tailor buttons. New empty state with 4-step explainer. Quick actions row for tailoring. |
| `src/app/(dashboard)/dashboard/resumes/page.tsx` | No changes needed (uses ResumesClient which is the entry point). |
| `src/app/(dashboard)/dashboard/matches/page.tsx` | Replaced ComingSoon with real MatchesClient + TailorButton. Fetches job_matches and resumes from DB. |

#### Test Files

| File | Tests |
|------|-------|
| `src/lib/resume/__tests__/sectionDetector.test.ts` | 8 tests: section detection, optional sections, unknown text, confidence scoring, raw text constraints, header info extraction (email, phone, LinkedIn, GitHub, location) |
| `src/lib/resume/__tests__/skills.test.ts` | 12 tests: language detection, framework detection, alias handling, partial word prevention, empty input, deduplication, comma-separated lists, multi-word skills, case insensitivity, SKILL_LIST integrity checks |
| `src/lib/resume/__tests__/aiParser.test.ts` | 9 tests: basic extraction, multiple experience entries, section detection, warnings, graceful fallback on failure, non-JSON handling, LinkedIn parsing, skill extraction, skill level clamping |
| `src/lib/resume/__tests__/parser.test.ts` | 7 tests: PDF parsing, DOCX parsing, AI result structure, confidence scores, empty buffer, unsupported types, progress callback |
| `src/lib/resume/__tests__/fixtures/resumes.ts` | 5 test fixtures: standard resume, section-rich resume, scanned/text, skills-only, LinkedIn profile |

### UI/UX Design Decisions

**Dark theme consistency**: All new components follow the existing `--color-*` CSS custom property system. No hardcoded hex values.

**Component design patterns:**
- All modals follow the same container pattern (`fixed inset-0 z-50` backdrop + centered card)
- All use `animate-reveal-up` for entry animation
- All close on Escape key
- All use the same button/padding/typography system
- Loading states use skeleton animations or spinner patterns consistent with existing code

**SmartUploadZone design:**
- States: idle → dragging → uploading → parsing → success | error
- Dragging state: green border + `scale-[1.01]` lift animation
- Uploading: spinning circle + progress bar with gradient
- Parsing: animated stage labels with increasing progress
- Success: confidence score card + skills count + sections count
- Format badges: PDF/DOCX/Image with appropriate icons

**TailorWizard design:**
- Steps: input → processing → result
- Processing: animated staggered list of operations
- Result: match score card, skill gaps (amber), changes list, cover letter (expandable), suggestions
- Each change type has a distinct icon (+/−/~) with color coding

**LinkedinImportModal design:**
- Dual-mode: URL paste or profile text paste
- LinkedIn blue accent (#0A66C2 via blue-500)
- Confidence badge on success
- Stats grid showing experience/education/skills counts

### Dependency Notes

- `tesseract.js` — added as optional dependency for OCR. Lazy-loaded, so no bundle impact if unavailable.
- `vitest` — added as dev dependency for testing. No production impact.
- All new code uses existing deps: `@/lib/ai/groq` (already has Groq client), `@/lib/supabase/server` (existing Supabase client), `lucide-react` (existing icon library).

### Running Tests

```bash
npx vitest run src/lib/resume/__tests__/
```

### Future Improvements (Not Done)

1. **Progressive parsing**: Stream results as each stage completes (currently waits for full completion)
2. **Batch import**: Upload multiple resumes at once
3. **Parser feedback loop**: Allow users to correct AI-parsed fields, feeding corrections back to improve future parsing
4. **Job board API integration**: Connect to LinkedIn/Indeed APIs for direct job matching
5. **Bulk tailor**: Tailor one resume against multiple job descriptions simultaneously
6. **Cover letter templates**: Multiple cover letter styles (classic, modern, startup)
7. **Parser versioning**: Track which parser version was used for each resume
8. **Image optimization**: Compress uploaded profile photos client-side before upload
9. **Undo tailor**: Allow reverting to pre-tailored version

---

## 2026-05-15 — Hide Two Column Template Card

- Added `isVisibleTemplate()` in `src/lib/builder/templateMeta.ts` with the exact `Two Column` template hidden.
- Filtered hidden templates from the landing showcase API, public builder page, and dashboard template library.
- Updated the shared template browser category so the hidden `Two Column` card no longer appears while other templates remain available.
- Verification: `npm run build` passes.

---

## 2026-05-15 — Disable RapidAPI Jobs for Testing

- Changed `src/app/api/v1/jobs/search/route.ts` to default to a quota-free local test job provider.
- RapidAPI is now opt-in with `JOBS_USE_RAPIDAPI=true`; otherwise the endpoint returns 10 prompt-aware test listings and streams timed search steps for UI testing.
- Bypassed the app's daily job-search rate limit while RapidAPI is disabled, so quota testing does not block UI iteration.
- Updated the job search client error copy to remove RapidAPI-specific messaging.
- Verification: `npm run build` passes.

---

## 2026-05-15 — Job Preview Before Results

- Updated `src/components/dashboard/jobs/JobSearchAgent.tsx` so fetched jobs wait for the live browser preview sync before rendering result cards.
- Added a 7 second minimum browser-preview window, making the browser animation appear first and the output appear after the preview sequence.
- Verification: `npm run build` passes.
