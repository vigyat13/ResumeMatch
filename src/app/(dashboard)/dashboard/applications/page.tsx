import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApplicationIntelligenceClient } from '@/components/applications/ApplicationIntelligenceClient'

export const metadata = { title: 'Applications — ResumeMatch' }

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: resumes } = await supabase
    .from('resumes')
    .select('id, file_name')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return <ApplicationIntelligenceClient resumes={resumes ?? []} />
}
