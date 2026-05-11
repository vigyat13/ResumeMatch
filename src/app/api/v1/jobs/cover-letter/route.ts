import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { groq, GROQ_MODELS } from '@/lib/ai/groq'

const Schema = z.object({
  jobTitle:        z.string().min(1).max(200),
  company:         z.string().min(1).max(200),
  jobDescription:  z.string().max(4000),
  resumeId:        z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 422 })

  const { jobTitle, company, jobDescription, resumeId } = parsed.data

  // Fetch resume text if provided, else fetch latest resume
  let resumeText = ''
  const query = supabase
    .from('resumes')
    .select('parsed_text, file_name')
    .eq('user_id', user.id)
    .not('parsed_text', 'is', null)

  const { data: resume } = resumeId
    ? await query.eq('id', resumeId).single()
    : await query.order('created_at', { ascending: false }).limit(1).single()

  resumeText = (resume as { parsed_text?: string } | null)?.parsed_text ?? ''

  // Fetch user profile for name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  const name = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'the applicant'

  const stream = await groq.chat.completions.create({
    model:  GROQ_MODELS.default,
    stream: true,
    messages: [
      {
        role: 'system',
        content: `You are an expert career coach. Write concise, compelling cover letters.
Format: 3 short paragraphs, no fluff. Opening (why this role), Middle (2-3 specific achievements from resume), Closing (CTA).
Tone: confident, professional, human. No "I am writing to express my interest". No generic phrases.
Output ONLY the cover letter body — no subject line, no date, no address headers.`,
      },
      {
        role: 'user',
        content: `Write a cover letter for ${name} applying to ${jobTitle} at ${company}.

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

RESUME:
${resumeText.slice(0, 2000) || 'No resume uploaded — write a general cover letter based on the job description.'}`,
      },
    ],
    max_tokens: 500,
    temperature: 0.7,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
