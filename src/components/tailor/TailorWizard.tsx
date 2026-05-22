'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X, Wand2, Briefcase, FileText, Sparkles, Loader2,
  CheckCircle2, AlertCircle, ArrowRight, ChevronDown, ChevronUp,
  Copy, Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type WizardStep = 'input' | 'processing' | 'result' | 'error'
type InputMethod = 'url' | 'paste'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface TailorResult {
  tailored: {
    original: Record<string, unknown>
    tailored: Record<string, unknown>
    changes: Array<{ section: string; type: string; description: string }>
    matchScore: number
    missingSkills: string[]
    addedSkills: string[]
    modifiedSections: string[]
  }
  coverLetter: {
    subject: string
    body: string
    recipientName: string
    recipientCompany: string
  }
  suggestions: string[]
}

export function TailorWizard({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<WizardStep>('input')
  const [inputMethod, setInputMethod] = useState<InputMethod>('paste')
  const [jobUrl, setJobUrl] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<TailorResult | null>(null)
  const [expandedCover, setExpandedCover] = useState(false)

  const close = useCallback(() => {
    setStep('input')
    setJobUrl('')
    setJobTitle('')
    setCompany('')
    setJobDesc('')
    setErrorMsg('')
    setResult(null)
    setExpandedCover(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  async function handleTailor() {
    if (!jobDesc.trim()) {
      setErrorMsg('Paste a job description.')
      setStep('error')
      return
    }

    setStep('processing')
    setErrorMsg('')

    try {
      const res = await fetch('/api/v1/tailor/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: jobTitle || undefined,
          company: company || undefined,
          jobDescription: jobDesc,
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setErrorMsg(body.error ?? 'Tailoring failed.')
        setStep('error')
        return
      }

      setResult(body.data)
      setStep('result')
    } catch {
      setErrorMsg('Connection error.')
      setStep('error')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-2xl animate-reveal-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface-raised)] z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">AI Resume Tailor</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Optimize your resume for any job</p>
            </div>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {step === 'error' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-500">{errorMsg}</p>
              </div>
              <button onClick={() => setStep('input')} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">Try Again</button>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="relative grid w-20 h-20 place-items-center mb-6">
                <div className="absolute inset-0 rounded-full border border-purple-500/20" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
                <Wand2 className="w-8 h-8 text-purple-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Tailoring Your Resume</h3>
              <div className="space-y-1.5">
                {['Analyzing job description...', 'Matching skills & keywords...', 'Rewriting experience bullets...', 'Generating cover letter...'].map((msg, i) => (
                  <p key={i} className="text-sm text-[var(--color-text-muted)] flex items-center gap-2 justify-center"
                    style={{ animationDelay: `${i * 1.5}s`, opacity: 0, animation: 'fadeIn 0.3s ease forwards' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    {msg}
                  </p>
                ))}
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface-hover)]">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-purple-500/30 flex flex-col items-center justify-center bg-purple-500/5">
                  <span className="text-2xl font-bold text-purple-500">{result.tailored.matchScore}</span>
                  <span className="text-[9px] text-purple-400">/ 100</span>
                </div>
                <div>
                  <p className="font-bold text-[var(--color-text-primary)]">
                    {result.tailored.matchScore >= 70 ? 'Strong Match' : result.tailored.matchScore >= 50 ? 'Moderate Match' : 'Needs Work'}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {result.tailored.modifiedSections.length} sections tailored · {result.tailored.changes.length} changes made
                  </p>
                </div>
              </div>

              {result.tailored.missingSkills.length > 0 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                  <p className="text-xs font-semibold text-amber-500 uppercase mb-2">Skill Gaps ({result.tailored.missingSkills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.tailored.missingSkills.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.tailored.changes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Changes Made</p>
                  {result.tailored.changes.map((c, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-[var(--color-surface-hover)]">
                      <span className={cn(
                        'flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5',
                        c.type === 'added' ? 'bg-emerald-500/20 text-emerald-400' :
                        c.type === 'removed' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      )}>
                        {c.type === 'added' ? '+' : c.type === 'removed' ? '−' : '~'}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">{c.section}</p>
                        <p className="text-sm text-[var(--color-text-primary)] mt-0.5">{c.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.coverLetter.body && (
                <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <button
                    onClick={() => setExpandedCover(e => !e)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <span>Generated Cover Letter</span>
                    {expandedCover ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedCover && (
                    <div className="px-4 pb-4">
                      <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">{result.coverLetter.subject}</p>
                      <div className="rounded-xl bg-[var(--color-surface-hover)] p-4 text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                        {result.coverLetter.body}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(result.coverLetter.body)}
                        className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        <Copy className="w-3 h-3" /> Copy to Clipboard
                      </button>
                    </div>
                  )}
                </div>
              )}

              {result.suggestions.length > 0 && (
                <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4">
                  <p className="text-xs font-semibold text-purple-400 uppercase mb-2">Suggestions</p>
                  <ul className="space-y-1.5">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)]">
                        <span className="text-purple-400">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { window.location.href = '/builder' }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition-colors"
                >
                  <Wand2 className="w-4 h-4" /> Apply Changes
                </button>
                <button
                  onClick={close}
                  className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {step === 'input' && (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMethod('paste')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                    inputMethod === 'paste'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <FileText className="w-4 h-4" /> Paste Description
                </button>
                <button
                  onClick={() => setInputMethod('url')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                    inputMethod === 'url'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <Briefcase className="w-4 h-4" /> Job URL
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Job Title</label>
                  <input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Company</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50"
                  />
                </div>
              </div>

              {inputMethod === 'url' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Job Posting URL</label>
                  <input
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://linkedin.com/jobs/view/..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50"
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">Paste a LinkedIn, Indeed, or other job URL</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Job Description</label>
                  <textarea
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Paste the full job description here..."
                    rows={8}
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all resize-none"
                  />
                </div>
              )}

              <button
                onClick={handleTailor}
                disabled={!jobDesc.trim()}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  jobDesc.trim()
                    ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-sm'
                    : 'bg-purple-500/30 text-white/50 cursor-not-allowed'
                )}
              >
                <Wand2 className="w-4 h-4" />
                Tailor My Resume
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
