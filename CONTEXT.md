# CONTEXT — ResumeMatch Build Log

> This file tracks every significant change, architectural decision, and build instruction.  
> Append-only. One entry per session.

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
