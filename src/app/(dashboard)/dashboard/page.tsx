import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  FilePlus2,
  FileText,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type Activity = {
  at: string | null
  text: string
  href: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    resumesResult,
    auditsResult,
    resumeCountResult,
    matchesCountResult,
    latestMatchesResult,
    applicationsCountResult,
    interviewCountResult,
    latestApplicationsResult,
    profileResult,
  ] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, file_name, parsing_status, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('audit_reports')
      .select('id, resume_id, overall_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2),

    supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null),

    supabase
      .from('job_matches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null),

    supabase
      .from('job_matches')
      .select('id, job_title, company, match_percentage, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('tracked_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),

    supabase
      .from('tracked_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'interview'),

    supabase
      .from('tracked_applications')
      .select('id, job_title, company, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('profiles')
      .select('first_name, subscription_tier')
      .eq('id', user.id)
      .single(),
  ])

  const resumes = resumesResult.data ?? []
  const audits = auditsResult.data ?? []
  const latestAudit = audits[0] ?? null
  const previousAudit = audits[1] ?? null
  const latestResume = resumes[0] ?? null
  const latestScore = latestAudit?.overall_score ?? null
  const healthScore = latestScore ?? 0
  const healthDelta = latestScore !== null && previousAudit?.overall_score !== null
    ? latestScore - previousAudit.overall_score
    : null
  const firstName = profileResult.data?.first_name?.trim() || user.email?.split('@')[0] || 'there'
  const tier = profileResult.data?.subscription_tier ?? 'free'
  const planLabel = tier === 'enterprise' ? 'Enterprise' : tier === 'pro' ? 'Pro' : 'Free'
  const resumeCount = resumeCountResult.count ?? resumes.length
  const matchCount = matchesCountResult.count ?? 0
  const applicationCount = applicationsCountResult.count ?? 0
  const interviewCount = interviewCountResult.count ?? 0
  const atsScore = latestScore !== null ? `${latestScore}%` : '-'
  const completeness = resumeCount > 0 ? (latestScore !== null ? 95 : 65) : 0
  const freshness = latestResume?.created_at ? timeAgo(latestResume.created_at) : '-'
  const nextAction = getNextAction({
    resumeCount,
    latestResume,
    latestScore,
  })
  const pipeline = [
    { label: 'Create', done: resumeCount > 0 },
    { label: 'Audit', done: latestScore !== null },
    { label: 'Match', done: matchCount > 0 },
    { label: 'Apply', done: applicationCount > 0 },
  ]
  const completedSteps = pipeline.filter(step => step.done).length
  const activities = buildActivities({
    resumes,
    audits,
    matches: latestMatchesResult.data ?? [],
    applications: latestApplicationsResult.data ?? [],
  })

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Dashboard
          </p>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-normal text-[var(--color-text-primary)]">
            Welcome, {firstName}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HeaderPill
            label="Resume Health"
            value={latestScore !== null ? `${healthScore}` : '-'}
            delta={healthDelta}
          />
          <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-sm font-semibold text-[var(--color-text-primary)]">
            <BadgeCheck className="h-4 w-4 text-[var(--color-accent)]" />
            {planLabel}
          </span>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <PanelEyebrow>Resume Health</PanelEyebrow>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Latest resume signal from your audit and library state.
              </p>
            </div>
            <Gauge className="h-5 w-5 text-[var(--color-accent)]" />
          </div>

          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <span className="text-4xl font-semibold tabular-nums text-[var(--color-text-primary)]">
                {latestScore !== null ? healthScore : '-'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {healthDelta === null ? 'No previous audit yet' : `${formatDelta(healthDelta)} from last audit`}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                {latestResume ? latestResume.file_name : 'Add a resume to start measuring health.'}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <MetricRow label="ATS Score" value={atsScore} />
            <MetricRow label="Completn." value={`${completeness}%`} />
            <MetricRow label="Freshness" value={freshness} />
          </div>
        </Panel>

        <Panel>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <PanelEyebrow>Next Best Action</PanelEyebrow>
              <h2 className="mt-3 text-xl font-semibold tracking-normal text-[var(--color-text-primary)]">
                {nextAction.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                {nextAction.description}
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
          </div>

          <Link
            href={nextAction.href}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            {nextAction.cta}
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          <div className="mt-6 border-t border-[var(--color-border)] pt-5">
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)]"
                style={{ width: `${(completedSteps / pipeline.length) * 100}%` }}
              />
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              {completedSteps} of {pipeline.length} steps done
            </p>
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard value={resumeCount} label="Resumes" icon={<FileText className="h-4 w-4" />} />
        <StatCard value={atsScore} label="ATS Score" icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard value={applicationCount} label="Applications" icon={<BriefcaseBusiness className="h-4 w-4" />} />
        <StatCard value={interviewCount} label="Interviews" icon={<ClipboardCheck className="h-4 w-4" />} />
      </section>

      <Panel>
        <div className="mb-5 flex items-center justify-between gap-3">
          <PanelEyebrow>Recent Activity</PanelEyebrow>
          <Link
            href="/dashboard/applications"
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            View all
          </Link>
        </div>
        {activities.length ? (
          <ul className="space-y-3">
            {activities.map((activity, index) => (
              <li key={`${activity.text}-${index}`}>
                <Link
                  href={activity.href}
                  className="flex gap-3 rounded-lg px-1 py-1 text-sm transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  <span className="w-16 shrink-0 text-[var(--color-text-muted)]">
                    {timeAgo(activity.at)}
                  </span>
                  <span className="min-w-0 truncate text-[var(--color-text-secondary)]">
                    {activity.text}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            Activity will appear after you upload, audit, match, or track applications.
          </p>
        )}
      </Panel>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <PanelEyebrow>Resume Pipeline</PanelEyebrow>
          <div className="mt-6 flex items-center">
            {pipeline.map((step, index) => (
              <div key={step.label} className="flex flex-1 items-center last:flex-none">
                <div>
                  <span className={`block h-4 w-4 rounded-full border ${step.done ? 'border-[var(--color-accent)] bg-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`} />
                  <p className="mt-3 text-xs font-medium text-[var(--color-text-muted)]">
                    {step.label}
                  </p>
                </div>
                {index < pipeline.length - 1 && (
                  <span className={`mx-3 h-px flex-1 ${pipeline[index + 1].done ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
                )}
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelEyebrow>Quick Actions</PanelEyebrow>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <QuickAction href="/builder" icon={<FilePlus2 className="h-4 w-4" />} label="New Resume" />
            <QuickAction href={latestResume ? `/dashboard/resumes/${latestResume.id}/audit` : '/dashboard/resumes'} icon={<ShieldCheck className="h-4 w-4" />} label="Run Audit" />
            <QuickAction href="/dashboard/jobs" icon={<Search className="h-4 w-4" />} label="Find Jobs" />
          </div>
        </Panel>
      </section>
    </div>
  )
}

function HeaderPill({
  label,
  value,
  delta,
}: {
  label: string
  value: string
  delta: number | null
}) {
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-sm text-[var(--color-text-secondary)]">
      <span>{label}: <strong className="text-[var(--color-text-primary)]">{value}</strong></span>
      {delta !== null && (
        <span className={delta >= 0 ? 'text-[var(--color-accent)]' : 'text-red-300'}>
          {delta >= 0 ? '+' : ''}{delta}%
        </span>
      )}
    </span>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
      {children}
    </section>
  )
}

function PanelEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
      {children}
    </p>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">{value}</span>
    </div>
  )
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: number | string
  label: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <div className="mb-4 flex items-center justify-between text-[var(--color-text-muted)]">
        {icon}
      </div>
      <p className="text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-hover)]"
    >
      <span className="text-[var(--color-accent)]">{icon}</span>
      {label}
    </Link>
  )
}

function getNextAction({
  resumeCount,
  latestResume,
  latestScore,
}: {
  resumeCount: number
  latestResume: { id: string; file_name: string } | null
  latestScore: number | null
}) {
  if (resumeCount === 0) {
    return {
      title: 'Create your first resume',
      description: 'Start with a clean template, then return here for audits and matching.',
      href: '/builder',
      cta: 'New resume',
    }
  }

  if (latestScore === null && latestResume) {
    return {
      title: `Run ATS Audit on "${latestResume.file_name}"`,
      description: 'You have a resume ready. Audit it before matching or applying.',
      href: `/dashboard/resumes/${latestResume.id}/audit`,
      cta: 'Run audit',
    }
  }

  return {
    title: 'Find roles for your strongest resume',
    description: latestResume
      ? `Use "${latestResume.file_name}" to search and track relevant jobs.`
      : 'Search live roles and track applications from the jobs workspace.',
    href: '/dashboard/jobs',
    cta: 'Find jobs',
  }
}

function buildActivities({
  resumes,
  audits,
  matches,
  applications,
}: {
  resumes: Array<{ file_name: string; created_at: string | null }>
  audits: Array<{ overall_score: number | null; created_at: string | null }>
  matches: Array<{ job_title: string | null; company: string | null; created_at: string | null }>
  applications: Array<{ job_title: string | null; company: string | null; status: string; created_at: string | null }>
}): Activity[] {
  const items: Activity[] = [
    ...resumes.slice(0, 2).map(resume => ({
      at: resume.created_at,
      text: `Uploaded resume "${resume.file_name}"`,
      href: '/dashboard/resumes',
    })),
    ...audits.slice(0, 2).map(audit => ({
      at: audit.created_at,
      text: `ATS audit scored ${audit.overall_score ?? '-'}%`,
      href: '/dashboard/resumes',
    })),
    ...matches.slice(0, 2).map(match => ({
      at: match.created_at,
      text: `Matched with "${match.job_title ?? 'Untitled role'}${match.company ? ` at ${match.company}` : ''}"`,
      href: '/dashboard/jobs',
    })),
    ...applications.slice(0, 2).map(application => ({
      at: application.created_at,
      text: `${titleCase(application.status)} "${application.job_title ?? 'Untitled role'}${application.company ? ` at ${application.company}` : ''}"`,
      href: '/dashboard/applications',
    })),
  ]

  return items
    .sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime())
    .slice(0, 4)
}

function formatDelta(delta: number) {
  if (delta === 0) return 'No change'
  return `${delta > 0 ? '+' : ''}${delta}%`
}

function timeAgo(date: string | null) {
  if (!date) return 'recent'
  const diff = Date.now() - new Date(date).getTime()
  if (!Number.isFinite(diff) || diff < 0) return 'recent'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return minutes <= 1 ? 'now' : `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}
