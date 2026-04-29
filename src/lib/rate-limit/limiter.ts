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
 * Storage:
 *  • Upstash Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN exist
 *  • Postgres RPC fallback so local/dev environments still work without Redis
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

  // Round timestamp down to nearest window boundary — same window = same counter row
  const windowStart  = Math.floor(now / windowMs) * windowMs
  const key          = `${endpoint}:${identifier}:${windowStart}`

  const redisResult = await checkRedisRateLimit({
    key,
    limit,
    resetAt: windowStart + windowMs,
    windowSec,
  })
  if (redisResult) return redisResult

  const admin = createAdminClient()

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

async function checkRedisRateLimit({
  key,
  limit,
  resetAt,
  windowSec,
}: {
  key: string
  limit: number
  resetAt: number
  windowSec: number
}): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSec, 'NX'],
      ]),
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`Redis returned ${res.status}`)

    const data = await res.json() as Array<{ result?: unknown; error?: string }>
    const count = Number(data[0]?.result ?? 0)
    if (!Number.isFinite(count)) throw new Error('Redis returned invalid count')

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    }
  } catch (error) {
    console.error('[Rate Limit] Redis check failed, falling back to Postgres:', error)
    return null
  }
}
