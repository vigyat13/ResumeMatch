'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Loader2, UploadCloud, WandSparkles, X } from 'lucide-react'
import type { ResumeData } from '@/lib/builder/types'

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface Props {
  templateId: string
  templateName: string
}

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export function TemplateStartClient({ templateId, templateName }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)

  function startBlank() {
    router.push(`/builder/${templateId}`)
  }

  async function handleFile(file: File) {
    if (!ALLOWED_MIME.includes(file.type)) {
      setError('Upload a PDF or DOCX resume.')
      setState('error')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum size is 10MB.')
      setState('error')
      return
    }

    setFileName(file.name)
    setError('')
    setState('uploading')
    setConfidence(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/v1/builder/parse-resume', {
        method: 'POST',
        body: formData,
      })
      const body = await response.json()

      if (!response.ok) {
        throw new Error(body.error ?? 'Could not parse this resume.')
      }

      const parsed = body.data as ResumeData
      window.localStorage.setItem(importKey(templateId), JSON.stringify(parsed))
      window.localStorage.removeItem('resumematch-builder-draft')
      setConfidence(body.meta?.confidence ?? null)
      setState('success')
      window.setTimeout(() => router.push(`/builder/${templateId}?source=upload`), 650)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not parse this resume.')
      setState('error')
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#263238]">
      <header className="flex h-20 items-center justify-between px-6 sm:px-10">
        <Link
          href="/builder"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#334148] transition-colors hover:bg-black/5"
          aria-label="Back to templates"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <Link
          href="/login"
          className="rounded-md border-2 border-[#5b51c8] px-4 py-2 text-sm font-bold text-[#5b51c8] transition-colors hover:bg-[#5b51c8] hover:text-white"
        >
          Login
        </Link>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center px-5 pb-16 text-center">
        <ResumeIllustration />

        <div className="mt-10 flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
          <WandSparkles className="h-3.5 w-3.5" />
          {templateName}
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-[-0.02em] text-[#263238] sm:text-5xl">
          Do you have an existing resume?
        </h1>
        <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-[#526168] sm:text-xl">
          Upload it and ResumeMatch will pre-fill this template with your contact, summary,
          experience, education, projects, and skills.
        </p>

        <div className="mt-10 grid w-full max-w-[520px] grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={state === 'uploading'}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-md bg-[#61c292] px-8 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#4daf80] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {state === 'uploading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
            {state === 'uploading' ? 'Parsing' : 'Yes'}
          </button>
          <button
            type="button"
            onClick={startBlank}
            disabled={state === 'uploading'}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-md border-2 border-[#334148] bg-white px-8 text-base font-bold text-[#263238] transition-colors hover:bg-[#eef1f4] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FileText className="h-5 w-5" />
            No
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={event => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
            event.target.value = ''
          }}
        />

        <div className="mt-6 min-h-12">
          {state === 'uploading' && (
            <p className="text-sm font-medium text-[#66747b]">
              Reading {fileName}, detecting sections, and mapping it into the builder.
            </p>
          )}
          {state === 'success' && (
            <p className="text-sm font-semibold text-emerald-700">
              Resume parsed{confidence !== null ? ` (${confidence}% confidence)` : ''}. Opening editor...
            </p>
          )}
          {state === 'error' && (
            <div className="inline-flex max-w-xl items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700">
              <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function ResumeIllustration() {
  return (
    <div className="relative h-[210px] w-[360px] max-w-full sm:h-[250px] sm:w-[460px]" aria-hidden="true">
      <div className="absolute left-1/2 top-10 h-36 w-72 -translate-x-1/2 rounded-[48%] bg-[#d9f2e7] sm:h-44 sm:w-96" />
      <div className="absolute left-1/2 top-4 h-40 w-28 -translate-x-1/2 rounded-sm bg-white shadow-xl ring-1 ring-black/5 sm:h-48 sm:w-32">
        <div className="h-full w-[38%] bg-[#3f6f6c]" />
        <div className="absolute left-[46%] top-7 h-2 w-12 rounded-full bg-[#93a8d8]" />
        <div className="absolute left-[46%] top-12 h-2 w-16 rounded-full bg-[#d5dcea]" />
        <div className="absolute left-[46%] top-17 h-2 w-14 rounded-full bg-[#d5dcea]" />
        <div className="absolute left-[46%] top-24 h-2 w-14 rounded-full bg-[#93a8d8]" />
        <div className="absolute left-[46%] top-32 h-2 w-16 rounded-full bg-[#d5dcea]" />
      </div>
      <div className="absolute left-16 top-24 hidden h-28 w-9 rounded-t-full bg-[#f0b07f] sm:block" />
      <div className="absolute left-12 top-32 hidden h-20 w-16 rounded-t-3xl bg-[#273b40] sm:block" />
      <div className="absolute right-16 top-24 hidden h-28 w-9 rounded-t-full bg-[#f1c49b] sm:block" />
      <div className="absolute right-11 top-32 hidden h-20 w-16 rounded-t-3xl bg-white shadow-sm sm:block" />
      <div className="absolute left-24 top-3 h-20 w-14 rotate-[-11deg] rounded bg-white/80 shadow-md ring-1 ring-black/5" />
      <div className="absolute right-24 top-6 h-20 w-14 rotate-[13deg] rounded bg-white/80 shadow-md ring-1 ring-black/5" />
      <div className="absolute bottom-2 left-1/2 h-3 w-44 -translate-x-1/2 rounded-full bg-black/5" />
    </div>
  )
}

function importKey(templateId: string): string {
  return `resumematch-builder-import-${templateId}`
}
