'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Loader2 } from 'lucide-react'

export function AuthCompleteClient({ nextPath }: { nextPath: string }) {
  const [seconds, setSeconds] = useState(3)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds(value => Math.max(0, value - 1))
    }, 1000)
    const timeout = window.setTimeout(() => {
      window.location.replace(nextPath)
    }, 2800)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [nextPath])

  return (
    <main className="min-h-screen bg-[var(--color-marketing-bg)] text-[var(--color-marketing-text)] flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-lg rounded-[2rem] border border-[var(--color-marketing-line)] bg-[var(--color-marketing-surface)] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-marketing-accent)]/25 bg-[var(--color-marketing-accent)]/10 text-[var(--color-marketing-accent)]">
          <Check className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-marketing-muted)]">
          Authentication complete
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-5xl">
          You are signed in.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[var(--color-text-secondary)]">
          ResumeMatch is setting up your workspace. You will be sent straight to the template library.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/templates"
            className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90"
          >
            Browse templates
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-[var(--color-marketing-line)] px-5 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            Go to dashboard
          </Link>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2 text-xs text-[var(--color-marketing-muted)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Redirecting in {seconds}s
        </div>
      </section>
    </main>
  )
}
