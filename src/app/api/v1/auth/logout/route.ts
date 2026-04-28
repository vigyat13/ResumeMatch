/**
 * POST /api/v1/auth/logout
 *
 * Invalidates the user's session and clears auth cookies.
 * signOut() tells Supabase to revoke the session server-side
 * AND clears the HTTP-only cookies from the browser.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: { message: 'Logged out successfully.' } })
  } catch (err) {
    console.error('[Logout] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
