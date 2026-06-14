interface PipelineStepProps {
  done: boolean
  label: string
  value: string
}

export function PipelineStep({ done, label, value }: PipelineStepProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white/35 p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className={`h-2.5 w-2.5 rounded-full ${done ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          {done ? 'Done' : 'Open'}
        </span>
      </div>
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{value}</p>
    </div>
  )
}
