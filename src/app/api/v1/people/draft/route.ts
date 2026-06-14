import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { aiProvider } from '@/lib/ai'

export const maxDuration = 30

const Schema = z.object({
  personName: z.string().min(1).max(120),
  personHeadline: z.string().max(300).optional(),
  company: z.string().min(1).max(120),
  role: z.string().max(160).optional(),
  kind: z.enum(['recruiter', 'peer']).default('peer'),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  const { personName, personHeadline, company, role, kind } = parsed.data

  // Ground the draft in the user's real background.
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

  const senderName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'the candidate'
  const skills = (resume?.extracted_skills ?? []).slice(0, 12).join(', ')
  const resumeExcerpt = (resume?.parsed_text ?? '').slice(0, 2500)

  try {
    const message = await aiProvider.generateText({
      useCase: 'application_intelligence',
      temperature: 0.5,
      maxTokens: 350,
      messages: [
        {
          role: 'system',
          content: [
            'You write short LinkedIn connection/referral messages. Constraints:',
            '- Maximum 120 words, first person, warm but professional, no flattery padding.',
            `- The sender is ${senderName}. Never invent facts not present in the resume context.`,
            kind === 'recruiter'
              ? '- The recipient is a recruiter: express interest in the role, one line on fit, ask about next steps.'
              : '- The recipient works at the company: politely ask whether they would consider referring the sender, make it easy to say no.',
            '- Output only the message text, no subject line, no quotes.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            `Recipient: ${personName}${personHeadline ? ` (${personHeadline})` : ''} at ${company}.`,
            role ? `Target role: ${role}.` : `Target company: ${company}.`,
            skills ? `Sender's key skills: ${skills}.` : '',
            resumeExcerpt ? `Sender's resume (excerpt):\n${resumeExcerpt}` : '',
          ].filter(Boolean).join('\n\n'),
        },
      ],
    })

    return NextResponse.json({ message: message.trim() })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Draft failed' }, { status: 502 })
  }
}
