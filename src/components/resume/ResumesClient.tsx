'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileSearch, Sparkles, ExternalLink, Wand2 } from 'lucide-react'
import { ResumeCard } from './ResumeCard'
import { ResumeUploadModal } from './ResumeUploadModal'
import { SmartUploadZone } from './SmartUploadZone'
import { LinkedinImportModal } from '@/components/linkedin/LinkedinImportModal'
import { TailorWizard } from '@/components/tailor/TailorWizard'

interface ResumeWithScore {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  extracted_skills: string[] | null
  parsing_status: string
  created_at: string | null
  latestAuditScore: number | null
}

interface Props {
  initialResumes: ResumeWithScore[]
}

export function ResumesClient({ initialResumes }: Props) {
  const [resumes, setResumes] = useState(initialResumes)
  const [showUpload, setShowUpload] = useState(false)
  const [showSmartUpload, setShowSmartUpload] = useState(false)
  const [showLinkedin, setShowLinkedin] = useState(false)
  const [showTailor, setShowTailor] = useState(false)
  const router = useRouter()

  const refreshResumes = useCallback(async () => {
    const res = await fetch('/api/v1/resumes', { cache: 'no-store' })
    if (!res.ok) return
    const body = await res.json()
    const next = (body.data ?? []) as Omit<ResumeWithScore, 'latestAuditScore'>[]
    setResumes((current) => {
      const scores = new Map(current.map((resume) => [resume.id, resume.latestAuditScore]))
      return next.map((resume) => ({
        ...resume,
        latestAuditScore: scores.get(resume.id) ?? null,
      }))
    })
  }, [])

  useEffect(() => {
    if (!resumes.some((resume) => resume.parsing_status === 'pending')) return
    const interval = window.setInterval(async () => {
      try { await refreshResumes() } catch { /* keep current state */ }
    }, 2200)
    return () => window.clearInterval(interval)
  }, [refreshResumes, resumes])

  const handleDelete = useCallback((id: string) => {
    setResumes((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const handleUploadSuccess = useCallback(() => {
    void refreshResumes()
    router.refresh()
  }, [refreshResumes, router])

  return (
    <>
      {/* Modals */}
      <ResumeUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadSuccess={handleUploadSuccess}
      />
      <SmartUploadZone
        isOpen={showSmartUpload}
        onClose={() => setShowSmartUpload(false)}
        onSuccess={handleUploadSuccess}
      />
      <LinkedinImportModal
        isOpen={showLinkedin}
        onClose={() => setShowLinkedin(false)}
        onSuccess={() => { setShowLinkedin(false); window.location.href = '/builder' }}
      />
      <TailorWizard isOpen={showTailor} onClose={() => setShowTailor(false)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Resume Library</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {resumes.length === 0
              ? 'Import your first resume to get an ATS audit'
              : `${resumes.length} resume${resumes.length !== 1 ? 's' : ''} · click any to run an ATS audit`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLinkedin(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            title="Import from LinkedIn"
          >
            <ExternalLink className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">LinkedIn</span>
          </button>
          <button
            onClick={() => setShowSmartUpload(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            title="AI Smart Import"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="hidden sm:inline">Smart Import</span>
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-foreground)] text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      {/* Quick actions row */}
      {resumes.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowTailor(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-400 hover:bg-purple-500/20 transition-colors"
          >
            <Wand2 className="w-3 h-3" /> Tailor for a Job
          </button>
        </div>
      )}

      {/* Empty state */}
      {resumes.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-12 text-center mt-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 mb-5">
            <FileSearch className="w-7 h-7 text-[var(--color-accent)]" />
          </div>
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">No resumes yet</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-sm mx-auto">
            Import your resume from any source — PDF, DOCX, image, or LinkedIn — and get an AI-powered ATS audit.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowSmartUpload(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-foreground)] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              Smart Import
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <Upload className="w-4 h-4" />
              Basic Upload
            </button>
            <button
              onClick={() => setShowLinkedin(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              LinkedIn
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-8 text-left max-w-2xl mx-auto">
            {[
              { step: '01', title: 'Any Format', desc: 'PDF, DOCX, PNG, JPG, WebP' },
              { step: '02', title: 'AI Parsing',  desc: 'Auto-detect sections & skills' },
              { step: '03', title: 'Structured',  desc: 'Editable resume builder data' },
              { step: '04', title: 'ATS Audit',  desc: 'Score & optimize instantly' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
                <p className="text-xs font-bold tracking-widest text-[var(--color-accent)] mb-1">{step}</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resume grid */}
      {resumes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {resumes.map((resume) => (
            <ResumeCardWithScore
              key={resume.id}
              resume={resume}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </>
  )
}

function ResumeCardWithScore({
  resume,
  onDelete,
}: {
  resume: ResumeWithScore
  onDelete: (id: string) => void
}) {
  return (
    <div className="relative">
      {resume.latestAuditScore !== null && (
        <div
          className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums"
          style={{
            color: auditScoreColor(resume.latestAuditScore),
            backgroundColor: `${auditScoreColor(resume.latestAuditScore)}18`,
            border: `1px solid ${auditScoreColor(resume.latestAuditScore)}40`,
          }}
        >
          ATS {resume.latestAuditScore}
        </div>
      )}
      <ResumeCard resume={resume} onDelete={onDelete} />
    </div>
  )
}

function auditScoreColor(score: number): string {
  if (score >= 80) return '#34d399'
  if (score >= 60) return '#fbbf24'
  if (score >= 40) return '#f97316'
  return '#f87171'
}
