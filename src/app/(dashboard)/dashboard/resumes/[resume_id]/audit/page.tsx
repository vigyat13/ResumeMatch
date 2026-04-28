import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata = { title: 'ATS Audit — ResumeMatch' }

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <ComingSoon
      feature="ATS Audit Engine"
      description="Get a detailed breakdown of how Applicant Tracking Systems score your resume — keyword density, formatting issues, section detection, and more."
      eta="Coming soon"
      backHref="/dashboard/resumes"
      backLabel="Back to Resumes"
      bullets={[
        'Overall ATS score out of 100 with category breakdown',
        'Keyword density vs. target job description',
        'Format & structure checks (columns, tables, fonts)',
        'Actionable fixes ranked by impact on score',
      ]}
    />
  )
}
