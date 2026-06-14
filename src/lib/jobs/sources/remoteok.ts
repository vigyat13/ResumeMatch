import type { NormalizedJob, SearchParams } from '../types'
import { fetchJson, htmlToText, jobId, matchesQuery, queryTokens } from '../util'

interface RemoteOkJob {
  id?: string
  position?: string
  company?: string
  location?: string
  salary_min?: number
  salary_max?: number
  url?: string
  date?: string
  tags?: string[]
  description?: string
}

export const name = 'RemoteOK'

export async function search(params: SearchParams): Promise<NormalizedJob[]> {
  // First array element is a legal notice object, not a job.
  const data = await fetchJson<RemoteOkJob[]>('https://remoteok.com/api', {
    headers: { 'User-Agent': 'resumematch-job-search' },
  })
  const tokens = queryTokens(params.query)
  return data
    .filter(j => j.position && j.url)
    .filter(j => matchesQuery(j.position!, j.description ?? '', tokens))
    .map(j => ({
      id: jobId(j.url!),
      title: j.position!,
      company: j.company ?? 'Unknown',
      location: j.location || 'Remote',
      remote: true,
      salary: j.salary_min && j.salary_max ? `$${j.salary_min.toLocaleString()} – $${j.salary_max.toLocaleString()}` : null,
      url: j.url!,
      source: name,
      postedAt: j.date ?? null,
      tags: (j.tags ?? []).slice(0, 6),
      description: htmlToText(j.description ?? ''),
    }))
}
