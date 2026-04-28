import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/log'

const SkillSchema = z.object({
  name:  z.string(),
  level: z.number().min(0).max(100),
})

const ExperienceSchema = z.object({
  company: z.string(),
  role:    z.string(),
  period:  z.string(),
  bullets: z.array(z.string()),
})

const ProjectSchema = z.object({
  name:        z.string(),
  tech:        z.string(),
  link:        z.string().optional(),
  description: z.string(),
  bullets:     z.array(z.string()),
})

const EducationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  year:   z.string(),
})

const ResumeDataSchema = z.object({
  name:         z.string().min(1),
  title:        z.string(),
  email:        z.string(),
  phone:        z.string(),
  location:     z.string(),
  github:       z.string(),
  linkedin:     z.string().default(''),
  portfolio:    z.string().default(''),
  summary:      z.string(),
  experience:   z.array(ExperienceSchema),
  projects:     z.array(ProjectSchema).default([]),
  education:    z.array(EducationSchema),
  skills:       z.array(SkillSchema),
  publications: z.array(z.string()).optional(),
  honors:       z.array(z.string()).optional(),
})

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
      template_id:      templateId ?? null,
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
