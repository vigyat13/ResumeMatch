interface StatCardProps {
  label: string
  value: string | number
  helper: string
  marker: string
}

export function StatCard({ label, value, helper, marker }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 transition-colors hover:border-[var(--color-accent)]/35">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-[var(--color-accent)]/[0.06] transition-colors group-hover:bg-[var(--color-accent)]/[0.1]" />
      <p className="text-xs font-semibold tracking-[0.18em] text-[var(--color-accent)]">{marker}</p>
      <p className="mt-8 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)]">{value}</p>
      <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
    </div>
  )
}
