'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Sparkles, X, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { NewMatchModal } from './NewMatchModal'

interface Resume { id: string; file_name: string }
interface JobMatch {
  id: string
  job_title: string | null
  company: string | null
  match_percentage: number | null
  saved: boolean | null
}

interface Props {
  initialMatches: JobMatch[]
  resumes: Resume[]
}

const EXAMPLES = [
  'backend engineer remote fresher',
  'frontend developer Bangalore React',
  'data analyst internship Python SQL',
]

const SEARCH_STAGES = ['thinking', 'searching', 'results'] as const
type SearchStage = typeof SEARCH_STAGES[number]

const SOURCES = [
  { name: 'LinkedIn',   accent: '#0a66c2', delayMs:  300 },
  { name: 'Indeed',     accent: '#003a9b', delayMs:  650 },
  { name: 'Glassdoor',  accent: '#0caa41', delayMs:  950 },
  { name: 'Lever',      accent: '#5b21b6', delayMs: 1300 },
  { name: 'Greenhouse', accent: '#f97316', delayMs: 1650 },
] as const

const MOCK_JOBS = [
  { title: 'Backend Engineer',         company: 'Northstar Labs',   location: 'Remote',    source: 'LinkedIn',   match: 86, salary: '₹18-26L' },
  { title: 'Software Engineer Intern', company: 'Vector AI',        location: 'Bangalore', source: 'Indeed',     match: 78, salary: '₹40k/mo' },
  { title: 'Full Stack Developer',     company: 'CircuitWorks',     location: 'Gurgaon',   source: 'Greenhouse', match: 74, salary: '₹14-22L' },
  { title: 'Platform Engineer',        company: 'Orbit Systems',    location: 'Hybrid',    source: 'Lever',      match: 69, salary: '₹16-24L' },
  { title: 'API Developer',            company: 'Currents Inc',     location: 'Mumbai',    source: 'Glassdoor',  match: 65, salary: '₹12-18L' },
] as const

// Naive parser to extract chips from query — visual only, real parsing happens server-side later
function parsePrompt(q: string) {
  const lower = q.toLowerCase()
  const role = q.match(/(backend|frontend|fullstack|full[- ]stack|data|platform|software|ml|ai|devops|mobile|product|design)[\s-]*\w*/i)?.[0]
  const cities = ['bangalore','mumbai','delhi','gurgaon','noida','hyderabad','pune','chennai','remote','hybrid','onsite']
  const location = cities.find(c => lower.includes(c))
  const level = ['fresher','intern','junior','mid','senior','staff','principal'].find(l => lower.includes(l))
  const stack = ['react','node','python','sql','java','go','rust','typescript','aws','gcp','docker','kubernetes']
    .filter(s => lower.includes(s))
  return { role, location, level, stack }
}

