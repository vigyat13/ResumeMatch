import type { NormalizedJob, SearchParams } from '../types'
import { fetchJson, htmlToText, jobId } from '../util'

// Free API key at https://developer.adzuna.com — good India + global coverage.
// Skipped automatically when ADZUNA_APP_ID / ADZUNA_APP_KEY are not set.

interface AdzunaJob {
  redirect_url: string
  title: string
  company?: { display_name?: string }
  location?: { display_name?: string }
  salary_min?: number
  salary_max?: number
  created?: string
  description?: string
  category?: { label?: string }
}

export const name = 'Adzuna'

export function enabled(): boolean {
  return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY)
}

export async function search(params: SearchParams): Promise<NormalizedJob[]> {
  const country = /india|gurugram|gurgaon|delhi|bangalore|bengaluru|mumbai|hyderabad|pune|noida/i
    .test(params.location ?? '') ? 'in' : 'us'
  const qs = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID!,
    app_key: process.env.ADZUNA_APP_KEY!,
    what: params.query,
    results_per_page: '40',
    max_days_old: String(params.recencyDays),
    'content-type': 'application/json',
  })
  if (params.location) qs.set('where', params.location)

  const data = await fetchJson<{ results: AdzunaJob[] }>(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${qs}`,
  )
  return (data.results ?? []).map(j => ({
    id: jobId(j.redirect_url),
    title: j.title.replace(/<[^>]+>/g, ''),
    company: j.company?.display_name ?? 'Unknown',
    location: j.location?.display_name ?? '',
    remote: /remote/i.test(`${j.title} ${j.location?.display_name ?? ''}`),
    salary: j.salary_min && j.salary_max
      ? `${Math.round(j.salary_min).toLocaleString()} – ${Math.round(j.salary_max).toLocaleString()}`
      : null,
    url: j.redirect_url,
    source: name,
    postedAt: j.created ?? null,
    tags: j.category?.label ? [j.category.label] : [],
    description: htmlToText(j.description ?? ''),
  }))
}
