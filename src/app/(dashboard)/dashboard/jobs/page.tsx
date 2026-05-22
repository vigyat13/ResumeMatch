import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JobSearchAgent } from '@/components/dashboard/jobs/JobSearchAgent'

export const metadata = { title: 'Find Jobs — ResumeMatch' }

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <JobSearchAgent />
    </div>
  )
}
