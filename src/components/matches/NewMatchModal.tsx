'use client'

import { useState } from 'react'
import { X, Loader2, Sparkles, FileText } from 'lucide-react'

interface Resume { id: string; file_name: string }

interface Props {
  resumes:   Resume[]
  onClose:   () => void
  onSuccess: (match: unknown) => void
}

export function NewMatchModal({ resumes, onClose, onSuccess }: Props) {
  const [resumeId, setResumeId]   = useState(resumes[0]?.id ?? '')
  const [jd,       setJd]         = useState('')
  const [company,  setCompany]    = useState('')
  const [title,    setTitle]      = useState('')
  const [loading,  setLoading]    = useState(false)
  const [error,    setError]      = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!resumeId) { setError('Please select a resume.'); return }
    if (jd.trim().length < 50) { setError('Paste the full job description (at least 50 characters).'); return }

    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/v1/matches', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ resume_id: resumeId, job_description: jd, company: company || undefined, job_title: title || undefined }),
      })
      const body = await res.json()
      if (!res.ok) { setError(body.error ?? 'Analysis failed.'); return }
      onSuccess(body.data)
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="w-full max-w-2xl bg-[var(--color-surface-raised)] rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            </div>
            <h2 className="font-bold text-[var(--color-text-primary)]">New Job Match Analysis</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Resume selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              Resume to match against
            </label>
            {resumes.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
                <FileText className="w-4 h-4 flex-shrink-0" />
                No resumes uploaded yet. Go to My Resumes and upload one first.
              </div>
            ) : (
              <select
                value={resumeId}
                onChange={e => setResumeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.file_name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                Job Title <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Senior Engineer"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                Company <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
              />
            </div>
          </div>

          {/* JD textarea */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the full job description here — include requirements, responsibilities, and qualifications for the best analysis…"
              rows={10}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 resize-none"
            />
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{jd.length} chars · min 50</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || resumes.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                : <><Sparkles className="w-4 h-4" /> Analyze Match</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
