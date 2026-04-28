/**
 * DASHBOARD LAYOUT
 *
 * This is a Server Component layout wrapping all /dashboard pages.
 * It renders the sidebar + main content area.
 *
 * Key concept — Route Groups:
 * The (dashboard) folder name with parentheses is a "route group".
 * It groups files for shared layouts WITHOUT affecting the URL.
 * So /app/(dashboard)/dashboard/page.tsx → URL is just /dashboard
 *
 * The layout reads the user from Supabase server-side, so we know
 * who is logged in without an extra API call from the client.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Server-side auth check — middleware also does this, but belt-and-suspenders
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile for sidebar display
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, avatar_url, subscription_tier')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-[var(--color-surface)] overflow-hidden">
      <Sidebar
        user={{
          id:                user.id,
          email:             user.email ?? '',
          first_name:        profile?.first_name ?? '',
          last_name:         profile?.last_name ?? '',
          avatar_url:        profile?.avatar_url ?? null,
          subscription_tier: profile?.subscription_tier ?? 'free',
        }}
      />

      {/* Main content area — scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
