import { createHash } from 'crypto'

export function jobId(url: string): string {
  return createHash('sha1').update(url).digest('hex').slice(0, 16)
}

/** Strip HTML tags and decode common entities into readable plain text. */
export function htmlToText(html: string): string {
  // Some sources (Greenhouse) return HTML-escaped markup — decode the
  // structural entities first so the tag stripper below can see the tags.
  if (!html.includes('<') && /&lt;[a-z!/]/i.test(html)) {
    html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  }
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

const STOPWORDS = new Set(['a', 'an', 'the', 'in', 'at', 'of', 'and', 'or', 'for', 'to', 'jobs', 'job'])

export function queryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t))
}

/** 0 when no token matches; higher when more query tokens appear in the title. */
export function titleScore(title: string, tokens: string[]): number {
  if (!tokens.length) return 1
  const t = title.toLowerCase()
  let score = 0
  for (const token of tokens) {
    if (t.includes(token)) score += 2
  }
  return score
}

export function matchesQuery(title: string, description: string, tokens: string[]): boolean {
  if (!tokens.length) return true
  const haystack = `${title} ${description.slice(0, 600)}`.toLowerCase()
  return tokens.some(t => haystack.includes(t))
}

export function withinDays(postedAt: string | null, days: number): boolean {
  if (!postedAt) return false
  const posted = Date.parse(postedAt)
  if (Number.isNaN(posted)) return false
  return Date.now() - posted <= days * 86_400_000
}

export async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json() as T
  } finally {
    clearTimeout(timer)
  }
}
