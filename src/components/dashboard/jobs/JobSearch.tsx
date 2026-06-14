'use client'

import { useCallback, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  ArrowUp,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarClock,
  ChevronDown,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Search,
  Wallet,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CoverLetterModal } from './CoverLetterModal'

interface Job {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  salary: string | null
  url: string
  source: string
  postedAt: string | null
  tags: string[]
  description: string
}

interface SourceResult {
  source: string
  status: 'ok' | 'error' | 'skipped'
  count: number
  error?: string
}

interface SearchResponse {
  jobs: Job[]
  sources: SourceResult[]
  totalBeforeFilter: number
}

type Phase = 'idle' | 'searching' | 'done' | 'error'

const RECENCY = [
  { days: 1, label: 'Last 24 hours' },
  { days: 3, label: 'Last 3 days' },
  { days: 7, label: 'Last week' },
  { days: 30, label: 'Last month' },
]

const SUGGESTIONS = [
  { icon: Zap, label: 'Frontend roles posted today', query: 'frontend engineer', days: 1 },
  { icon: Search, label: 'Remote Python jobs this week', query: 'python developer remote', days: 7 },
  { icon: Search, label: 'React developer roles', query: 'react developer', days: 7 },
  { icon: Search, label: 'Backend engineer jobs', query: 'backend engineer', days: 7 },
]

