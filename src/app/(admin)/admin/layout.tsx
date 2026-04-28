/**
 * ADMIN LAYOUT
 *
 * Wraps all /admin/* pages.
 * Uses requireAdmin() — non-admins are redirected to /dashboard
 * before they can see anything.
 *
 * Visual cue: red accent + "ADMIN" badge so admins know they're
 * in a different mode. Helps prevent accidental data changes.
 */

import Link from 'next/link'
import { Shield, FileClock, Activity, Users, ArrowLeft, LineChart } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/guards'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireAdmin()

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Admin top bar — distinct from user dashboard */}
      <div className="border-b border-red-500/20 bg-red-500/5">
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-6 py-3">
          <Shield className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold text-red-600 tracking-wide uppercase">
            Admin Mode
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            Signed in as {profile.first_name} {profile.last_name} ({profile.role})
          </span>
          <Link
            href="/dashboard"
            className="ml-auto flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to user dashboard
          </Link>
        </div>
      </div>

      {/* Admin sidebar + content */}
      <div className="max-w-7xl mx-auto flex gap-8 px-6 py-8">
        <nav className="w-56 flex-shrink-0 space-y-1">
          <AdminNavLink href="/admin"             icon={Activity}   label="Overview" />
          <AdminNavLink href="/admin/metrics"    icon={LineChart}   label="Performance" />
          <AdminNavLink href="/admin/audit-logs" icon={FileClock}   label="Audit Logs" />
          <AdminNavLink href="/admin/users"      icon={Users}       label="Users" />
        </nav>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

function AdminNavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </Link>
  )
}
