/**
 * METRICS DASHBOARD
 *
 * Shows API performance over the last 24 hours.
 *  • Total requests, error rate
 *  • P50 / P95 / P99 latency per endpoint
 *  • Recent slow requests (>1s)
 *  • Recent errors (status >= 400)
 *
 * Concepts:
 *  • Percentile latency matters more than average. Average hides outliers.
 *  • P95 means 95% of requests were faster than this number.
 *  • If P50 is fast but P99 is slow → some bug only affects ~1% of users.
 */

import { createAdminClient } from '@/lib/supabase/server'
import { Activity, AlertCircle, Zap, TrendingUp } from 'lucide-react'

export default async function MetricsPage() {
  const admin    = createAdminClient()
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [totalResult, errorResult, recentSlow, recentErrors, byEndpoint] = await Promise.all([
    admin.from('api_metrics').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
    admin.from('api_metrics').select('*', { count: 'exact', head: true }).gte('created_at', since24h).gte('status_code', 400),
    admin.from('api_metrics').select('endpoint, method, duration_ms, status_code, created_at').gte('created_at', since24h).gte('duration_ms', 1000).order('duration_ms', { ascending: false }).limit(10),
    admin.from('api_metrics').select('endpoint, method, status_code, error_message, created_at').gte('created_at', since24h).gte('status_code', 400).order('created_at', { ascending: false }).limit(10),
    // For percentile aggregation we'd need a SQL function; for now group by endpoint
    admin.from('api_metrics').select('endpoint, duration_ms').gte('created_at', since24h).limit(5000),
  ])

  const totalRequests = totalResult.count ?? 0
  const errorCount    = errorResult.count ?? 0
  const errorRate     = totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : '0.00'

  // Compute percentiles client-side (in-memory) — fine at this scale
  const byEndpointStats = computeEndpointStats(byEndpoint.data ?? [])

  const cards = [
    { label: 'Requests (24h)', value: totalRequests.toLocaleString(), icon: Activity,    color: 'text-blue-500',    bg: 'bg-blue-500/10' },
    { label: 'Errors (24h)',   value: errorCount.toLocaleString(),    icon: AlertCircle, color: 'text-red-500',     bg: 'bg-red-500/10' },
    { label: 'Error Rate',     value: `${errorRate}%`,                icon: TrendingUp,  color: 'text-amber-500',   bg: 'bg-amber-500/10' },
    { label: 'Slow (>1s)',     value: (recentSlow.data?.length ?? 0).toLocaleString(), icon: Zap, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Performance Metrics</h1>
        <p className="text-[var(--color-text-muted)] mt-1">API latency and error rates — last 24 hours.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-endpoint latency */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Endpoint Latency</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">P50 = median, P95 = 95th percentile (worst 5%), P99 = 99th percentile</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-hover)]">
            <tr className="text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              <th className="px-4 py-3">Endpoint</th>
              <th className="px-4 py-3">Calls</th>
              <th className="px-4 py-3">P50</th>
              <th className="px-4 py-3">P95</th>
              <th className="px-4 py-3">P99</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {byEndpointStats.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                  No metrics recorded yet. API calls will appear here once endpoints are wrapped with `withMetrics()`.
                </td>
              </tr>
            ) : byEndpointStats.map(stat => (
              <tr key={stat.endpoint} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                <td className="px-4 py-3"><code className="text-xs">{stat.endpoint}</code></td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">{stat.count}</td>
                <td className="px-4 py-3 text-xs">{stat.p50}ms</td>
                <td className="px-4 py-3 text-xs">{stat.p95}ms</td>
                <td className="px-4 py-3 text-xs">{stat.p99}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Recent errors */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Recent Errors</h2>
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          {(recentErrors.data ?? []).length === 0 ? (
            <li className="px-5 py-8 text-sm text-center text-[var(--color-text-muted)]">No errors in the last 24h. 🎉</li>
          ) : (recentErrors.data ?? []).map((err, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-3">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full text-red-600 bg-red-500/10">
                {err.status_code}
              </span>
              <code className="text-xs text-[var(--color-text-muted)]">{err.method} {err.endpoint}</code>
              <span className="text-xs text-[var(--color-text-muted)] flex-1 truncate">{err.error_message}</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {err.created_at ? new Date(err.created_at).toLocaleTimeString() : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

interface EndpointMetric { endpoint: string; duration_ms: number }
interface EndpointStats {
  endpoint: string
  count:    number
  p50:      number
  p95:      number
  p99:      number
}

function computeEndpointStats(metrics: EndpointMetric[]): EndpointStats[] {
  const grouped = new Map<string, number[]>()
  for (const m of metrics) {
    const arr = grouped.get(m.endpoint) ?? []
    arr.push(m.duration_ms)
    grouped.set(m.endpoint, arr)
  }

  const stats: EndpointStats[] = []
  for (const [endpoint, durations] of grouped) {
    durations.sort((a, b) => a - b)
    stats.push({
      endpoint,
      count: durations.length,
      p50: percentile(durations, 0.5),
      p95: percentile(durations, 0.95),
      p99: percentile(durations, 0.99),
    })
  }
  return stats.sort((a, b) => b.count - a.count)
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p))
  return sorted[idx]
}
