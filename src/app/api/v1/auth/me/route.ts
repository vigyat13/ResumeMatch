/**
 * GET /api/v1/auth/me
 *
 * Returns the authenticated user's profile.
 * Protected — requires a valid session cookie.
 *
 * Teaching note on getUser() vs getSession():
 * - getSession() reads the JWT from cookies — fast but doesn't verify with server
 * - getUser()   verifies the token with Supabase server — slower but secure
 * Always use getUser() for security-critical checks.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify the session is valid (hits Supabase server)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // Fetch the full profile from our profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, subscription_tier, avatar_url, created_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        user_id:           user.id,
        email:             user.email,
        first_name:        profile.first_name,
        last_name:         profile.last_name,
        subscription_tier: profile.subscription_tier,
        avatar_url:        profile.avatar_url,
        created_at:        profile.created_at,
      },
    })
  } catch (err) {
    console.error('[Me] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
