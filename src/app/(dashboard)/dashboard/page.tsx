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

  const stats = [
    { label: 'Resumes Uploaded', value: resumeCount ?? 0, marker: '01' },
    { label: 'Job Matches',      value: matchCount ?? 0,  marker: '02' },
    { label: 'Avg Match Score',  value: latestAudit ? `${latestAudit.overall_score}%` : '—', marker: '03' },
  ]

  return (
    <div className="space-y-8">

      {/* Beta notice */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 flex items-start gap-3">
        <span className="mt-0.5 text-lg">🚧</span>
        <div>
          <p className="text-sm font-semibold text-foreground">Dashboard is in early access</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            The resume builder is fully live. Job matching, uploads, and settings are being rolled out shortly.{' '}
            <Link href="/builder" className="text-primary font-medium hover:underline">Go build a resume →</Link>
          </p>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}
        </h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Here&apos;s what&apos;s happening with your job search.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, marker }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5"
          >
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--color-accent)] mb-8">{marker}</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick action — upload first resume */}
      {resumes.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-[var(--color-accent)] mb-4">START HERE</p>
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Upload your first resume</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Get AI-powered feedback and match it against thousands of job listings.
          </p>
          <Link
            href="/dashboard/resumes/upload"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Upload Resume
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent resumes */}
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Recent Resumes</h2>
            <Link
              href="/dashboard/resumes"
              className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
            >
              View all →
            </Link>
          </div>

          {resumes.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--color-text-muted)] text-center">
              No resumes yet. Upload one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {resumes.map((resume) => (
                <li key={resume.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {resume.file_name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <StatusBadge status={resume.parsing_status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent job matches */}
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Recent Job Matches</h2>
            <Link
              href="/dashboard/matches"
              className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
            >
              View all →
            </Link>
          </div>

          {matches.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--color-text-muted)] text-center">
              No job matches yet. Upload a resume and add a job description.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {matches.map((match) => (
                <li key={match.id} className="flex items-center gap-3 px-5 py-3">
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    processed: { label: 'Ready',      className: 'text-emerald-600 bg-emerald-50' },
    pending:   { label: 'Processing', className: 'text-amber-600 bg-amber-50' },
    error:     { label: 'Error',      className: 'text-red-600 bg-red-50' },
  }
  const s = map[status] ?? map['pending']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-600 bg-emerald-50'
              : score >= 60 ? 'text-amber-600   bg-amber-50'
              :               'text-red-600     bg-red-50'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {score}%
    </span>
  )
}
