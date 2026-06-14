import type { NormalizedJob, SearchParams } from '../types'
import { fetchJson, htmlToText, jobId, matchesQuery, queryTokens } from '../util'

interface ArbeitnowJob {
  slug: string
  company_name: string
  title: string
  description: string
  remote: boolean
  url: string
  tags: string[]
  location: string
  created_at: number // unix seconds
}

export const name = 'Arbeitnow'

export async function search(params: SearchParams): Promise<NormalizedJob[]> {
  const data = await fetchJson<{ data: ArbeitnowJob[] }>(
    'https://www.arbeitnow.com/api/job-board-api',
  )
  const tokens = queryTokens(params.query)
  return (data.data ?? [])
    .filter(j => matchesQuery(j.title, j.description ?? '', tokens))
    .map(j => ({
      id: jobId(j.url),
      title: j.title,
      company: j.company_name,
      location: j.location || (j.remote ? 'Remote' : ''),
      remote: j.remote,
      salary: null,
      url: j.url,
      source: name,
      postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
      tags: (j.tags ?? []).slice(0, 6),
      description: htmlToText(j.description ?? ''),
    }))
}
