import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createSession, getDebugUrl } from '@/lib/browserbase/session'
import { getJobAgentRun, startJobAgentRun } from '@/lib/browserbase/job-agent'

const CreateSessionSchema = z.object({
  prompt: z.string().max(1000).optional(),
  resumeName: z.string().max(240).optional(),
  applyMode: z.enum(['review', 'auto_open']).default('review'),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateSessionSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 422 })

  if (!process.env.BROWSERBASE_API_KEY) {
    return Response.json(
      { error: 'Missing BROWSERBASE_API_KEY. Add it to .env.local to start cloud browser sessions.' },
      { status: 503 },
    )
  }

  const prompt = parsed.data.prompt?.trim() || 'Find relevant jobs and prepare applications for review.'
  const resumeName = parsed.data.resumeName ?? ''
  const searchQuery = buildQuery(prompt)

  let session
  try {
    session = await createSession({
      userId: user.id.slice(0, 36),
      product: 'resumematch-job-agent',
      prompt: prompt.slice(0, 120),
      resumeName: resumeName.slice(0, 120),
      searchQuery: searchQuery.slice(0, 120),
      applyMode: parsed.data.applyMode,
    })
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 502 },
    )
  }

  const debug = await getDebugUrl(session.id)
  const run = startJobAgentRun({
    sessionId: session.id,
    connectUrl: session.connectUrl,
    query: searchQuery,
    applyMode: parsed.data.applyMode,
  })

  return Response.json({
    session: {
      id: session.id,
      status: session.status,
      region: session.region,
      expiresAt: session.expiresAt,
      debuggerUrl: debug?.debuggerUrl ?? null,
      debuggerFullscreenUrl: debug?.debuggerFullscreenUrl ?? null,
    },
    run,
  })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const runId = req.nextUrl.searchParams.get('runId')
  if (!runId) return Response.json({ error: 'Missing runId' }, { status: 400 })

  const run = getJobAgentRun(runId)
  if (!run) return Response.json({ error: 'Run not found' }, { status: 404 })

  return Response.json({ run })
}

function buildQuery(prompt: string): string {
  const cleaned = prompt.replace(/\s+/g, ' ').trim().slice(0, 160)
  if (!cleaned) return 'software engineer jobs apply'
  if (/\b(job|jobs|career|careers|hiring|apply|role|roles)\b/i.test(cleaned)) return cleaned
  return `${cleaned} jobs apply`
}
