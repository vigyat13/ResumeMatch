import { describe, it, expect } from 'vitest'
import { detectSections, classifyHeaderInfo } from '../sectionDetector'
import { SectionType } from '../types'
import { RESUME_TEXT_SIMPLE, RESUME_TEXT_WITH_SECTIONS } from './fixtures/resumes'

describe('detectSections', () => {
  it('detects all major sections in a standard resume', () => {
    const sections = detectSections(RESUME_TEXT_SIMPLE)

    expect(sections.length).toBeGreaterThanOrEqual(4)

    const types = sections.map(s => s.type)
    expect(types).toContain(SectionType.Header)
    expect(types).toContain(SectionType.Summary)
    expect(types).toContain(SectionType.Experience)
    expect(types).toContain(SectionType.Education)
    expect(types).toContain(SectionType.Skills)
  })

  it('detects optional sections in resumes that have them', () => {
    const sections = detectSections(RESUME_TEXT_WITH_SECTIONS)

    const types = sections.map(s => s.type)
    expect(types).toContain(SectionType.Certifications)
    expect(types).toContain(SectionType.Honors)
  })

  it('returns Unknown section for text with no clear sections', () => {
    const sections = detectSections('Just some random text without clear resume sections.')

    expect(sections.length).toBe(1)
    expect(sections[0].type).toBe(SectionType.Unknown)
    expect(sections[0].rawText).toContain('random text')
  })

  it('assigns non-zero confidence for detected sections', () => {
    const sections = detectSections(RESUME_TEXT_SIMPLE)

    for (const section of sections) {
      expect(section.confidence).toBeGreaterThanOrEqual(0)
      if (section.type !== SectionType.Header) {
        expect(section.confidence).toBeGreaterThan(0)
      }
    }
  })

  it('includes raw text in each section', () => {
    const sections = detectSections(RESUME_TEXT_SIMPLE)

    for (const section of sections) {
      expect(section.rawText.length).toBeGreaterThan(0)
    }
  })
})

describe('classifyHeaderInfo', () => {
  it('extracts email from header text', () => {
    const info = classifyHeaderInfo('Contact: john@example.com | 555-123-4567')
    expect(info.email).toBe('john@example.com')
  })

  it('extracts phone numbers', () => {
    const info = classifyHeaderInfo('Phone: +1-555-123-4567')
    expect(info.phone).toBe('+1-555-123-4567')
  })

  it('extracts LinkedIn URLs', () => {
    const info = classifyHeaderInfo('LinkedIn: linkedin.com/in/johndoe')
    expect(info.linkedin).toContain('linkedin.com/in/johndoe')
  })

  it('extracts GitHub URLs', () => {
    const info = classifyHeaderInfo('GitHub: github.com/johndoe')
    expect(info.github).toContain('github.com/johndoe')
  })

  it('extracts location info', () => {
    const info = classifyHeaderInfo('San Francisco, CA')
    expect(info.location).toBe('San Francisco, CA')
  })

  it('returns empty strings for missing fields', () => {
    const info = classifyHeaderInfo('Just a name')
    expect(info.email).toBeUndefined()
    expect(info.phone).toBeUndefined()
  })
})
