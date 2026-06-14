import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description: string
  href: string
  cta: string
}

export function EmptyState({ title, description, href, cta }: EmptyStateProps) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white/55 text-xs font-bold text-[var(--color-accent)]">
        RM
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center justify-center rounded-full border border-[var(--color-accent)]/35 px-4 py-2 text-xs font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10"
      >
        {cta}
      </Link>
    </div>
  )
}
