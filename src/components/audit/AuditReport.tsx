'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  Lightbulb,
  Wrench,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { ScoreRing } from './ScoreRing'
import {
  AuditReport as AuditReportType,
  AuditIssue,
  AuditRecommendation,
  CATEGORY_META,
  scoreColor,
  severityColor,
  priorityColor,
} from '@/types/audit'

interface Props {
  report: AuditReportType
  resumeId: string
  resumeName: string
}

export function AuditReport({ report, resumeId, resumeName }: Props) {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [reauditError, setReauditError] = useState<string | null>(null)
  const router = useRouter()

  const filteredIssues = report.issues.filter(
    (i) => severityFilter === 'all' || i.severity === severityFilter
  )

  const criticalCount = report.issues.filter((i) => i.severity === 'high').length
  const warningCount  = report.issues.filter((i) => i.severity === 'medium').length
  const infoCount     = report.issues.filter((i) => i.severity === 'low').length

  const gapToNext = report.overall_score < 80
    ? report.overall_score < 60
      ? 60 - report.overall_score
      : 80 - report.overall_score
    : 0

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
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">ATS Audit Report</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5 truncate max-w-xs">{resumeName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-muted)]">
            {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button
            onClick={handleReaudit}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            Re-audit
          </button>
        </div>
        {reauditError && (
          <p className="w-full text-xs text-[#f87171]">{reauditError}</p>
        )}
      </div>

      {/* ── Score + Categories ──────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">

          {/* Score Ring */}
          <div className="flex-shrink-0">
            <ScoreRing score={report.overall_score} size={150} strokeWidth={11} />
            {gapToNext > 0 && (
              <p className="text-center text-xs text-[var(--color-text-muted)] mt-3 max-w-[150px]">
                <span className="text-[#fbbf24] font-semibold">{gapToNext} points</span> to next tier
              </p>
            )}
          </div>

          {/* Category Bars */}
          <div className="flex-1 w-full">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)] mb-4">
              Category Breakdown
            </p>
            <div className="space-y-3">
              {(Object.entries(report.category_scores) as [keyof typeof CATEGORY_META, number][]).map(
                ([key, score]) => {
                  const meta = CATEGORY_META[key]
                  const color = scoreColor(score)
                  return (
                    <div key={key} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            {meta.label}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)] hidden group-hover:inline">
                            — {meta.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {meta.weight}% weight
                          </span>
                          <span className="text-sm font-bold tabular-nums" style={{ color }}>
                            {score}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-[rgba(245,240,232,0.06)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${score}%`,
                            backgroundColor: color,
                            boxShadow: `0 0 8px ${color}50`,
                            animationDelay: '200ms',
                          }}
                        />
                      </div>
                    </div>
                  )
                }
              )}
            </div>

            {/* Issue summary chips */}
            <div className="flex items-center gap-2 mt-5 flex-wrap">
              {criticalCount > 0 && (
                <Chip color="#f87171" count={criticalCount} label="critical" />
              )}
              {warningCount > 0 && (
                <Chip color="#fbbf24" count={warningCount} label="warnings" />
              )}
              {infoCount > 0 && (
                <Chip color="#60a5fa" count={infoCount} label="info" />
              )}
              {report.issues.length === 0 && (
                <span className="text-xs text-[#34d399] font-medium">✓ No issues found</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Issues ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            Issues Found
            <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
              ({report.issues.length})
            </span>
          </h2>
          <div className="flex items-center gap-1">
            {(['all', 'high', 'medium', 'low'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setSeverityFilter(f); setExpandedIssue(null) }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                  severityFilter === f
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {f === 'high' ? 'Critical' : f === 'medium' ? 'Warning' : f === 'low' ? 'Info' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8 text-[#34d399]" />}
            title="No issues found"
            description={severityFilter === 'all' ? 'Your resume is ATS-ready.' : `No ${severityFilter} severity issues.`}
          />
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {filteredIssues.map((issue, i) => (
              <IssueRow
                key={i}
                issue={issue}
                index={i}
                expanded={expandedIssue === i}
                onToggle={() => setExpandedIssue(expandedIssue === i ? null : i)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* ── Recommendations ─────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Recommendations</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Fix these to move up the score ladder
          </p>
        </div>

        {report.recommendations.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8 text-[#34d399]" />}
            title="No recommendations"
            description="Your resume is well-optimized."
          />
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {report.recommendations.map((rec, i) => (
              <RecommendationRow key={i} rec={rec} index={i} />
            ))}
          </ul>
        )}
      </div>

      {/* ── What this score means ───────────────────────────── */}
      <div className="rounded-2xl border border-[rgba(245,240,232,0.06)] bg-[rgba(245,240,232,0.02)] p-5">
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
          How ATS Scoring Works
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { range: '80–100', label: 'ATS Ready', color: '#34d399', note: 'Passes most systems' },
            { range: '60–79', label: 'Needs Work', color: '#fbbf24', note: 'May get filtered out' },
            { range: '40–59', label: 'Weak',       color: '#f97316', note: 'Likely rejected by ATS' },
            { range: '0–39',  label: 'Critical',   color: '#f87171', note: 'Almost always filtered' },
          ].map(({ range, label, color, note }) => (
            <div
              key={range}
              className="rounded-xl p-3"
              style={{ backgroundColor: `${color}0d`, border: `1px solid ${color}25` }}
            >
              <p className="text-sm font-bold tabular-nums" style={{ color }}>{range}</p>
              <p className="text-xs font-semibold text-[var(--color-text-primary)] mt-0.5">{label}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────── */

function IssueRow({
  issue,
  index,
  expanded,
  onToggle,
}: {
  issue: AuditIssue
  index: number
  expanded: boolean
  onToggle: () => void
}) {
  const color = severityColor(issue.severity)
  const SeverityIcon = issue.severity === 'high' ? AlertTriangle
                     : issue.severity === 'medium' ? Info
                     : Info

  return (
    <li>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 px-5 py-4 hover:bg-[var(--color-surface-hover)] transition-colors text-left"
      >
        {/* Severity dot */}
        <div className="mt-0.5 flex-shrink-0">
          <SeverityIcon className="w-4 h-4" style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {issue.category}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
              style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}35` }}
            >
              {issue.severity === 'high' ? 'critical' : issue.severity}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
            {issue.message}
          </p>
        </div>

        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--color-text-muted)] transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded: fix suggestion */}
      {expanded && (
        <div
          className="px-5 pb-4 ml-8"
          style={{ borderLeft: `2px solid ${color}40` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              How to fix
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {getSuggestedFix(issue)}
          </p>
        </div>
      )}
    </li>
  )
}

