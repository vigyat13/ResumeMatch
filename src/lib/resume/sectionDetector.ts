import { SectionType, type ParsedSection } from './types'

interface SectionPattern {
  type: SectionType
  patterns: RegExp[]
  priority: number
}

function wb(pattern: string): RegExp {
  return new RegExp(`\\b${pattern}\\b`, 'i')
}

const SECTION_PATTERNS: SectionPattern[] = [
  {
    type: SectionType.Summary,
    patterns: [
      wb('summary'),
      wb('professional summary'),
      /^profile$/i,
      wb('about me'),
      wb('objective'),
      wb('career objective'),
      wb('professional profile'),
    ],
    priority: 10,
  },
  {
    type: SectionType.Experience,
    patterns: [
      /^experience$/i,
      wb('work experience'),
      wb('professional experience'),
      wb('employment history'),
      wb('work history'),
      wb('relevant experience'),
      wb('professional background'),
    ],
    priority: 20,
  },
  {
    type: SectionType.Education,
    patterns: [
      /^education$/i,
      wb('academic background'),
      wb('educational qualifications'),
      /^qualifications$/i,
      wb('academic history'),
    ],
    priority: 20,
  },
  {
    type: SectionType.Skills,
    patterns: [
      /^skills$/i,
      wb('technical skills'),
      wb('core competencies'),
      /^technologies$/i,
      /^expertise$/i,
      wb('technical expertise'),
      wb('key skills'),
      /^competencies$/i,
      wb('tech stack'),
      /^proficiencies$/i,
    ],
    priority: 20,
  },
  {
    type: SectionType.Projects,
    patterns: [
      /^projects$/i,
      wb('personal projects'),
      wb('academic projects'),
      wb('key projects'),
      wb('project experience'),
    ],
    priority: 20,
  },
  {
    type: SectionType.Certifications,
    patterns: [
      /^certifications$/i,
      /^certificates$/i,
      wb('professional certifications'),
      /^licenses$/i,
      wb('licenses and certifications'),
      /^accreditations$/i,
    ],
    priority: 15,
  },
  {
    type: SectionType.Publications,
    patterns: [
      /^publications$/i,
      wb('research publications'),
      /^papers$/i,
      /^research$/i,
      wb('published works'),
    ],
    priority: 15,
  },
  {
    type: SectionType.Honors,
    patterns: [
      /^honors\b/i,
      /^awards\b/i,
      /^honours\b/i,
      /^achievements\b/i,
      /honors\s*&?\s*awards/i,
      /awards\s*&?\s*recognition/i,
      /^recognition\b/i,
    ],
    priority: 15,
  },
  {
    type: SectionType.Languages,
    patterns: [
      /^languages$/i,
      wb('language proficiency'),
      wb('language skills'),
    ],
    priority: 10,
  },
  {
    type: SectionType.Volunteer,
    patterns: [
      /^volunteer$/i,
      wb('volunteer experience'),
      /^volunteering$/i,
      wb('community service'),
      wb('social work'),
    ],
    priority: 10,
  },
  {
    type: SectionType.References,
    patterns: [
      /^references$/i,
      wb('professional references'),
    ],
    priority: 5,
  },
]

function detectSectionType(line: string): { type: SectionType; confidence: number } | null {
  for (const section of SECTION_PATTERNS) {
    for (const pattern of section.patterns) {
      if (pattern.test(line.trim())) {
        return { type: section.type, confidence: Math.min(100, 50 + section.priority * 2.5) }
      }
    }
  }
  return null
}

export function detectSections(text: string): ParsedSection[] {
  const lines = text.split('\n')
  const sections: ParsedSection[] = []
  let currentSection: SectionType = SectionType.Header
  let currentText: string[] = []
  let currentConfidence = 60

  function flushSection() {
    const content = currentText.join('\n').trim()
    if (content) {
      sections.push({
        type: currentSection,
        rawText: content,
        confidence: currentConfidence,
      })
    }
    currentText = []
  }

  for (const line of lines) {
    const detected = detectSectionType(line)
    if (detected && line.trim().length < 100) {
      flushSection()
      currentSection = detected.type
      currentConfidence = detected.confidence
    } else {
      currentText.push(line)
    }
  }

  flushSection()

  if (sections.length === 1 && sections[0].type === SectionType.Header) {
    sections[0].type = SectionType.Unknown
    sections[0].confidence = 0
  }

  if (sections.length === 0) {
    sections.push({
      type: SectionType.Unknown,
      rawText: text,
      confidence: 0,
    })
  }

  return sections
}

export function classifyHeaderInfo(text: string): Record<string, string> {
  const result: Record<string, string> = {}

  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.+-]+/)
  if (emailMatch) result.email = emailMatch[0]

  const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  if (phoneMatch) result.phone = phoneMatch[0]

  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,]+/i)
  if (linkedinMatch) result.linkedin = linkedinMatch[0]

  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s,]+/i)
  if (githubMatch) result.github = githubMatch[0]

  const locationMatch = text.match(/([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*),\s*([A-Z]{2})/)
  if (locationMatch) result.location = locationMatch[0]

  return result
}
