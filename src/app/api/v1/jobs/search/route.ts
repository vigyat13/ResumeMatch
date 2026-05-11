import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit/limiter'

const FREE_DAILY_LIMIT = 10
const PRO_DAILY_LIMIT  = 200

const SearchSchema = z.object({
  query:    z.string().min(1).max(200),
  location: z.string().max(100).optional(),
  page:     z.number().int().min(1).max(5).optional().default(1),
})

function sseChunk(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`
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
  const limit   = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT

  const rl = await checkRateLimit({
    identifier: user.id,
    endpoint:   'jobs_search',
    limit,
    windowSec:  86400, // 24h window
  })

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
  const apiKey = process.env.RAPIDAPI_KEY

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY not configured' }), { status: 500 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (data: object) => controller.enqueue(enc.encode(sseChunk(data)))

      try {
        send({ type: 'step', message: 'Connecting to job search...', status: 'running' })

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
          send({ type: 'step', message: `API error: ${res.status}`, status: 'error' })
          send({ type: 'done', total: 0 })
          controller.close()
          return
        }

        const json = await res.json()
        const jobs: RawJob[] = json.data ?? []

        send({ type: 'step', message: `Found ${jobs.length} jobs from LinkedIn, Indeed & more`, status: 'done' })
        send({ type: 'step', message: 'Parsing results...', status: 'running' })

        const mapped = jobs.map((j) => ({
          id:          j.job_id,
          title:       j.job_title,
          company:     j.employer_name,
          location:    j.job_city ? `${j.job_city}, ${j.job_country ?? ''}`.trim().replace(/,$/, '') : (j.job_country ?? 'Remote'),
          is_remote:   j.job_is_remote ?? false,
          source:      j.job_publisher ?? 'Job Board',
          url:         j.job_apply_link ?? j.job_url ?? '#',
          posted_at:   j.job_posted_at_datetime_utc ?? null,
          salary_min:  j.job_min_salary ?? null,
          salary_max:  j.job_max_salary ?? null,
          salary_currency: j.job_salary_currency ?? null,
          salary_period:   j.job_salary_period ?? null,
          description_snippet: (j.job_description ?? '').slice(0, 200),
          employer_logo: j.employer_logo ?? null,
        }))

        send({ type: 'step', message: 'Done.', status: 'done' })
        send({ type: 'jobs', data: mapped })
        send({ type: 'done', total: mapped.length, remaining: rl.remaining, limit })
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