function RecommendationRow({
  rec,
  index,
}: {
  rec: AuditRecommendation
  index: number
}) {
  const color = priorityColor(rec.priority)
  const Icon = index % 2 === 0 ? Lightbulb : Wrench

  return (
    <li className="flex items-start gap-4 px-5 py-4">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
        style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{rec.action}</p>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide flex-shrink-0"
            style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}35` }}
          >
            {rec.priority}
          </span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
          {rec.impact}
        </p>
      </div>
    </li>
  )
}

function Chip({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
    >
      <span className="font-bold">{count}</span> {label}
    </span>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      {icon}
      <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-3">{title}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">{description}</p>
    </div>
  )
}

function getSuggestedFix(issue: AuditIssue): string {
  const lower = (issue.category + ' ' + issue.message).toLowerCase()

  if (lower.includes('contact') || lower.includes('email') || lower.includes('phone'))
    return 'Add a clear contact section at the top of your resume with your full name, professional email, phone number, LinkedIn URL, and city/state.'

  if (lower.includes('keyword') || lower.includes('skill'))
    return 'Review the job description you\'re targeting. Extract 8-12 specific technical skills and tools, then naturally incorporate them into your experience bullet points and skills section.'

  if (lower.includes('bullet') || lower.includes('achievement') || lower.includes('quantif'))
    return 'Rewrite each job description bullet using the format: "[Action verb] + [what you did] + [measurable result]". Example: "Reduced API latency by 40% by implementing Redis caching."'

  if (lower.includes('format') || lower.includes('table') || lower.includes('column'))
    return 'Use a single-column layout with standard section headers. Remove all tables, text boxes, and multi-column layouts that confuse ATS parsers.'

  if (lower.includes('length') || lower.includes('page') || lower.includes('dense'))
    return 'Aim for 1 page (under 5 years experience) or 2 pages max (5+ years). Remove outdated roles, irrelevant skills, and generic filler phrases.'

  if (lower.includes('font') || lower.includes('color') || lower.includes('graphic'))
    return 'Use only black text on a white background. Choose standard fonts (Arial, Calibri, Georgia). Remove all icons, graphics, and decorative elements.'

  return 'Address this issue by reviewing your resume content and ensuring it follows ATS-friendly formatting standards.'
}
