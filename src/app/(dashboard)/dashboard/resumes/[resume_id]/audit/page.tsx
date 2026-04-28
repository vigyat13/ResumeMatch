import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, AlertCircle, CheckCircle2, Minus, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RunAuditButton } from '@/components/resume/RunAuditButton'

interface CategoryScores {
  format:       number
  content:      number
  keywords:     number
  length:       number
  contact_info: number
}
interface Issue {
  severity: 'high' | 'medium' | 'low'
  category: string
  message:  string
}
interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  action:   string
  impact:   string
}
interface AuditReport {
  id:               string
  overall_score:    number
  category_scores:  CategoryScores
  issues:           Issue[]
  recommendations:  Recommendation[]
  created_at:       string
}

interface Params {
  params: Promise<{ resume_id: string }>
}

export default async function AuditPage({ params }: Params) {
  const { resume_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: resume }, { data: report }] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, file_name, parsed_text')
      .eq('id', resume_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle(),

    supabase
      .from('audit_reports')
      .select('*')
      .eq('resume_id', resume_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!resume) notFound()

  const audit = report as AuditReport | null

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Link href="/dashboard/resumes" className="hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> My Resumes
        </Link>
        <span>/</span>
        <span className="flex items-center gap-1.5 text-[var(--color-text-primary)]">
          <FileText className="w-3.5 h-3.5" />
          {resume.file_name}
        </span>
        <span>/</span>
        <span>ATS Audit</span>
      </div>

      {/* No audit yet */}
      {!audit && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-[var(--color-accent)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
              Run Your ATS Audit
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
              Our AI will analyze your resume against ATS scoring criteria and give you a 0–100 score
              with specific fixes to land more interviews.
            </p>
          </div>
          {resume.parsed_text && resume.parsed_text.trim().length >= 50
            ? <RunAuditButton resumeId={resume_id} />
            : <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg max-w-sm">
                Resume text could not be extracted. Please re-upload your PDF for analysis.
              </p>
          }
        </div>
      )}

      {/* Audit report */}
      {audit && (
        <>
          {/* Score hero */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

              {/* Score ring */}
              <ScoreRing score={audit.overall_score} />

              {/* Score summary */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                  ATS Readiness Score
                </h1>
                <p className="text-[var(--color-text-muted)] text-sm mb-1">
                  {scoreLabel(audit.overall_score)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mb-5">
                  Analyzed {new Date(audit.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <RunAuditButton resumeId={resume_id} variant="outline" label="Re-run Audit" />
              </div>

              {/* Quick stats */}
              <div className="flex sm:flex-col gap-3 sm:gap-2 text-center">
                {[
                  { label: 'High Issues',  value: audit.issues.filter(i => i.severity === 'high').length,   color: 'text-red-500'     },
                  { label: 'Medium Issues',value: audit.issues.filter(i => i.severity === 'medium').length, color: 'text-amber-500'   },
                  { label: 'Fixes Ready',  value: audit.recommendations.length,                             color: 'text-emerald-500' },
                ].map(s => (
                  <div key={s.label} className="px-4 py-2 rounded-xl bg-[var(--color-surface-hover)] min-w-[80px]">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
            <h2 className="font-bold text-[var(--color-text-primary)] mb-5">Category Breakdown</h2>
            <div className="space-y-4">
              {categoryRows(audit.category_scores).map(({ label, score, weight }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text-primary)]">{label}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">{weight}% weight</span>
                    </div>
                    <span className={`font-bold text-sm ${scoreColor(score)}`}>{score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${scoreBar(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {audit.issues.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
              <h2 className="font-bold text-[var(--color-text-primary)] mb-5">Issues Found</h2>
              <div className="space-y-3">
                {audit.issues.map((issue, i) => (
                  <div key={i} className={`flex gap-3 p-3.5 rounded-xl border ${severityStyle(issue.severity).bg}`}>
                    <SeverityIcon severity={issue.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className={`text-xs font-bold uppercase tracking-wide ${severityStyle(issue.severity).text}`}>
                          {issue.severity}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                          {issue.category}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-primary)]">{issue.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {audit.recommendations.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
              <h2 className="font-bold text-[var(--color-text-primary)] mb-5">Recommendations</h2>
              <div className="space-y-3">
                {audit.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)]">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${priorityBadge(rec.priority)}`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-0.5">{rec.action}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        <span className="font-medium text-[var(--color-text-secondary)]">Impact:</span> {rec.impact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── helpers ─────────────────────────────────────────────── */

function scoreLabel(score: number) {
  if (score >= 85) return '✓ Excellent — your resume is highly ATS-optimised'
  if (score >= 70) return '↑ Good — a few tweaks will push you into the top tier'
  if (score >= 55) return '⚠ Fair — several areas need attention before applying'
  return '✗ Needs Work — significant improvements required'
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function scoreBar(score: number) {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function categoryRows(cs: CategoryScores) {
  return [
    { label: 'Format & Structure', score: cs.format,       weight: 20 },
    { label: 'Content Quality',    score: cs.content,      weight: 25 },
    { label: 'Keywords & Skills',  score: cs.keywords,     weight: 25 },
    { label: 'Length & Density',   score: cs.length,       weight: 15 },
    { label: 'Contact Info',       score: cs.contact_info, weight: 15 },
  ]
}

function severityStyle(s: string) {
  if (s === 'high')   return { bg: 'border-red-200 bg-red-50/50',    text: 'text-red-600'    }
  if (s === 'medium') return { bg: 'border-amber-200 bg-amber-50/50', text: 'text-amber-600'  }
  return                     { bg: 'border-border bg-transparent',    text: 'text-emerald-600'}
}

function priorityBadge(p: string) {
  if (p === 'high')   return 'bg-red-100 text-red-700'
  if (p === 'medium') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'high')   return <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
  if (severity === 'medium') return <Minus       className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
  return                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
}

function ScoreRing({ score }: { score: number }) {
  const radius       = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset   = circumference * (1 - score / 100)
  const color        = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="-rotate-90 w-full h-full">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor"
          className="text-[var(--color-border)]" strokeWidth="9" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold leading-none" style={{ color }}>{score}</span>
        <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5">/ 100</span>
      </div>
    </div>
  )
}
