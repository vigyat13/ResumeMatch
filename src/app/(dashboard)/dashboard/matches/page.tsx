import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata = { title: 'Job Matches — ResumeMatch' }

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <ComingSoon
      feature="Job Matching"
      description="Paste any job description and we'll score your resume against it, highlight skill gaps, and give you tailored suggestions to beat the ATS filter."
      eta="Coming soon"
      bullets={[
        'Instant match percentage against any job posting',
        'Skill gap analysis — see exactly what you\'re missing',
        'AI-powered bullet rewrites to close the gap',
        'Track which jobs you\'ve matched and applied to',
      ]}
    />
  )
}
