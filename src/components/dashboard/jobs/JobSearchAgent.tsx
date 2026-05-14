'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { BriefcaseBusiness, CheckCircle2, Clock3, ExternalLink, Globe2, MailPlus, MapPin, Search, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LiveBrowserPreview } from '@/components/live-browser-preview'
import { ApplyModal } from './ApplyModal'

type BrowserPhase = 0 | 1 | 2 | 3 | 4 | 5

interface Step {
  message: string
  status:  'running' | 'done' | 'error'
}

interface Job {
  id:                  string
  title:               string
  company:             string
  location:            string
  is_remote:           boolean
  source:              string
  url:                 string
  posted_at:           string | null
  salary_min:          number | null
  salary_max:          number | null
  salary_currency:     string | null
  salary_period:       string | null
  description_snippet: string
  employer_logo:       string | null
}

interface LiveBrowserSession {
  session_id: string
  url: string
  width: number
  height: number
  websocket_path: string
}

const LIVE_BROWSER_API_URL = process.env.NEXT_PUBLIC_LIVE_BROWSER_API_URL ?? 'http://localhost:8000'
const LIVE_BROWSER_WS_URL = process.env.NEXT_PUBLIC_LIVE_BROWSER_WS_URL ?? `${LIVE_BROWSER_API_URL.replace(/^http/, 'ws')}/browser/stream`

function timeAgo(iso: string | null): string {
  if (!iso) return 'Recently'
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1)  return 'Just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? '1d ago' : `${d}d ago`
}

