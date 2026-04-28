import { z } from 'zod'

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
  publications: z.array(z.string()).optional(),
  honors: z.array(z.string()).optional(),
})
