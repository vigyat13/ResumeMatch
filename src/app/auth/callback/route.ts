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
 *  → redirect to a branded completion page
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/log'
import { sendWelcomeEmail } from '@/lib/email/welcome'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code     = searchParams.get('code')
  const errParam = searchParams.get('error')
  const errDesc  = searchParams.get('error_description')
  const next     = '/builder'

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

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    logAuditEvent({
      userId: user.id,
      eventType: 'oauth_login',
      request,
      metadata: { provider: user.app_metadata?.provider ?? 'oauth' },
    })

    if (await isNewOAuthUser(user.id, user.created_at)) {
      const firstName = getFirstName(user.user_metadata)
      if (user.email) {
        void sendWelcomeEmail({ to: user.email, firstName })
      }
      logAuditEvent({
        userId: user.id,
        eventType: 'signup',
        request,
        metadata: {
          email: user.email,
          signup_method: user.app_metadata?.provider ?? 'oauth',
        },
      })
    }
  }

  const completeUrl = new URL('/auth/complete', origin)
  completeUrl.searchParams.set('next', next)
  return NextResponse.redirect(completeUrl)
}

async function isNewOAuthUser(userId: string, createdAt?: string): Promise<boolean> {
  if (!createdAt) return false

  const createdMs = new Date(createdAt).getTime()
  if (!Number.isFinite(createdMs)) return false

  const isRecent = Date.now() - createdMs < 2 * 60 * 1000
  if (!isRecent) return false

  const admin = createAdminClient()
  const { count, error } = await admin
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'signup')

  if (error) {
    console.error('[OAuth Callback] Could not check signup audit:', error)
    return false
  }

  return (count ?? 0) === 0
}

function getFirstName(metadata: Record<string, unknown>): string {
  const explicit = metadata.first_name
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim()

  const fullName = metadata.full_name ?? metadata.name
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim().split(/\s+/)[0]
  }

  return 'there'
}
