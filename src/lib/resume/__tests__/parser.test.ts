import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseResume } from '../parser'

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'Mock DOCX text.\nSkills: Python, Django, PostgreSQL' }),
  },
}))

vi.mock('../aiParser', () => ({
  aiParseFromRawWithFallback: vi.fn().mockImplementation(async (text: string) => ({
    resumeData: {
      name: 'Parsed Name',
      title: 'Engineer',
      email: 'test@example.com',
      phone: '',
      location: '',
      github: '',
      linkedin: '',
      portfolio: '',
      summary: text.slice(0, 100),
      experience: [{ company: 'Company', role: 'Role', period: '2020-2023', bullets: ['Did stuff'] }],
      education: [{ school: 'University', degree: 'BS', year: '2020' }],
      skills: [{ name: 'JavaScript', level: 80 }, { name: 'React', level: 75 }],
      projects: [],
      publications: [],
      honors: [],
    },
    sections: [],
    confidence: { overall: 85, perSection: {} as any },
    detectedFormat: 'plain_text' as const,
    warnings: [],
  })),
}))

vi.mock('../skills', () => ({
  extractSkills: vi.fn().mockImplementation((text: string) => {
    if (text.includes('Python')) return ['Python', 'Django', 'PostgreSQL']
    if (text.includes('JavaScript')) return ['JavaScript', 'React', 'Node.js']
    return []
  }),
}))

vi.mock('../ocr', () => ({
  ocrImage: vi.fn().mockResolvedValue('OCR extracted text.\nSkills: Python'),
  isImageType: vi.fn().mockReturnValue(true),
  isLikelyScanned: vi.fn().mockReturnValue(false),
}))

describe('parseResume', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses a DOCX buffer and returns text + skills', async () => {
    const buffer = Buffer.from('test docx content')
    const result = await parseResume(buffer, 'docx')

    expect(result.text.length).toBeGreaterThan(0)
    expect(result.skills.length).toBeGreaterThan(0)
    expect(result.error).toBeUndefined()
  })

  it('returns parsed AI result with structured data', async () => {
    const buffer = Buffer.from('test content')
    const result = await parseResume(buffer, 'docx')

    expect(result.parsed?.resumeData.name).toBe('Parsed Name')
    expect(result.parsed?.resumeData.experience.length).toBeGreaterThan(0)
  })

  it('returns confidence scores from AI parser', async () => {
    const buffer = Buffer.from('test content')
    const result = await parseResume(buffer, 'docx')

    expect(result.parsed?.confidence.overall).toBeGreaterThan(0)
  })

  it('handles empty buffer but returns gracefully', async () => {
    const buffer = Buffer.from('')
    const result = await parseResume(buffer, 'docx')

    expect(result).toBeDefined()
  })

  it('calls onProgress callback with stages', async () => {
    const buffer = Buffer.from('test content')
    const stages: string[] = []

    await parseResume(buffer, 'docx', {}, (progress) => {
      stages.push(progress.stage)
    })

    expect(stages.length).toBeGreaterThan(0)
    expect(stages[stages.length - 1]).toBe('complete')
  })

  it('works without onProgress callback', async () => {
    const buffer = Buffer.from('test content')
    const result = await parseResume(buffer, 'docx')

    expect(result.parsed).not.toBeNull()
  })

  it('returns skills extracted from text', async () => {
    const buffer = Buffer.from('test docx content with skills: Python and Django')
    const result = await parseResume(buffer, 'docx')

    expect(result.skills.length).toBeGreaterThan(0)
  })

  it('includes detectedFormat in parsed result', async () => {
    const buffer = Buffer.from('test content')
    const result = await parseResume(buffer, 'docx')

    expect(result.parsed?.detectedFormat).toBe('docx')
  })
})
