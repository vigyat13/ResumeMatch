import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApplicationsBoard } from '@/components/applications/ApplicationsBoard'

export const metadata = { title: 'Applications — ResumeMatch' }

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Applications</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Everything you saved or applied to, tracked through your pipeline.
        </p>
      </header>

      <ApplicationsBoard />
    </div>
  )
}
