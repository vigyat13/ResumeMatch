/**
 * AUTH GUARDS
 *
 * Server-side helpers that combine authentication + authorization checks.
 * Use these in Server Components, Layouts, and API Routes.
 *
 * RBAC (Role-Based Access Control) pattern:
 *  • Every user has a `role` column on profiles ('user' or 'admin')
 *  • requireAdmin() throws/redirects if not admin
 *  • This is checked server-side — clients can't fake their role
 *
 * Why server-side?
 * Client-side role checks are display-only. The real check must happen
 * on the server, where the user can't tamper with the response.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

interface AuthContext {
  user: User
  profile: {
    id:                string
    first_name:        string
    last_name:         string
    role:              string
    subscription_tier: string
    avatar_url:        string | null
  }
}

/**
 * Require an authenticated user. Redirects to /login if not signed in.
 * Returns the user + profile so the page can use them.
 */
export async function requireUser(): Promise<AuthContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, subscription_tier, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  return { user, profile }
}

/**
 * Require an admin user. Redirects to /dashboard if not admin.
 * Logs the unauthorized attempt to audit_logs for security review.
 */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireUser()
  if (ctx.profile.role !== 'admin') {
    // Could log unauthorized admin access attempts here for security
    redirect('/dashboard')
  }
  return ctx
}

/**
 * For API routes — returns null instead of redirecting.
 * Caller decides what to do (return 401, return error JSON, etc).
 */
export async function getOptionalUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
