'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'

interface Props {
  resumeId: string
  variant?: 'primary' | 'outline'
  label?: string
}

const AUDIT_PHASES = [
  'Reading parsed resume',
  'Scoring ATS structure',
  'Checking keywords',
  'Writing recommendations',
] as const

export function RunAuditButton({ resumeId, variant = 'primary', label = 'Run ATS Audit' }: Props) {
  const [running, setRunning] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [phase,   setPhase]   = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      setPhase((current) => Math.min(AUDIT_PHASES.length - 1, current + 1))
    }, 900)
    return () => window.clearInterval(interval)
  }, [running])

  async function handleRun() {
    setPhase(0)
    setRunning(true)
    setError(null)
    try {
      const res  = await fetch(`/api/v1/resumes/${resumeId}/audit`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'Failed to run audit.')
        return
      }
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setPhase(0)
      setRunning(false)
    }
  }

  const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60'
  const cls  = variant === 'primary'
    ? `${base} bg-primary text-primary-foreground hover:opacity-90`
    : `${base} border border-border text-foreground hover:bg-accent/5`

  return (
    <div className="flex flex-col items-start gap-2">
      <button onClick={handleRun} disabled={running} className={cls}>
        {running
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {AUDIT_PHASES[phase]}</>
          : <><Sparkles className="w-4 h-4" /> {label}</>
        }
      </button>
      {running && (
        <div className="h-1 w-56 overflow-hidden rounded-full bg-[rgba(245,240,232,0.08)]">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${28 + phase * 22}%` }}
          />
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
