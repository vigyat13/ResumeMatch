'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { BrowserSimulator, type BrowserPhase } from './BrowserSimulator'
import { ApplyModal } from './ApplyModal'

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

  const toggleApplied = useCallback((id: string) => {
    setApplied(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem('rm_applied_jobs', JSON.stringify([...next]))
      return next
    })
  }, [])

  const search = useCallback(async () => {
    if (!query.trim() || loading) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setSteps([])
    setJobs([])
    setLimitError(null)
    setPhase(1)

    try {
      const res = await fetch('/api/v1/jobs/search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: query.trim(), location: location.trim() || undefined }),
        signal:  ctrl.signal,
      })

      if (res.status === 429) {
        const json = await res.json().catch(() => ({}))
        setLimitError({ message: json.error ?? 'Daily limit reached.', upgrade: !!json.upgradeRequired })
        return
      }

      if (!res.ok || !res.body) {
        setSteps([{ message: 'Search failed. Check RAPIDAPI_KEY.', status: 'error' }])
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
              setJobs(msg.data)
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

  useEffect(() => () => { abortRef.current?.abort() }, [])

  const hasResults = jobs.length > 0
  const hasSteps   = steps.length > 0

  return (
    <>
    <div className="flex h-full flex-col gap-6">

      {/* Prompt bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="What job are you looking for? e.g. Frontend Developer"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 pr-12 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
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
          placeholder="Location (e.g. Bangalore)"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all sm:w-52"
        />
        <button
          onClick={search}
          disabled={!query.trim() || loading}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Searching…' : 'Search Jobs'}
        </button>
      </div>

      {/* Rate limit status */}
      {rateLimit && (
        <p className="text-xs text-[var(--color-text-muted)]">
          {rateLimit.remaining} / {rateLimit.limit} searches remaining today
        </p>
      )}

      {/* Rate limit error */}
      {limitError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {limitError.message}
          {limitError.upgrade && (
            <a href="/dashboard/settings?tab=billing" className="ml-2 underline font-medium">
              Upgrade to Pro
            </a>
          )}
        </div>
      )}

      {/* Body */}
      {!hasSteps && !hasResults && !limitError && (
        <EmptyState />
      )}

      {(hasSteps || hasResults) && (
        <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:items-start">

          {/* Browser simulator */}
          {hasSteps && (
            <div className="flex flex-col gap-3">
              <BrowserSimulator
                phase={phase}
                query={query}
                location={location || undefined}
                previewJobs={jobs.slice(0, 4)}
              />
              {hasResults && (
                <p className="text-xs text-[var(--color-text-muted)] text-center">
                  {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
                  {applied.size > 0 && ` · ${applied.size} applied`}
                </p>
              )}
            </div>
          )}

          {/* Job cards */}
          {hasResults && (
            <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 content-start">
              {jobs.map(job => {
                const isApplied = applied.has(job.id)
                const salary    = formatSalary(job)
                return (
                  <div
                    key={job.id}
                    className={cn(
                      'flex flex-col gap-3 rounded-xl border p-4 transition-all',
                      isApplied
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/40'
                    )}
                  >
                    {/* Header */}
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
                          {job.company.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-sm text-[var(--color-text-primary)]">{job.title}</p>
                        <p className="truncate text-xs text-[var(--color-text-secondary)]">{job.company}</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                        <LocationIcon className="h-3 w-3 shrink-0" />
                        {job.is_remote ? 'Remote' : job.location}
                      </span>
                      {salary && (
                        <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                          <span>·</span>
                          {salary}
                        </span>
                      )}
                      <span className="ml-auto text-[var(--color-text-muted)]">{timeAgo(job.posted_at)}</span>
                    </div>

                    {/* Snippet */}
                    {job.description_snippet && (
                      <p className="line-clamp-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
                        {job.description_snippet}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="mt-auto flex items-center gap-2 pt-1">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', sourceBadge(job.source))}>
                        {job.source}
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => toggleApplied(job.id)}
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                            isApplied
                              ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                          )}
                        >
                          {isApplied ? '✓ Applied' : 'Mark Applied'}
                        </button>
                        {hasEmailApply(job.url, job.description_snippet) ? (
                          <button
                            onClick={() => setApplyJob(job)}
                            className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 transition-opacity"
                          >
                            Auto Apply
                          </button>
                        ) : (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 transition-opacity"
                          >
                            View Job
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
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

function hasEmailApply(url: string, snippet: string): boolean {
  if (url.startsWith('mailto:')) return true
  return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(snippet)
}

function EmptyState() {
  const examples = [
    'Frontend Developer, Bangalore',
    'Product Manager, Remote',
    'Backend Engineer, Mumbai',
    'Data Scientist, Hyderabad',
  ]
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-3xl">
        🔍
      </div>
      <div>
        <p className="text-lg font-semibold text-[var(--color-text-primary)]">Search any job</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Real-time results from LinkedIn, Indeed, Glassdoor & more</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {examples.map(ex => (
          <span
            key={ex}
            className="cursor-default rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]"
          >
            {ex}
          </span>
        ))}
      </div>
    </div>
  )
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}


function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
