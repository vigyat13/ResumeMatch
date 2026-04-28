/**
 * NEXT.JS PROXY (formerly middleware.ts)
 *
 * Next.js 16 renamed "middleware" to "proxy".
 * Runs on every request BEFORE the page renders.
 *
 * Responsibilities:
 * 1. Refresh Supabase auth sessions (keeps users logged in)
 * 2. Redirect unauthenticated users away from /dashboard
 * 3. Redirect logged-in users away from /login and /signup
 */

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
