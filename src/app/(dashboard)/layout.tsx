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
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'

const DASHBOARD_LOCKED = process.env.NEXT_PUBLIC_DASHBOARD_LOCKED === 'true'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (DASHBOARD_LOCKED) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-12 text-foreground">
        <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Dashboard locked</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Dashboard access is paused for now.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            We are keeping the dashboard private while this area is being finished. The resume builder is still available.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/builder"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open builder
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Back home
            </Link>
          </div>
        </section>
      </main>
    )
  }

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
    <div className="flex min-h-dvh flex-col bg-[var(--color-surface)] md:h-screen md:flex-row md:overflow-hidden">
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
      <main className="min-w-0 flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
