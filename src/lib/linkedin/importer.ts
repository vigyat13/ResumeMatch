import { groq, GROQ_MODELS } from '@/lib/ai/groq'
import type { ResumeData } from '@/lib/builder/types'
import type { LinkedinProfile, LinkedinImportResult } from './types'

export async function importLinkedinProfile(
  input: string,
  options?: { signal?: AbortSignal }
): Promise<LinkedinImportResult> {
  const prompt = `Extract a complete LinkedIn profile from the following text or URL content. Return ONLY valid JSON.

Input:
---
${input.slice(0, 15000)}
---

Return this exact JSON structure with ALL fields populated:
{
  "profile": {
    "name": "Full Name",
    "title": "Current Headline/Title",
    "email": "email if found",
    "phone": "phone if found",
    "location": "City, State",
    "linkedin": "full linkedin URL",
    "summary": "About/Summary section text",
    "experience": [
      { "company": "Company", "role": "Title", "period": "Dates", "duration": "X yr Y mo", "location": "City", "description": ["bullet 1", "bullet 2"] }
    ],
    "education": [
      { "school": "University", "degree": "Degree Type", "field": "Major", "year": "Year", "activities": ["activity 1"] }
    ],
    "skills": ["Skill 1", "Skill 2"],
    "certifications": [
      { "name": "Cert Name", "issuer": "Issuing Org", "date": "Date" }
    ],
    "languages": ["Language 1"],
    "publications": [
      { "title": "Pub Title", "publisher": "Publisher", "date": "Date", "url": "URL" }
    ],
    "honors": ["Honor 1"],
    "volunteer": [
      { "organization": "Org", "role": "Role", "period": "Dates", "cause": "Cause" }
    ]
  },
  "warnings": ["any issues"],
  "confidence": 85
}`

  const completion = await groq.chat.completions.create({
    model: GROQ_MODELS.default,
    messages: [
      {
        role: 'system',
        content: 'You are a LinkedIn profile scraper and parser. Extract ALL available information from the provided profile data. If information is not present, use empty strings/arrays. Return ONLY valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 4000,
    ...(options?.signal ? { signal: options.signal } : {}),
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  if (!raw) {
    throw new Error('LinkedIn import: AI returned empty response')
  }

  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  const parsed = JSON.parse(cleaned) as {
    profile: LinkedinProfile
    warnings: string[]
    confidence: number
  }

  return {
    profile: parsed.profile,
    warnings: parsed.warnings ?? [],
    confidence: parsed.confidence ?? 0,
  }
}

export function linkedinProfileToResumeData(profile: LinkedinProfile): ResumeData {
  return {
    name: profile.name || '',
    title: profile.title || '',
    email: profile.email || '',
    phone: profile.phone || '',
    location: profile.location || '',
    github: '',
    linkedin: profile.linkedin || '',
    portfolio: '',
    summary: profile.summary || '',
    experience: profile.experience.map(e => ({
      company: e.company || '',
      role: e.role || '',
      period: e.period || '',
      bullets: e.description || [],
    })),
    education: profile.education.map(e => ({
      school: e.school || '',
      degree: e.field ? `${e.degree} in ${e.field}` : e.degree,
      year: e.year || '',
    })),
    skills: profile.skills.map(s => ({ name: s, level: 80 })),
    projects: [],
    certifications: profile.certifications.map(c => [c.name, c.issuer, c.date].filter(Boolean).join(' — ')),
    publications: profile.publications.map(p => p.title),
    honors: profile.honors ?? [],
  }
}
