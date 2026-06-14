'use client'

/**
 * SIDEBAR COMPONENT
 *
 * Server Component (layout) fetches the user and passes it here; this Client
 * Component handles the active-link highlight, collapse toggle, and logout.
 */

import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, FileText, Search, ClipboardList, Settings, LogOut,
} from 'lucide-react'
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
  label:  string   // full label (desktop)
  short:  string   // compact label (mobile tab bar)
  href:   string
  icon:   LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    short: 'Home',     href: '/dashboard',              icon: LayoutDashboard },
  { label: 'My Resumes',   short: 'Resumes',  href: '/dashboard/resumes',      icon: FileText },
  { label: 'Find Jobs',    short: 'Jobs',     href: '/dashboard/jobs',         icon: Search },
  { label: 'Applications', short: 'Apps',     href: '/dashboard/applications', icon: ClipboardList },
  { label: 'Settings',     short: 'Settings', href: '/dashboard/settings',     icon: Settings },
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
      {/* ── Mobile top bar ───────────────────────────────── */}
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
              className="rounded-full bg-[var(--color-accent)] px-3.5 py-1.5 text-xs font-semibold text-black"
            >
              + New
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Log out"
              className="rounded-full border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom tab bar ────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]/96 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        {NAV_ITEMS.map(({ short, href, icon: Icon }) => {
          const active = isActivePath(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors',
                active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{short}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside
        className={cn(
          'relative hidden flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] md:flex',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center border-b border-[var(--color-border)] px-4 py-5',
          collapsed && 'justify-center px-0',
        )}>
          <Link
            href="/dashboard"
            style={{ fontFamily: 'var(--font-headline), sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: '0.01em', color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            {collapsed
              ? <span style={{ color: 'var(--color-accent)' }}>R</span>
              : <>Resume<span style={{ color: 'var(--color-accent)' }}>Match</span></>}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-colors hover:bg-[var(--color-surface-hover)]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-[11px] text-[var(--color-text-muted)]">{collapsed ? '›' : '‹'}</span>
        </button>

        {/* Primary CTA */}
        <div className={cn('px-3 pt-4', collapsed && 'px-2')}>
          <Link
            href="/builder"
            title={collapsed ? 'New resume' : undefined}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90',
              collapsed && 'px-0',
            )}
          >
            <FileText className="h-4 w-4" />
            {!collapsed && 'New resume'}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActivePath(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]',
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Upgrade banner — free users only */}
        {!collapsed && !isPro && (
          <div className="mx-2 mb-3 rounded-lg border border-[var(--color-accent)]/20 bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-brand-400)]/10 p-3">
            <p className="mb-1.5 text-xs font-semibold text-[var(--color-accent)]">Upgrade to Pro</p>
            <p className="mb-2 text-xs text-[var(--color-text-muted)]">Unlimited AI audits and priority matching.</p>
            <Link
              href="/dashboard/settings?tab=billing"
              className="block w-full rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-center text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              Upgrade Now
            </Link>
          </div>
        )}

        {/* User + logout */}
        <div className={cn(
          'flex items-center gap-3 border-t border-[var(--color-border)] px-3 py-4',
          collapsed && 'flex-col justify-center gap-1 px-0 py-3',
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-accent)]">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              : <span className="text-xs font-semibold text-white">{initials}</span>}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                {user.first_name} {user.last_name}
              </p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">{user.email}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Log out"
            aria-label="Log out"
            className="shrink-0 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
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
