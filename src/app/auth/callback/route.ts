/**
 * OAUTH CALLBACK HANDLER
 *
 * Route: GET /auth/callback?code=...
 *
 * This runs after Google or GitHub authenticates the user.
 * It exchanges the one-time `code` for a Supabase session (JWT tokens)
 * and sets them as secure HTTP-only cookies.
 *
 * Flow:
 *  Google/GitHub → redirect to /auth/callback?code=XYZ
 *  → exchangeCodeForSession(code)
 *  → Supabase sets session cookies
 *  → redirect to /dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code     = searchParams.get('code')
  const errParam = searchParams.get('error')
  const errDesc  = searchParams.get('error_description')
  const next     = searchParams.get('next') ?? '/dashboard'

  // Supabase sends ?error=... when OAuth fails at the provider level (bad credentials, user denied, etc.)
  if (errParam) {
    console.error('[OAuth Callback] Provider error:', errParam, errDesc)
    const params = new URLSearchParams({ error: 'oauth_failed', detail: errDesc ?? errParam })
    return NextResponse.redirect(`${origin}/login?${params.toString()}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_cancelled`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[OAuth Callback] Exchange error:', error.message)
    const params = new URLSearchParams({ error: 'oauth_failed', detail: error.message })
    return NextResponse.redirect(`${origin}/login?${params.toString()}`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
