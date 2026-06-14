'use client'

/**
 * RESUME CARD
 *
 * Displays a single resume's metadata with action buttons.
 * This is a Client Component because of:
 * - useState for delete confirmation modal
 * - onClick handlers
 *
 * The card uses CSS transform for the hover scale effect because
 * transforms are GPU-accelerated and don't trigger layout reflow.
 * Tailwind's `hover:scale-[1.02]` compiles to exactly that.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BriefcaseBusiness, FileText, Trash2, Eye, Clock, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'
import { formatFileSize, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Resume {
  id:               string
  file_name:        string
  file_url:         string
  file_type:        string
  file_size:        number
  extracted_skills: string[] | null
  parsing_status:   string
  created_at:       string | null
}

interface Props {
  resume:   Resume
  onDelete: (id: string) => void
}

export function ResumeCard({ resume, onDelete }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [deleteError, setDeleteError]  = useState<string | null>(null)
  const [retrying,    setRetrying]     = useState(false)
  const [retryError,  setRetryError]   = useState<string | null>(null)
  const router = useRouter()

  const skills = resume.extracted_skills ?? []
  const isParsed = resume.parsing_status === 'processed' || resume.parsing_status === 'completed'

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/v1/resumes/${resume.id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (res.ok) {
        onDelete(resume.id)
      } else {
        setDeleteError(body?.error ?? 'Failed to delete resume.')
      }
    } catch {
      setDeleteError('Network error. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleRetryExtraction() {
    setRetrying(true)
    setRetryError(null)
    try {
      const res = await fetch(`/api/v1/resumes/${resume.id}/parse`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) {
        setRetryError(body.error ?? 'Extraction failed. Try uploading the resume again.')
        return
      }
      router.refresh()
    } catch {
      setRetryError('Network error. Please try again.')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <>
      <div className={cn(
        'relative flex flex-col rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-surface-raised)] p-6',
        'shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        'hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]',
        'transition-all duration-100 ease-out'
      )}>
        {/* File icon + name */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--color-text-primary)] truncate" title={resume.file_name}>
              {resume.file_name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {resume.created_at ? formatDate(resume.created_at) : ''} · {formatFileSize(resume.file_size)}
            </p>
          </div>
          <ParsingBadge status={resume.parsing_status} />
        </div>

        {/* Skills tags */}
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {skills.slice(0, 8).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
              >
                {skill}
              </span>
            ))}
            {skills.length > 8 && (
              <span className="px-2 py-0.5 rounded-full text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-hover)]">
                +{skills.length - 8} more
              </span>
            )}
          </div>
        ) : (
          <div className="mb-5">
            <p className="text-xs text-[var(--color-text-muted)] italic">
              {resume.parsing_status === 'pending'
                ? 'Extracting skills…'
                : resume.parsing_status === 'failed'
                ? 'Extraction failed. This may be a scanned PDF or protected file.'
                : 'No skills detected'}
            </p>
            {resume.parsing_status === 'failed' && (
              <button
                onClick={handleRetryExtraction}
                disabled={retrying}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
              >
                <Clock className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Retrying extraction…' : 'Retry extraction'}
              </button>
            )}
            {retryError && <p className="mt-2 text-xs text-red-500">{retryError}</p>}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-[var(--color-border)]">
          <a
            href={resume.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </a>

          <Link
            href={`/dashboard/resumes/${resume.id}/audit`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium transition-colors ${
              isParsed
                ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                : 'pointer-events-none opacity-45 text-[var(--color-text-muted)]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            ATS Audit
          </Link>

          <Link
            href={`/dashboard/jobs?resume_id=${resume.id}&resume_name=${encodeURIComponent(resume.file_name)}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium transition-colors ${
              isParsed
                ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                : 'pointer-events-none opacity-45 text-[var(--color-text-muted)]'
            }`}
          >
            <BriefcaseBusiness className="w-3.5 h-3.5" />
            Apply Jobs
          </Link>

          <button
            onClick={() => setShowConfirm(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setShowConfirm(false) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-2xl p-6">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2">Delete Resume?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              This will delete <strong className="text-[var(--color-text-primary)]">{resume.file_name}</strong>.
              This action cannot be undone.
            </p>
            {deleteError && (
              <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ParsingBadge({ status }: { status: string }) {
  if (status === 'completed' || status === 'processed') return (
    <span aria-label="Parsing complete">
      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
    </span>
  )
  if (status === 'failed') return (
    <span aria-label="Parsing failed">
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
    </span>
  )
  return (
    <span aria-label="Parsing in progress">
      <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
    </span>
  )
}
