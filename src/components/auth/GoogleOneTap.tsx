'use client'

import Script from 'next/script'
import { useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type OneTapContext = 'signin' | 'signup' | 'use'

type GoogleCredentialResponse = {
  credential?: string
  select_by?: string
}

type GoogleIdConfig = {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  context?: OneTapContext
  itp_support?: boolean
  use_fedcm_for_prompt?: boolean
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: GoogleIdConfig) => void
          prompt: () => void
          cancel: () => void
        }
      }
    }
  }
}

interface GoogleOneTapProps {
  context?: OneTapContext
  nextPath?: string
  onError?: (message: string) => void
  onSuccess?: () => void
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export function GoogleOneTap({
  context = 'signin',
  nextPath = '/dashboard/templates',
  onError,
  onSuccess,
}: GoogleOneTapProps) {
  const promptedRef = useRef(false)
  const supabase = useMemo(() => createClient(), [])

  const startOneTap = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID || promptedRef.current) return

    const googleId = window.google?.accounts?.id
    if (!googleId) return

    promptedRef.current = true

    const { data: { user } } = await supabase.auth.getUser()
    if (user) return

    googleId.initialize({
      client_id: GOOGLE_CLIENT_ID,
      context,
      auto_select: true,
      cancel_on_tap_outside: false,
      itp_support: true,
      use_fedcm_for_prompt: true,
      callback: async (response) => {
        if (!response.credential) {
          onError?.('Google did not return a sign-in token. Please use the Google button instead.')
          return
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        })

        if (error) {
          onError?.(error.message)
          return
        }

        googleId.cancel()

        if (onSuccess) {
          onSuccess()
          return
        }

        window.location.href = nextPath
      },
    })

    googleId.prompt()
  }, [context, nextPath, onError, onSuccess, supabase])

  if (!GOOGLE_CLIENT_ID) return null

  return (
    <Script
      id="google-identity-services"
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onReady={() => { void startOneTap() }}
    />
  )
}
