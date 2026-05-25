import { aiProvider } from '@/lib/ai/provider'
import { getSystemPrompt } from '@/lib/ai/prompts'
import type { ResumeData } from '@/lib/builder/types'
import { SectionType, type ParsedSection, type AIParseResult } from './types'

interface AIResponse {
  name: string
  title: string
  email: string
  phone: string
  location: string
  github: string
  linkedin: string
  portfolio: string
  summary: string
  experience: Array<{
    company: string
    role: string
    period: string
    bullets: string[]
  }>
  education: Array<{
    school: string
    degree: string
    cgpa: string
    year: string
  }>
  skills: Array<{
    name: string
    level: number
  }>
  projects: Array<{
    name: string
    tech: string
    link: string
    description: string
    bullets: string[]
  }>
  certifications: string[]
  publications: string[]
  honors: string[]
  languages: string[]
  sections: Array<{
    type: SectionType
    rawText: string
    confidence: number
  }>
  confidence: {
    overall: number
    perSection: Record<string, number>
  }
  warnings: string[]
}

// System prompt is now centralized in src/lib/ai/prompts.ts

function parseResumeDataFromJson(raw: string): Partial<AIResponse> {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  try {
    return JSON.parse(cleaned) as AIResponse
  } catch {
    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as AIResponse
      } catch {
        throw new Error('Failed to parse AI response as JSON')
      }
    }
    throw new Error('No JSON found in AI response')
  }
}

export async function aiExtractResumeData(
  text: string,
  options?: { signal?: AbortSignal }
): Promise<AIParseResult> {
  const prompt = `Extract structured resume data from the following text. Return ONLY valid JSON.

Resume text:
---
${text.slice(0, 12000)}
---

JSON schema:
{
  "name": "Full Name",
  "title": "Professional Title or Headline",
  "email": "email@example.com",
  "phone": "phone number",
  "location": "City, State",
  "github": "github URL or empty",
  "linkedin": "linkedin URL or empty",
  "portfolio": "portfolio URL or empty",
  "summary": "Professional summary text",
  "experience": [
    { "company": "Company Name", "role": "Job Title", "period": "Start - End", "bullets": ["achievement 1", "achievement 2"] }
  ],
  "education": [
    { "school": "School Name", "degree": "Degree Type", "cgpa": "GPA or empty", "year": "Graduation Year" }
  ],
  "skills": [
    { "name": "Skill Name", "level": 80 }
  ],
  "projects": [
    { "name": "Project Name", "tech": "tech stack", "link": "URL or empty", "description": "brief description", "bullets": ["detail 1"] }
  ],
  "certifications": ["cert 1"],
  "publications": ["pub 1"],
  "honors": ["honor 1"],
  "languages": ["language 1"],
  "sections": [
    { "type": "header|summary|experience|education|skills|projects|certifications|publications|honors|languages|volunteer|references|unknown", "rawText": "original section text", "confidence": 85 }
  ],
  "confidence": {
    "overall": 85,
    "perSection": { "experience": 90, "education": 85 }
  },
  "warnings": ["any issues detected"]
}`

  const systemPrompt = getSystemPrompt('resume_parse')

  const raw = await aiProvider.generateText({
    useCase: 'resume_parse',
    messages: [
      systemPrompt,
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    maxTokens: 4000,
    signal: options?.signal,
  })
  if (!raw) {
    throw new Error('AI returned empty response')
  }

  const parsed = parseResumeDataFromJson(raw)

  const sections: ParsedSection[] = (parsed.sections ?? []).map((s: AIResponse['sections'][0]) => ({
    type: s.type || SectionType.Unknown,
    rawText: s.rawText || '',
    confidence: s.confidence || 0,
  }))

  const resumeData: ResumeData = {
    name: parsed.name || '',
    title: parsed.title || '',
    email: parsed.email || '',
    phone: parsed.phone || '',
    location: parsed.location || '',
    github: parsed.github || '',
    linkedin: parsed.linkedin || '',
    portfolio: parsed.portfolio || '',
    summary: parsed.summary || '',
    experience: (parsed.experience ?? []).map(e => ({
      company: e.company || '',
      role: e.role || '',
      period: e.period || '',
      bullets: e.bullets ?? [],
    })),
    education: (parsed.education ?? []).map(e => ({
      school: e.school || '',
      degree: e.degree || '',
      cgpa: e.cgpa || '',
      year: e.year || '',
    })),
    skills: (parsed.skills ?? []).map(s => ({
      name: s.name || '',
      level: typeof s.level === 'number' ? Math.min(100, Math.max(0, s.level)) : 50,
    })),
    projects: (parsed.projects ?? []).map(p => ({
      name: p.name || '',
      tech: p.tech || '',
      link: p.link || '',
      description: p.description || '',
      bullets: p.bullets ?? [],
    })),
    certifications: cleanStringList(parsed.certifications),
    publications: cleanStringList(parsed.publications),
    honors: cleanStringList(parsed.honors),
  }

  const perSection: Record<string, number> = {}
  const sectionTypes = Object.values(SectionType)
  for (const st of sectionTypes) {
    perSection[st] = parsed.confidence?.perSection?.[st] ?? 0
  }

  return {
    resumeData,
    sections,
    confidence: {
      overall: parsed.confidence?.overall ?? 0,
      perSection: perSection as Record<SectionType, number>,
    },
    detectedFormat: 'plain_text',
    warnings: parsed.warnings ?? [],
  }
}

function cleanStringList(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values.map(listItemText).filter(Boolean)
}

function listItemText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
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
    ].map(listItemText).filter(Boolean).join(' — ')
  }
  return ''
}

export async function aiParseFromRawWithFallback(
  text: string,
  options?: { signal?: AbortSignal }
): Promise<AIParseResult> {
  try {
    return await aiExtractResumeData(text, options)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI parsing failed'
    return {
      resumeData: {
        name: '', title: '', email: '', phone: '', location: '',
        github: '', linkedin: '', portfolio: '', summary: '',
        experience: [], education: [], skills: [], projects: [],
        certifications: [], publications: [], honors: [],
      },
      sections: [{ type: SectionType.Unknown, rawText: text, confidence: 0 }],
      confidence: { overall: 0, perSection: {} as Record<SectionType, number> },
      detectedFormat: 'plain_text',
      warnings: [message],
    }
  }
}
