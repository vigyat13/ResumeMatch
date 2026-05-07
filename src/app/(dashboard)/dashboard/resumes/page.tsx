import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResumesClient } from '@/components/resume/ResumesClient'

export const metadata = { title: 'My Resumes — ResumeMatch' }

export default async function ResumesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch resumes + their latest audit scores in parallel
  const [resumesResult, auditsResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, file_name, file_url, file_type, file_size, extracted_skills, parsing_status, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),

    supabase
      .from('audit_reports')
      .select('resume_id, overall_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const resumes = resumesResult.data ?? []
  const audits  = auditsResult.data ?? []

  // Map resume_id → latest audit score (audits are already sorted desc by created_at)
  const latestScoreByResume = new Map<string, number>()
  for (const a of audits) {
    if (!latestScoreByResume.has(a.resume_id) && a.overall_score !== null) {
      latestScoreByResume.set(a.resume_id, a.overall_score)
    }
  }

  const resumesWithScores = resumes.map((r) => ({
    ...r,
    latestAuditScore: latestScoreByResume.get(r.id) ?? null,
  }))

  return (
    <div className="space-y-2">
      <ResumesClient initialResumes={resumesWithScores} />
    </div>
  )
}
