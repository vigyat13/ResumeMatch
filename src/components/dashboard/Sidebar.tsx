'use client'

/**
 * SIDEBAR COMPONENT
 *
 * 'use client' because:
 * - Uses useState for collapsed/expanded toggle
 * - Uses usePathname() to highlight the active nav link
 * - Has interactive buttons (logout, collapse)
 *
 * Pattern: Server Component (layout) fetches data, passes it as props
 * to a Client Component (sidebar) that handles interactions.
 * This avoids client-side data fetching for info available at render time.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface SidebarUser {
  id:                string
  email:             string
  first_name:        string
  last_name:         string
  avatar_url:        string | null
  subscription_tier: string
}

interface NavItem {
  label: string
  href:  string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard' },
  { label: 'My Resumes',  href: '/dashboard/resumes' },
  { label: 'Job Matches', href: '/dashboard/matches' },
  { label: 'Templates',   href: '/dashboard/templates' },
  { label: 'Settings',    href: '/dashboard/settings' },
]

export function Sidebar({ user }: { user: SidebarUser }) {
  const [collapsed, setCollapsed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = useMemo(() => createClient(), [])

  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
  const isPro    = user.subscription_tier === 'pro' || user.subscription_tier === 'enterprise'

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'same-origin' })
      await supabase.auth.signOut()
      router.replace('/login')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
    <div className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-[0.01em] text-[var(--color-text-primary)]"
          style={{ fontFamily: 'var(--font-headline), sans-serif' }}
        >
          Resume<span className="text-[var(--color-accent)]">Match</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/builder"
            className="rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-black"
          >
            Builder
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] disabled:opacity-50"
          >
            Out
          </button>
        </div>
      </div>
    </div>

    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]/96 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      {NAV_ITEMS.map(({ label, href }) => {
        const active = isActivePath(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors',
              active
                ? 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)]'
            )}
          >
            <span className="text-[11px]">{label.split(' ').map(word => word[0]).join('')}</span>
            <span className="mt-0.5 max-w-full truncate">{label.replace('Job ', '')}</span>
          </Link>
        )
      })}
    </nav>

    <aside
      className={cn(
        'relative hidden flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] md:flex',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center px-4 py-5 border-b border-[var(--color-border)]',
        collapsed && 'justify-center px-0'
      )}>
        <Link
          href="/dashboard"
          style={{ fontFamily: 'var(--font-headline), sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: '0.01em', color: 'var(--color-text-primary)', textDecoration: 'none' }}
        >
          {collapsed
            ? <span style={{ color: 'var(--color-accent)' }}>R</span>
            : <>Resume<span style={{ color: 'var(--color-accent)' }}>Match</span></>
          }
        </Link>
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className={cn(
          'absolute -right-3 top-6 z-10',
          'w-6 h-6 rounded-full border border-[var(--color-border)]',
          'bg-[var(--color-surface-raised)] flex items-center justify-center',
          'hover:bg-[var(--color-surface-hover)] transition-colors'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <span className="text-[11px] text-[var(--color-text-muted)]">›</span>
          : <span className="text-[11px] text-[var(--color-text-muted)]">‹</span>
        }
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href }) => {
          const active = isActivePath(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-colors duration-150',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
              )}
            >
              {collapsed
                ? <span className="text-xs font-semibold">{label.slice(0, 2).toUpperCase()}</span>
                : <span>{label}</span>
              }
            </Link>
          )
        })}
      </nav>

      {/* Upgrade banner — only for free users, expanded sidebar */}
      {!collapsed && !isPro && (
        <div className="mx-2 mb-3 p-3 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-brand-400)]/10 border border-[var(--color-accent)]/20">
          <p className="text-xs font-semibold text-[var(--color-accent)] mb-1.5">Upgrade to Pro</p>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">
            Unlock unlimited AI audits and priority matching.
          </p>
          <Link
            href="/dashboard/settings?tab=billing"
            className="block w-full text-center text-xs font-medium py-1.5 px-3 rounded-md bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* User profile + logout */}
      <div className={cn(
        'flex items-center gap-3 px-3 py-4 border-t border-[var(--color-border)]',
        collapsed && 'justify-center flex-col gap-1 px-0 py-3'
      )}>
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-[var(--color-accent)] flex items-center justify-center">
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            : <span className="text-xs font-semibold text-white">{initials}</span>
          }
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Log out"
          className="flex-shrink-0 p-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          Out
        </button>
      </div>
    </aside>
    </>
  )
}

function isActivePath(pathname: string, href: string): boolean {
  return href === '/dashboard'
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)
}
