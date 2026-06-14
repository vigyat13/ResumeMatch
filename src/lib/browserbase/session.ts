const API = 'https://api.browserbase.com/v1'

function apiKey(): string {
  const k = process.env.BROWSERBASE_API_KEY
  if (!k) throw new Error('Missing BROWSERBASE_API_KEY')
  return k
}

function headers() {
  return { 'Content-Type': 'application/json', 'X-BB-API-Key': apiKey() }
}

export interface BBSession {
  id: string
  status: string
  region: string | null
  expiresAt: string | null
  connectUrl: string | null
}

export async function createSession(metadata?: Record<string, string>): Promise<BBSession> {
  const payload: Record<string, unknown> = {}
  if (process.env.BROWSERBASE_PROJECT_ID) payload.projectId = process.env.BROWSERBASE_PROJECT_ID
  if (metadata) {
    payload.userMetadata = Object.fromEntries(
      Object.entries(metadata).map(([k, v]) => [k, sanitize(v)])
    )
  }
  const res = await fetch(`${API}/sessions`, {
    method: 'POST', headers: headers(), body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? body?.error ?? 'Failed to create Browserbase session')
  }
  const s = await res.json()
  return { id: s.id, status: s.status ?? 'RUNNING', region: s.region ?? null, expiresAt: s.expiresAt ?? null, connectUrl: s.connectUrl ?? null }
}

export async function getDebugUrl(sessionId: string) {
  const res = await fetch(`${API}/sessions/${sessionId}/debug`, { headers: headers() })
  if (!res.ok) return null
  const d = await res.json()
  return { debuggerUrl: d.debuggerUrl ?? null, debuggerFullscreenUrl: d.debuggerFullscreenUrl ?? null } as const
}

function sanitize(v: string): string {
  return v.replace(/[^a-zA-Z0-9_.:-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 120) || 'none'
}
