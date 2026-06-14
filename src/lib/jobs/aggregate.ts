import type { NormalizedJob, SearchParams, SearchResponse, SourceResult } from './types'
import { queryTokens, titleScore, withinDays } from './util'
import * as remotive from './sources/remotive'
import * as arbeitnow from './sources/arbeitnow'
import * as remoteok from './sources/remoteok'
import * as greenhouse from './sources/greenhouse'
import * as lever from './sources/lever'
import * as adzuna from './sources/adzuna'
import * as jsearch from './sources/jsearch'

interface Source {
  name: string
  search: (params: SearchParams) => Promise<NormalizedJob[]>
  enabled?: () => boolean
}

const SOURCES: Source[] = [jsearch, adzuna, greenhouse, lever, remotive, arbeitnow, remoteok]

export async function searchAllSources(input: SearchParams): Promise<SearchResponse> {
  // If no explicit location given but the query names a region ("react dev india"),
  // lift it out so the location filter applies.
  const params = { ...input }
  if (!params.location?.trim()) {
    const q = params.query.toLowerCase()
    const found = Object.keys(REGION_ALIASES).find(region =>
      q.includes(region) || REGION_ALIASES[region].some(p => q.includes(p)),
    )
    if (found) {
      const place = REGION_ALIASES[found].find(p => q.includes(p)) ?? found
      params.location = place
    }
  }

  const active = SOURCES.filter(s => !s.enabled || s.enabled())
  const skipped: SourceResult[] = SOURCES
    .filter(s => s.enabled && !s.enabled())
    .map(s => ({ source: s.name, status: 'skipped' as const, count: 0 }))

  const settled = await Promise.allSettled(active.map(s => s.search(params)))

  const sources: SourceResult[] = [...skipped]
  const all: NormalizedJob[] = []

  settled.forEach((result, i) => {
    const source = active[i].name
    if (result.status === 'fulfilled') {
      sources.push({ source, status: 'ok', count: result.value.length })
      all.push(...result.value)
    } else {
      sources.push({ source, status: 'error', count: 0, error: String(result.reason?.message ?? result.reason) })
    }
  })

  const deduped = dedupe(all)
  const recent = deduped.filter(j => withinDays(j.postedAt, params.recencyDays))
  const filtered = filterLocation(recent, params.location)

  const tokens = queryTokens(params.query)
  filtered.sort((a, b) => {
    const scoreDiff = titleScore(b.title, tokens) - titleScore(a.title, tokens)
    if (scoreDiff !== 0) return scoreDiff
    return Date.parse(b.postedAt ?? '0') - Date.parse(a.postedAt ?? '0')
  })

  return {
    jobs: filtered.slice(0, 100),
    sources,
    totalBeforeFilter: deduped.length,
  }
}

function dedupe(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>()
  const out: NormalizedJob[] = []
  for (const job of jobs) {
    const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}`
    if (seen.has(job.url) || seen.has(key)) continue
    seen.add(job.url)
    seen.add(key)
    out.push(job)
  }
  return out
}

// Region → place-name aliases so "India" matches "Gurugram", "Remote - India", etc.
const REGION_ALIASES: Record<string, string[]> = {
  india: ['india', 'gurugram', 'gurgaon', 'delhi', 'bangalore', 'bengaluru', 'mumbai', 'hyderabad', 'pune', 'noida', 'chennai', 'kolkata', 'ahmedabad'],
  usa: ['usa', 'united states', 'u.s.', 'us-', 'new york', 'san francisco', 'seattle', 'austin', 'boston', 'chicago', 'los angeles'],
  uk: ['uk', 'united kingdom', 'london', 'manchester', 'edinburgh'],
  germany: ['germany', 'berlin', 'munich', 'hamburg', 'köln', 'cologne', 'frankfurt'],
  canada: ['canada', 'toronto', 'vancouver', 'montreal', 'ottawa'],
  europe: ['europe', 'emea', 'berlin', 'london', 'amsterdam', 'paris', 'madrid', 'dublin', 'lisbon'],
}

// Locations that mean "remote from anywhere" rather than a specific region.
const ANYWHERE = ['remote', 'anywhere', 'worldwide', 'global', 'fully remote', 'work from home']

function filterLocation(jobs: NormalizedJob[], location?: string): NormalizedJob[] {
  const needle = location?.trim().toLowerCase()
  if (!needle) return jobs

  const aliases = new Set<string>([needle])
  for (const [region, places] of Object.entries(REGION_ALIASES)) {
    if (needle.includes(region) || places.some(p => needle.includes(p))) {
      places.forEach(p => aliases.add(p))
      aliases.add(region)
    }
  }
  const wanted = [...aliases]

  // Words that lock a "remote" role to some region ("US Remote", "EMEA only").
  const REGION_WORDS = /\b(us|usa|u\.s\.?|united states|america|uk|united kingdom|eu|emea|europe|canada|germany|france|apac|latam|australia|india)\b/i

  return jobs.filter(job => {
    const loc = job.location.toLowerCase()
    if (wanted.some(a => loc.includes(a))) return true
    // Region-locked remote roles ("Remote - USA", "US Remote") only pass for
    // their own region; unrestricted remote roles pass for any location.
    if (job.remote) {
      const restricted = REGION_WORDS.test(loc)
        || Object.values(REGION_ALIASES).flat().some(p => loc.includes(p))
      if (!restricted) return loc === '' || ANYWHERE.some(a => loc.includes(a))
    }
    return false
  })
}
