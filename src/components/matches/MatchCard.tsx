'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, Trash2, ChevronDown, ChevronUp, Briefcase, Calendar } from 'lucide-react'

interface JobMatch {
  id:               string
  job_title:        string | null
  company:          string | null
  match_percentage: number | null
  matched_skills:   string[] | null
  missing_skills:   string[] | null
  extra_skills:     string[] | null
  recommendations:  string[] | null
  saved:            boolean | null
  created_at:       string | null
}

interface Props {
  match:    JobMatch
  onDelete: (id: string) => void
  onSave:   (id: string, saved: boolean) => void
}

export function MatchCard({ match, onDelete, onSave }: Props) {
  const [expanded,  setExpanded]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  const score    = match.match_percentage ?? 0
  const matched  = match.matched_skills  ?? []
  const missing  = match.missing_skills  ?? []
  const extras   = match.extra_skills    ?? []
  const recs     = match.recommendations ?? []
  const isSaved  = !!match.saved

  const scoreColor = score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'
  const scoreBg    = score >= 70 ? 'bg-emerald-50 border-emerald-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
  const scoreBar   = score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const scoreLabel = score >= 85 ? 'Excellent fit' : score >= 70 ? 'Strong fit' : score >= 50 ? 'Moderate fit' : score >= 30 ? 'Weak fit' : 'Poor fit'

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/v1/matches/${match.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ saved: !isSaved }),
      })
      onSave(match.id, !isSaved)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/v1/matches/${match.id}`, { method: 'DELETE' })
      onDelete(match.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden transition-shadow hover:shadow-md">

      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">

          {/* Score badge */}
          <div className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center ${scoreBg}`}>
            <span className={`text-2xl font-bold leading-none ${scoreColor}`}>{score}</span>
            <span className={`text-[9px] font-semibold mt-0.5 ${scoreColor}`}>/ 100</span>
          </div>

          {/* Job info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[var(--color-text-primary)] text-base leading-tight truncate">
              {match.job_title ?? 'Unknown Role'}
            </h3>
            {match.company && (
              <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                <Briefcase className="w-3 h-3" /> {match.company}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-semibold ${scoreColor}`}>{scoreLabel}</span>
              {match.created_at && (
                <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(match.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              title={isSaved ? 'Unsave' : 'Save'}
              className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
            >
              {isSaved
                ? <BookmarkCheck className="w-4 h-4 text-[var(--color-accent)]" />
                : <Bookmark      className="w-4 h-4 text-[var(--color-text-muted)]" />
              }
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete"
              className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-4 h-1.5 rounded-full bg-[var(--color-surface-hover)]">
          <div className={`h-full rounded-full ${scoreBar}`} style={{ width: `${score}%`, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Skills summary */}
      <div className="px-5 pb-4 space-y-3">
        {matched.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">
              ✓ Matched ({matched.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matched.slice(0, 6).map(s => (
                <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {s}
                </span>
              ))}
              {matched.length > 6 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] text-[var(--color-text-muted)]">+{matched.length - 6}</span>
              )}
            </div>
          </div>
        )}

        {missing.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-1.5">
              ✗ Missing ({missing.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missing.slice(0, 6).map(s => (
                <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">
                  {s}
                </span>
              ))}
              {missing.length > 6 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] text-[var(--color-text-muted)]">+{missing.length - 6}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expandable recommendations */}
      {recs.length > 0 && (
        <div className="border-t border-[var(--color-border)]">
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <span>{recs.length} Recommendations</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="px-5 pb-4 space-y-2">
              {recs.map((rec, i) => (
                <div key={i} className="flex gap-2.5 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">{rec}</p>
                </div>
              ))}
              {extras.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <p className="text-[10px] font-semibold text-[var(--color-accent)] uppercase tracking-wide mb-1.5">
                    ★ Your extra skills (stand-out)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {extras.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-[11px] bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
