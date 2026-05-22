import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiParseFromRawWithFallback } from '../aiParser'
import { SectionType } from '../types'
import { RESUME_TEXT_SIMPLE, RESUME_TEXT_WITH_SECTIONS, RESUME_SKILLS_ONLY, RESUME_LINKEDIN_TEXT } from './fixtures/resumes'

vi.mock('@/lib/ai/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
  GROQ_MODELS: {
    default: 'llama-3.3-70b-versatile',
    fast: 'llama-3.1-8b-instant',
    longCtx: 'mixtral-8x7b-32768',
  },
}))

import { groq } from '@/lib/ai/groq'

function mockGroqResponse(overrides: Record<string, unknown> = {}) {
  const defaultResponse = {
    name: 'John Doe',
    title: 'Software Engineer',
    email: 'john@example.com',
    phone: '+1-555-123-4567',
    location: 'San Francisco, CA',
    github: 'github.com/johndoe',
    linkedin: 'linkedin.com/in/johndoe',
    portfolio: '',
    summary: 'Experienced software engineer.',
    experience: [
      { company: 'TechCorp', role: 'Senior Engineer', period: '2021 - Present', bullets: ['Led migration to microservices'] },
    ],
    education: [
      { school: 'UC Berkeley', degree: 'B.S. Computer Science', cgpa: '3.8', year: '2019' },
    ],
    skills: [
      { name: 'JavaScript', level: 90 },
      { name: 'TypeScript', level: 85 },
    ],
    projects: [],
    certifications: [],
    publications: [],
    honors: [],
    languages: [],
    sections: [
      { type: 'header', rawText: 'John Doe...', confidence: 95 },
      { type: 'summary', rawText: 'Experienced...', confidence: 90 },
      { type: 'experience', rawText: 'TechCorp...', confidence: 95 },
    ],
    confidence: { overall: 90, perSection: { experience: 95, education: 90 } },
    warnings: [],
    ...overrides,
  }

  return {
    choices: [
      {
        message: {
          content: JSON.stringify(defaultResponse),
        },
      },
    ],
  }
}

describe('aiParseFromRawWithFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extracts resume data from simple resume text', async () => {
    vi.mocked(groq.chat.completions.create).mockResolvedValue(mockGroqResponse() as any)

    const result = await aiParseFromRawWithFallback(RESUME_TEXT_SIMPLE)

    expect(result.resumeData.name).toBe('John Doe')
    expect(result.resumeData.email).toBe('john@example.com')
    expect(result.resumeData.experience.length).toBeGreaterThan(0)
    expect(result.resumeData.skills.length).toBeGreaterThan(0)
    expect(result.confidence.overall).toBeGreaterThan(0)
  })

  it('parses multiple experience entries', async () => {
    vi.mocked(groq.chat.completions.create).mockResolvedValue(mockGroqResponse({
      experience: [
        { company: 'TechCorp', role: 'Senior Engineer', period: '2021 - Present', bullets: ['Led migration'] },
        { company: 'StartupX', role: 'Software Engineer', period: '2019 - 2021', bullets: ['Built APIs'] },
      ],
    }) as any)

    const result = await aiParseFromRawWithFallback(RESUME_TEXT_SIMPLE)
    expect(result.resumeData.experience.length).toBe(2)
  })

  it('detects sections from the input', async () => {
    vi.mocked(groq.chat.completions.create).mockResolvedValue(mockGroqResponse() as any)

    const result = await aiParseFromRawWithFallback(RESUME_TEXT_SIMPLE)
    expect(result.sections.length).toBeGreaterThan(0)
    expect(result.sections.some(s => s.type === SectionType.Summary)).toBe(true)
  })

  it('includes warnings when provided', async () => {
    vi.mocked(groq.chat.completions.create).mockResolvedValue(mockGroqResponse({
      warnings: ['Some text appears garbled, possibly OCR issues'],
    }) as any)

    const result = await aiParseFromRawWithFallback(RESUME_TEXT_SIMPLE)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('OCR')
  })

  it('returns graceful fallback on AI failure', async () => {
    vi.mocked(groq.chat.completions.create).mockRejectedValue(new Error('API timeout'))

    const result = await aiParseFromRawWithFallback(RESUME_TEXT_SIMPLE)
    expect(result.resumeData.name).toBe('')
    expect(result.confidence.overall).toBe(0)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('handles empty or non-JSON AI responses gracefully', async () => {
    vi.mocked(groq.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: 'This is not JSON at all' } }],
    } as any)

    const result = await aiParseFromRawWithFallback('some text')
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('parses LinkedIn-style profile text', async () => {
    vi.mocked(groq.chat.completions.create).mockResolvedValue(mockGroqResponse({
      name: 'John Doe',
      title: 'Software Engineer at TechCorp',
    }) as any)

    const result = await aiParseFromRawWithFallback(RESUME_LINKEDIN_TEXT)
    expect(result.resumeData.name).toBeTruthy()
    expect(result.resumeData.title).toBeTruthy()
  })

  it('extracts skills from AI response', async () => {
    vi.mocked(groq.chat.completions.create).mockResolvedValue(mockGroqResponse({
      skills: [
        { name: 'JavaScript', level: 90 },
        { name: 'TypeScript', level: 85 },
        { name: 'React', level: 85 },
        { name: 'Node.js', level: 80 },
      ],
    }) as any)

    const result = await aiParseFromRawWithFallback(RESUME_TEXT_SIMPLE)
    expect(result.resumeData.skills.length).toBeGreaterThanOrEqual(3)
    const skillNames = result.resumeData.skills.map(s => s.name)
    expect(skillNames).toContain('JavaScript')
    expect(skillNames).toContain('React')
  })

  it('validates skill levels are in 0-100 range', async () => {
    vi.mocked(groq.chat.completions.create).mockResolvedValue(mockGroqResponse({
      skills: [
        { name: 'React', level: 150 },
        { name: 'Python', level: -10 },
      ],
    }) as any)

    const result = await aiParseFromRawWithFallback(RESUME_TEXT_SIMPLE)
    for (const skill of result.resumeData.skills) {
      expect(skill.level).toBeGreaterThanOrEqual(0)
      expect(skill.level).toBeLessThanOrEqual(100)
    }
  })
})
