import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JobSearch } from '@/components/dashboard/jobs/JobSearch'

export const metadata = { title: 'Find Jobs — ResumeMatch' }

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', user.id)
    .single()

  return <JobSearch firstName={profile?.first_name || undefined} />
}
