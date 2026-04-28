/**
 * API METRICS / OBSERVABILITY
 *
 * Concept: every API call records its latency, status, and any error.
 * This lets admins see:
 *  • Which endpoints are slow (P50, P95, P99 latency)
 *  • Which endpoints are failing (4xx, 5xx rates)
 *  • Per-user request volume (detect abuse)
 *
 * Industry comparison:
 *  • Datadog APM, New Relic, Sentry Performance — same data, more polish
 *  • For our scale, a Postgres table is fine
 *  • Upgrade path: ship to ClickHouse or BigQuery for huge volumes
 *
 * Pattern: wrap your API handler with withMetrics() to auto-record.
 * Don't sprinkle measurement code through business logic.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

type Handler = (req: NextRequest, ctx?: never) => Promise<NextResponse>

/**
 * Wrap an API route handler to automatically log timing + status.
 * Usage:
 *   export const POST = withMetrics(async (req) => { ... })
 */
export function withMetrics(handler: Handler, endpointOverride?: string): Handler {
  return async (req, ctx) => {
    const startedAt = Date.now()
    const endpoint  = endpointOverride ?? new URL(req.url).pathname
    const method    = req.method

    let response:  NextResponse
    let error:     string | undefined

    try {
      response = await handler(req, ctx)
    } catch (err) {
      // If the handler throws, log a 500 and re-throw
      error = err instanceof Error ? err.message : String(err)
      recordMetric({
        endpoint, method, statusCode: 500,
        durationMs: Date.now() - startedAt,
        errorMessage: error,
      })
      throw err
    }

    recordMetric({
      endpoint, method,
      statusCode:   response.status,
      durationMs:   Date.now() - startedAt,
      errorMessage: response.status >= 400 ? `HTTP ${response.status}` : undefined,
    })

    return response
  }
}

interface MetricInput {
  userId?:       string
  endpoint:      string
  method:        string
  statusCode:    number
  durationMs:    number
  errorMessage?: string
}

/**
 * Fire-and-forget metric write. Failures here must NEVER break user requests.
 */
function recordMetric(input: MetricInput): void {
  void writeMetric(input)
}

async function writeMetric({
  userId, endpoint, method, statusCode, durationMs, errorMessage,
}: MetricInput) {
  try {
    const admin = createAdminClient()
    await admin.from('api_metrics').insert({
      user_id:       userId ?? null,
      endpoint,
      method,
      status_code:   statusCode,
      duration_ms:   durationMs,
      error_message: errorMessage ?? null,
    })
  } catch (err) {
    console.error('[Metrics] Write failed:', err)
  }
}
