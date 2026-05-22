import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/log'
import { ResumeDataSchema } from '@/lib/builder/schema'
import { isBuiltInTemplateId } from '@/lib/builder/builtinTemplates'

const BodySchema = z.object({
  resumeData: ResumeDataSchema,
  templateId: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid resume data' }, { status: 422 })
  }

  const { resumeData: d, templateId } = parsed.data
  const storedTemplateId = isBuiltInTemplateId(templateId) ? null : (templateId ?? null)

  const parsedText = [
    d.name, d.title, d.email, d.summary,
    ...d.experience.flatMap(e => [e.role, e.company, ...e.bullets]),
    ...d.projects.flatMap(p  => [p.name, p.tech, ...p.bullets]),
    ...d.education.map(e => `${e.degree} ${e.school}`),
    ...d.skills.map(s => s.name),
    ...(d.publications ?? []),
    ...(d.honors ?? []),
  ].join('\n')

  const extractedSkills = d.skills.map(s => s.name).filter(Boolean)
  const fileName = `${d.name.replace(/\s+/g, '_')}_Resume_Builder.pdf`

  const { data: resume, error } = await supabase
    .from('resumes')
    .insert({
      user_id:          user.id,
      file_name:        fileName,
      file_type:        'application/pdf',
      file_url:         '',
      file_size:        0,
      parsing_status:   'processed',
      parsed_text:      parsedText,
      extracted_skills: extractedSkills,
      template_id:      storedTemplateId,
    })
    .select('id')
    .single()

  if (error || !resume) {
    console.error('[Builder Save]', error)
    return NextResponse.json({ error: 'Failed to save resume' }, { status: 500 })
  }

  void logAuditEvent({
    userId:    user.id,
    eventType: 'resume_upload',
    resource:  `resume:${resume.id}`,
    request:   req,
    metadata:  { source: 'builder', template_id: templateId },
  })

  return NextResponse.json({ resume_id: resume.id })
}
