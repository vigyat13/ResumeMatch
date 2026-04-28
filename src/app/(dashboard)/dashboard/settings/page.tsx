import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/SettingsClient'

export const metadata = { title: 'Settings — ResumeMatch' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, prefsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, timezone, subscription_tier')
      .eq('id', user.id)
      .single(),
    supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const profile = profileRes.data ?? {
    first_name: '',
    last_name:  '',
    avatar_url: null,
    timezone:   null,
    subscription_tier: 'free',
  }

  return (
    <div className="p-8">
      <SettingsClient
        profile={{ ...profile, email: user.email ?? '' }}
        prefs={prefsRes.data ?? null}
      />
    </div>
  )
}
