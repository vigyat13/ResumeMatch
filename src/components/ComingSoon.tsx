import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  feature:     string
  description: string
  eta?:        string
  backHref?:   string
  backLabel?:  string
  bullets?:    string[]
}

export function ComingSoon({
  feature,
  description,
  eta,
  backHref  = '/dashboard',
  backLabel = 'Back to Dashboard',
  bullets   = [],
}: Props) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-5">

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Coming soon
          </p>
          <h1 style={{ fontFamily: 'var(--font-headline), sans-serif', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 700, lineHeight: 1.05, color: 'var(--color-marketing-text)', margin: 0 }}>
            {feature}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>

        {bullets.length > 0 && (
          <ul className="space-y-2 pt-1">
            {bullets.map((b, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2.5">
                <span className="mt-[7px] w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}

        {eta && (
          <p className="text-sm text-muted-foreground">
            Expected: <span className="font-medium text-foreground">{eta}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
          <Link
            href="/builder"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Build a Resume
          </Link>
        </div>
      </div>
    </div>
  )
}
