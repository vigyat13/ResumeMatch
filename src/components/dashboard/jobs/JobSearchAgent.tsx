'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { KeyboardEvent } from 'react'
import {
  AlertTriangle,
  ArrowUp,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Code2,
  ExternalLink,
  GraduationCap,
  Globe2,
  MailPlus,
  MapPin,
  PenLine,
  SlidersHorizontal,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LiveBrowserPreview } from '@/components/live-browser-preview'
import { ApplyModal } from './ApplyModal'

type BrowserPhase = 0 | 1 | 2 | 3 | 4 | 5

type AgentState =
  | 'searching_jobs'
  | 'ranking_jobs'
  | 'checking_company_quality'
  | 'extracting_recruiter'
  | 'tailoring_resume'
  | 'drafting_cover_letter'
  | 'awaiting_user_approval'
  | 'submitting_application'
  | 'completed'

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

interface JobIntelligence {
  qualityScore: number
  matchScore: number
  ghostRisk: number
  recruiterSignal: number
  companySignal: number
  salarySignal: number
  freshnessSignal: number
  priorityScore: number
  reasons: string[]
  risks: string[]
  nextAction: 'apply' | 'referral' | 'research' | 'skip'
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
const MIN_BROWSER_PREVIEW_MS = 7000

const PROMPT_SUGGESTIONS = [
  { label: 'Engineering', value: 'Frontend engineer jobs', icon: Code2 },
  { label: 'Entry level', value: 'Software engineer intern jobs', icon: GraduationCap },
  { label: 'Product', value: 'Product manager jobs', icon: SlidersHorizontal },
  { label: 'Writing', value: 'Technical writer jobs', icon: PenLine },
]

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

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function getQueryTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter(term => term.length > 2 && !['job', 'jobs', 'role', 'roles', 'remote', 'hybrid', 'onsite'].includes(term))
}

function scoreJob(job: Job, query: string, index: number): JobIntelligence {
  const haystack = `${job.title} ${job.company} ${job.location} ${job.description_snippet}`.toLowerCase()
  const terms = getQueryTerms(query)
  const matchedTerms = terms.filter(term => haystack.includes(term))
  const matchScore = terms.length ? clampScore((matchedTerms.length / terms.length) * 100) : 62

  const postedMs = job.posted_at ? new Date(job.posted_at).getTime() : NaN
  const ageDays = Number.isFinite(postedMs) ? Math.max(0, (Date.now() - postedMs) / 86_400_000) : 10
  const freshnessSignal = clampScore(100 - ageDays * 8)
  const salarySignal = job.salary_min || job.salary_max ? 92 : 38
  const sourceSignal = job.source === 'Career Page' ? 88 : job.source === 'LinkedIn' ? 74 : job.source === 'Glassdoor' ? 68 : 58
  const recruiterSignal = /recruiter|hiring manager|talent|apply@|mailto:/i.test(`${job.url} ${job.description_snippet}`)
    ? 82
    : job.source === 'LinkedIn'
      ? 58
      : 42
  const companySignal = clampScore(sourceSignal + (job.employer_logo ? 8 : 0) + (job.company.length > 2 ? 4 : -15))
  const descriptionSignal = job.description_snippet.length > 160 ? 76 : 42

  const ghostRisk = clampScore(
    18
    + (salarySignal < 50 ? 16 : -8)
    + (freshnessSignal < 45 ? 22 : -10)
    + (descriptionSignal < 50 ? 14 : -6)
    + (job.source === 'Indeed' ? 8 : 0)
    + (/urgent|rockstar|ninja|10\+ years.*entry/i.test(job.description_snippet) ? 18 : 0)
    + index * 1.5,
  )

  const qualityScore = clampScore((freshnessSignal * 0.22) + (salarySignal * 0.16) + (companySignal * 0.24) + (descriptionSignal * 0.16) + (recruiterSignal * 0.22))
  const priorityScore = clampScore((matchScore * 0.34) + (qualityScore * 0.34) + ((100 - ghostRisk) * 0.22) + (recruiterSignal * 0.10))
  const nextAction = priorityScore >= 78
    ? 'apply'
    : recruiterSignal >= 60 && priorityScore >= 64
      ? 'referral'
      : ghostRisk >= 58
        ? 'research'
        : priorityScore < 45
          ? 'skip'
          : 'research'

  const reasons = [
    `${matchedTerms.length || 0}/${terms.length || 1} search terms matched`,
    job.salary_min || job.salary_max ? 'Salary signal present' : 'No salary range',
    freshnessSignal >= 70 ? 'Fresh posting' : 'Freshness needs checking',
    recruiterSignal >= 60 ? 'Recruiter/contact signal found' : 'No clear recruiter signal',
  ]

  const risks = [
    ...(ghostRisk >= 58 ? ['High ghost-job risk'] : []),
    ...(salarySignal < 50 ? ['Compensation missing'] : []),
    ...(descriptionSignal < 50 ? ['Thin job description'] : []),
    ...(freshnessSignal < 45 ? ['Possibly stale posting'] : []),
  ]

  return {
    qualityScore,
    matchScore,
    ghostRisk,
    recruiterSignal,
    companySignal,
    salarySignal,
    freshnessSignal,
    priorityScore,
    reasons,
    risks,
    nextAction,
  }
}

