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
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Find Jobs</h1>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
          Real-time job search — LinkedIn, Indeed, Glassdoor & more
        </p>
      </div>
      <JobSearchAgent />
    </div>
  )
}
