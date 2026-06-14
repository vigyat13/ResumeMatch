import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createSession, getDebugUrl } from '@/lib/browserbase/session'
import { getLocalConnectUrl, LOCAL_CHROME_HINT } from '@/lib/browserbase/local'
import { autofillApplication, profileFromResumeData, type CandidateProfile } from '@/lib/browserbase/autofill'
import { parseResumeToBuilderData } from '@/lib/resume/structuredParser'

export const maxDuration = 60

const Schema = z.object({
  job: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    company: z.string().min(1),
    url: z.string().url(),
  }),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  const { job } = parsed.data

  // Candidate profile comes from the same structured parser the builder uses,
  // run over the latest parsed resume. Account profile fills any gaps.
  const [{ data: profile }, { data: resume }] = await Promise.all([
    supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single(),
    supabase
      .from('resumes')
      .select('parsed_text, extracted_skills')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .eq('parsing_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  let candidate: CandidateProfile
  try {
    const structured = resume?.parsed_text
      ? await parseResumeToBuilderData(resume.parsed_text, resume.extracted_skills ?? [])
      : null
    candidate = profileFromResumeData({
      resume: structured?.data ?? null,
      accountFirstName: profile?.first_name ?? '',
      accountLastName: profile?.last_name ?? '',
      accountEmail: user.email ?? '',
    })
  } catch {
    candidate = profileFromResumeData({
      resume: null,
      accountFirstName: profile?.first_name ?? '',
      accountLastName: profile?.last_name ?? '',
      accountEmail: user.email ?? '',
    })
  }

  // Provider 1: Browserbase (cloud live view). Provider 2: local Chrome (free).
  let provider: 'browserbase' | 'local' = 'browserbase'
  let sessionId: string | null = null
  let liveViewUrl: string | null = null
  let connectUrl: string | null = null
  let providerError: string | null = null

  if (process.env.BROWSERBASE_API_KEY) {
    try {
      const session = await createSession({
        userId: user.id.slice(0, 36),
        product: 'resumematch-apply',
        jobTitle: job.title.slice(0, 120),
        company: job.company.slice(0, 120),
      })
      sessionId = session.id
      connectUrl = session.connectUrl
      const debug = await getDebugUrl(session.id)
      liveViewUrl = debug?.debuggerFullscreenUrl ?? debug?.debuggerUrl ?? null
    } catch (err) {
      providerError = (err as Error).message
    }
  } else {
    providerError = 'BROWSERBASE_API_KEY not set'
  }

  if (!connectUrl) {
    const local = await getLocalConnectUrl()
    if (local) {
      provider = 'local'
      connectUrl = local
      sessionId = `local-${crypto.randomUUID()}`
      liveViewUrl = null
    }
  }

  if (!connectUrl) {
    return NextResponse.json({
      error: providerError?.includes('limit')
        ? `Browserbase minutes exhausted. Free alternative: run the agent in your own Chrome. ${LOCAL_CHROME_HINT}`
        : `No browser available (${providerError ?? 'unknown'}). ${LOCAL_CHROME_HINT}`,
      jobUrl: job.url,
      profileUsed: publicProfile(candidate),
    }, { status: 503 })
  }

  let filled: string[] = []
  let fillError: string | null = null
  try {
    const result = await autofillApplication(connectUrl, job.url, candidate)
    filled = result.filled
  } catch (err) {
    fillError = (err as Error).message
  }

  return NextResponse.json({
    sessionId,
    provider,
    liveViewUrl,
    jobUrl: job.url,
    filled,
    fillError,
    profileUsed: publicProfile(candidate),
  })
}

function publicProfile(c: CandidateProfile) {
  return {
    name: c.fullName,
    email: c.email,
    phone: c.phone || null,
    location: c.location || null,
    linkedin: c.linkedin || null,
    website: c.website || null,
  }
}