function rankJobs(jobs: Job[], query: string): Job[] {
  return [...jobs].sort((a, b) => {
    const aScore = scoreJob(a, query, 0).priorityScore
    const bScore = scoreJob(b, query, 0).priorityScore
    return bScore - aScore
  })
}

function getAgentState(loading: boolean, jobs: Job[], steps: Step[]): AgentState {
  if (jobs.length > 0 && !loading) return 'awaiting_user_approval'
  if (!loading && steps.some(step => step.status === 'done')) return 'completed'
  if (steps.length >= 4) return 'extracting_recruiter'
  if (steps.length >= 3) return 'checking_company_quality'
  if (steps.length >= 2) return 'ranking_jobs'
  return 'searching_jobs'
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

function wait(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms))
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
  const resultRevealTimeoutRef = useRef<number | null>(null)

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
    const runStartedAt = Date.now()

    setLoading(true)
    setSteps([])
    setJobs([])
    setLimitError(null)
    setBrowserError(null)
    setBrowserSession(null)
    setPhase(1)
    setRevealStage(1)
    setActiveJobIndex(0)
    if (resultRevealTimeoutRef.current) {
      window.clearTimeout(resultRevealTimeoutRef.current)
      resultRevealTimeoutRef.current = null
    }

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
          { message: 'Job search failed. Please try again.', status: 'error' },
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
              const foundJobs = Array.isArray(msg.data) ? rankJobs(msg.data as Job[], searchQuery) : []
              const remainingPreviewTime = Math.max(0, MIN_BROWSER_PREVIEW_MS - (Date.now() - runStartedAt))
              await Promise.all([
                syncLiveBrowserResults(browserRunPromise, searchQuery, searchLocation, foundJobs, ctrl.signal),
                wait(remainingPreviewTime),
              ])
              if (ctrl.signal.aborted) return
              setJobs(foundJobs)
              setPhase(5)
              resultRevealTimeoutRef.current = window.setTimeout(() => {
                if (!ctrl.signal.aborted) setRevealStage(3)
              }, 1400)
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
    if (resultRevealTimeoutRef.current) {
      window.clearTimeout(resultRevealTimeoutRef.current)
    }
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
  const currentAgentState = applyJob ? 'drafting_cover_letter' : getAgentState(loading, jobs, steps)
  const jobIntel = useMemo(
    () => new Map(jobs.map((job, index) => [job.id, scoreJob(job, query, index)])),
    [jobs, query],
  )
  const runLabel = location.trim()
    ? `Search ${query || 'jobs'} in ${location}`
    : `Search ${query || 'anything'}`
  if (!showSearchExperience && !limitError) {
    return (
      <div className="flex min-h-[calc(100vh-240px)] items-center justify-center px-1 pb-20">
        <div className="w-full max-w-4xl animate-reveal-up">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl">
              What role should we find?
            </h1>
          </div>

          <CommandSearchPanel
            query={query}
            location={location}
            loading={loading}
            setQuery={setQuery}
            setLocation={setLocation}
            search={search}
            autoFocus
            variant="hero"
          />
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
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div>
                {browserSession ? (
                  <LiveBrowserPreview
                    websocketUrl={LIVE_BROWSER_WS_URL}
                    sessionId={browserSession.session_id}
                    width={browserSession.width}
                    height={browserSession.height}
                    className="rounded-xl"
                  />
                ) : (
                  <div className="mx-auto flex aspect-video max-w-4xl items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-muted)]">
                    {browserStarting
                      ? 'Starting live browser...'
                      : browserError
                        ? `Live browser unavailable: ${browserError}`
                    : 'Preparing live browser preview...'}
                  </div>
                )}
              </div>
              <ExecutionInspector
                steps={steps}
                browserSession={browserSession}
                currentState={currentAgentState}
              />
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
              <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{jobs.length} jobs matched</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    Ranked by priority score, quality signals, salary visibility, and ghost-job risk.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
                  <span className="rounded-full border border-[var(--color-border)] px-3 py-1">{jobs.length} listings</span>
                  <span className="rounded-full border border-[var(--color-border)] px-3 py-1">{jobs.filter(job => job.is_remote).length} remote</span>
                </div>
              </div>
              </div>

              <div className="space-y-3 md:ml-[54px]">
              {jobs.map((job, index) => {
                const isApplied = applied.has(job.id)
                const salary    = formatSalary(job)
                const isFocused = phase === 5 && activeJobIndex === index
                const locationLabel = job.is_remote ? 'Remote' : job.location
                const intelligence = jobIntel.get(job.id) ?? scoreJob(job, query, index)
                return (
                  <div
                    key={job.id}
                    className={cn(
                      'animate-job-card-in rounded-xl border p-4 transition-colors duration-200',
                      isApplied
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/40',
                      isFocused && 'border-[var(--color-accent)]/70 shadow-[0_18px_45px_rgba(52,211,153,0.10)] ring-1 ring-[var(--color-accent)]/20'
                    )}
                    style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-3">
                        {job.employer_logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={job.employer_logo}
                            alt={job.company}
                            className="h-11 w-11 shrink-0 rounded-xl border border-[var(--color-border)] bg-white object-contain p-1.5"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-bold text-[var(--color-text-muted)]">
                            {initials(job.company)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn('rounded-md px-2 py-1 text-[10px] font-semibold', sourceBadge(job.source))}>
                              {job.source}
                            </span>
                            {isFocused && (
                              <span className="rounded-md border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--color-accent)]">
                                Previewing
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-base font-semibold leading-6 text-[var(--color-text-primary)]">{job.title}</p>
                          <p className="mt-0.5 truncate text-sm text-[var(--color-text-secondary)]">{job.company}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
                            <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{locationLabel}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5">
                              <Clock3 className="h-3.5 w-3.5 shrink-0" />
                              {timeAgo(job.posted_at)}
                            </span>
                            {salary && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5">
                                <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" />
                                {salary}
                              </span>
                            )}
                          </div>
                          {job.description_snippet && (
                            <p className="mt-3 line-clamp-2 border-l border-[var(--color-border)] pl-3 text-sm leading-6 text-[var(--color-text-muted)]">
                              {job.description_snippet}
                            </p>
                          )}
                          <JobIntelligenceStrip intelligence={intelligence} />
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 lg:w-44 lg:flex-col">
                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Priority</p>
                          <div className="mt-1 flex items-end gap-1">
                            <span className={cn(
                              'text-2xl font-bold',
                              intelligence.priorityScore >= 75 ? 'text-[var(--color-accent)]' : intelligence.priorityScore >= 55 ? 'text-amber-300' : 'text-red-300',
                            )}>
                              {intelligence.priorityScore}
                            </span>
                            <span className="pb-1 text-[10px] text-[var(--color-text-muted)]">/100</span>
                          </div>
                          <p className="mt-1 text-[11px] capitalize text-[var(--color-text-muted)]">
                            {intelligence.nextAction === 'apply' ? 'apply now' : intelligence.nextAction === 'referral' ? 'referral first' : intelligence.nextAction}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleApplied(job.id)}
                          className={cn(
                            'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                            isApplied
                              ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                              : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                          )}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {isApplied ? 'Applied' : 'Track'}
                        </button>
                        {hasEmailApply(job.url, job.description_snippet) ? (
                          <button
                            onClick={() => setApplyJob(job)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90"
                          >
                            <MailPlus className="h-3.5 w-3.5" />
                            Draft apply
                          </button>
                        ) : (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open job
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          )}
      </div>

      <div className="fixed inset-x-4 bottom-4 z-40 md:left-72 md:right-8">
        <CommandSearchPanel
          query={query}
          location={location}
          loading={loading}
          setQuery={setQuery}
          setLocation={setLocation}
          search={search}
          variant="dock"
        />
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

function ExecutionInspector({
  steps,
  browserSession,
  currentState,
}: {
  steps: Step[]
  browserSession: LiveBrowserSession | null
  currentState: AgentState
}) {
  return (
    <aside className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <div className="mb-4 flex items-center gap-2">
        <Globe2 className="h-4 w-4 text-[var(--color-accent)]" />
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Execution inspector</h2>
      </div>
      <div className="space-y-3 text-xs">
        <InspectorRow label="State" value={currentState.replace(/_/g, ' ')} />
        <InspectorRow label="Session" value={browserSession ? browserSession.session_id.slice(0, 8) : 'pending'} />
        <InspectorRow label="DOM target" value="job boards + career pages" />
        <InspectorRow label="Retry mode" value="best-effort preview" />
      </div>
      <div className="mt-4 border-t border-[var(--color-border)] pt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Action history</p>
        <div className="space-y-2">
          {steps.length ? steps.slice(-5).map((step, index) => (
            <div key={`${step.message}-${index}`} className="flex gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className={cn(
                'mt-1 h-2 w-2 shrink-0 rounded-full',
                step.status === 'error' ? 'bg-red-300' : step.status === 'done' ? 'bg-green-300' : 'animate-pulse bg-blue-300',
              )} />
              <span className="leading-5">{step.message}</span>
            </div>
          )) : (
            <p className="text-xs text-[var(--color-text-muted)]">Waiting for the first action.</p>
          )}
        </div>
      </div>
    </aside>
  )
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="truncate text-right capitalize text-[var(--color-text-primary)]">{value}</span>
    </div>
  )
}

function JobIntelligenceStrip({ intelligence }: { intelligence: JobIntelligence }) {
  const metrics = [
    { label: 'Match', value: intelligence.matchScore, danger: false },
    { label: 'Quality', value: intelligence.qualityScore, danger: false },
    { label: 'Ghost risk', value: intelligence.ghostRisk, danger: true },
    { label: 'Recruiter', value: intelligence.recruiterSignal, danger: false },
  ]

  return (
    <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="grid gap-2 sm:grid-cols-4">
        {metrics.map(metric => {
          const good = metric.danger ? metric.value <= 35 : metric.value >= 70
          const mixed = metric.danger ? metric.value > 35 && metric.value <= 60 : metric.value >= 45 && metric.value < 70
          return (
            <div key={metric.label}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] text-[var(--color-text-muted)]">{metric.label}</span>
                <span className={cn('text-[11px] font-semibold', good ? 'text-[var(--color-accent)]' : mixed ? 'text-amber-300' : 'text-red-300')}>
                  {metric.value}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn('h-full rounded-full', good ? 'bg-[var(--color-accent)]' : mixed ? 'bg-amber-300' : 'bg-red-300')}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {intelligence.reasons.slice(0, 3).map(reason => (
          <span key={reason} className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[10px] text-[var(--color-text-muted)]">
            {reason}
          </span>
        ))}
        {intelligence.risks.slice(0, 2).map(risk => (
          <span key={risk} className="inline-flex items-center gap-1 rounded-md border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[10px] text-amber-100">
            <AlertTriangle className="h-3 w-3" />
            {risk}
          </span>
        ))}
      </div>
    </div>
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

function CommandSearchPanel({
  query,
  location,
  loading,
  setQuery,
  setLocation,
  search,
  autoFocus = false,
  variant,
}: {
  query: string
  location: string
  loading: boolean
  setQuery: (value: string) => void
  setLocation: (value: string) => void
  search: () => void
  autoFocus?: boolean
  variant: 'hero' | 'dock'
}) {
  const isHero = variant === 'hero'

  function submitFromKeyboard(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    search()
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className={cn(
        'border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-2xl shadow-black/25',
        isHero ? 'rounded-[1.75rem] p-4 sm:p-5' : 'rounded-[1.5rem] p-3 backdrop-blur'
      )}>
        <div className="relative">
          <textarea
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={submitFromKeyboard}
            placeholder="Search backend jobs, remote frontend roles, PM internships..."
            rows={isHero ? 3 : 1}
            autoFocus={autoFocus}
            className={cn(
              'w-full resize-none border-0 bg-transparent text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]',
              isHero ? 'min-h-28 text-lg leading-7' : 'min-h-11 pr-12 text-sm leading-6'
            )}
          />

          {!isHero && (
            <button
              type="button"
              onClick={search}
              disabled={!query.trim() || loading}
              aria-label="Search jobs"
              className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-border)] pt-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                value={location}
                onChange={event => setLocation(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && search()}
                placeholder="Location filter"
                className="h-9 w-full rounded-xl border border-[var(--color-border)] bg-black/20 pl-9 pr-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]/55"
              />
            </label>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            {isHero && (
              <button
                type="button"
                onClick={search}
                disabled={!query.trim() || loading}
                className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />}
                Search jobs
                {!loading && <ArrowUp className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {isHero && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PROMPT_SUGGESTIONS.map(({ label, value, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setQuery(value)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/35 hover:text-[var(--color-text-primary)]"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
