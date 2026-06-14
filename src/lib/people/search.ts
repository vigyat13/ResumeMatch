/**
 * People search for referrals — finds public LinkedIn profiles.
 *
 * Providers, in order:
 *  1. Google Custom Search JSON API (official, free 100 queries/day) —
 *     set GOOGLE_CSE_KEY + GOOGLE_CSE_ID (cse.google.com, "search entire web").
 *  2. DuckDuckGo HTML (keyless, best-effort — often bot-challenged).
 *
 * When neither yields results, the route returns prepared X-ray search links
 * the UI opens directly — always works, no keys.
 */

export interface Person {
  name: string
  headline: string
  url: string
  snippet: string
  kind: 'recruiter' | 'peer'
}

export interface PeopleSearchResult {
  people: Person[]
  provider: 'google' | 'duckduckgo' | 'none'
  searchLinks: { label: string; url: string }[]
}

export async function searchPeople(company: string, role?: string): Promise<PeopleSearchResult> {
  const queries: Array<{ q: string; kind: Person['kind'] }> = [
    { q: `site:linkedin.com/in "${company}" recruiter OR "talent acquisition" OR "hiring"`, kind: 'recruiter' },
    role
      ? { q: `site:linkedin.com/in "${company}" "${role}"`, kind: 'peer' }
      : { q: `site:linkedin.com/in "${company}" engineer OR manager`, kind: 'peer' },
  ]

  const searchLinks = xrayLinks(company, role)

  if (process.env.GOOGLE_CSE_KEY && process.env.GOOGLE_CSE_ID) {
    const people = await runProvider(queries, googleCse)
    if (people.length) return { people, provider: 'google', searchLinks }
  }

  const people = await runProvider(queries, ddg)
  if (people.length) return { people, provider: 'duckduckgo', searchLinks }

  return { people: [], provider: 'none', searchLinks }
}

async function runProvider(
  queries: Array<{ q: string; kind: Person['kind'] }>,
  provider: (q: string, kind: Person['kind']) => Promise<Person[]>,
): Promise<Person[]> {
  const settled = await Promise.allSettled(queries.map(({ q, kind }) => provider(q, kind)))
  const people: Person[] = []
  const seen = new Set<string>()
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue
    for (const person of result.value) {
      if (seen.has(person.url)) continue
      seen.add(person.url)
      people.push(person)
    }
  }
  return people.slice(0, 24)
}

/* ── Google Custom Search ───────────────────────────────────── */

interface CseItem { title?: string; link?: string; snippet?: string }

async function googleCse(query: string, kind: Person['kind']): Promise<Person[]> {
  const qs = new URLSearchParams({
    key: process.env.GOOGLE_CSE_KEY!,
    cx: process.env.GOOGLE_CSE_ID!,
    q: query,
    num: '10',
  })
  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${qs}`, {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Google CSE HTTP ${res.status}`)
  const data = await res.json() as { items?: CseItem[] }

  return (data.items ?? [])
    .filter(i => i.link && /linkedin\.com\/in\//i.test(i.link))
    .map(i => toPerson(i.title ?? '', i.link!, i.snippet ?? '', kind))
    .filter((p): p is Person => p !== null)
}

/* ── DuckDuckGo HTML (best effort) ──────────────────────────── */

async function ddg(query: string, kind: Person['kind']): Promise<Person[]> {
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`DuckDuckGo HTTP ${res.status}`)
  const html = await res.text()

  const people: Person[] = []
  const blocks = html.split('result__body')
  for (const block of blocks.slice(1)) {
    const link = block.match(/href="([^"]*uddg=[^"]+)"/)?.[1]
      ?? block.match(/href="(https?:\/\/[a-z]{0,3}\.?linkedin\.com\/in\/[^"]+)"/i)?.[1]
    if (!link) continue

    let url = link
    const uddg = link.match(/uddg=([^&"]+)/)?.[1]
    if (uddg) url = decodeURIComponent(uddg)
    if (!/linkedin\.com\/in\//i.test(url)) continue

    const titleRaw = block.match(/result__a[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? ''
    const title = decodeEntities(titleRaw.replace(/<[^>]+>/g, '')).trim()
    const snippetRaw = block.match(/result__snippet[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? ''
    const snippet = decodeEntities(snippetRaw.replace(/<[^>]+>/g, '')).trim()

    const person = toPerson(title, url, snippet, kind)
    if (person) people.push(person)
    if (people.length >= 12) break
  }
  return people
}

/* ── Shared ─────────────────────────────────────────────────── */

function toPerson(title: string, url: string, snippet: string, kind: Person['kind']): Person | null {
  // LinkedIn result titles look like "Name - Headline | LinkedIn"
  const cleaned = title.replace(/\s*[|–-]\s*LinkedIn.*$/i, '')
  const [name, ...headlineParts] = cleaned.split(/\s+-\s+/)
  if (!name?.trim()) return null
  return {
    name: name.trim(),
    headline: headlineParts.join(' — ').trim(),
    url: url.split('?')[0],
    snippet: snippet.slice(0, 220),
    kind,
  }
}

function xrayLinks(company: string, role?: string): { label: string; url: string }[] {
  const recruiters = `site:linkedin.com/in "${company}" recruiter OR "talent acquisition"`
  const peers = `site:linkedin.com/in "${company}" ${role ? `"${role}"` : ''}`.trim()
  return [
    { label: `Google: recruiters at ${company}`, url: `https://www.google.com/search?q=${encodeURIComponent(recruiters)}` },
    { label: `Google: people at ${company}${role ? ` · ${role}` : ''}`, url: `https://www.google.com/search?q=${encodeURIComponent(peers)}` },
    { label: `LinkedIn people search: ${company}`, url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${company} ${role ?? ''}`.trim())}` },
  ]
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
}
