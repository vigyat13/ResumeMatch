import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/SettingsClient'

export const metadata = { title: 'Settings — ResumeMatch' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: prefs }] = await Promise.all([
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

  return (
    <SettingsClient
      profile={{
        first_name:        profile?.first_name ?? '',
        last_name:         profile?.last_name ?? '',
        email:             user.email ?? '',
        avatar_url:        profile?.avatar_url ?? null,
        timezone:          profile?.timezone ?? null,
        subscription_tier: profile?.subscription_tier ?? 'free',
      }}
      prefs={prefs ?? null}
    />
  )
}
