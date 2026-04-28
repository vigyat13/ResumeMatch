/**
 * POST /api/v1/auth/refresh
 *
 * Rotates the access token using the refresh token stored in cookies.
 * Supabase handles token rotation automatically — this endpoint is
 * a safety valve for clients that need to force-refresh.
 *
 * How JWT rotation works:
 * - Access tokens expire in 1 hour (short-lived, limits exposure if stolen)
 * - Refresh tokens expire in 7 days (long-lived, stays in HTTP-only cookie)
 * - refreshSession() exchanges the refresh token for a new access token
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // refreshSession() uses the refresh_token cookie automatically.
    // It returns a new access token and rotates the refresh token.
    const { data, error } = await supabase.auth.refreshSession()

    if (error || !data.session) {
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      data: {
        user_id:    data.user?.id,
        email:      data.user?.email,
        expires_at: data.session.expires_at,
      },
      meta: { message: 'Session refreshed.' },
    })
  } catch (err) {
    console.error('[Refresh] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
