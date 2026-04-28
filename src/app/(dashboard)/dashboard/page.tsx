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
import {
  FileText,
  Briefcase,
  TrendingUp,
  Upload,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

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
    { label: 'Resumes Uploaded', value: resumeCount ?? 0, icon: FileText,   color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
    { label: 'Job Matches',      value: matchCount ?? 0,  icon: Briefcase,  color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Avg Match Score',  value: latestAudit ? `${latestAudit.overall_score}%` : '—', icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ]

  return (
    <div className="space-y-8">
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
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5"
          >
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick action — upload first resume */}
      {resumes.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[var(--color-border)] p-8 text-center">
          <Upload className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Upload your first resume</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Get AI-powered feedback and match it against thousands of job listings.
          </p>
          <Link
            href="/dashboard/resumes/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Upload className="w-4 h-4" />
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
              View all <ArrowRight className="w-3 h-3" />
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
                  <FileText className="w-4 h-4 flex-shrink-0 text-[var(--color-text-muted)]" />
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
              View all <ArrowRight className="w-3 h-3" />
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
                  <Briefcase className="w-4 h-4 flex-shrink-0 text-[var(--color-text-muted)]" />
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
  const map: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    processed: { label: 'Ready',      icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50'  },
    pending:   { label: 'Processing', icon: Clock,        className: 'text-amber-600  bg-amber-50'     },
    error:     { label: 'Error',      icon: AlertCircle,  className: 'text-red-600    bg-red-50'       },
  }
  const s = map[status] ?? map['pending']
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      <Icon className="w-3 h-3" />
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
