import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AuditReport } from '@/components/audit/AuditReport'
import { RunAuditButton } from '@/components/resume/RunAuditButton'
import type { AuditReport as AuditReportType } from '@/types/audit'

export const metadata = { title: 'ATS Audit — ResumeMatch' }

interface Props {
  params: Promise<{ resume_id: string }>
}

export default async function AuditPage({ params }: Props) {
  const { resume_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch resume + latest audit in parallel
  const [resumeResult, auditResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, file_name, parsing_status')
      .eq('id', resume_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single(),

    supabase
      .from('audit_reports')
      .select('*')
      .eq('resume_id', resume_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (resumeResult.error || !resumeResult.data) notFound()

  const resume = resumeResult.data
  const report = auditResult.data as AuditReportType | null
  const isParsed = resume.parsing_status === 'processed' || resume.parsing_status === 'completed'

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Back nav */}
      <Link
        href="/dashboard/resumes"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Resumes
      </Link>

      {/* No audit yet — empty state */}
      {!report && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 mb-5">
            <Sparkles className="w-7 h-7 text-[var(--color-accent)]" />
          </div>

          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            No audit yet for this resume
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-2 mb-6 max-w-sm mx-auto">
            Run an ATS audit to get a detailed score breakdown, see exactly what&apos;s blocking your resume
            from getting past automated filters, and get specific fixes.
          </p>

          {!isParsed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(245,240,232,0.06)] text-sm text-[var(--color-text-muted)]">
              {resume.parsing_status === 'failed'
                ? 'Text extraction failed. Go back and retry extraction or upload a text-based PDF/DOCX.'
                : 'Resume is still being parsed — check back shortly'}
            </div>
          ) : (
            <RunAuditButton resumeId={resume_id} />
          )}

          {/* What gets analyzed */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 text-left">
            {[
              { label: 'Format',       note: 'Section structure, parser compatibility', pct: '20%' },
              { label: 'Content',      note: 'Action verbs, quantified achievements', pct: '25%' },
              { label: 'Keywords',     note: 'Tech skills, role-specific terms', pct: '25%' },
              { label: 'Length',       note: 'Page count & content density', pct: '15%' },
              { label: 'Contact Info', note: 'Name, email, phone, LinkedIn', pct: '15%' },
            ].map(({ label, note, pct }) => (
              <div
                key={label}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">{label}</span>
                  <span className="text-xs font-bold text-[var(--color-accent)]">{pct}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit report */}
      {report && (
        <AuditReport
          report={report}
          resumeId={resume_id}
          resumeName={resume.file_name ?? 'Resume'}
        />
      )}
    </div>
  )
}