function formatSalary(job: Job): string | null {
  if (!job.salary_min && !job.salary_max) return null
  const cur = job.salary_currency ?? '₹'
  const fmt = (n: number) => n >= 100_000
    ? `${(n / 100_000).toFixed(0)}L`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}K`
      : String(n)
  const period = job.salary_period === 'YEAR' ? '/yr' : job.salary_period === 'MONTH' ? '/mo' : ''
  if (job.salary_min && job.salary_max) return `${cur}${fmt(job.salary_min)}–${fmt(job.salary_max)}${period}`
  if (job.salary_min) return `${cur}${fmt(job.salary_min)}+${period}`
  return `Up to ${cur}${fmt(job.salary_max!)}${period}`
}

const SOURCE_COLORS: Record<string, string> = {
  LinkedIn:  'bg-blue-500/15 text-blue-400',
  Indeed:    'bg-indigo-500/15 text-indigo-400',
  Glassdoor: 'bg-green-500/15 text-green-400',
}

function sourceBadge(source: string): string {
  return SOURCE_COLORS[source] ?? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
}

function initials(company: string): string {
  return company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'JB'
}

export function JobSearchAgent() {
  const [query,    setQuery]    = useState('')
  const [location, setLocation] = useState('')
  const [steps,     setSteps]     = useState<Step[]>([])
  const [jobs,      setJobs]      = useState<Job[]>([])
  const [loading,   setLoading]   = useState(false)
  const [rateLimit,  setRateLimit]  = useState<{ remaining: number; limit: number } | null>(null)
  const [limitError, setLimitError] = useState<{ message: string; upgrade: boolean } | null>(null)
  const [phase,      setPhase]      = useState<BrowserPhase>(0)
  const [applyJob,   setApplyJob]   = useState<Job | null>(null)
  const [activeJobIndex, setActiveJobIndex] = useState(0)
  const [browserSession, setBrowserSession] = useState<LiveBrowserSession | null>(null)
  const [browserError, setBrowserError] = useState<string | null>(null)
  const [browserStarting, setBrowserStarting] = useState(false)
  const [revealStage, setRevealStage] = useState<0 | 1 | 2 | 3>(0)
  const [applied,  setApplied]  = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('rm_applied_jobs')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })
  const abortRef = useRef<AbortController | null>(null)
  const browserSessionRef = useRef<string | null>(null)

  const toggleApplied = useCallback((id: string) => {
    setApplied(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem('rm_applied_jobs', JSON.stringify([...next]))
      return next
    })
  }, [])

  const search = useCallback(async () => {
    if (!query.trim() || loading) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const searchQuery = query.trim()
    const searchLocation = location.trim()

    setLoading(true)
    setSteps([])
    setJobs([])
    setLimitError(null)
    setBrowserError(null)
    setBrowserSession(null)
    setPhase(1)
    setRevealStage(1)
    setActiveJobIndex(0)

    window.setTimeout(() => {
      if (!ctrl.signal.aborted) setRevealStage(2)
    }, 1100)

    try {
      const browserRunPromise = createLiveBrowserRun({
        query: searchQuery,
        location: searchLocation,
        signal: ctrl.signal,
        previousSessionId: browserSessionRef.current,
        onStarting: setBrowserStarting,
        onSession: (session) => {
          browserSessionRef.current = session.session_id
          setBrowserSession(session)
        },
        onError: setBrowserError,
      })

      const res = await fetch('/api/v1/jobs/search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: searchQuery, location: searchLocation || undefined }),
        signal:  ctrl.signal,
      })

      if (res.status === 429) {
        const json = await res.json().catch(() => ({}))
        setLimitError({ message: json.error ?? 'Daily limit reached.', upgrade: !!json.upgradeRequired })
        return
      }

      if (!res.ok || !res.body) {
        setSteps([
          { message: 'Live job API failed. Check RAPIDAPI_KEY or RapidAPI quota.', status: 'error' },
        ])
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buf     = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          const data = line.replace(/^data: /, '').trim()
          if (!data) continue
          try {
            const msg = JSON.parse(data)
            if (msg.type === 'step') {
              setSteps(prev => {
                const next = [...prev, { message: msg.message, status: msg.status }]
                // map step index → browser phase
                const phaseMap: BrowserPhase[] = [1, 2, 3, 4]
                setPhase(phaseMap[Math.min(next.length - 1, 3)] ?? 4)
                return next
              })
            } else if (msg.type === 'jobs') {
              const foundJobs = Array.isArray(msg.data) ? (msg.data as Job[]) : []
              await syncLiveBrowserResults(browserRunPromise, searchQuery, searchLocation, foundJobs, ctrl.signal)
              setJobs(foundJobs)
              setRevealStage(3)
              setPhase(5)
            } else if (msg.type === 'done' && msg.remaining != null) {
              setRateLimit({ remaining: msg.remaining, limit: msg.limit })
            }
          } catch {
            // malformed chunk, skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setSteps(prev => [...prev, { message: 'Connection error', status: 'error' }])
      }
    } finally {
      setLoading(false)
    }
  }, [query, location, loading])

  useEffect(() => () => {
    abortRef.current?.abort()
    if (browserSessionRef.current) {
      void destroyLiveBrowserSession(browserSessionRef.current)
    }
  }, [])

  useEffect(() => {
    if (phase !== 5 || jobs.length === 0) return
    const interval = window.setInterval(() => {
      setActiveJobIndex(prev => (prev + 1) % Math.min(jobs.length, 6))
    }, 1600)
    return () => window.clearInterval(interval)
  }, [phase, jobs.length])

  const hasResults = jobs.length > 0
  const hasSteps   = steps.length > 0
  const showSearchExperience = loading || hasSteps || hasResults
  const runLabel = location.trim()
    ? `Search ${query || 'jobs'} in ${location}`
    : `Search ${query || 'anything'}`
  const checkpointItems = [
    { label: 'Opened browser', complete: phase >= 1 },
    { label: location.trim() ? 'Typed role and location' : 'Typed search prompt', complete: phase >= 2 },
    { label: 'Searched job boards', complete: phase >= 4 },
    { label: `${jobs.length || 'Matching'} jobs found`, complete: hasResults },
  ]

  if (!showSearchExperience && !limitError) {
    return (
      <div className="flex min-h-[calc(100vh-260px)] items-center justify-center pb-20">
        <div className="w-full max-w-3xl animate-reveal-up">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(52,211,153,0.13),rgba(14,14,14,0.98)_36%,rgba(8,8,8,0.98))] p-3 shadow-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  placeholder="Search anything..."
                  className="w-full rounded-2xl border border-white/10 bg-black/45 py-4 pl-10 pr-12 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-all focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
                  autoFocus
                />
              </div>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="Location"
                className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-4 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-all focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 sm:w-52"
              />
              <button
                onClick={search}
                disabled={!query.trim()}
                className="flex items-center justify-center rounded-2xl bg-[var(--color-accent)] px-6 py-4 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Search Jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="relative flex min-h-[calc(100vh-180px)] flex-col gap-5 pb-32">
      {rateLimit && (
        <p className="mx-auto w-full max-w-5xl text-xs text-[var(--color-text-muted)]">
          {rateLimit.remaining} / {rateLimit.limit} searches remaining today
        </p>
      )}

      {limitError && (
        <div className="mx-auto w-full max-w-5xl rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {limitError.message}
          {limitError.upgrade && (
            <a href="/dashboard/settings?tab=billing" className="ml-2 underline font-medium">
              Upgrade to Pro
            </a>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col items-center gap-6">
        <div className="relative w-full max-w-5xl">
          <div className="absolute bottom-0 left-[17px] top-2 hidden border-l border-[var(--color-border)] md:block" />
          <div className="mb-6 grid gap-5 pl-0 md:grid-cols-[34px_1fr]">
            <div className="relative z-10 hidden justify-center md:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
                <Target className="h-4 w-4 text-[var(--color-text-muted)]" />
              </span>
            </div>
            <div>
              <p className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">Goal</p>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-4 text-base text-[var(--color-text-primary)] shadow-sm">
                {runLabel}
              </div>
            </div>
          </div>

          {revealStage >= 2 && (
          <>
          <div className="mb-3 grid gap-5 md:grid-cols-[34px_1fr]">
            <div className="relative z-10 hidden justify-center md:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
                <Globe2 className="h-4 w-4 text-[var(--color-text-muted)]" />
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">Agent Run</p>
              <span className="text-sm text-[var(--color-text-muted)]">
                {hasResults ? '1 of 1 complete' : '0 of 1 complete'}
              </span>
              <span className={cn(
                'ml-auto flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium',
                loading ? 'text-blue-300' : hasResults ? 'text-green-300' : 'text-[var(--color-text-muted)]'
              )}>
                <span className={cn('h-2 w-2 rounded-full', loading ? 'animate-pulse bg-blue-400' : hasResults ? 'bg-green-400' : 'bg-[var(--color-text-muted)]')} />
                {loading ? 'Running' : hasResults ? 'Complete' : 'Waiting'}
              </span>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[34px_1fr]">
            <div className="hidden md:block" />
            <div>
              {browserSession ? (
                <LiveBrowserPreview
                  websocketUrl={LIVE_BROWSER_WS_URL}
                  sessionId={browserSession.session_id}
                  width={browserSession.width}
                  height={browserSession.height}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-muted)]">
                  {browserStarting
                    ? 'Starting live browser...'
                    : browserError
                      ? `Live browser unavailable: ${browserError}`
                  : 'Preparing live browser preview...'}
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>

          {hasResults && revealStage >= 3 && (
            <div className="w-full max-w-5xl animate-reveal-up">
              <div className="mb-4 grid gap-5 md:grid-cols-[34px_1fr]">
                <div className="relative z-10 hidden justify-center md:flex">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-green-500/25 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-300" />
                  </span>
                </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Jobs found</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {checkpointItems[3].label}. Results are pulled from the live search API using your prompt and location filter.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
                  <span className="rounded-full border border-[var(--color-border)] px-3 py-1">{jobs.length} listings</span>
                  <span className="rounded-full border border-[var(--color-border)] px-3 py-1">{jobs.filter(job => job.is_remote).length} remote</span>
                  <span className="rounded-full border border-[var(--color-border)] px-3 py-1">{new Set(jobs.map(job => job.source)).size} sources</span>
                </div>
              </div>
              </div>

              <div className="space-y-3 md:ml-[54px]">
              {jobs.map((job, index) => {
                const isApplied = applied.has(job.id)
                const salary    = formatSalary(job)
                const isFocused = phase === 5 && activeJobIndex === index
                return (
                  <div
                    key={job.id}
                    className={cn(
                      'animate-job-card-in rounded-2xl border p-4 shadow-sm transition-all duration-300',
                      isApplied
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/40',
                      isFocused && 'scale-[1.015] border-[var(--color-accent)]/70 shadow-[0_18px_45px_rgba(52,211,153,0.12)] ring-2 ring-[var(--color-accent)]/20'
                    )}
                    style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                  >
                    <div className="grid gap-4 lg:grid-cols-[1fr_260px] lg:items-start">
                    <div className="flex items-start gap-3">
                      {job.employer_logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={job.employer_logo}
                          alt={job.company}
                          className="h-9 w-9 shrink-0 rounded-lg object-contain border border-[var(--color-border)] bg-white p-1"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-bold text-[var(--color-text-muted)]">
                          {initials(job.company)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{job.title}</p>
                        <p className="truncate text-xs text-[var(--color-text-secondary)]">{job.company}</p>
                        {job.description_snippet && (
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                            {job.description_snippet}
                          </p>
                        )}
                      </div>
                      {isFocused && (
                        <span className="rounded-full bg-[var(--color-accent)]/15 px-2 py-1 text-[10px] font-semibold text-[var(--color-accent)]">
                          Opened in preview
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-[var(--color-text-muted)]">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                        {job.is_remote ? 'Remote' : job.location}
                        </span>
                      </span>
                      {salary && (
                        <span className="flex min-w-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-[var(--color-text-muted)]">
                          <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                          {salary}
                          </span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-[var(--color-text-muted)]">
                        <Clock3 className="h-3.5 w-3.5 shrink-0" />
                        {timeAgo(job.posted_at)}
                      </span>
                      <span className={cn('flex items-center justify-center rounded-lg px-2.5 py-2 font-medium', sourceBadge(job.source))}>
                        {job.source}
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => toggleApplied(job.id)}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                            isApplied
                              ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                          )}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {isApplied ? '✓ Applied' : 'Mark Applied'}
                        </button>
                        {hasEmailApply(job.url, job.description_snippet) ? (
                          <button
                            onClick={() => setApplyJob(job)}
                            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90"
                          >
                            <MailPlus className="h-3.5 w-3.5" />
                            Auto Apply
                          </button>
                        ) : (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Job
                          </a>
                        )}
                    </div>
                    </div>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          )}
      </div>

      <div className="fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(52,211,153,0.14),rgba(14,14,14,0.98)_34%,rgba(8,8,8,0.98))] p-3 shadow-2xl backdrop-blur md:left-72 md:right-8">
        <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Tell the agent what job to search for..."
              className="w-full rounded-2xl border border-white/10 bg-black/45 py-3 pl-10 pr-12 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-all focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
            />
            {loading && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                <SpinnerIcon className="h-4 w-4 text-[var(--color-accent)] animate-spin" />
              </span>
            )}
          </div>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Location filter"
            className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-all focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 sm:w-52"
          />
          <button
            onClick={search}
            disabled={!query.trim() || loading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? 'Searching...' : 'Search Jobs'}
          </button>
        </div>
        </div>
      </div>
    </div>

    {applyJob && (
      <ApplyModal
        job={applyJob as Job}
        onClose={() => setApplyJob(null)}
        onApplied={(id) => { toggleApplied(id); setApplyJob(null) }}
      />
    )}
    </>
  )
}

async function createLiveBrowserRun({
  query,
  location,
  signal,
  previousSessionId,
  onStarting,
  onSession,
  onError,
}: {
  query: string
  location: string
  signal: AbortSignal
  previousSessionId: string | null
  onStarting: (value: boolean) => void
  onSession: (session: LiveBrowserSession) => void
  onError: (message: string) => void
}): Promise<LiveBrowserSession | null> {
  onStarting(true)

  try {
    if (previousSessionId) {
      void destroyLiveBrowserSession(previousSessionId)
    }

    const res = await fetch(`${LIVE_BROWSER_API_URL}/browser/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'about:blank',
        width: 1280,
        height: 720,
      }),
      signal,
    })

    if (!res.ok) {
      throw new Error(`backend returned ${res.status}`)
    }

    const session = await res.json() as LiveBrowserSession
    if (!signal.aborted) {
      onSession(session)
      void startLiveBrowserJobRun(session.session_id, query, location, signal)
      return session
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      onError((err as Error).message || 'could not connect')
    }
  } finally {
    if (!signal.aborted) onStarting(false)
  }

  return null
}

