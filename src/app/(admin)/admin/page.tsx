/**
 * ADMIN OVERVIEW PAGE
 *
 * Shows top-level system metrics:
 *  • Total users, signups today
 *  • Resumes uploaded
 *  • Recent audit events
 *
 * This is a Server Component — runs queries directly.
 * RLS is bypassed because the requireAdmin() check happens
 * in the layout, and admins legitimately need cross-user metrics.
 */

import Link from 'next/link'
import { Users, FileText, Activity, Clock } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'

export default async function AdminOverviewPage() {
  const admin = createAdminClient()

  // Parallel fetches — all aggregations at once
  const [
    { count: totalUsers },
    { count: totalResumes },
    { count: totalAudits },
    { data: recentEvents },
    { count: signupsToday },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('resumes').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    admin.from('audit_logs').select('*', { count: 'exact', head: true }),
    admin.from('audit_logs').select('id, event_type, user_id, created_at').order('created_at', { ascending: false }).limit(10),
    admin.from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'signup')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ])

  const metrics = [
    { label: 'Total Users',     value: totalUsers ?? 0,    icon: Users,    color: 'text-blue-500',    bg: 'bg-blue-500/10' },
    { label: 'Active Resumes',  value: totalResumes ?? 0,  icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Audit Events',    value: totalAudits ?? 0,   icon: Activity, color: 'text-violet-500',  bg: 'bg-violet-500/10' },
    { label: 'Signups (24h)',   value: signupsToday ?? 0,  icon: Clock,    color: 'text-amber-500',   bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">System Overview</h1>
        <p className="text-[var(--color-text-muted)] mt-1">Real-time metrics across all users.</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value.toLocaleString()}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent audit events */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Recent Activity</h2>
          <Link href="/admin/audit-logs" className="text-xs text-[var(--color-accent)] hover:underline">
            View all →
          </Link>
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          {(recentEvents ?? []).map(event => (
            <li key={event.id} className="flex items-center gap-3 px-5 py-3">
              <EventBadge eventType={event.event_type} />
              <code className="text-xs text-[var(--color-text-muted)] flex-1 truncate">
                {event.user_id ? event.user_id.slice(0, 8) : 'anonymous'}
              </code>
              <span className="text-xs text-[var(--color-text-muted)]">
                {event.created_at ? new Date(event.created_at).toLocaleString() : ''}
              </span>
            </li>
          ))}
          {(!recentEvents || recentEvents.length === 0) && (
            <li className="px-5 py-8 text-sm text-center text-[var(--color-text-muted)]">
              No audit events yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}

function EventBadge({ eventType }: { eventType: string }) {
  const colors: Record<string, string> = {
    signup:        'text-emerald-600 bg-emerald-500/10',
    login:         'text-blue-600 bg-blue-500/10',
    login_failed:  'text-red-600 bg-red-500/10',
    logout:        'text-gray-600 bg-gray-500/10',
    resume_upload: 'text-violet-600 bg-violet-500/10',
    resume_delete: 'text-orange-600 bg-orange-500/10',
  }
  const className = colors[eventType] ?? 'text-gray-600 bg-gray-500/10'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
      {eventType}
    </span>
  )
}
