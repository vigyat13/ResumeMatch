import { STATUS_MAP } from './helpers'

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP['pending']
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  )
}
