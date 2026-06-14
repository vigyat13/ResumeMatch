import type { NormalizedJob, SearchParams } from '../types'
import { fetchJson, htmlToText, jobId, matchesQuery, queryTokens } from '../util'

// Companies with active public Lever boards. Slug = jobs.lever.co/{slug}
const BOARDS = ['palantir', 'spotify', 'highspot']

interface LeverJob {
  hostedUrl: string
  text: string
  createdAt: number // unix ms
  categories?: { location?: string; commitment?: string; team?: string }
  descriptionPlain?: string
  salaryRange?: { min?: number; max?: number; currency?: string }
}

export const name = 'Lever'

export async function search(params: SearchParams): Promise<NormalizedJob[]> {
  const tokens = queryTokens(params.query)
  const results = await Promise.allSettled(
    BOARDS.map(slug =>
      fetchJson<LeverJob[]>(`https://api.lever.co/v0/postings/${slug}?mode=json`)
        .then(jobs => ({ slug, jobs: Array.isArray(jobs) ? jobs : [] })),
    ),
  )

  const jobs: NormalizedJob[] = []
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    const company = r.value.slug.charAt(0).toUpperCase() + r.value.slug.slice(1)
    for (const j of r.value.jobs) {
      if (!matchesQuery(j.text, j.descriptionPlain ?? '', tokens)) continue
      jobs.push({
        id: jobId(j.hostedUrl),
        title: j.text,
        company,
        location: j.categories?.location ?? '',
        remote: /remote/i.test(j.categories?.location ?? ''),
        salary: formatSalary(j.salaryRange),
        url: j.hostedUrl,
        source: name,
        postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
        tags: [j.categories?.team, j.categories?.commitment].filter(Boolean) as string[],
        description: htmlToText(j.descriptionPlain ?? ''),
      })
      if (jobs.length >= 60) return jobs
    }
  }
  return jobs
}

function formatSalary(r?: { min?: number; max?: number; currency?: string }): string | null {
  if (!r?.min || !r?.max) return null
  const cur = r.currency ?? 'USD'
  return `${cur} ${r.min.toLocaleString()} – ${r.max.toLocaleString()}`
}
