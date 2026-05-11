'use client'

import { useState, useEffect, useRef } from 'react'

interface Job {
  id:          string
  title:       string
  company:     string
  url:         string
  description_snippet: string
}

interface ApplyModalProps {
  job:      Job
  onClose:  () => void
  onApplied: (jobId: string) => void
}

function extractEmail(url: string, snippet: string): string | null {
  const mailto = url.match(/^mailto:([^\?]+)/)
  if (mailto) return mailto[1]
  const inSnippet = snippet.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (inSnippet) return inSnippet[0]
  return null
}

export function ApplyModal({ job, onClose, onApplied }: ApplyModalProps) {
  const [coverLetter, setCoverLetter] = useState('')
  const [generating,  setGenerating]  = useState(true)
  const [sending,     setSending]     = useState(false)
  const [sent,        setSent]        = useState(false)
  const [error,       setError]       = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const applyEmail = extractEmail(job.url, job.description_snippet)

  useEffect(() => {
    const ctrl = new AbortController()
    abortRef.current = ctrl

    async function generate() {
      try {
        const res = await fetch('/api/v1/jobs/cover-letter', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            jobTitle:       job.title,
            company:        job.company,
            jobDescription: job.description_snippet,
          }),
          signal: ctrl.signal,
        })

        if (!res.ok || !res.body) { setGenerating(false); return }

        const reader  = res.body.getReader()
        const decoder = new TextDecoder()
        let text      = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          text += decoder.decode(value, { stream: true })
          setCoverLetter(text)
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError('Failed to generate cover letter.')
      } finally {
        setGenerating(false)
      }
    }

    generate()
    return () => ctrl.abort()
  }, [job.title, job.company, job.description_snippet])

  async function handleSend() {
    if (!applyEmail || !coverLetter.trim()) return
    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/v1/jobs/apply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          jobTitle:    job.title,
          company:     job.company,
          applyEmail,
          coverLetter,
          jobUrl:      job.url,
        }),
      })

      if (!res.ok) { setError('Failed to send. Try again.'); return }

      setSent(true)
      onApplied(job.id)
      setTimeout(onClose, 1800)
    } catch {
      setError('Network error.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Auto Apply</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{job.title} · {job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Apply email */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
          {applyEmail ? (
            <span className="text-[var(--color-text-secondary)]">
              Sending to: <span className="font-medium text-[var(--color-accent)]">{applyEmail}</span>
            </span>
          ) : (
            <span className="text-amber-400">
              No email found in job listing — email apply not available for this job.
            </span>
          )}
        </div>

        {/* Cover letter */}
        <div className="relative">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Cover Letter {generating && <span className="ml-1 normal-case font-normal">(generating…)</span>}
          </label>
          <textarea
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
            rows={10}
            placeholder={generating ? '' : 'Cover letter will appear here…'}
            className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
          />
          {generating && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <SpinnerIcon className="h-3 w-3 animate-spin" />
              Writing…
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </button>
          {sent ? (
            <span className="rounded-xl bg-green-500/20 px-4 py-2.5 text-sm font-semibold text-green-400">
              ✓ Application Sent!
            </span>
          ) : (
            <button
              onClick={handleSend}
              disabled={!applyEmail || !coverLetter.trim() || generating || sending}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {sending && <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />}
              {sending ? 'Sending…' : 'Send Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}
