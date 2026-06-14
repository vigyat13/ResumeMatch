import type { NormalizedJob, SearchParams } from '../types'
import { fetchJson, htmlToText, jobId, matchesQuery, queryTokens } from '../util'

// Companies with active public Greenhouse boards. Slug = boards.greenhouse.io/{slug}
const BOARDS = [
  'stripe', 'databricks', 'figma', 'coinbase',
  'airbnb', 'postman', 'gitlab',
]

interface GhJob {
  absolute_url: string
  title: string
  updated_at: string
  location: { name: string }
  content?: string
}

export const name = 'Greenhouse'

export async function search(params: SearchParams): Promise<NormalizedJob[]> {
  const tokens = queryTokens(params.query)
  const results = await Promise.allSettled(
    BOARDS.map(slug =>
      fetchJson<{ jobs: GhJob[] }>(
        `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
      ).then(data => ({ slug, jobs: data.jobs ?? [] })),
    ),
  )

  const jobs: NormalizedJob[] = []
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    const company = companyLabel(r.value.slug)
    for (const j of r.value.jobs) {
      if (!matchesQuery(j.title, '', tokens)) continue
      jobs.push({
        id: jobId(j.absolute_url),
        title: j.title,
        company,
        location: j.location?.name ?? '',
        remote: /remote/i.test(j.location?.name ?? ''),
        salary: null,
        url: j.absolute_url,
        source: name,
        postedAt: j.updated_at ?? null,
        tags: [],
        description: htmlToText(j.content ?? ''),
      })
      if (jobs.length >= 60) return jobs
    }
  }
  return jobs
}

function companyLabel(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}
