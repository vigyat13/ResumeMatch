/**
 * AUDIT LOGS VIEWER
 *
 * Lists every audit event with filtering.
 * Server Component — supports URL search params for filters
 * (so admins can share/bookmark filtered views).
 *
 * Pagination strategy: cursor-based using created_at + id
 * Why not OFFSET/LIMIT?
 * OFFSET 1000 means Postgres still scans 1000 rows you don't want.
 * Cursor pagination ("WHERE created_at < $cursor") uses the index → O(log n).
 */

import { createAdminClient } from '@/lib/supabase/server'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const PAGE_SIZE = 50

interface PageProps {
  searchParams: Promise<{
    event_type?: string
    cursor?:     string
  }>
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const { event_type, cursor } = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('audit_logs')
    .select('id, user_id, event_type, resource, ip_address, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)   // fetch one extra to know if there's a next page

  if (event_type) {
    query = query.eq('event_type', event_type)
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: logs } = await query
  const hasMore = (logs?.length ?? 0) > PAGE_SIZE
  const visibleLogs = (logs ?? []).slice(0, PAGE_SIZE)
  const nextCursor  = hasMore ? visibleLogs[visibleLogs.length - 1].created_at : null

  // Fetch distinct event types for the filter chip bar
  const { data: distinctEvents } = await admin
    .from('audit_logs')
    .select('event_type')
    .limit(1000)
  const eventTypes = Array.from(new Set((distinctEvents ?? []).map(e => e.event_type)))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Audit Logs</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          All security and data-access events. Append-only, server-written.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <FilterChip href="/admin/audit-logs" active={!event_type} label="All" />
        {eventTypes.map(type => (
          <FilterChip
            key={type}
            href={`/admin/audit-logs?event_type=${type}`}
            active={event_type === type}
            label={type}
          />
        ))}
      </div>

      {/* Logs table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-hover)]">
            <tr className="text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {visibleLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                  No audit logs match this filter.
                </td>
              </tr>
            ) : visibleLogs.map(log => (
              <tr key={log.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                    {log.event_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs text-[var(--color-text-muted)]">
                    {log.user_id ? log.user_id.slice(0, 8) : '—'}
                  </code>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                  {log.ip_address || '—'}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] truncate max-w-[150px]">
                  {log.resource || '—'}
                </td>
                <td className="px-4 py-3">
                  {log.metadata && Object.keys(log.metadata as object).length > 0 ? (
                    <code className="text-xs text-[var(--color-text-muted)] max-w-[200px] truncate inline-block">
                      {JSON.stringify(log.metadata)}
                    </code>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-muted)]">
          Showing {visibleLogs.length} of {hasMore ? `${PAGE_SIZE}+` : visibleLogs.length}
        </p>
        <div className="flex gap-2">
          {cursor && (
            <Link
              href={`/admin/audit-logs${event_type ? `?event_type=${event_type}` : ''}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> First page
            </Link>
          )}
          {nextCursor && (
            <Link
              href={`/admin/audit-logs?${new URLSearchParams({ ...(event_type && { event_type }), cursor: nextCursor }).toString()}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Next <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
        active
          ? 'bg-[var(--color-accent)] text-white'
          : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
      }`}
    >
      {label}
    </Link>
  )
}
