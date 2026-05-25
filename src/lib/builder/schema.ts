import { z } from 'zod'

const StringListItemSchema = z.preprocess((value) => {
  if (typeof value === 'string') return value
  if (value == null) return ''
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (!Array.isArray(value) && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return [
      record.name,
      record.title,
      record.certification,
      record.issuer,
      record.provider,
      record.organization,
      record.description,
      record.date,
      record.year,
    ].map(item => String(item ?? '').trim()).filter(Boolean).join(' — ')
  }
  return ''
}, z.string())

export const SkillSchema = z.object({
  name: z.string(),
  level: z.number().min(0).max(100),
})

export const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  period: z.string(),
  bullets: z.array(z.string()),
})

export const ProjectSchema = z.object({
  name: z.string(),
  tech: z.string(),
  link: z.string().optional(),
  description: z.string(),
  bullets: z.array(z.string()),
})

export const EducationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  cgpa: z.string().optional().default(''),
  year: z.string(),
})

export const ResumeDataSchema = z.object({
  name: z.string().min(1),
  title: z.string(),
  profileImage: z.string().optional().default(''),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  github: z.string(),
  linkedin: z.string().default(''),
  portfolio: z.string().default(''),
  summary: z.string(),
  experience: z.array(ExperienceSchema),
  projects: z.array(ProjectSchema).default([]),
  education: z.array(EducationSchema),
  skills: z.array(SkillSchema),
  certifications: z.array(StringListItemSchema).optional(),
  publications: z.array(StringListItemSchema).optional(),
  honors: z.array(StringListItemSchema).optional(),
})
