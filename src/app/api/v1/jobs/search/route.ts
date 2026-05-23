import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit/limiter'

const FREE_DAILY_LIMIT = 10
const PRO_DAILY_LIMIT  = 200
const USE_RAPID_API = process.env.JOBS_USE_RAPIDAPI === 'true'

const SearchSchema = z.object({
  query:    z.string().min(1).max(200),
  location: z.string().max(100).optional(),
  page:     z.number().int().min(1).max(5).optional().default(1),
})

function sseChunk(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Fetch tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier    = profile?.subscription_tier ?? 'free'
  const isPro   = tier === 'pro' || tier === 'enterprise'
  const limit = USE_RAPID_API ? (isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT) : 999

  const rl = USE_RAPID_API
    ? await checkRateLimit({
        identifier: user.id,
        endpoint:   'jobs_search',
        limit,
        windowSec:  86400, // 24h window
      })
    : { allowed: true, remaining: 999, resetAt: Date.now() + 86_400_000 }

  if (!rl.allowed) {
    const resetIn = Math.ceil((rl.resetAt - Date.now()) / 3_600_000)
    return new Response(
      JSON.stringify({
        error:     `Daily search limit reached (${limit}/day). Resets in ~${resetIn}h.`,
        upgradeRequired: !isPro,
      }),
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = SearchSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 422 })
  }

  const { query, location, page } = parsed.data

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (data: object) => controller.enqueue(enc.encode(sseChunk(data)))

      try {
        const mapped = USE_RAPID_API
          ? await fetchRapidApiJobs({ query, location, page, send })
          : await fetchTestJobs({ query, location, send })

        send({ type: 'jobs', data: mapped })
        send(
          USE_RAPID_API
            ? { type: 'done', total: mapped.length, remaining: rl.remaining, limit }
            : { type: 'done', total: mapped.length }
        )
      } catch (err) {
        send({ type: 'step', message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`, status: 'error' })
        send({ type: 'done', total: 0 })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}

type SendEvent = (data: object) => void

interface MappedJob {
  id:                  string
  title:               string
  company:             string
  location:            string
  is_remote:           boolean
  source:              string
  url:                 string
  posted_at:           string | null
  salary_min:          number | null
  salary_max:          number | null
  salary_currency:     string | null
  salary_period:       string | null
  description_snippet: string
  employer_logo:       string | null
}

async function fetchRapidApiJobs({
  query,
  location,
  page,
  send,
}: {
  query: string
  location?: string
  page: number
  send: SendEvent
}): Promise<MappedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    send({ type: 'step', message: 'RapidAPI key missing. Returning test listings instead.', status: 'error' })
    return fetchTestJobs({ query, location, send })
  }

  send({ type: 'step', message: 'Connecting to RapidAPI job search...', status: 'running' })

  const searchQuery = location ? `${query} in ${location}` : query
  const url = new URL('https://jsearch.p.rapidapi.com/search')
  url.searchParams.set('query', searchQuery)
  url.searchParams.set('page', String(page))
  url.searchParams.set('num_pages', '1')
  url.searchParams.set('date_posted', 'week')
  url.searchParams.set('employment_types', 'FULLTIME,PARTTIME,CONTRACTOR')

  send({ type: 'step', message: `Searching for "${query}"${location ? ` in ${location}` : ''}...`, status: 'running' })

  const res = await fetch(url.toString(), {
    headers: {
      'X-RapidAPI-Key':  apiKey,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  })

  if (!res.ok) {
    send({ type: 'step', message: `RapidAPI returned ${res.status}. Returning test listings instead.`, status: 'error' })
    return fetchTestJobs({ query, location, send })
  }

  const json = await res.json()
  const jobs: RawJob[] = json.data ?? []

  send({ type: 'step', message: `Found ${jobs.length} jobs from live providers`, status: 'done' })
  send({ type: 'step', message: 'Parsing results...', status: 'running' })

  const mapped = jobs.map((j) => ({
    id:          j.job_id,
    title:       j.job_title,
    company:     j.employer_name,
    location:    j.job_city ? `${j.job_city}, ${j.job_country ?? ''}`.trim().replace(/,$/, '') : (j.job_country ?? 'Remote'),
    is_remote:   j.job_is_remote ?? false,
    source:      normalizeSource(j.job_publisher),
    url:         j.job_apply_link ?? j.job_url ?? '#',
    posted_at:   j.job_posted_at_datetime_utc ?? null,
    salary_min:  j.job_min_salary ?? null,
    salary_max:  j.job_max_salary ?? null,
    salary_currency: j.job_salary_currency ?? null,
    salary_period:   j.job_salary_period ?? null,
    description_snippet: (j.job_description ?? '').slice(0, 220),
    employer_logo: j.employer_logo ?? null,
  }))

  send({ type: 'step', message: 'Done.', status: 'done' })
  return mapped
}

async function fetchTestJobs({
  query,
  location,
  send,
}: {
  query: string
  location?: string
  send: SendEvent
}): Promise<MappedJob[]> {
  send({ type: 'step', message: 'Opening browser session...', status: 'running' })
  await wait(500)
  send({ type: 'step', message: `Typing "${query}"${location ? ` with ${location} filter` : ''}...`, status: 'running' })
  await wait(700)
  send({ type: 'step', message: 'Checking LinkedIn, Indeed, Glassdoor, and company career pages...', status: 'running' })
  await wait(900)

  const jobs = buildTestJobs(query, location)

  send({ type: 'step', message: `Found ${jobs.length} test listings for this search`, status: 'done' })
  await wait(450)
  send({ type: 'step', message: 'Preparing job cards...', status: 'done' })
  return jobs
}

function buildTestJobs(query: string, location?: string): MappedJob[] {
  const role = normalizeRole(query)
  const place = location?.trim() || 'Remote'
  const now = Date.now()
  const companies = [
    'Northstar Labs',
    'Stripeworks',
    'Apex Systems',
    'NovaCloud',
    'BrightLayer',
    'OrbitPay',
    'LaunchGrid',
    'ScaleDesk',
    'Greenhouse AI',
    'MetricLoop',
  ]
  const sources = ['LinkedIn', 'Indeed', 'Glassdoor', 'Career Page', 'LinkedIn', 'Indeed', 'Glassdoor', 'Career Page', 'LinkedIn', 'Indeed']
  const titleVariants = [
    role,
    `Senior ${role}`,
    `${role} - Platform`,
    `${role} Intern`,
    `Remote ${role}`,
    `${role} Consultant`,
    `${role} - Growth`,
    `${role} - Product Engineering`,
    `Associate ${role}`,
    `Lead ${role}`,
  ]

  return titleVariants.map((title, index) => {
    const source = sources[index]
    const remote = /remote/i.test(query) || index % 3 === 0
    const company = companies[index]
    const encodedCompany = encodeURIComponent(company)
    const encodedTitle = encodeURIComponent(title)
    const baseSalary = 55_000 + index * 7_500

    return {
      id: `test-${slugify(title)}-${index}`,
      title,
      company,
      location: remote ? 'Remote' : place,
      is_remote: remote,
      source,
      url: `https://www.google.com/search?q=${encodedCompany}+${encodedTitle}+jobs`,
      posted_at: new Date(now - (index + 1) * 3_600_000).toISOString(),
      salary_min: index % 2 === 0 ? baseSalary : null,
      salary_max: index % 2 === 0 ? baseSalary + 25_000 : null,
      salary_currency: '$',
      salary_period: index % 2 === 0 ? 'YEAR' : null,
      description_snippet: `${company} is hiring for ${title}. This test listing matches the current prompt and location filter so you can validate the browser preview, result timing, tracking, and apply flow without RapidAPI quota.`,
      employer_logo: null,
    }
  })
}

function normalizeRole(query: string): string {
  const cleaned = query
    .replace(/\b(jobs?|roles?|openings?|hiring|remote|onsite|hybrid|in|near me)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const role = cleaned || 'Software Engineer'
  return role
    .split(' ')
    .map(word => word ? `${word[0]?.toUpperCase()}${word.slice(1).toLowerCase()}` : '')
    .join(' ')
}

function normalizeSource(source: string | null | undefined): string {
  const value = source ?? 'Job Board'
  if (/linkedin/i.test(value)) return 'LinkedIn'
  if (/indeed/i.test(value)) return 'Indeed'
  if (/glassdoor/i.test(value)) return 'Glassdoor'
  return value
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface RawJob {
  job_id:                        string
  job_title:                     string
  employer_name:                 string
  employer_logo:                 string | null
  job_publisher:                 string
  job_city:                      string | null
  job_country:                   string | null
  job_is_remote:                 boolean
  job_apply_link:                string
  job_url:                       string
  job_posted_at_datetime_utc:    string | null
  job_min_salary:                number | null
  job_max_salary:                number | null
  job_salary_currency:           string | null
  job_salary_period:             string | null
  job_description:               string
}