export function JobSearch({ firstName }: { firstName?: string }) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [recency, setRecency] = useState(7)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [coverLetterJob, setCoverLetterJob] = useState<Job | null>(null)

  const selected = useMemo(
    () => result?.jobs.find(j => j.id === selectedId) ?? null,
    [result, selectedId],
  )

  const runSearch = useCallback(async (
    overrides?: { query?: string; days?: number },
  ) => {
    const q = (overrides?.query ?? query).trim()
    const days = overrides?.days ?? recency
    if (q.length < 2 || phase === 'searching') return

    if (overrides?.query) setQuery(overrides.query)
    if (overrides?.days) setRecency(overrides.days)

    setPhase('searching')
    setError('')
    setResult(null)
    setSelectedId(null)

    try {
      const res = await fetch('/api/v1/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, location: location.trim() || undefined, recencyDays: days }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Search failed')

      const data = body as SearchResponse
      setResult(data)
      setSelectedId(data.jobs[0]?.id ?? null)
      setPhase('done')
    } catch (err) {
      setError((err as Error).message)
      setPhase('error')
    }
  }, [query, location, recency, phase])

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') runSearch()
  }

  async function saveJob(job: Job) {
    if (savedIds.has(job.id)) return
    setSavedIds(prev => new Set(prev).add(job.id))
    const res = await fetch('/api/v1/applications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_title: job.title, company: job.company, job_url: job.url, status: 'saved' }),
    })
    if (!res.ok) {
      setSavedIds(prev => {
        const next = new Set(prev)
        next.delete(job.id)
        return next
      })
    }
  }

  const isHero = phase === 'idle'
  const recencyLabel = RECENCY.find(r => r.days === recency)?.label ?? 'Last week'

  const promptBox = (
    <div className={cn(
      'rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[0_8px_40px_rgba(0,0,0,0.35)] transition-colors focus-within:border-[var(--color-accent)]/40',
      isHero ? 'p-2' : 'p-1.5',
    )}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Describe the role you want — e.g. senior React developer, remote"
        className={cn(
          'w-full bg-transparent px-4 text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]',
          isHero ? 'py-4 text-base' : 'py-2.5 text-sm',
        )}
        autoFocus
      />

      <div className="flex items-center justify-between gap-2 px-2 pb-1">
        <div className="flex items-center gap-1.5">
          {/* Recency selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] data-[popup-open]:border-[var(--color-accent)]/40"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              {recencyLabel}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {RECENCY.map(r => (
                <DropdownMenuItem key={r.days} onClick={() => setRecency(r.days)}>
                  {r.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Location */}
          <div className="hidden items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 sm:flex">
            <MapPin className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Anywhere"
              className="w-20 bg-transparent text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:w-28 transition-all"
            />
          </div>
        </div>

        <Button
          size="icon"
          onClick={() => runSearch()}
          disabled={phase === 'searching' || query.trim().length < 2}
          className="rounded-full"
          aria-label="Search"
        >
          {phase === 'searching' ? <Loader2 className="animate-spin" /> : <ArrowUp />}
        </Button>
      </div>
    </div>
  )

  /* ── Hero (idle) ─────────────────────────────────────────── */
  if (isHero) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          <h1 className="animate-reveal-up text-center text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            {firstName ? `Where to next, ${firstName}?` : 'Find your next role.'}
          </h1>
          <p className="animate-reveal-up mt-2 text-center text-sm text-[var(--color-text-muted)]" style={{ animationDelay: '60ms' }}>
            Live postings from real job boards — save roles and generate a cover letter in one click.
          </p>

          <div className="animate-reveal-up mt-8" style={{ animationDelay: '120ms' }}>
            {promptBox}
          </div>

          <div className="animate-reveal-up mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ animationDelay: '200ms' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s.label}
                onClick={() => runSearch({ query: s.query, days: s.days })}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3.5 text-left text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-text-primary)]"
              >
                <s.icon className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Working / results view ──────────────────────────────── */
  return (
    <div className="flex h-full flex-col gap-4">
      {promptBox}

      {/* Source telemetry */}
      {result && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 font-mono text-[11px]">
          {result.sources.map(s => (
            <span key={s.source} className="inline-flex items-center gap-1.5" title={s.error}>
              <span className={cn(
                'h-1.5 w-1.5 rounded-full',
                s.status === 'ok' && s.count > 0 ? 'bg-[var(--color-accent)]' :
                s.status === 'ok' ? 'bg-[var(--color-text-muted)]' :
                s.status === 'skipped' ? 'bg-[var(--color-text-muted)]/40' : 'bg-red-400',
              )} />
              <span className="text-[var(--color-text-secondary)]">{s.source}</span>
              <span className="text-[var(--color-text-muted)]">
                {s.status === 'ok' ? s.count : s.status === 'skipped' ? 'off' : 'err'}
              </span>
            </span>
          ))}
          <a href="/dashboard/applications" className="ml-auto text-[var(--color-accent)] hover:underline">
            Tracker ↗
          </a>
        </div>
      )}

      {phase === 'searching' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(320px,2fr)_3fr]">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
          <Skeleton className="hidden min-h-[400px] rounded-2xl lg:block" />
        </div>
      )}

      {phase === 'error' && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-6 text-sm text-red-300">{error}</div>
      )}

      {phase === 'done' && result && result.jobs.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-16 text-center">
          <p className="text-base font-semibold text-[var(--color-text-primary)]">No jobs in this window</p>
          <p className="max-w-md text-sm text-[var(--color-text-muted)]">
            {result.totalBeforeFilter > 0
              ? `${result.totalBeforeFilter} matches exist but none posted within "${recencyLabel}". Widen the window and retry.`
              : 'Try a broader query or different keywords.'}
          </p>
        </div>
      )}

      {phase === 'done' && result && result.jobs.length > 0 && (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(320px,2fr)_3fr]">
          <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-none">
            <p className="px-1 font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
              {result.jobs.length} roles · {recencyLabel.toLowerCase()}
            </p>
            {result.jobs.map((job, i) => (
              <button
                key={job.id}
                onClick={() => setSelectedId(job.id)}
                style={{ animationDelay: `${Math.min(i * 30, 360)}ms` }}
                className={cn(
                  'animate-job-card-in rounded-xl border p-3.5 text-left transition-colors',
                  selectedId === job.id
                    ? 'border-[var(--color-accent)]/50 bg-[var(--color-accent)]/[0.06]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-text-muted)]/30',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-semibold text-[var(--color-text-primary)]">{job.title}</p>
                  {savedIds.has(job.id) && (
                    <Badge className="shrink-0 bg-[var(--color-accent)]/15 font-mono text-[10px] text-[var(--color-accent)]">saved</Badge>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
                  {job.company}{job.location ? ` · ${job.location}` : ''}
                </p>
                <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-muted)]">
                  <span className="rounded border border-[var(--color-border)] px-1.5 py-0.5">{job.source}</span>
                  {job.postedAt && <span>{relativeTime(job.postedAt)}</span>}
                  {job.salary && <span className="truncate text-[var(--color-accent)]/80">{job.salary}</span>}
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <article className="flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] lg:sticky lg:top-4">
              <header className="border-b border-[var(--color-border)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-snug text-[var(--color-text-primary)]">{selected.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                      <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{selected.company}</span>
                      {selected.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{selected.location}</span>}
                      {selected.postedAt && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{relativeTime(selected.postedAt)}</span>}
                      {selected.salary && <span className="inline-flex items-center gap-1.5 text-[var(--color-accent)]"><Wallet className="h-3.5 w-3.5" />{selected.salary}</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-mono text-[10px] text-[var(--color-text-muted)]">
                    {selected.source}
                  </Badge>
                </div>

                {selected.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selected.tags.map(t => (
                      <Badge key={t} variant="secondary" className="text-[11px] font-normal text-[var(--color-text-secondary)]">{t}</Badge>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <Button
                    className="rounded-xl font-semibold"
                    onClick={() => saveJob(selected)}
                    render={<a href={selected.url} target="_blank" rel="noopener noreferrer" />}
                  >
                    <ArrowUpRight />
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => saveJob(selected)}
                    className={cn(
                      'rounded-xl',
                      savedIds.has(selected.id) && 'border-[var(--color-accent)]/40 text-[var(--color-accent)]',
                    )}
                  >
                    {savedIds.has(selected.id) ? <BookmarkCheck /> : <Bookmark />}
                    {savedIds.has(selected.id) ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setCoverLetterJob(selected)}
                  >
                    <FileText />
                    Cover letter
                  </Button>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <pre className="whitespace-pre-wrap font-[var(--font-body)] text-sm leading-7 text-[var(--color-text-secondary)]">
                  {selected.description || 'No description provided by the source — open the original posting.'}
                </pre>
              </div>
            </article>
          )}
        </div>
      )}

      {coverLetterJob && (
        <CoverLetterModal job={coverLetterJob} onClose={() => setCoverLetterJob(null)} />
      )}
    </div>
  )
}

function relativeTime(iso: string): string {
  const diff = Date.now() - Date.parse(iso)
  if (Number.isNaN(diff) || diff < 0) return ''
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 31) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}