async function destroyLiveBrowserSession(sessionId: string) {
  try {
    await fetch(`${LIVE_BROWSER_API_URL}/browser/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
  } catch {
    // Best-effort cleanup. Session TTL on the backend is the fallback.
  }
}

async function syncLiveBrowserResults(
  browserRunPromise: Promise<LiveBrowserSession | null>,
  query: string,
  location: string,
  jobs: Job[],
  signal: AbortSignal,
) {
  try {
    const session = await browserRunPromise
    if (!session || signal.aborted) return
    await completeLiveBrowserJobRun(session.session_id, query, location, jobs, signal)
  } catch {
    // Job results should still render even if the optional browser preview disconnects.
  }
}

async function startLiveBrowserJobRun(sessionId: string, query: string, location: string, signal?: AbortSignal) {
  await fetch(`${LIVE_BROWSER_API_URL}/browser/job-search/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, query, location }),
    signal,
  })
}

async function completeLiveBrowserJobRun(
  sessionId: string,
  query: string,
  location: string,
  jobs: Job[],
  signal?: AbortSignal,
) {
  const res = await fetch(`${LIVE_BROWSER_API_URL}/browser/job-search/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, query, location, jobs }),
    signal,
  })
  if (!res.ok) {
    throw new Error(`backend returned ${res.status}`)
  }
}

function hasEmailApply(url: string, snippet: string): boolean {
  if (url.startsWith('mailto:')) return true
  return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(snippet)
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}
