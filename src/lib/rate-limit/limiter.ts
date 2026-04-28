/**
 * RATE LIMITING
 *
 * Why rate limit?
 *  • Cost control: every Groq/OpenAI call costs money
 *  • Fairness: one user can't hog the AI quota
 *  • Abuse prevention: scrapers can't brute-force endpoints
 *  • DDoS mitigation: caps inbound work
 *
 * Algorithm: Fixed Window Counter (simplest, good enough at our scale)
 *  • Each user_id + endpoint key gets a count + reset time
 *  • Reset every X seconds (e.g. 60 for "10 per minute")
 *
 * Storage: Postgres table (no Redis at our scale)
 *  • Trade-off: ~5ms slower than Redis, but one less service to run
 *  • Upgrade path: swap implementation when we hit ~100 req/sec
 *
 * Production-grade alternative: Upstash Redis or Vercel KV
 *  • Sub-ms latency, distributed counters
 *  • Add when we have multi-region deploys
 */

import { createAdminClient } from '@/lib/supabase/server'

interface RateLimitResult {
  allowed:    boolean
  remaining:  number
  resetAt:    number       // unix timestamp (ms)
}

interface RateLimitConfig {
  identifier: string       // e.g. user_id, ip address
  endpoint:   string       // e.g. 'ai_feedback', 'resume_upload'
  limit:      number       // max requests per window
  windowSec:  number       // window length in seconds
}

/**
 * Check if a request is within the rate limit.
 * Returns { allowed, remaining, resetAt }.
 *
 * Usage in an API route:
 *   const limit = await checkRateLimit({
 *     identifier: user.id,
 *     endpoint:   'ai_feedback',
 *     limit:      10,
 *     windowSec:  60,
 *   })
 *   if (!limit.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
 */
export async function checkRateLimit({
  identifier,
  endpoint,
  limit,
  windowSec,
}: RateLimitConfig): Promise<RateLimitResult> {
  const now      = Date.now()
  const windowMs = windowSec * 1000
  const admin    = createAdminClient()

  // Round timestamp down to nearest window boundary — same window = same counter row
  const windowStart  = Math.floor(now / windowMs) * windowMs
  const key          = `${endpoint}:${identifier}:${windowStart}`

  // Atomic upsert + increment using a single SQL call
  // ON CONFLICT keeps the row, increments count
  const { data, error } = await admin.rpc('increment_rate_limit', {
    p_key:        key,
    p_window_end: new Date(windowStart + windowMs).toISOString(),
  })

  if (error) {
    // If rate limit infrastructure fails, fail OPEN (allow request)
    // Better to occasionally let an extra request through than to break the app
    console.error('[Rate Limit] Check failed, failing open:', error)
    return { allowed: true, remaining: limit, resetAt: windowStart + windowMs }
  }

  const count     = (data as number) ?? 0
  const allowed   = count <= limit
  const remaining = Math.max(0, limit - count)

  return {
    allowed,
    remaining,
    resetAt: windowStart + windowMs,
  }
}
