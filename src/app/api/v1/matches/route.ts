import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { groq, GROQ_MODELS } from '@/lib/ai/groq'
import { checkRateLimit } from '@/lib/rate-limit/limiter'

const BodySchema = z.object({
  resume_id:       z.string().uuid(),
  job_description: z.string().min(50, { message: 'Job description is too short — paste the full JD.' }),
  job_title:       z.string().optional(),
  company:         z.string().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('job_matches')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch matches.' }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = await checkRateLimit({ identifier: user.id, endpoint: 'job_match', limit: 10, windowSec: 3600 })
  if (!rateLimit.allowed) {
    const mins = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
    return NextResponse.json({ error: `Rate limit reached. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` }, { status: 429 })
  }

  const body   = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 422 })
  }

  const { resume_id, job_description, job_title, company } = parsed.data

  const { data: resume } = await supabase
    .from('resumes')
    .select('id, file_name, parsed_text')
    .eq('id', resume_id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!resume) return NextResponse.json({ error: 'Resume not found.' }, { status: 404 })
  if (!resume.parsed_text || resume.parsed_text.trim().length < 50) {
    return NextResponse.json({ error: 'Resume text could not be read. Please re-upload your PDF.' }, { status: 422 })
  }

  const prompt = `You are a professional resume-to-job matching expert.

Compare the resume against the job description and return a detailed match analysis.

RESUME:
---
${resume.parsed_text.slice(0, 5000)}
---

JOB DESCRIPTION:
---
${job_description.slice(0, 3000)}
---

Return ONLY valid JSON (no markdown, no extra text):
{
  "job_title": "<extracted or inferred job title from JD>",
  "company": "<company name from JD, or null>",
  "match_percentage": <integer 0-100>,
  "job_skills": ["<every skill/tool/requirement mentioned in JD>"],
  "matched_skills": ["<skills present in both resume and JD>"],
  "missing_skills": ["<skills required by JD that are absent from resume>"],
  "extra_skills": ["<notable resume skills not required by this JD>"],
  "recommendations": ["<specific actionable advice to improve this application>"]
}

Scoring:
- 85-100: Exceptional fit, nearly all requirements met
- 70-84: Strong fit, most key requirements met
- 50-69: Moderate fit, some gaps exist
- 30-49: Weak fit, significant gaps
- 0-29: Poor fit, very different role or level

Provide 3-5 specific, actionable recommendations tailored to this job.`

  let ai: {
    job_title:        string
    company:          string | null
    match_percentage: number
    job_skills:       string[]
    matched_skills:   string[]
    missing_skills:   string[]
    extra_skills:     string[]
    recommendations:  string[]
  }

  try {
    const completion = await groq.chat.completions.create({
      model:       GROQ_MODELS.default,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens:  1500,
    })
    const raw     = completion.choices[0]?.message?.content ?? ''
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
    ai            = JSON.parse(cleaned)
  } catch (err) {
    console.error('[Job Match] Groq/parse error:', err)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }

  const { data: match, error: dbErr } = await supabase
    .from('job_matches')
    .insert({
      user_id:          user.id,
      resume_id,
      job_description,
      job_title:        job_title || ai.job_title,
      company:          company   || ai.company,
      match_percentage: ai.match_percentage,
      job_skills:       ai.job_skills,
      matched_skills:   ai.matched_skills,
      missing_skills:   ai.missing_skills,
      extra_skills:     ai.extra_skills,
      recommendations:  ai.recommendations,
    })
    .select()
    .single()

  if (dbErr || !match) {
    console.error('[Job Match] DB error:', dbErr)
    return NextResponse.json({ error: 'Failed to save match.' }, { status: 500 })
  }

  return NextResponse.json({ data: match }, { status: 201 })
}
