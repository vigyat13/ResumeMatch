import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MatchesClient } from '@/components/matches/MatchesClient'

export const metadata = { title: 'Job Matches — ResumeMatch' }

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [matchesResult, resumesResult] = await Promise.all([
    supabase
      .from('job_matches')
      .select('id, job_title, company, match_percentage, matched_skills, missing_skills, extra_skills, recommendations, saved, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),

    supabase
      .from('resumes')
      .select('id, file_name')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  return (
    <MatchesClient
      initialMatches={matchesResult.data ?? []}
      resumes={resumesResult.data ?? []}
    />
  )
}
