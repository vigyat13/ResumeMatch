'use client'

import { useEffect, useState } from 'react'

const IN_APP_BROWSER_PATTERNS = [
  { name: 'WhatsApp', pattern: /WhatsApp/i },
  { name: 'Instagram', pattern: /Instagram/i },
  { name: 'Facebook', pattern: /FBAN|FBAV|FBIOS|FB_IAB|FB4A/i },
  { name: 'Messenger', pattern: /Messenger|FB_IAB/i },
  { name: 'LinkedIn', pattern: /LinkedInApp/i },
  { name: 'TikTok', pattern: /TikTok/i },
  { name: 'Twitter', pattern: /Twitter|X-Twitter/i },
  { name: 'Line', pattern: /Line\//i },
]

export interface InAppBrowserInfo {
  isInAppBrowser: boolean
  appName: string
  isIOS: boolean
}

export function detectInAppBrowser(userAgent: string): InAppBrowserInfo {
  const match = IN_APP_BROWSER_PATTERNS.find(entry => entry.pattern.test(userAgent))

  return {
    isInAppBrowser: Boolean(match),
    appName: match?.name ?? 'this in-app browser',
    isIOS: /iPhone|iPad|iPod/i.test(userAgent),
  }
}

export function useInAppBrowser(): InAppBrowserInfo {
  const [info, setInfo] = useState<InAppBrowserInfo>({
    isInAppBrowser: false,
    appName: '',
    isIOS: false,
  })

  useEffect(() => {
    setInfo(detectInAppBrowser(window.navigator.userAgent))
  }, [])

  return info
}

