'use client'

import { ExternalLink } from 'lucide-react'
import type { InAppBrowserInfo } from '@/lib/auth/inAppBrowser'

interface Props {
  info: InAppBrowserInfo
}

export function InAppBrowserNotice({ info }: Props) {
  if (!info.isInAppBrowser) return null

  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
      <div className="flex items-start gap-2">
        <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>
          <p className="font-semibold">Google sign-in is blocked inside {info.appName}.</p>
          <p className="mt-1 leading-5 text-amber-100/80">
            Use email/password here, or open this page in {info.isIOS ? 'Safari' : 'Chrome'} to continue with Google.
          </p>
        </div>
      </div>
    </div>
  )
}

