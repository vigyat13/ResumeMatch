/**
 * POST /api/v1/auth/signup
 *
 * Creates a new user account with email and password.
 *
 * Teaching note on Next.js API Routes:
 * Files named route.ts in the app directory become API endpoints.
 * Export named functions (GET, POST, PUT, DELETE) = HTTP methods.
 * These run on the SERVER — no browser access, safe for secrets.
 *
 * Security layers:
 * 1. Zod validates input (prevents garbage data)
 * 2. Supabase Auth handles bcrypt hashing (never store plain passwords)
 * 3. Our trigger auto-creates profile + subscription rows
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/welcome'
import { logAuditEvent } from '@/lib/audit/log'

// Input validation schema — Zod throws if any field is wrong
const SignupSchema = z.object({
  email:      z.string().email('Invalid email format'),
  password:   z.string()
                .min(8, 'Password must be at least 8 characters')
                .regex(/[A-Z]/, 'Must contain an uppercase letter')
                .regex(/[a-z]/, 'Must contain a lowercase letter')
                .regex(/[0-9]/, 'Must contain a number')
                .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name:  z.string().min(1, 'Last name is required').max(50),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json()
    const parsed = SignupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, first_name, last_name } = parsed.data

    // 2. Create user with Supabase Auth
    // Supabase hashes the password with bcrypt automatically.
    // The `data` field goes into auth.users.raw_user_meta_data —
    // our trigger reads it to populate the profiles table.
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name, last_name }, // stored in user metadata
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      // Supabase returns "User already registered" for duplicate emails
      if (error.message.includes('already registered')) {
        return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Signup failed.' }, { status: 400 })
    }

    // 3. Audit log + welcome email — both fire-and-forget
    logAuditEvent({
      userId:    data.user.id,
      eventType: 'signup',
      request,
      metadata:  { email, signup_method: 'password' },
    })
    void sendWelcomeEmail({ to: email, firstName: first_name })

    // 4. Return user data (never return password hashes)
    return NextResponse.json(
      {
        data: {
          user_id:   data.user.id,
          email:     data.user.email,
          first_name,
          last_name,
          subscription_tier: 'free',
        },
        meta: {
          // Session is set via HTTP-only cookies by Supabase automatically
          message: data.session
            ? 'Account created successfully.'
            : 'Account created. Please check your email to verify.',
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[Signup] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
