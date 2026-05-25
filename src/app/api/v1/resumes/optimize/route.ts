import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit/limiter'
import { OptimizeRequestSchema, optimizeResume } from '@/lib/resume/optimizer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimit = await checkRateLimit({
      identifier: user.id,
      endpoint: 'resume_optimize',
      limit: 8,
      windowSec: 3600,
    })
    if (!rateLimit.allowed) {
      const mins = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)
    const parsed = OptimizeRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid optimization input.' },
        { status: 422 }
      )
    }

    if (parsed.data.mode === 'job_description' && parsed.data.jobDescription.trim().length < 80) {
      return NextResponse.json(
        { error: 'Paste a fuller job description before optimizing for a role.' },
        { status: 422 }
      )
    }

    const result = await optimizeResume(parsed.data)
    return NextResponse.json({ data: result })
  } catch (err) {
    console.error('[Resume Optimize] Error:', err)
    const message = err instanceof Error ? err.message : 'Resume optimization failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
