import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const Schema = z.object({
  sessionId: z.string().min(1),
  job: z.object({
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

  const { sessionId, job } = parsed.data

  const { error } = await supabase.from('tracked_applications').insert({
    user_id: user.id,
    session_id: sessionId,
    job_title: job.title,
    company: job.company,
    job_url: job.url,
    status: 'submitted',
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to record application.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