export function MatchesClient({ initialMatches, resumes }: Props) {
  const [query, setQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [matches, setMatches] = useState(initialMatches)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [stage, setStage] = useState<SearchStage>('thinking')
  const [committedQuery, setCommittedQuery] = useState('')

  const parsed = useMemo(() => parsePrompt(committedQuery), [committedQuery])

  const bestMatch = matches
    .filter(match => match.match_percentage !== null)
    .sort((a, b) => (b.match_percentage ?? 0) - (a.match_percentage ?? 0))[0]

  function handleSuccess(match: unknown) {
    setMatches(current => [match as JobMatch, ...current])
  }

  function startSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!query.trim()) return
    setCommittedQuery(query.trim())
    setStage('thinking')
    setIsSearchOpen(true)
  }

  function useExample(example: string) {
    setQuery(example)
    setCommittedQuery(example)
    setStage('thinking')
    setIsSearchOpen(true)
  }

  // Lock body scroll when modal open
  useEffect(() => {
    if (!isSearchOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isSearchOpen])

  useEffect(() => {
    if (!isSearchOpen) return

    const thinkingTimer = window.setTimeout(() => setStage('searching'), 1100)
    const resultsTimer  = window.setTimeout(() => setStage('results'),   3200)

    return () => {
      window.clearTimeout(thinkingTimer)
      window.clearTimeout(resultsTimer)
    }
  }, [isSearchOpen, committedQuery])

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-2 py-8">

      <style jsx global>{`
        @keyframes agent-sweep {
          0% { transform: rotate(0deg); opacity: 0.25; }
          50% { opacity: 0.95; }
          100% { transform: rotate(360deg); opacity: 0.25; }
        }
        @keyframes job-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes modal-reveal {
          0% { opacity: 0; transform: scale(0.92); filter: blur(20px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes overlay-fade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes chip-rise {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ring-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.45); }
          50% { box-shadow: 0 0 0 18px rgba(52,211,153,0); }
        }
        @keyframes job-slide-in {
          0% { opacity: 0; transform: translateX(28px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <section className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
            Job search agent
          </p>
          <h1
            className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-6xl"
            style={{ fontFamily: 'var(--font-headline), sans-serif' }}
          >
            What job should we find?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
            Type role, location, remote preference, or experience level. The agent searches LinkedIn, Indeed, Glassdoor, Lever, and Greenhouse, ranks results against your CV, and highlights the gaps.
          </p>
        </div>

        <form
          onSubmit={startSearch}
          className="rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(101,211,158,0.12),rgba(7,13,10,0.96)_44%,rgba(8,8,8,0.98))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.35)]"
        >
          <div className="rounded-[1.45rem] border border-white/10 bg-black/35 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3 px-2">
                <Search className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search jobs: backend engineer in Gurgaon, remote, fresher..."
                  className="min-h-14 flex-1 bg-transparent text-base font-medium text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] sm:text-lg"
                  autoFocus
                />
              </div>
              <button
                disabled={!query.trim()}
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Sparkles className="h-4 w-4" />
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)]/40"
              >
                Match JD
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {EXAMPLES.map(example => (
              <button
                key={example}
                type="button"
                onClick={() => useExample(example)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-text-primary)]"
              >
                {example}
              </button>
            ))}
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span>{resumes.length} resume{resumes.length !== 1 ? 's' : ''} ready</span>
          <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
          <span>{matches.length} previous match{matches.length !== 1 ? 'es' : ''}</span>
          {bestMatch && (
            <>
              <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
              <span>Best: {bestMatch.job_title ?? 'Role'} · {bestMatch.match_percentage}%</span>
            </>
          )}
        </div>
      </section>

      {/* ── Agent workspace overlay ───────────────────────────────────── */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(101,211,158,0.16),rgba(0,0,0,0.94)_38%,#020302_100%)] px-4 py-5 backdrop-blur-xl sm:px-6 sm:py-8"
          style={{ animation: 'overlay-fade 280ms ease-out' }}
        >
          <div className="mx-auto flex min-h-full w-full max-w-6xl items-center">
            <section
              className="relative w-full overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#070907]/95 p-4 shadow-[0_40px_140px_rgba(0,0,0,0.72)] sm:p-6 lg:p-8"
              style={{ animation: 'modal-reveal 480ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(101,211,158,0.14),transparent_34%,rgba(255,255,255,0.035)_62%,transparent)]" />
              <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[var(--color-accent)]/18 blur-3xl" />
              <div className="pointer-events-none absolute -left-24 bottom-8 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />

              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--color-accent)]">
                    Agent workspace
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-4xl">
                    {stage === 'thinking'  && 'Reading your prompt'}
                    {stage === 'searching' && 'Scraping job sources'}
                    {stage === 'results'   && 'Jobs ranked against your CV'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] transition hover:border-white/20 hover:text-[var(--color-text-primary)]"
                  aria-label="Close agent workspace"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>

              {/* Active prompt bar (read-only summary) */}
              <div className="relative mt-6 rounded-[1.8rem] border border-[var(--color-accent)]/25 bg-black/45 p-3 shadow-[0_0_0_1px_rgba(101,211,158,0.06),0_22px_80px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-accent)] text-sm font-black text-black"
                    style={{ animation: 'ring-pulse 2.2s ease-in-out infinite' }}
                  >
                    AI
                  </span>
                  <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        startSearch()
                      }
                    }}
                    className="min-h-12 flex-1 bg-transparent text-base font-semibold text-[var(--color-text-primary)] outline-none sm:text-xl"
                  />
                  <button
                    type="button"
                    onClick={() => startSearch()}
                    className="hidden items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-black hover:brightness-95 sm:inline-flex"
                  >
                    Run <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* ── Two-column workspace ─────────────────────────────── */}
              <div className="relative mt-7 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">

                {/* LEFT: Thinking + source progress */}
                <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015))] p-5">
                  <div className="relative min-h-[420px] overflow-hidden rounded-[1.55rem] border border-white/10 bg-black/40">
                    <div className="absolute left-0 right-0 top-0 flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                        {stage === 'thinking' ? 'Thinking' : stage === 'searching' ? 'Live scrape' : 'Done'}
                      </span>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
                    </div>

                    {/* THINKING stage: show parsed prompt chips */}
                    {stage === 'thinking' && (
                      <div className="absolute inset-x-5 top-16 space-y-4">
                        <div className="flex items-center gap-4 rounded-3xl border border-[var(--color-accent)]/25 bg-[#09110d] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.42)]">
                          <div className="relative h-16 w-16 shrink-0">
                            <span className="absolute inset-0 rounded-full bg-[var(--color-accent)]/15" />
                            <span className="absolute inset-2 rounded-full border border-[var(--color-accent)]/30" />
                            <span className="absolute inset-[18px] rounded-full bg-[var(--color-accent)]" />
                            <span className="absolute left-1/2 top-1/2 h-28 w-0.5 origin-top bg-[linear-gradient(var(--color-accent),transparent)]" style={{ animation: 'agent-sweep 1.6s linear infinite' }} />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-[var(--color-text-primary)]">Understanding the prompt</p>
                            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">Extracting role, location, level, and stack…</p>
                          </div>
                        </div>

                        {/* Parsed chips */}
                        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-4">
                          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Parsed</p>
                          <div className="flex flex-wrap gap-2">
                            {parsed.role && <Chip label="role" value={parsed.role} delay={0} />}
                            {parsed.location && <Chip label="location" value={parsed.location} delay={120} />}
                            {parsed.level && <Chip label="level" value={parsed.level} delay={240} />}
                            {parsed.stack.map((s, i) => (
                              <Chip key={s} label="stack" value={s} delay={360 + i * 100} />
                            ))}
                            {!parsed.role && !parsed.location && !parsed.level && parsed.stack.length === 0 && (
                              <span className="text-xs text-[var(--color-text-muted)]">No filters detected — searching broadly.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SEARCHING stage: per-source live list */}
                    {stage !== 'thinking' && (
                      <div className="absolute inset-x-5 top-16 space-y-2.5">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Job sources</p>
                        {SOURCES.map((src, i) => (
                          <SourceRow
                            key={src.name}
                            source={src}
                            isDone={stage === 'results' || (stage === 'searching' && i < 3)}
                            isActive={stage === 'searching' && i >= 3}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Live job results */}
                <div className="rounded-[2rem] border border-white/10 bg-black/30 p-4">
                  <div className="mb-4 flex items-center justify-between px-1">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">Live jobs</p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {stage === 'thinking'  && 'Waiting for parse to complete…'}
                        {stage === 'searching' && 'Rows arrive as sources respond.'}
                        {stage === 'results'   && 'Sorted by CV fit. Click a row for details.'}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                      {stage === 'results' ? `${MOCK_JOBS.length} found` : stage === 'searching' ? 'streaming' : 'queued'}
                    </span>
                  </div>

                  <div className="relative space-y-3">
                    {MOCK_JOBS.map((job, index) => {
                      const visible = stage === 'results' || (stage === 'searching' && index < 3)
                      return (
                        <div
                          key={`${job.company}-${job.title}`}
                          className={`group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.018))] p-4 transition-all duration-700 ${
                            visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                          }`}
                          style={{
                            transitionDelay: `${index * 180}ms`,
                            animation: visible ? `job-slide-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 180}ms backwards` : undefined,
                          }}
                        >
                          <span className="absolute inset-y-0 left-0 w-1 bg-[var(--color-accent)]" />
                          {stage !== 'results' && visible && (
                            <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(101,211,158,0.12),transparent)]" style={{ animation: 'job-line 1.25s ease-in-out infinite' }} />
                          )}
                          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-[var(--color-text-primary)]">{job.title}</p>
                              <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">{job.company} · {job.salary}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <SourceTag source={job.source} />
                                <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)]">
                                  {job.location}
                                </span>
                                <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)]">
                                  Apply later
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">CV fit</p>
                                <p className={`text-xl font-black tabular-nums ${stage === 'results' ? matchColor(job.match) : 'text-[var(--color-text-muted)]'}`}>
                                  {stage === 'results' ? `${job.match}%` : '--'}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={stage !== 'results'}
                                className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)]/40 disabled:opacity-40"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="relative mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false)
                    setShowModal(true)
                  }}
                  className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-white/25"
                >
                  Match a pasted JD
                </button>
                <button
                  type="button"
                  onClick={() => startSearch()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
                >
                  <Sparkles className="h-4 w-4" /> Search again
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {showModal && (
        <NewMatchModal
          resumes={resumes}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────── */

function Chip({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)]"
      style={{ animation: `chip-rise 360ms ease-out ${delay}ms backwards` }}
    >
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-accent)]">{label}</span>
      <span>{value}</span>
    </span>
  )
}

function SourceRow({
  source,
  isDone,
  isActive,
}: {
  source: typeof SOURCES[number]
  isDone: boolean
  isActive: boolean
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition-all duration-500"
      style={{ opacity: isDone || isActive ? 1 : 0.4 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: source.accent, boxShadow: isActive ? `0 0 12px ${source.accent}` : 'none' }}
          />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{source.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
          {isActive && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-accent)]" />}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${
            isDone ? 'bg-[var(--color-accent)] text-black' : isActive ? 'bg-white/15 text-white' : 'bg-white/10 text-[var(--color-text-muted)]'
          }`}>
            {isDone ? 'done' : isActive ? 'live' : 'queue'}
          </span>
        </div>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: isDone ? '100%' : isActive ? '60%' : '0%',
            backgroundColor: source.accent,
          }}
        />
      </div>
    </div>
  )
}

function SourceTag({ source }: { source: string }) {
  const meta = SOURCES.find(s => s.name === source)
  const accent = meta?.accent ?? '#34d399'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        color: accent,
        backgroundColor: `${accent}18`,
        border: `1px solid ${accent}40`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
      {source}
    </span>
  )
}

function matchColor(score: number): string {
  if (score >= 80) return 'text-[#34d399]'
  if (score >= 60) return 'text-[#fbbf24]'
  return 'text-[#f87171]'
}
