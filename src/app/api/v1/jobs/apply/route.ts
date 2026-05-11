import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getResend, FROM_EMAIL } from '@/lib/email/client'

const Schema = z.object({
  jobTitle:     z.string().min(1).max(200),
  company:      z.string().min(1).max(200),
  applyEmail:   z.string().email(),
  coverLetter:  z.string().min(10).max(3000),
  jobUrl:       z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  const { jobTitle, company, applyEmail, coverLetter, jobUrl } = parsed.data

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  const name = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Applicant'

  const resend = getResend()

  const { error } = await resend.emails.send({
    from:    FROM_EMAIL,
    to:      applyEmail,
    replyTo: user.email!,
    subject: `Application for ${jobTitle} — ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <p>${coverLetter.replace(/\n/g, '<br/>')}</p>
        <br/>
        <p>Best regards,<br/><strong>${name}</strong><br/>${user.email}</p>
        ${jobUrl ? `<br/><p style="color:#888;font-size:12px;">Applied via ResumeMatch · <a href="${jobUrl}">Job listing</a></p>` : ''}
      </div>
    `,
    text: `${coverLetter}\n\nBest regards,\n${name}\n${user.email}`,
  })

  if (error) return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })

  return NextResponse.json({ success: true })
}
