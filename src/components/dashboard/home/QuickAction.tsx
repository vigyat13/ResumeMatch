import Link from 'next/link'

interface QuickActionProps {
  href: string
  title: string
  description: string
  marker: string
}

export function QuickAction({ href, title, description, marker }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[var(--color-border)] bg-white/35 p-4 transition-colors hover:border-[var(--color-accent)]/40 hover:bg-white/60"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          {marker}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{description}</p>
        </div>
        <span className="text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1">→</span>
      </div>
    </Link>
  )
}
