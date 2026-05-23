'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import {
  X, Upload, FileText, Image, CheckCircle2, AlertCircle,
  Loader2, Sparkles, FileType, Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type UploadState = 'idle' | 'dragging' | 'uploading' | 'parsing' | 'success' | 'error'
type FileFormat = 'pdf' | 'docx' | 'image'

interface ParseStage {
  stage: string
  percent: number
  message: string
}

interface SmartUploadResult {
  resume_id?: string
  file_name: string
  text: string
  skills: string[]
  parsed: {
    resumeData: Record<string, unknown>
    confidence: { overall: number }
    sections: Array<{ type: string; confidence: number }>
    warnings: string[]
  } | null
  error: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: SmartUploadResult) => void
}

const ACCEPTED_TYPES: Record<string, FileFormat> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/webp': 'image',
}

const MAX_SIZE = 10 * 1024 * 1024
const FORMAT_LABELS: Record<FileFormat, { icon: typeof FileText; label: string }> = {
  pdf: { icon: FileText, label: 'PDF' },
  docx: { icon: FileType, label: 'DOCX' },
  image: { icon: Image, label: 'Image' },
}

const PARSE_STAGES: ParseStage[] = [
  { stage: 'decoding', percent: 5, message: 'Reading file' },
  { stage: 'extracting_text', percent: 25, message: 'Extracting text content' },
  { stage: 'detecting_sections', percent: 45, message: 'Detecting resume sections' },
  { stage: 'ai_analysis', percent: 60, message: 'AI analyzing structure' },
  { stage: 'extracting_skills', percent: 80, message: 'Extracting skills & keywords' },
  { stage: 'building_resume', percent: 95, message: 'Building structured resume' },
]

export function SmartUploadZone({ isOpen, onClose, onSuccess }: Props) {
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileFormat, setFileFormat] = useState<FileFormat | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<SmartUploadResult | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const resetState = useCallback(() => {
    setState('idle')
    setProgress(0)
    setPhase('')
    setFileName('')
    setFileFormat(null)
    setErrorMsg('')
    setResult(null)
  }, [])

  const close = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  function handleFile(file: File) {
    const fmt = ACCEPTED_TYPES[file.type]
    if (!fmt) {
      setErrorMsg('Unsupported format. Accepted: PDF, DOCX, PNG, JPG, WebP.')
      setState('error')
      return
    }
    if (file.size > MAX_SIZE) {
      setErrorMsg('File too large. Maximum 10MB.')
      setState('error')
      return
    }

    setFileName(file.name)
    setFileFormat(fmt)
    uploadAndParse(file, fmt)
  }

  async function uploadAndParse(file: File, fmt: FileFormat) {
    setState('uploading')
    setProgress(0)
    setPhase('Uploading...')

    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 20))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const body = JSON.parse(xhr.responseText)
        const data = body.data as SmartUploadResult
        setResult(data)
        setState('success')
        setProgress(100)
        setPhase('Parse complete')
        onSuccess(data)
      } else {
        try {
          const body = JSON.parse(xhr.responseText)
          setErrorMsg(body.error ?? 'Processing failed.')
        } catch {
          setErrorMsg('Processing failed.')
        }
        setState('error')
      }
    }

    xhr.onerror = () => {
      setErrorMsg('Connection error. Please try again.')
      setState('error')
    }

    xhr.open('POST', '/api/v1/resumes/parse-ai')
    xhr.send(formData)

    setState('parsing')
    setPhase('Extracting text...')

    PARSE_STAGES.forEach(({ stage, percent, message }) => {
      window.setTimeout(() => {
        setState((s) => {
          if (s === 'parsing' || s === 'uploading') {
            setPhase(message)
            setProgress((p) => Math.max(p, 20 + Math.round((percent / 100) * 75)))
          }
          return s
        })
      }, stage === 'ai_analysis' ? 2000 : stage === 'extracting_skills' ? 3500 : 1000)
    })
  }

  if (!isOpen) return null

  const FormatIcon = fileFormat ? FORMAT_LABELS[fileFormat].icon : Upload

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-2xl animate-reveal-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Smart Import</h2>
              <p className="text-xs text-[var(--color-text-muted)]">AI-powered resume parsing</p>
            </div>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {state === 'error' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-500">{errorMsg}</p>
                <p className="text-xs text-red-400/80 mt-1">Try a different file or check the format.</p>
              </div>
            </div>
          )}

          {state === 'success' && result ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Resume Parsed Successfully</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{result.file_name}</p>
              </div>

              {result.parsed && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[var(--color-surface-hover)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--color-accent)]">{result.parsed.confidence.overall}%</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Parse Confidence</p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-surface-hover)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{result.skills.length}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Skills Found</p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-surface-hover)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{result.parsed.sections.length}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Sections</p>
                  </div>
                </div>
              )}

              {result.parsed?.warnings && result.parsed.warnings.length > 0 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                  <p className="text-xs font-semibold text-amber-500 mb-1">Warnings</p>
                  {result.parsed.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-500/80">{w}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    close()
                    window.location.href = '/builder'
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-foreground)] text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Open in Builder
                </button>
                <button
                  onClick={() => { resetState() }}
                  className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Import Another
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setState(s => s === 'uploading' || s === 'parsing' ? s : 'dragging') }}
                onDragLeave={() => setState(s => s === 'dragging' ? 'idle' : s)}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && state !== 'uploading' && state !== 'parsing') handleFile(f) }}
                onClick={() => state !== 'uploading' && state !== 'parsing' && fileInputRef.current?.click()}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-4 py-14 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all',
                  state === 'dragging'
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 scale-[1.01]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-hover)]',
                  (state === 'uploading' || state === 'parsing') && 'cursor-default pointer-events-none'
                )}
              >
                {state === 'uploading' || state === 'parsing' ? (
                  <div className="text-center space-y-3">
                    <div className="relative grid h-16 w-16 place-items-center mx-auto">
                      <div className="absolute inset-0 rounded-full border border-[var(--color-accent)]/20" />
                      <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-[var(--color-accent)] animate-spin" />
                      <FormatIcon className="w-7 h-7 text-[var(--color-accent)] animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{phase}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{fileName}</p>
                  </div>
                ) : state === 'idle' ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center group-hover:bg-[var(--color-accent)]/15 transition-colors">
                      <Sparkles className="w-7 h-7 text-[var(--color-accent)]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        Drop your resume here or click to browse
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1.5 max-w-xs mx-auto">
                        AI parses any format — PDF, DOCX, PNG, JPG
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {(['pdf', 'docx', 'image'] as FileFormat[]).map((fmt) => {
                        const info = FORMAT_LABELS[fmt]
                        const Icon = info.icon
                        return (
                          <span key={fmt} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-surface-hover)] text-[10px] font-medium text-[var(--color-text-muted)]">
                            <Icon className="w-3 h-3" /> {info.label}
                          </span>
                        )
                      })}
                    </div>
                  </>
                ) : state === 'dragging' ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center animate-bounce">
                      <Upload className="w-6 h-6 text-[var(--color-accent)]" />
                    </div>
                    <p className="text-base font-semibold text-[var(--color-accent)]">Drop to import</p>
                  </>
                ) : null}
              </div>

              {(state === 'uploading' || state === 'parsing') && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span className="truncate max-w-[75%]">{fileName}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-emerald-400 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {state === 'parsing' && (
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Processing with AI...
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function useRouter() {
  return { refresh: () => window.location.reload() }
}
