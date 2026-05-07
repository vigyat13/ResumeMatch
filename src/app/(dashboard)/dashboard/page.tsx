/**
 * DASHBOARD HOME PAGE
 *
 * Server Component — fetches real data at request time.
 * No 'use client' needed because there's no interactivity here.
 * The stat cards and recent items are just rendered HTML.
 *
 * Architecture pattern — Page = data fetching, Component = rendering:
 * Pages are responsible for fetching data and passing it to components.
 * Components just render what they receive — they don't know about Supabase.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel fetches — Promise.all runs both queries simultaneously
  // instead of waterfall (resume fetch → then match fetch)
  const [resumesResult, matchesResult, auditsResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, file_name, parsing_status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('job_matches')
      .select('id, job_title, company, match_percentage, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('audit_reports')
      .select('id, overall_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  const resumes = resumesResult.data ?? []
  const matches = matchesResult.data ?? []
  const latestAudit = auditsResult.data?.[0] ?? null

  // Aggregate stats for the stat cards
  const { count: resumeCount }  = await supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  const { count: matchCount }   = await supabase.from('job_matches').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', user.id)
    .single()

  const totalResumes = resumeCount ?? 0
  const totalMatches = matchCount ?? 0
  const latestScore = latestAudit?.overall_score ?? null
  const firstName = profile?.first_name?.trim()
  const nextAction = getNextAction({
    resumeCount: totalResumes,
    hasAudit: Boolean(latestAudit),
    matchCount: totalMatches,
  })

  const stats = [
    {
      label: 'Resumes',
      value: totalResumes,
      helper: totalResumes > 0 ? `${resumes.length} shown here` : 'Start with builder or upload',
      marker: '01',
    },
    {
      label: 'Job Matches',
      value: totalMatches,
      helper: totalMatches > 0 ? 'Review your latest fits' : 'Add a JD to compare',
      marker: '02',
    },
    {
      label: 'Latest ATS Score',
      value: latestScore !== null ? `${latestScore}%` : '—',
      helper: latestScore !== null ? scoreCopy(latestScore) : 'Run an audit after upload',
      marker: '03',
    },
  ]

  return (
    <div className="space-y-7 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(101,211,158,0.16),rgba(7,13,10,0.96)_42%,rgba(9,9,9,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
                Workspace
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                Builder live
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                ATS checks
              </span>
            </div>
            <p className="mb-3 text-sm font-medium text-[var(--color-text-muted)]">
              ResumeMatch dashboard
            </p>
            <h1
              className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl"
              style={{ fontFamily: 'var(--font-headline), sans-serif' }}
            >
              Welcome back{firstName ? `, ${firstName}` : ''}. Build the next version of your CV.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
              Keep resumes, audits, and job matches in one place. Start with a clean template, upload an existing CV, then use the dashboard to track what needs work.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/builder"
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
              >
                Open builder
              </Link>
              <Link
                href="/dashboard/resumes"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-white/[0.08]"
              >
                Upload resume
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Next best action
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
              {nextAction.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              {nextAction.description}
            </p>
            <Link
              href={nextAction.href}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-[var(--color-accent)]/35 bg-[var(--color-accent)]/10 px-4 py-3 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/15"
            >
              {nextAction.cta}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, helper, marker }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 transition-colors hover:border-[var(--color-accent)]/35"
          >
            <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-[var(--color-accent)]/[0.06] transition-colors group-hover:bg-[var(--color-accent)]/[0.1]" />
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--color-accent)]">{marker}</p>
            <p className="mt-8 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)]">{value}</p>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Quick launch
          </p>
          <div className="mt-5 grid gap-3">
            <QuickAction
              href="/builder"
              title="Create a resume"
              description="Use a production-ready template and export a clean PDF."
              marker="Build"
            />
            <QuickAction
              href="/dashboard/resumes"
              title="Upload for audit"
              description="Keep uploaded resumes organized and run checks from one place."
              marker="Audit"
            />
            <QuickAction
              href="/dashboard/templates"
              title="Browse templates"
              description="Pick layouts built for readable, ATS-friendly resumes."
              marker="Pick"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[radial-gradient(circle_at_top_left,rgba(101,211,158,0.12),transparent_30%),var(--color-surface-raised)] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
                Progress
              </p>
              <h2 className="mt-3 text-xl font-semibold text-[var(--color-text-primary)]">
                Your resume pipeline
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
                The dashboard should tell you what to do next without hunting through pages. Use this flow to move from resume to job match.
              </p>
            </div>
            <Link
              href="/dashboard/resumes"
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent)]/40"
            >
              Manage resumes
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <PipelineStep done={totalResumes > 0} label="Resume added" value={totalResumes > 0 ? `${totalResumes} total` : 'Not yet'} />
            <PipelineStep done={Boolean(latestAudit)} label="Audit ready" value={latestScore !== null ? `${latestScore}% score` : 'Pending'} />
            <PipelineStep done={totalMatches > 0} label="Jobs matched" value={totalMatches > 0 ? `${totalMatches} found` : 'Not yet'} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">Recent resumes</h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Latest files and parsing state</p>
            </div>
            <Link
              href="/dashboard/resumes"
              className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] transition-colors hover:border-[var(--color-accent)]/40"
            >
              View all
            </Link>
          </div>

          {resumes.length === 0 ? (
            <EmptyState
              title="No resumes yet"
              description="Create one in the builder or upload an existing PDF to begin tracking audits."
              href="/builder"
              cta="Create resume"
            />
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {resumes.map((resume) => (
                <li key={resume.id} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.025]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-black/20 text-xs font-semibold text-[var(--color-accent)]">
                    CV
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {resume.file_name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatDate(resume.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={resume.parsing_status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">Recent job matches</h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Role fit and match strength</p>
            </div>
            <Link
              href="/dashboard/matches"
              className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] transition-colors hover:border-[var(--color-accent)]/40"
            >
              View all
            </Link>
          </div>

          {matches.length === 0 ? (
            <EmptyState
              title="No matches yet"
              description="Once a job description is added, matches will appear here with a fit score."
              href="/dashboard/matches"
              cta="Open matches"
            />
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {matches.map((match) => (
                <li key={match.id} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.025]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-black/20 text-xs font-semibold text-[var(--color-accent)]">
                    JD
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {match.job_title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{match.company ?? ''}</p>
                  </div>
                  <ScoreBadge score={match.match_percentage ?? 0} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function QuickAction({
  href,
  title,
  description,
  marker,
}: {
  href: string
  title: string
  description: string
  marker: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[var(--color-border)] bg-black/15 p-4 transition-colors hover:border-[var(--color-accent)]/40 hover:bg-black/25"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          {marker}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{description}</p>
        </div>
        <span className="text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1">→</span>
      </div>
    </Link>
  )
}

function PipelineStep({ done, label, value }: { done: boolean; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-black/15 p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className={`h-2.5 w-2.5 rounded-full ${done ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          {done ? 'Done' : 'Open'}
        </span>
      </div>
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{value}</p>
    </div>
  )
}

function EmptyState({
  title,
  description,
  href,
  cta,
}: {
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs font-bold text-[var(--color-accent)]">
        RM
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center justify-center rounded-full border border-[var(--color-accent)]/35 px-4 py-2 text-xs font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10"
      >
        {cta}
      </Link>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    processed: { label: 'Ready', className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' },
    completed: { label: 'Ready', className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' },
    pending: { label: 'Queued', className: 'border-amber-400/20 bg-amber-400/10 text-amber-300' },
    processing: { label: 'Parsing', className: 'border-sky-400/20 bg-sky-400/10 text-sky-300' },
    error: { label: 'Error', className: 'border-red-400/20 bg-red-400/10 text-red-300' },
    failed: { label: 'Failed', className: 'border-red-400/20 bg-red-400/10 text-red-300' },
  }
  const s = map[status] ?? map['pending']
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
              : score >= 60 ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
              :               'border-red-400/20 bg-red-400/10 text-red-300'
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${color}`}>
      {score}%
    </span>
  )
}

function formatDate(date: string | null) {
  if (!date) return 'Recently'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function scoreCopy(score: number) {
  if (score >= 85) return 'Strong resume signal'
  if (score >= 70) return 'Good, still improvable'
  if (score >= 50) return 'Needs focused cleanup'
  return 'Needs a stronger rewrite'
}

function getNextAction({
  resumeCount,
  hasAudit,
  matchCount,
}: {
  resumeCount: number
  hasAudit: boolean
  matchCount: number
}) {
  if (resumeCount === 0) {
    return {
      title: 'Create your first resume',
      description: 'Start with the builder if you want a clean A4 CV, or upload an existing resume from the resumes page.',
      href: '/builder',
      cta: 'Start building',
    }
  }

  if (!hasAudit) {
    return {
      title: 'Run your first audit',
      description: 'You have a resume uploaded. The next step is checking structure, keywords, and ATS readability.',
      href: '/dashboard/resumes',
      cta: 'Open resumes',
    }
  }

  if (matchCount === 0) {
    return {
      title: 'Compare against a job',
      description: 'Add a job description so ResumeMatch can show gaps between your CV and the target role.',
      href: '/dashboard/matches',
      cta: 'Add job match',
    }
  }

  return {
    title: 'Review latest matches',
    description: 'Your setup has resumes, audits, and matches. Review the best roles and improve the weak spots.',
    href: '/dashboard/matches',
    cta: 'Review matches',
  }
}
