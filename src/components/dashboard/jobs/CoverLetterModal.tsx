'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, FileText, Loader2, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface JobLike {
  title: string
  company: string
  description: string
}

interface Props {
  job: JobLike
  onClose: () => void
}

/**
 * Streams an AI cover letter for a job from /api/v1/jobs/cover-letter,
 * grounded in the user's latest parsed resume. Generates on open; supports
 * copy, download (.txt), and regenerate.
 */
export function CoverLetterModal({ job, onClose }: Props) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'streaming' | 'done' | 'error'>('streaming')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const generate = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setText('')
    setError('')
    setStatus('streaming')

    try {
      const res = await fetch('/api/v1/jobs/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          jobTitle: job.title.slice(0, 200),
          company: job.company.slice(0, 200),
          jobDescription: (job.description ?? '').slice(0, 4000),
        }),
      })

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Could not generate the cover letter.')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        setText(prev => prev + decoder.decode(value, { stream: true }))
      }
      setStatus('done')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError((err as Error).message)
      setStatus('error')
    }
  }, [job.title, job.company, job.description])

  useEffect(() => {
    void generate()
    return () => abortRef.current?.abort()
  }, [generate])

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function download() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${job.company.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-cover-letter.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const busy = status === 'streaming'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={busy ? undefined : onClose} aria-hidden />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
              <FileText className="h-4 w-4 text-[var(--color-accent)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Cover letter</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">{job.title} · {job.company}</p>
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : (
            <pre className="whitespace-pre-wrap font-[var(--font-body)] text-sm leading-7 text-[var(--color-text-secondary)]">
              {text}
              {busy && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-[var(--color-accent)] align-middle" />}
            </pre>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2.5 border-t border-[var(--color-border)] p-4">
          <Button size="sm" variant="outline" className="rounded-lg" onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {text ? 'Regenerate' : 'Generate'}
          </Button>
          <Button size="sm" variant="outline" className="rounded-lg" onClick={copy} disabled={!text || busy}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button size="sm" variant="outline" className="rounded-lg" onClick={download} disabled={!text || busy}>
            <Download />
            Download
          </Button>
        </footer>
      </div>
    </div>
  )
}
