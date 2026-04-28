'use client'

import { useState } from 'react'
import { Plus, Briefcase, Bookmark } from 'lucide-react'
import { MatchCard }     from './MatchCard'
import { NewMatchModal } from './NewMatchModal'

interface Resume   { id: string; file_name: string }
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
  initialMatches: JobMatch[]
  resumes:        Resume[]
}

type Filter = 'all' | 'saved'

export function MatchesClient({ initialMatches, resumes }: Props) {
  const [matches,    setMatches]    = useState<JobMatch[]>(initialMatches)
  const [showModal,  setShowModal]  = useState(false)
  const [filter,     setFilter]     = useState<Filter>('all')

  function handleDelete(id: string) {
    setMatches(m => m.filter(x => x.id !== id))
  }

  function handleSave(id: string, saved: boolean) {
    setMatches(m => m.map(x => x.id === id ? { ...x, saved } : x))
  }

  function handleSuccess(match: unknown) {
    setMatches(m => [match as JobMatch, ...m])
  }

  const filtered = filter === 'saved' ? matches.filter(m => m.saved) : matches
  const savedCount = matches.filter(m => m.saved).length

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Job Matches</h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">
            {matches.length > 0
              ? `${matches.length} match${matches.length !== 1 ? 'es' : ''} · ${savedCount} saved`
              : 'Paste a job description to see how well your resume fits'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Match
        </button>
      </div>

      {/* Filter tabs */}
      {matches.length > 0 && (
        <div className="flex gap-2">
          {(['all', 'saved'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {f === 'saved' && <Bookmark className="w-3.5 h-3.5" />}
              {f === 'all' ? `All (${matches.length})` : `Saved (${savedCount})`}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border-2 border-dashed border-[var(--color-border)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-[var(--color-accent)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No matches yet</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-xs">
            Paste a job description and select your resume. AI will score your fit and show exactly what skills to add.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Run Your First Match
          </button>
        </div>
      )}

      {/* Saved empty state */}
      {filter === 'saved' && savedCount === 0 && matches.length > 0 && (
        <div className="text-center py-12 text-[var(--color-text-muted)] text-sm">
          No saved matches yet. Click the bookmark icon on a match to save it.
        </div>
      )}

      {/* Match grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onDelete={handleDelete}
              onSave={handleSave}
            />
          ))}
        </div>
      )}

      {showModal && (
        <NewMatchModal
          resumes={resumes}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
