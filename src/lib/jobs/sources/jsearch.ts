import type { NormalizedJob, SearchParams } from '../types'
import { fetchJson, htmlToText, jobId } from '../util'

// JSearch on RapidAPI — aggregates Google for Jobs (LinkedIn, Indeed, Glassdoor
// and more listings). Free tier available. Skipped when JSEARCH_API_KEY unset.

interface JSearchJob {
  job_id: string
  job_title: string
  employer_name: string
  job_city?: string
  job_country?: string
  job_is_remote?: boolean
  job_min_salary?: number
  job_max_salary?: number
  job_salary_currency?: string
  job_apply_link: string
  job_posted_at_datetime_utc?: string
  job_description?: string
  job_publisher?: string
  job_employment_type?: string
}

export const name = 'JSearch'

export function enabled(): boolean {
  return Boolean(process.env.JSEARCH_API_KEY)
}

export async function search(params: SearchParams): Promise<NormalizedJob[]> {
  const datePosted = params.recencyDays <= 1 ? 'today' : params.recencyDays <= 3 ? '3days' : params.recencyDays <= 7 ? 'week' : 'month'
  const query = params.location ? `${params.query} in ${params.location}` : params.query
  const qs = new URLSearchParams({ query, page: '1', num_pages: '1', date_posted: datePosted })

  const data = await fetchJson<{ data: JSearchJob[] }>(
    `https://jsearch.p.rapidapi.com/search?${qs}`,
    {
      headers: {
        'x-rapidapi-key': process.env.JSEARCH_API_KEY!,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
    },
    10_000,
  )
  return (data.data ?? []).map(j => ({
    id: jobId(j.job_apply_link || j.job_id),
    title: j.job_title,
    company: j.employer_name ?? 'Unknown',
    location: [j.job_city, j.job_country].filter(Boolean).join(', ') || (j.job_is_remote ? 'Remote' : ''),
    remote: Boolean(j.job_is_remote),
    salary: j.job_min_salary && j.job_max_salary
      ? `${j.job_salary_currency ?? ''} ${j.job_min_salary.toLocaleString()} – ${j.job_max_salary.toLocaleString()}`.trim()
      : null,
    url: j.job_apply_link,
    source: j.job_publisher ? `${name} · ${j.job_publisher}` : name,
    postedAt: j.job_posted_at_datetime_utc ?? null,
    tags: j.job_employment_type ? [j.job_employment_type] : [],
    description: htmlToText(j.job_description ?? ''),
  }))
}
