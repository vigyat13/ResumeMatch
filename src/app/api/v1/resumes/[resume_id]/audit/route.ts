import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { groq, GROQ_MODELS } from '@/lib/ai/groq'
import { checkRateLimit } from '@/lib/rate-limit/limiter'
import { logAuditEvent } from '@/lib/audit/log'

interface Params {
  params: Promise<{ resume_id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { resume_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: report } = await supabase
    .from('audit_reports')
    .select('*')
    .eq('resume_id', resume_id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ data: report ?? null })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { resume_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = await checkRateLimit({
    identifier: user.id,
    endpoint:   'ats_audit',
    limit:      5,
    windowSec:  3600,
  })
  if (!rateLimit.allowed) {
    const minutesLeft = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.` },
      { status: 429 }
    )
  }

  const { data: resume, error: resumeErr } = await supabase
    .from('resumes')
    .select('id, file_name, parsed_text')
    .eq('id', resume_id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (resumeErr || !resume) {
    return NextResponse.json({ error: 'Resume not found.' }, { status: 404 })
  }
  if (!resume.parsed_text || resume.parsed_text.trim().length < 50) {
    return NextResponse.json(
      { error: 'Resume text is too short to analyze. Please upload a complete resume PDF.' },
      { status: 422 }
    )
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) consultant. Analyze the resume below and produce a structured audit report.

RESUME:
---
${resume.parsed_text.slice(0, 6000)}
---

Return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "overall_score": <integer 0-100>,
  "category_scores": {
    "format": <integer 0-100>,
    "content": <integer 0-100>,
    "keywords": <integer 0-100>,
    "length": <integer 0-100>,
    "contact_info": <integer 0-100>
  },
  "issues": [
    { "severity": "high"|"medium"|"low", "category": "<Format|Content|Keywords|Length|Contact Info>", "message": "<specific issue, 1-2 sentences>" }
  ],
  "recommendations": [
    { "priority": "high"|"medium"|"low", "action": "<specific action>", "impact": "<what improves>" }
  ]
}

Scoring rubric (weights):
- format (20%): standard sections, clean headings, no tables/columns/text-boxes that break parsers
- content (25%): quantified achievements with numbers/%, strong action verbs, specific accomplishments
- keywords (25%): technical skills, role-specific terminology, tools, certifications
- length (15%): 1-2 pages, good density, no padding
- contact_info (15%): name, email, phone, LinkedIn, city/state all present

overall_score = round(format*0.20 + content*0.25 + keywords*0.25 + length*0.15 + contact_info*0.15)

List 3-7 issues and 3-5 recommendations, sorted by severity/priority descending.`

  let auditData: {
    overall_score: number
    category_scores: { format: number; content: number; keywords: number; length: number; contact_info: number }
    issues: Array<{ severity: string; category: string; message: string }>
    recommendations: Array<{ priority: string; action: string; impact: string }>
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
    auditData     = JSON.parse(cleaned)
  } catch (err) {
    console.error('[ATS Audit] Groq/parse error:', err)
    return NextResponse.json({ error: 'Failed to generate audit. Please try again.' }, { status: 500 })
  }

  const { data: report, error: dbErr } = await supabase
    .from('audit_reports')
    .insert({
      resume_id,
      user_id:          user.id,
      overall_score:    auditData.overall_score,
      category_scores:  auditData.category_scores,
      issues:           auditData.issues,
      recommendations:  auditData.recommendations,
    })
    .select()
    .single()

  if (dbErr || !report) {
    console.error('[ATS Audit] DB insert error:', dbErr)
    return NextResponse.json({ error: 'Failed to save audit report.' }, { status: 500 })
  }

  logAuditEvent({ userId: user.id, eventType: 'ats_audit_run', resource: `resume:${resume_id}`, request: req })
  return NextResponse.json({ data: report })
}
