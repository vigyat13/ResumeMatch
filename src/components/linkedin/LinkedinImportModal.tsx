'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ExternalLink, Loader2, CheckCircle2, AlertCircle, Sparkles, Globe, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

type ImportState = 'idle' | 'loading' | 'success' | 'error'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: ImportResult) => void
}

export interface ImportResult {
  profile: {
    name: string
    title: string
    summary: string
    experience: Array<{ company: string; role: string; period: string; description: string[] }>
    education: Array<{ school: string; degree: string; field: string; year: string }>
    skills: string[]
  }
  resumeData: {
    name: string
    title: string
    email: string
    phone: string
    location: string
    summary: string
    experience: Array<{ company: string; role: string; period: string; bullets: string[] }>
    education: Array<{ school: string; degree: string; year: string }>
    skills: Array<{ name: string; level: number }>
  }
  warnings: string[]
  confidence: number
}

export function LinkedinImportModal({ isOpen, onClose, onSuccess }: Props) {
  const [state, setState] = useState<ImportState>('idle')
  const [inputMode, setInputMode] = useState<'url' | 'paste'>('url')
  const [url, setUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)

  const close = useCallback(() => {
    setState('idle')
    setUrl('')
    setPastedText('')
    setErrorMsg('')
    setResult(null)
    onClose()
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  async function handleImport() {
    const input = inputMode === 'url' ? url : pastedText
    if (!input.trim()) {
      setErrorMsg(inputMode === 'url' ? 'Enter a LinkedIn profile URL.' : 'Paste your LinkedIn profile text.')
      setState('error')
      return
    }

    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/v1/linkedin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputMode === 'url' ? { url: input } : { text: input }),
      })

      let body: { data?: ImportResult; error?: string }
      try {
        body = await res.json()
      } catch {
        const text = await res.text().catch(() => 'unknown')
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 200)}`)
      }

      if (!res.ok) {
        throw new Error(body.error ?? `Import failed (${res.status})`)
      }

      if (!body.data) {
        throw new Error('Server returned empty response')
      }

      setResult(body.data)
      setState('success')
      onSuccess(body.data)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed. Please try again.')
      setState('error')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-2xl animate-reveal-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Import from LinkedIn</h2>
              <p className="text-xs text-[var(--color-text-muted])">Auto-populate your resume from LinkedIn</p>
            </div>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {state === 'error' && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{errorMsg}</p>
            </div>
          )}

          {state === 'success' && result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface-hover)]">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <ExternalLink className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--color-text-primary)]">{result.profile.name || 'Profile Imported'}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{result.profile.title}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-[var(--color-accent)]">{result.confidence}%</p>
                  <p className="text-[9px] text-[var(--color-text-muted)]">confidence</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-[var(--color-surface-hover)] p-2">
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">{result.profile.experience.length}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">Experiences</p>
                </div>
                <div className="rounded-lg bg-[var(--color-surface-hover)] p-2">
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">{result.profile.education.length}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">Education</p>
                </div>
                <div className="rounded-lg bg-[var(--color-surface-hover)] p-2">
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">{result.profile.skills.length}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">Skills</p>
                </div>
              </div>

              {result.warnings.length > 0 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                  <p className="text-[10px] font-semibold text-amber-500 uppercase mb-1">Notes</p>
                  {result.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-500/80">{w}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    close()
                    window.location.href = '/builder'
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  Open in Builder
                </button>
                <button
                  onClick={() => { setState('idle'); setResult(null) }}
                  className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Import Another
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('url')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                    inputMode === 'url'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <Globe className="w-4 h-4" /> Profile URL
                </button>
                <button
                  onClick={() => setInputMode('paste')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                    inputMode === 'paste'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <FileText className="w-4 h-4" /> Paste Profile
                </button>
              </div>

              {inputMode === 'url' ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">Paste the URL of any public LinkedIn profile</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Paste Profile Text</label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Go to your LinkedIn profile, select all (Ctrl+A), copy (Ctrl+C), and paste here..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all resize-none"
                  />
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={state === 'loading'}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  state === 'loading'
                    ? 'bg-blue-500/50 text-white/70 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                )}
              >
                {state === 'loading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Import Profile</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
