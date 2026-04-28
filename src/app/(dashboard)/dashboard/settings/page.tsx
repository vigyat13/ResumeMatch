import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata = { title: 'Settings — ResumeMatch' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <ComingSoon
      feature="Account Settings"
      description="Manage your profile, notification preferences, billing, and connected accounts — all in one place."
      eta="Coming soon"
      bullets={[
        'Edit your name, email, and profile picture',
        'Notification and email preferences',
        'Subscription and billing management',
        'Connected OAuth accounts (Google, GitHub)',
      ]}
    />
  )
}
