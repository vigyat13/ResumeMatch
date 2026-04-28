/**
 * BROWSER-SIDE SUPABASE CLIENT
 *
 * Use this in Client Components (files with 'use client' at the top).
 * It reads auth tokens from cookies automatically.
 *
 * Pattern: createBrowserClient() from @supabase/ssr handles cookie
 * management in the browser so sessions persist across page reloads.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Singleton pattern: reuse the same client instance across the app.
// Creating multiple clients wastes memory and causes session conflicts.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
