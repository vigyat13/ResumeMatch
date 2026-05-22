/**
 * SUPABASE MIDDLEWARE CLIENT
 *
 * Used only inside src/middleware.ts (Next.js middleware).
 * Middleware runs on every request BEFORE the page renders.
 * It refreshes the Supabase session so auth tokens never expire silently.
 *
 * Key concept: JWTs expire (default 1 hour). If we don't refresh them,
 * users get logged out unexpectedly. Middleware silently refreshes on
 * every request, keeping sessions alive.
 */

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const DEFAULT_AUTHED_PATH = '/dashboard/templates'

export async function updateSession(request: NextRequest) {
  // Start with a response we can attach cookies to
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set on both request (for current handler) and response (for browser)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: getUser() refreshes the session token if it's expired.
  // Do NOT remove this call — it's what keeps users logged in.
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/signup')

  if (isProtectedRoute && !user) {
    // Not logged in → redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return withSecurityHeaders(NextResponse.redirect(url))
  }

  if (isAuthRoute && user) {
    // Already logged in → redirect to the default workspace page
    const url = request.nextUrl.clone()
    url.pathname = DEFAULT_AUTHED_PATH
    return withSecurityHeaders(NextResponse.redirect(url))
  }

  return withSecurityHeaders(supabaseResponse)
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  return response
}
