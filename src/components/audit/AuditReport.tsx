'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Info,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { ScoreRing } from './ScoreRing'
import {
  AuditReport as AuditReportType,
  AuditIssue,
  AuditRecommendation,
  CATEGORY_META,
  scoreColor,
  scoreLabel,
  severityColor,
  priorityColor,
} from '@/types/audit'
import { cn } from '@/lib/utils'

interface Props {
  report: AuditReportType
  resumeId: string
  resumeName: string
}

type SeverityFilter = 'all' | 'high' | 'medium' | 'low'

export function AuditReport({ report, resumeId, resumeName }: Props) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [isPending, startTransition] = useTransition()
  const [reauditError, setReauditError] = useState<string | null>(null)
  const router = useRouter()

  const filteredIssues = report.issues.filter(
    issue => severityFilter === 'all' || issue.severity === severityFilter,
  )
  const criticalCount = report.issues.filter(issue => issue.severity === 'high').length
  const warningCount = report.issues.filter(issue => issue.severity === 'medium').length
  const infoCount = report.issues.filter(issue => issue.severity === 'low').length
  const weakestCategory = getWeakestCategory(report.category_scores)
  const gapToNext = getGapToNext(report.overall_score)

  async function handleReaudit() {
    setReauditError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/resumes/${resumeId}/audit`, { method: 'POST' })
        const body = await res.json()
        if (!res.ok) {
          setReauditError(body.error ?? 'Re-audit failed.')
          return
        }
        router.refresh()
      } catch {
        setReauditError('Network error. Please try again.')
      }
    })
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            ATS Audit
          </p>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-normal text-[var(--color-text-primary)]">
            {resumeName}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Last checked {formatDate(report.created_at)}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button
            type="button"
            onClick={handleReaudit}
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
            {isPending ? 'Running audit' : 'Re-audit'}
          </button>
          {reauditError && <p className="max-w-xs text-xs text-red-300">{reauditError}</p>}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Resume Health
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Overall parser and content readiness.
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-[var(--color-accent)]" />
          </div>

          <div className="flex flex-col items-center">
            <ScoreRing score={report.overall_score} size={154} strokeWidth={12} />
            <p className="mt-4 text-center text-sm leading-6 text-[var(--color-text-muted)]">
              {gapToNext > 0 ? (
                <>
                  <span className="font-semibold text-amber-300">{gapToNext} points</span> to the next score band.
                </>
              ) : (
                'This resume is in the top audit band.'
              )}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <SignalCard label="Critical" value={criticalCount} tone="danger" />
            <SignalCard label="Warnings" value={warningCount} tone="warn" />
            <SignalCard label="Info" value={infoCount} tone="info" />
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Score Breakdown
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--color-text-primary)]">
                {scoreLabel(report.overall_score)}
              </h2>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Focus
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                {weakestCategory.label}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.entries(report.category_scores) as [keyof typeof CATEGORY_META, number][]).map(([key, score]) => (
              <CategoryCard key={key} label={CATEGORY_META[key].label} description={CATEGORY_META[key].description} weight={CATEGORY_META[key].weight} score={score} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Issues
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
              {report.issues.length ? `${report.issues.length} items to review` : 'No issues found'}
            </h2>
          </div>

          <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--color-border)] p-1">
            {(['all', 'high', 'medium', 'low'] as const).map(filter => (
              <button
                key={filter}
                type="button"
                onClick={() => setSeverityFilter(filter)}
                className={cn(
                  'h-8 rounded-md px-3 text-xs font-semibold capitalize transition-colors',
                  severityFilter === filter
                    ? 'bg-[var(--color-accent)] text-black'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
                )}
              >
                {filter === 'high' ? 'Critical' : filter === 'medium' ? 'Warning' : filter}
              </button>
            ))}
          </div>
        </div>

        {filteredIssues.length ? (
          <div className="grid gap-3">
            {filteredIssues.map((issue, index) => (
              <IssueCard key={`${issue.category}-${index}`} issue={issue} index={index} />
            ))}
          </div>
        ) : (
          <EmptyCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Nothing in this filter"
            description={severityFilter === 'all' ? 'Your resume has no audit issues.' : `No ${severityFilter} severity issues were found.`}
          />
        )}
      </section>

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Recommendations
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
              Prioritized fixes
            </h2>
          </div>
          <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
        </div>

        {report.recommendations.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {report.recommendations.map((recommendation, index) => (
              <RecommendationCard key={`${recommendation.action}-${index}`} recommendation={recommendation} index={index} />
            ))}
          </div>
        ) : (
          <EmptyCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="No recommendations"
            description="The audit did not return any required fixes."
          />
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          { range: '80-100', label: 'ATS Ready', color: '#34d399', note: 'Strong signal' },
          { range: '60-79', label: 'Needs Work', color: '#fbbf24', note: 'Fix before applying' },
          { range: '40-59', label: 'Weak', color: '#f97316', note: 'Likely filtered' },
          { range: '0-39', label: 'Critical', color: '#f87171', note: 'Rewrite needed' },
        ].map(item => (
          <ScoreBand key={item.range} {...item} />
        ))}
      </section>
    </div>
  )
}

function CategoryCard({
  label,
  description,
  weight,
  score,
}: {
  label: string
  description: string
  weight: number
  score: number
}) {
  const color = scoreColor(score)
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-muted)]">{description}</p>
        </div>
        <span className="text-lg font-semibold tabular-nums" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">{weight}% weight</p>
    </div>
  )
}

function SignalCard({ label, value, tone }: { label: string; value: number; tone: 'danger' | 'warn' | 'info' }) {
  const color = tone === 'danger' ? '#f87171' : tone === 'warn' ? '#fbbf24' : '#60a5fa'
  return (
    <div className="rounded-lg border p-3 text-center" style={{ borderColor: `${color}30`, backgroundColor: `${color}10` }}>
      <p className="text-lg font-semibold tabular-nums" style={{ color }}>{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">{label}</p>
    </div>
  )
}

function IssueCard({ issue, index }: { issue: AuditIssue; index: number }) {
  const color = severityColor(issue.severity)
  const Icon = issue.severity === 'high' ? AlertTriangle : issue.severity === 'medium' ? Info : CheckCircle2
  return (
    <article className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ color, backgroundColor: `${color}16`, border: `1px solid ${color}30` }}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{issue.category}</p>
            <SeverityPill severity={issue.severity} />
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{issue.message}</p>
          <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-black/15 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Suggested fix
            </p>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{getSuggestedFix(issue)}</p>
          </div>
        </div>
        <span className="hidden text-xs font-semibold tabular-nums text-[var(--color-text-muted)] sm:block">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
    </article>
  )
}

function RecommendationCard({ recommendation, index }: { recommendation: AuditRecommendation; index: number }) {
  const color = priorityColor(recommendation.priority)
  const Icon = index % 2 === 0 ? Lightbulb : Wrench
  return (
    <article className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ color, backgroundColor: `${color}16`, border: `1px solid ${color}30` }}>
          <Icon className="h-4 w-4" />
        </div>
        <PriorityPill priority={recommendation.priority} />
      </div>
      <p className="text-sm font-semibold leading-6 text-[var(--color-text-primary)]">{recommendation.action}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{recommendation.impact}</p>
    </article>
  )
}

function SeverityPill({ severity }: { severity: AuditIssue['severity'] }) {
  const color = severityColor(severity)
  const label = severity === 'high' ? 'critical' : severity === 'medium' ? 'warning' : 'info'
  return <Pill color={color}>{label}</Pill>
}

function PriorityPill({ priority }: { priority: AuditRecommendation['priority'] }) {
  return <Pill color={priorityColor(priority)}>{priority} priority</Pill>
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={{ color, backgroundColor: `${color}16`, border: `1px solid ${color}30` }}
    >
      {children}
    </span>
  )
}

function EmptyCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center text-[var(--color-accent)]">
      {icon}
      <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
    </div>
  )
}

function ScoreBand({ range, label, color, note }: { range: string; label: string; color: string; note: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: `${color}26`, backgroundColor: `${color}0d` }}>
      <p className="text-sm font-semibold tabular-nums" style={{ color }}>{range}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{note}</p>
    </div>
  )
}

function getWeakestCategory(scores: AuditReportType['category_scores']) {
  return (Object.entries(scores) as [keyof typeof CATEGORY_META, number][])
    .map(([key, score]) => ({ key, score, label: CATEGORY_META[key].label }))
    .sort((a, b) => a.score - b.score)[0]
}

function getGapToNext(score: number) {
  if (score < 60) return 60 - score
  if (score < 80) return 80 - score
  return 0
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function getSuggestedFix(issue: AuditIssue): string {
  const lower = `${issue.category} ${issue.message}`.toLowerCase()

  if (lower.includes('contact') || lower.includes('email') || lower.includes('phone')) {
    return 'Add a clear contact line at the top with name, professional email, phone, LinkedIn, and location.'
  }

  if (lower.includes('keyword') || lower.includes('skill')) {
    return 'Pull the most important tools and keywords from your target role, then add them naturally to skills and experience bullets.'
  }

  if (lower.includes('bullet') || lower.includes('achievement') || lower.includes('quantif')) {
    return 'Rewrite bullets as action + work performed + measurable outcome. Add numbers for scale, impact, latency, revenue, users, or cost.'
  }

  if (lower.includes('format') || lower.includes('table') || lower.includes('column')) {
    return 'Use a single-column layout with standard headings. Avoid tables, text boxes, icons, and decorative layout elements for ATS uploads.'
  }

  if (lower.includes('length') || lower.includes('page') || lower.includes('dense')) {
    return 'Keep the resume tight: one page for early career, two pages only for deeper experience. Remove filler and weak older details.'
  }

  return 'Review this section for ATS clarity, plain formatting, specific evidence, and role-relevant wording.'
}
