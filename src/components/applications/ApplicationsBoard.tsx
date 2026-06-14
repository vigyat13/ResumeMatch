'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TrackedApplication {
  id: string
  job_title: string | null
  company: string | null
  job_url: string | null
  status: string
  created_at: string | null
}

const COLUMNS: { key: string; label: string; statuses: string[] }[] = [
  { key: 'saved', label: 'Saved', statuses: ['saved'] },
  { key: 'applied', label: 'Applied', statuses: ['applied', 'submitted'] },
  { key: 'interview', label: 'Interview', statuses: ['interview'] },
  { key: 'offer', label: 'Offer', statuses: ['offer'] },
  { key: 'rejected', label: 'Rejected', statuses: ['rejected'] },
]

const MOVE_TARGETS = [
  { status: 'saved', label: 'Saved' },
  { status: 'applied', label: 'Applied' },
  { status: 'interview', label: 'Interview' },
  { status: 'offer', label: 'Offer' },
  { status: 'rejected', label: 'Rejected' },
]

export function ApplicationsBoard() {
  const [apps, setApps] = useState<TrackedApplication[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/v1/applications/track')
      .then(res => res.json())
      .then(body => setApps(body.data ?? []))
      .catch(() => setError('Could not load applications.'))
  }, [])

  async function move(id: string, status: string) {
    setApps(prev => prev?.map(a => a.id === id ? { ...a, status } : a) ?? null)
    const res = await fetch('/api/v1/applications/track', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (!res.ok) setError('Failed to move application.')
  }

  if (error) {
    return <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-6 text-sm text-red-300">{error}</div>
  }

  if (!apps) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-[var(--color-text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading applications…
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] py-20 text-center">
        <p className="text-base font-semibold text-[var(--color-text-primary)]">Nothing tracked yet</p>
        <p className="max-w-md text-sm text-[var(--color-text-muted)]">
          Save or apply to jobs from the Find Jobs page — they land here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      {COLUMNS.map(col => {
        const items = apps.filter(a => col.statuses.includes(a.status))
        return (
          <div key={col.key} className="flex min-h-[200px] flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/60 p-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">{col.label}</span>
              <Badge variant="secondary" className="font-mono text-[10px]">{items.length}</Badge>
            </div>

            {items.map(app => (
              <div key={app.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="line-clamp-2 text-sm font-semibold text-[var(--color-text-primary)]">{app.job_title ?? 'Untitled role'}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">{app.company ?? '—'}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                    {app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                        aria-label="Open job posting"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                        Move <ChevronDown className="h-3 w-3 opacity-60" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {MOVE_TARGETS.filter(t => !col.statuses.includes(t.status)).map(t => (
                          <DropdownMenuItem key={t.status} onClick={() => move(app.id, t.status)}>
                            {t.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className={cn('flex flex-1 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)]/60 py-6')}>
                <span className="text-xs text-[var(--color-text-muted)]/60">Empty</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
