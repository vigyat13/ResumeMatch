'use client'

/**
 * RESUMES PAGE — /dashboard/resumes
 *
 * 'use client' because:
 * - Upload modal state (open/closed)
 * - Optimistic UI: remove deleted cards without refetch
 * - After upload success: add new card to list
 *
 * Pattern — client-side data fetching with SWR-style polling:
 * We fetch resumes on mount and after upload success.
 * We also poll every 5 seconds while any resume is 'pending'
 * to pick up the background parsing completion.
 */

import { useState, useEffect, useCallback } from 'react'
import { Upload, FileText } from 'lucide-react'
import { ResumeUploadModal } from '@/components/resume/ResumeUploadModal'
import { ResumeCard }        from '@/components/resume/ResumeCard'

interface Resume {
  id:               string
  file_name:        string
  file_url:         string
  file_type:        string
  file_size:        number
  extracted_skills: string[] | null
  parsing_status:   string
  created_at:       string
}

export default function ResumesPage() {
  const [resumes,     setResumes]     = useState<Resume[]>([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)

  const hasPending = resumes.some(r => r.parsing_status === 'pending')

  const fetchResumes = useCallback(async () => {
    try {
      const res  = await fetch('/api/v1/resumes')
      const body = await res.json()
      if (res.ok) setResumes(body.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => { fetchResumes() }, [fetchResumes])

  // Poll every 5s while any resume is still being parsed
  useEffect(() => {
    if (!hasPending) return
    const id = setInterval(fetchResumes, 5000)
    return () => clearInterval(id)
  }, [hasPending, fetchResumes])

  function handleUploadSuccess(resumeId: string) {
    // Add a placeholder card immediately (optimistic) then refetch
    fetchResumes()
    setModalOpen(false)
    void resumeId
  }

  function handleDelete(id: string) {
    // Optimistic remove — no need to wait for refetch
    setResumes(prev => prev.filter(r => r.id !== id))
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Resumes</h1>
            <p className="text-[var(--color-text-muted)] mt-1">
              {resumes.length > 0
                ? `${resumes.length} resume${resumes.length !== 1 ? 's' : ''} uploaded`
                : 'Upload your resume to get started'}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Resume
          </button>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && resumes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[var(--color-accent)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              No resumes yet
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-xs">
              Upload your first resume to get AI-powered feedback and job matching.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Upload className="w-4 h-4" />
              Upload Your First Resume
            </button>
          </div>
        )}

        {/* Resume grid */}
        {!loading && resumes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map(resume => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <ResumeUploadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  )
}
