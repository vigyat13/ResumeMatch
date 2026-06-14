import type { NormalizedJob, SearchParams } from '../types'
import { fetchJson, htmlToText, jobId } from '../util'

interface RemotiveJob {
  url: string
  title: string
  company_name: string
  candidate_required_location: string
  salary: string
  publication_date: string
  tags: string[]
  description: string
}

export const name = 'Remotive'

export async function search(params: SearchParams): Promise<NormalizedJob[]> {
  const data = await fetchJson<{ jobs: RemotiveJob[] }>(
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(params.query)}&limit=50`,
  )
  return (data.jobs ?? []).map(j => ({
    id: jobId(j.url),
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location || 'Remote',
    remote: true,
    salary: j.salary || null,
    url: j.url,
    source: name,
    postedAt: j.publication_date || null,
    tags: (j.tags ?? []).slice(0, 6),
    description: htmlToText(j.description ?? ''),
  }))
}
