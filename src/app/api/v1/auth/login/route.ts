/**
 * POST /api/v1/auth/login
 *
 * Authenticates user with email and password.
 * On success, Supabase sets JWT tokens as HTTP-only cookies.
 *
 * HTTP-only cookies = JavaScript cannot read them.
 * This protects against XSS attacks (malicious scripts stealing tokens).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/log'

const LoginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body   = await request.json()
    const parsed = LoginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const supabase = await createClient()

    // signInWithPassword verifies the bcrypt hash internally
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Audit log failed attempts — useful for detecting brute force
      logAuditEvent({
        eventType: 'login_failed',
        request,
        metadata:  { email, reason: error.message },
      })
      // Use generic message — don't tell attackers whether email or password is wrong
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Fetch the user's profile for the response
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, subscription_tier')
      .eq('id', data.user.id)
      .single()

    logAuditEvent({
      userId:    data.user.id,
      eventType: 'login',
      request,
      metadata:  { method: 'password' },
    })

    return NextResponse.json({
      data: {
        user_id:           data.user.id,
        email:             data.user.email,
        first_name:        profile?.first_name ?? '',
        last_name:         profile?.last_name ?? '',
        subscription_tier: profile?.subscription_tier ?? 'free',
      },
      meta: { message: 'Logged in successfully.' },
    })
  } catch (err) {
    console.error('[Login] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
