'use client'

/**
 * RESUME UPLOAD MODAL
 *
 * Drag-and-drop file upload with progress tracking.
 * Uses the Fetch API with XMLHttpRequest for real upload progress.
 *
 * State machine (5 states):
 *   idle → dragging → uploading → success | error
 *   error → idle (retry)
 *
 * Key concept — FormData + fetch vs JSON:
 * File uploads require multipart/form-data encoding, not JSON.
 * Never set Content-Type manually for FormData — the browser
 * adds the correct boundary string automatically.
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, CloudUpload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModalState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error'

interface Props {
  isOpen:          boolean
  onClose:         () => void
  onUploadSuccess: (resumeId: string) => void
}

const MAX_SIZE     = 10 * 1024 * 1024
const ALLOWED_MIME = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_EXT  = ['.pdf', '.docx']

export function ResumeUploadModal({ isOpen, onClose, onUploadSuccess }: Props) {
  const [state,    setState]    = useState<ModalState>('idle')
  const [progress, setProgress] = useState(0)
  const [phase, setPhase]       = useState('Waiting for file')
  const [fileName, setFileName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [uploadedId, setUploadedId] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef  = useRef<HTMLDivElement>(null)
  const router       = useRouter()

  const resetState = useCallback(() => {
    setState('idle')
    setProgress(0)
    setPhase('Waiting for file')
    setFileName('')
    setErrorMsg('')
  }, [])

  const closeModal = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, closeModal])

  function validate(file: File): string | null {
    if (!ALLOWED_MIME.includes(file.type)) {
      return 'Only PDF and DOCX files are supported.'
    }
    if (file.size > MAX_SIZE) {
      return 'File is too large. Maximum size is 10MB.'
    }
    return null
  }

  function handleFileSelect(file: File) {
    const err = validate(file)
    if (err) {
      setErrorMsg(err)
      setState('error')
      return
    }
    setFileName(file.name)
    uploadFile(file)
  }

  function uploadFile(file: File) {
    setState('uploading')
    setProgress(0)
    setPhase('Uploading securely')

    const formData = new FormData()
    formData.append('file', file)

    // Use XMLHttpRequest for real upload progress events
    // Fetch API does not support upload progress yet
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.min(58, Math.round((e.loaded / e.total) * 58)))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 201) {
        const body = JSON.parse(xhr.responseText)
        setUploadedId(body.data.resume_id)
        setProgress(100)
        setPhase(body.data.parsing_status === 'processed' ? 'Skills extracted' : 'Extraction needs retry')
        setState('success')
        onUploadSuccess(body.data.resume_id)
      } else {
        const body = JSON.parse(xhr.responseText)
        setErrorMsg(body.error ?? 'Upload failed. Please try again.')
        setState('error')
      }
    }

    xhr.onerror = () => {
      setErrorMsg('Upload failed. Please check your connection and try again.')
      setState('error')
    }

    xhr.open('POST', '/api/v1/resumes/upload')
    xhr.send(formData)

    const phases = [
      [800, 'Uploading securely', 42],
      [1600, 'Reading document text', 68],
      [2600, 'Detecting sections', 76],
      [3600, 'Extracting skills', 84],
      [4800, 'Preparing ATS audit', 92],
    ] as const

    phases.forEach(([delay, label, nextProgress]) => {
      window.setTimeout(() => {
        setState((current) => {
          if (current === 'uploading') {
            setPhase(label)
            setProgress((currentProgress) => Math.max(currentProgress, nextProgress))
          }
          return current
        })
      }, delay)
    })
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState(s => s === 'uploading' || s === 'success' ? s : 'dragging')
  }, [])

  const onDragLeave = useCallback(() => {
    setState(s => s === 'dragging' ? 'idle' : s)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (state === 'uploading') return
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  if (!isOpen) return null

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Upload Resume</h2>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Error banner */}
          {state === 'error' && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
          )}

          {/* Success state */}
          {state === 'success' ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                Resume uploaded successfully
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-5">
                Skills were extracted and the ATS audit page is ready.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    closeModal()
                    router.push(`/dashboard/resumes/${uploadedId}/audit`)
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Open ATS Audit
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                ref={dropZoneRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => state !== 'uploading' && fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 py-12 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
                  state === 'dragging'
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-hover)]',
                  state === 'uploading' && 'cursor-default opacity-70 pointer-events-none'
                )}
              >
                {state === 'uploading' ? (
                  <div className="relative grid h-14 w-14 place-items-center">
                    <div className="absolute inset-0 rounded-full border border-[var(--color-accent)]/20" />
                    <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-[var(--color-accent)] animate-spin" />
                    <Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-pulse" />
                  </div>
                ) : (
                  <CloudUpload className={cn(
                    'w-10 h-10 transition-colors',
                    state === 'dragging' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                  )} />
                )}

                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {state === 'uploading'
                      ? phase
                      : state === 'dragging'
                      ? 'Drop to upload'
                      : 'Drag resume here or click to browse'
                    }
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {state === 'uploading' ? fileName : 'PDF or DOCX, max 10MB'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {state === 'uploading' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span className="truncate max-w-[80%]">{fileName}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Retry button for error state */}
              {state === 'error' && (
                <button
                  onClick={() => setState('idle')}
                  className="w-full py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Try Again
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXT.join(',')}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                  e.target.value = ''
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
