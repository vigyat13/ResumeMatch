import Link from 'next/link'
import { ArrowLeft, Sparkles, Clock } from 'lucide-react'

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
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            In Development
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">{feature}</h1>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>

        {/* What's coming bullets */}
        {bullets.length > 0 && (
          <ul className="text-left space-y-2 rounded-xl border border-border bg-card px-5 py-4">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}

        {/* ETA */}
        {eta && (
          <p className="text-sm text-muted-foreground">
            Expected: <span className="font-medium text-foreground">{eta}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={backHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
          <Link
            href="/builder"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            Build a Resume
          </Link>
        </div>
      </div>
    </div>
  )
}
