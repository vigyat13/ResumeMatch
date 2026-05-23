import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { groq, GROQ_MODELS } from '@/lib/ai/groq'
import { checkRateLimit } from '@/lib/rate-limit/limiter'
import {
  buildApplicationPrompt,
  fallbackApplicationIntelligence,
  parseApplicationIntelligence,
} from '@/lib/applications/intelligence'

const BodySchema = z.object({
  resumeId:       z.string().uuid().optional(),
  profileNotes:   z.string().max(4000).optional().default(''),
  jobTitle:       z.string().max(200).optional(),
  company:        z.string().max(200).optional(),
  location:       z.string().max(200).optional(),
  salaryTarget:   z.string().max(120).optional(),
  jobDescription: z.string().min(50, 'Paste the full job description before analyzing.').max(12000),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = await checkRateLimit({
    identifier: user.id,
    endpoint:   'application_intelligence',
    limit:      12,
    windowSec:  3600,
  })

  if (!rateLimit.allowed) {
    const mins = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
    return NextResponse.json({ error: `Rate limit reached. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 422 })
  }

  const input = parsed.data
  let resumeText = ''

  const resumeQuery = supabase
    .from('resumes')
    .select('id, file_name, parsed_text')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .not('parsed_text', 'is', null)

  const { data: resume } = input.resumeId
    ? await resumeQuery.eq('id', input.resumeId).single()
    : await resumeQuery.order('created_at', { ascending: false }).limit(1).single()

  resumeText = (resume as { parsed_text?: string | null } | null)?.parsed_text ?? ''

  if (!resumeText.trim() && !input.profileNotes.trim()) {
    return NextResponse.json({ error: 'Add profile notes or upload a parsed resume first.' }, { status: 422 })
  }

  try {
    const completion = await groq.chat.completions.create({
      model:       GROQ_MODELS.default,
      messages:    [{ role: 'user', content: buildApplicationPrompt({ ...input, resumeText }) }],
      temperature: 0.25,
      max_tokens:  3500,
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const analysis = parseApplicationIntelligence(raw)

    return NextResponse.json({
      data: {
        analysis,
        resume: resume ? { id: resume.id, file_name: resume.file_name } : null,
      },
    })
  } catch (err) {
    console.error('[Application Intelligence] Analysis error:', err)
    return NextResponse.json({
      data: {
        analysis: fallbackApplicationIntelligence(),
        resume: resume ? { id: resume.id, file_name: resume.file_name } : null,
        degraded: true,
      },
    })
  }
}
