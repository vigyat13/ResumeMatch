import { groq, GROQ_MODELS } from '@/lib/ai/groq'
import { extractSkills } from '@/lib/resume/skills'
import { DEFAULT_RESUME_DATA, type ResumeData } from '@/lib/builder/types'
import { ResumeDataSchema } from '@/lib/builder/schema'

type SectionKey =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'honors'
  | 'publications'

const SECTION_ALIASES: Record<SectionKey, string[]> = {
  summary: [
    'summary',
    'profile',
    'profile summary',
    'professional summary',
    'career profile',
    'objective',
    'career objective',
    'about',
  ],
  experience: [
    'experience',
    'work experience',
    'professional experience',
    'relevant experience',
    'employment history',
    'career history',
    'internship experience',
    'internships',
  ],
  projects: [
    'projects',
    'selected projects',
    'personal projects',
    'academic projects',
    'technical projects',
    'portfolio projects',
  ],
  education: [
    'education',
    'academic background',
    'academic qualifications',
    'qualifications',
  ],
  skills: [
    'skills',
    'technical skills',
    'core skills',
    'key skills',
    'competencies',
    'tools',
    'tools and technologies',
    'technologies',
    'technical skills & interests',
  ],
  certifications: [
    'certifications',
    'certification',
    'certificates',
    'certifications and training',
    'certifications training',
    'training',
    'courses',
    'licenses',
    'professional certifications',
  ],
  honors: [
    'honors',
    'honours',
    'achievements',
    'awards',
    'awards and honors',
    'honors and leadership',
    'honors leadership and extracurricular',
    'honors leadership extracurricular',
    'leadership and extracurricular',
    'leadership extracurricular',
    'leadership',
    'activities',
    'accomplishments',
    'recognition',
    'extracurricular',
  ],
  publications: ['publications', 'research', 'papers', 'selected publications'],
}

const DATE_PATTERN = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\.?\s*\d{4}\s*(?:[-–—to]+\s*(?:present|current|now|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\.?\s*\d{4}))?|(?:19|20)\d{2}\s*(?:[-–—to]+\s*(?:present|current|now|(?:19|20)\d{2}))?/i
const MONTH_DATE_PATTERN = /(?:(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\.?\s+(?:19|20)\d{2})(?:\s*[-–—]\s*(?:(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\.?\s+(?:19|20)\d{2}|present|current|now|ongoing))?/ig
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/
const URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?/i
const BULLET_PATTERN = /^[•*·\-–—]\s+/
const PAGE_MARKER_PATTERN = /^\s*(?:[-–—]{1,3}\s*)?(?:page\s+)?\d+\s+of\s+\d+(?:\s*[-–—]{1,3})?\s*$/i

export type StructuredParseResult = {
  data: ResumeData
  text: string
  skills: string[]
  parser: 'ai' | 'rules'
  confidence: number
  warnings: string[]
}

export async function parseResumeToBuilderData(text: string, skills: string[]): Promise<StructuredParseResult> {
  const fallback = parseWithRules(text, skills)

  if (!process.env.GROQ_API_KEY || text.trim().length < 80) {
    return fallback
  }

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.default,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You convert raw resume text into strict JSON for a resume builder.',
            'Return only valid JSON with this shape:',
            '{"name":"","title":"","email":"","phone":"","location":"","github":"","linkedin":"","portfolio":"","summary":"","experience":[{"company":"","role":"","period":"","bullets":[""]}],"projects":[{"name":"","tech":"","link":"","description":"","bullets":[""]}],"education":[{"school":"","degree":"","cgpa":"","year":""}],"skills":[{"name":"","level":80}],"certifications":[],"honors":[],"publications":[]}',
            'Preserve facts from the resume. Do not invent employers, degrees, dates, metrics, links, or skills.',
            'Keep original month-inclusive dates exactly when present, such as "Jun 2021 - Aug 2021".',
            'Only include skills, certifications, links, schools, companies, and projects visible in the source text.',
            'Keep Certifications & Training separate from Honors, Leadership, and Awards.',
            'For categorized skill sections, preserve category labels exactly, such as "Programming: Python, C++" as skill names.',
            'For honors, leadership, extracurricular, and certifications, preserve the complete source line including label, description, provider, and date. Do not summarize or shorten these lines.',
            'Use concise achievement bullets. If a field is unknown, use an empty string or empty array.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: text.slice(0, 12000),
        },
      ],
    })

    const content = completion.choices[0]?.message?.content ?? ''
    const parsed = extractJsonObject(content) as Partial<ResumeData>
    const merged = mergeParsedWithFallback(parsed, fallback.data)
    const data = validateResumeData(restoreFactsFromSource(cleanResumeData(merged), fallback.data, text), fallback.data)
    return {
      data,
      text,
      skills: data.skills.map(skill => skill.name).filter(Boolean),
      parser: 'ai',
      confidence: scoreParsedData(data),
      warnings: buildWarnings(data, fallback.warnings),
    }
  } catch (error) {
    console.error('[Builder Parser] AI structuring failed:', error)
    return {
      ...fallback,
      warnings: [...fallback.warnings, 'AI structuring failed, used deterministic parser instead.'],
    }
  }
}

function parseWithRules(text: string, providedSkills: string[]): StructuredParseResult {
  const lines = toLines(text)
  const sections = splitSections(lines)
  const contact = extractContact(lines)
  const header = inferHeader(lines, contact)
  const parsedSkillLines = parseSkillLines(sections.skills ?? [])
  const skillNames = unique([
    ...parsedSkillLines,
    ...providedSkills,
    ...extractSkills(text),
  ]).slice(0, 18)

  const data = cleanResumeData({
    ...DEFAULT_RESUME_DATA,
    ...header,
    ...contact,
    summary: parseSummary(sections.summary, lines),
    experience: parseExperience(sections.experience ?? []),
    projects: parseProjects(sections.projects ?? []),
    education: parseEducation(sections.education ?? []),
    skills: skillNames.map(name => ({ name, level: 80 })),
    certifications: parseDatedListItems(sections.certifications ?? []).slice(0, 12),
    honors: cleanHonorLines(sections.honors ?? [], sections.publications ?? []).slice(0, 16),
    publications: cleanBullets([...(sections.publications ?? [])]).slice(0, 12),
  })

  const warnings = buildWarnings(data)

  return {
    data,
    text,
    skills: skillNames,
    parser: 'rules',
    confidence: scoreParsedData(data),
    warnings,
  }
}

function toLines(text: string): string[] {
  return text
    .replace(/\f/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line && !PAGE_MARKER_PATTERN.test(line))
}

function splitSections(lines: string[]): Partial<Record<SectionKey, string[]>> {
  const sections: Partial<Record<SectionKey, string[]>> = {}
  let current: SectionKey | null = null

  for (const line of lines) {
    const heading = detectHeading(line)
    if (heading) {
      current = heading
      sections[current] ??= []
      continue
    }
    if (current) sections[current]?.push(line)
  }

  return sections
}

function detectHeading(line: string): SectionKey | null {
  const normalized = normalizeHeading(line)
  if (normalized.length > 64) return null

  for (const [key, aliases] of Object.entries(SECTION_ALIASES) as [SectionKey, string[]][]) {
    const normalizedAliases = aliases.map(normalizeHeading)
    if (normalizedAliases.includes(normalized)) return key
    if (normalizedAliases.some(alias => normalized === `${alias}s`)) return key
  }

  return null
}

function normalizeHeading(line: string): string {
  return line
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractContact(lines: string[]): Partial<ResumeData> {
  const joined = lines.slice(0, 18).join(' | ')
  const email = joined.match(EMAIL_PATTERN)?.[0] ?? ''
  const phone = joined.match(PHONE_PATTERN)?.[0]?.trim() ?? ''
  const urls = lines.flatMap(line => line.match(new RegExp(URL_PATTERN, 'ig')) ?? [])
  const linkedin = urls.find(url => /linkedin\.com/i.test(url)) ?? ''
  const github = urls.find(url => /github\.com/i.test(url)) ?? ''
  const portfolio = urls.find(url => !/linkedin\.com|github\.com/i.test(url)) ?? ''
  const location = inferLocation(lines)

  return { email, phone, linkedin, github, portfolio, location }
}

function inferHeader(lines: string[], contact: Partial<ResumeData>): Partial<ResumeData> {
  const candidates = lines.slice(0, 10).filter(line =>
    !EMAIL_PATTERN.test(line) &&
    !PHONE_PATTERN.test(line) &&
    !URL_PATTERN.test(line) &&
    !detectHeading(line)
  )
  const name = candidates.find(line => {
    const words = line.split(/\s+/)
    return words.length >= 2 && words.length <= 5 && !DATE_PATTERN.test(line) && line.length <= 48
  }) ?? ''
  const nameIndex = name ? lines.indexOf(name) : -1
  const title = lines.slice(nameIndex + 1, nameIndex + 5).find(line =>
    line &&
    line !== contact.location &&
    !EMAIL_PATTERN.test(line) &&
    !PHONE_PATTERN.test(line) &&
    !URL_PATTERN.test(line) &&
    !detectHeading(line) &&
    line.length <= 80
  ) ?? ''

  return { name, title }
}

function inferLocation(lines: string[]): string {
  const top = lines.slice(0, 12)
  const locationLine = top.find(line =>
    /,\s*[A-Z]{2,}|remote|india|united states|usa|canada|uk|singapore|delhi|mumbai|bengaluru|bangalore|pune|hyderabad|chennai/i.test(line) &&
    !EMAIL_PATTERN.test(line) &&
    !URL_PATTERN.test(line)
  )
  if (!locationLine) return ''
  return locationLine
    .split('|')
    .map(part => part.trim())
    .find(part => /remote|india|united states|usa|canada|uk|singapore|delhi|mumbai|bengaluru|bangalore|pune|hyderabad|chennai|,\s*[A-Z]{2,}/i.test(part)) ?? ''
}

function parseSummary(sectionLines: string[] | undefined, allLines: string[]): string {
  const source = sectionLines?.length ? sectionLines : allLines.slice(2, 8)
  return source
    .filter(line => !EMAIL_PATTERN.test(line) && !PHONE_PATTERN.test(line) && !URL_PATTERN.test(line) && !detectHeading(line))
    .join(' ')
    .slice(0, 700)
}

function parseExperience(lines: string[]) {
  const blocks = groupTimelineBlocks(lines)
  return blocks.map(block => {
    const periodLine = block.find(line => DATE_PATTERN.test(line)) ?? ''
    const headingLines = block.filter(line => !isBullet(line)).slice(0, 4)
    const cleanHeadings = headingLines.map(line => line.replace(DATE_PATTERN, '').replace(/\s+[|•-]\s*$/, '').trim()).filter(Boolean)
    const [first = '', second = ''] = cleanHeadings
    const bullets = cleanBullets(block.filter(line => isBullet(line) || !cleanHeadings.includes(line)))

    return {
      company: inferCompany(first, second),
      role: inferRole(first, second),
      period: periodLine.match(DATE_PATTERN)?.[0] ?? '',
      bullets: bullets.slice(0, 5),
    }
  }).filter(entry => entry.company || entry.role || entry.bullets.length)
}

function parseProjects(lines: string[]) {
  const blocks = groupProjectBlocks(lines)
  return blocks.map(block => {
    const heading = block.find(line => !isBullet(line) && !DATE_PATTERN.test(line)) ?? ''
    const link = block.find(line => URL_PATTERN.test(line))?.match(URL_PATTERN)?.[0] ?? ''
    const bullets = cleanBullets(block.filter(line => line !== heading && !URL_PATTERN.test(line) && !isDateOnly(line))).slice(0, 5)
    const tech = inferTech(heading, block.join(' '))
    return {
      name: heading.replace(/\s+[|•-]\s*.*$/, '').trim(),
      tech,
      link,
      description: bullets[0] ?? '',
      bullets: bullets.slice(1),
    }
  }).filter(project => project.name || project.description)
}

function groupProjectBlocks(lines: string[]): string[][] {
  const blocks: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    const startsProject = !isBullet(line) && !DATE_PATTERN.test(line) && current.length > 0 && current.some(item => isBullet(item)) && looksLikeProjectHeading(line)
    if (startsProject) {
      blocks.push(current)
      current = []
    }
    current.push(line)
  }

  if (current.length) blocks.push(current)
  return blocks
}

function looksLikeProjectHeading(line: string): boolean {
  return /\s[|]\s/.test(line) || /^[A-Z][A-Za-z0-9 .'-]+:\s+\S/.test(line)
}

function parseEducation(lines: string[]) {
  const blocks = groupTimelineBlocks(lines, true)
  return blocks.map(block => {
    const periodLine = block.find(line => DATE_PATTERN.test(line)) ?? ''
    const school = block.find(line => !DATE_PATTERN.test(line) && !isBullet(line)) ?? ''
    const degree = block.find(line => line !== school && !isBullet(line))?.replace(DATE_PATTERN, '').trim() ?? ''
    const cgpa = block.join(' ').match(/(?:CGPA|GPA)[:\s]*[0-9.]+(?:\/[0-9.]+)?/i)?.[0] ?? ''
    return {
      school,
      degree,
      cgpa,
      year: periodLine.match(DATE_PATTERN)?.[0] ?? '',
    }
  }).filter(education => education.school || education.degree)
}

function parseSkillLines(lines: string[]): string[] {
  return lines.flatMap(line => {
    const normalizedLine = line.replace(/\s+/g, ' ').trim()
    const categoryMatch = normalizedLine.match(/^([A-Za-z][A-Za-z /&+-]{1,40}):\s*(.+)$/)
    if (categoryMatch) {
      return [`${categoryMatch[1].trim()}: ${categoryMatch[2].trim()}`]
    }

    return normalizedLine
      .split(/[,|•;·]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length >= 2 && skill.length <= 50 && !DATE_PATTERN.test(skill))
  }).filter(skill => skill.length <= 180)
}

function parseDatedListItems(lines: string[]): string[] {
  const cleaned = cleanBullets(lines)
  const dateOnly = cleaned.filter(line => isDateOnly(line))
  const items = cleaned.filter(line => !isDateOnly(line))

  if (!items.length) return []
  if (!dateOnly.length) return items

  return items.map((item, index) => {
    if (DATE_PATTERN.test(item)) return item
    const date = dateOnly[index]
    return date ? `${item} — ${date}` : item
  })
}

function isDateOnly(line: string): boolean {
  const match = line.match(DATE_PATTERN)?.[0] ?? ''
  return Boolean(match) && line.replace(match, '').replace(/[–—-]/g, '').trim().length === 0
}

function groupTimelineBlocks(lines: string[], allowShortBlocks = false): string[][] {
  const blocks: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    const startsBlock = DATE_PATTERN.test(line) || (!isBullet(line) && current.length >= (allowShortBlocks ? 3 : 4))
    if (startsBlock && current.length) {
      blocks.push(current)
      current = []
    }
    current.push(line)
  }

  if (current.length) blocks.push(current)
  return blocks.filter(block => allowShortBlocks || block.some(line => DATE_PATTERN.test(line)) || block.length >= 3)
}

function isBullet(line: string): boolean {
  return BULLET_PATTERN.test(line) || line.length > 85
}

function cleanBullets(lines: string[]): string[] {
  return unique(lines
    .map(line => line.replace(BULLET_PATTERN, '').trim())
    .filter(line =>
      line.length > 6 &&
      !PAGE_MARKER_PATTERN.test(line) &&
      !detectHeading(line) &&
      !EMAIL_PATTERN.test(line) &&
      !PHONE_PATTERN.test(line)
    ))
}

function cleanHonorLines(lines: string[], publicationLines: string[]): string[] {
  const publicationKeys = new Set(cleanBullets(publicationLines).map(normalizeComparableItem))
  return cleanBullets(lines).filter(line => {
    const normalized = normalizeComparableItem(line)
    if (publicationKeys.has(normalized)) return false
    if (publicationKeys.size && [...publicationKeys].some(pub => pub.includes(normalized) || normalized.includes(pub))) return false
    if (/\b(working paper|article on|ieee|medium technical blog|publication|conference|journal)\b/i.test(line)) return false
    return true
  })
}

function inferCompany(first: string, second: string): string {
  if (!first) return ''
  if (/\b(engineer|developer|manager|analyst|consultant|designer|intern|associate|lead|specialist|accountant|executive)\b/i.test(first) && second) {
    return second
  }
  return first
}

function inferRole(first: string, second: string): string {
  if (!first) return ''
  if (/\b(engineer|developer|manager|analyst|consultant|designer|intern|associate|lead|specialist|accountant|executive)\b/i.test(first)) {
    return first
  }
  return second
}

function inferTech(heading: string, blockText: string): string {
  const afterSeparator = heading.split(/\s+[|•]\s+/)[1]
  if (afterSeparator) return afterSeparator.trim()
  return extractSkills(blockText).slice(0, 6).join(', ')
}

function cleanResumeData(input: Partial<ResumeData>): ResumeData {
  const normalizedSkills = normalizeCategorizedSkillEntries(
    unique(asArray(input.skills).map(skill => clean(skill.name)).filter(Boolean))
  )

  return {
    ...DEFAULT_RESUME_DATA,
    name: clean(input.name),
    title: clean(input.title),
    profileImage: input.profileImage ?? '',
    email: clean(input.email),
    phone: clean(input.phone),
    location: clean(input.location),
    github: clean(input.github),
    linkedin: clean(input.linkedin),
    portfolio: clean(input.portfolio),
    summary: clean(input.summary),
    experience: asArray(input.experience).map(entry => ({
      company: clean(entry.company),
      role: clean(entry.role),
      period: clean(entry.period),
      bullets: cleanBullets(asArray(entry.bullets)).slice(0, 6),
    })).filter(entry => entry.company || entry.role || entry.bullets.length),
    projects: asArray(input.projects).map(project => ({
      name: clean(project.name),
      tech: clean(project.tech),
      link: clean(project.link),
      description: clean(project.description),
      bullets: cleanBullets(asArray(project.bullets)).slice(0, 5),
    })).filter(project => project.name || project.description || project.bullets.length),
    education: asArray(input.education).map(education => ({
      school: clean(education.school),
      degree: clean(education.degree),
      cgpa: clean(education.cgpa),
      year: clean(education.year),
    })).filter(education => education.school || education.degree),
    skills: normalizedSkills
      .slice(0, 18)
      .map(name => ({ name, level: 80 })),
    certifications: cleanArray(input.certifications, 12),
    publications: cleanArray(input.publications, 12),
    honors: cleanArray(input.honors, 16),
  }
}

function extractJsonObject(content: string): unknown {
  const trimmed = content.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const fenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    try {
      return JSON.parse(fenced)
    } catch {
      const start = fenced.indexOf('{')
      const end = fenced.lastIndexOf('}')
      if (start >= 0 && end > start) {
        return JSON.parse(fenced.slice(start, end + 1))
      }
      throw new Error('AI response did not contain valid JSON.')
    }
  }
}

function mergeParsedWithFallback(parsed: Partial<ResumeData>, fallback: ResumeData): Partial<ResumeData> {
  return {
    ...fallback,
    ...parsed,
    name: prefer(parsed.name, fallback.name),
    title: prefer(parsed.title, fallback.title),
    email: fallback.email || clean(parsed.email),
    phone: fallback.phone || clean(parsed.phone),
    location: prefer(parsed.location, fallback.location),
    github: fallback.github || clean(parsed.github),
    linkedin: fallback.linkedin || clean(parsed.linkedin),
    portfolio: fallback.portfolio || clean(parsed.portfolio),
    summary: preferLonger(parsed.summary, fallback.summary),
    experience: nonEmptyArray(parsed.experience) ? parsed.experience : fallback.experience,
    projects: nonEmptyArray(parsed.projects) ? parsed.projects : fallback.projects,
    education: nonEmptyArray(parsed.education) ? parsed.education : fallback.education,
    skills: mergeSkillEntries(parsed.skills, fallback.skills),
    certifications: mergeTextItems(parsed.certifications, fallback.certifications),
    honors: mergeTextItems(parsed.honors, fallback.honors),
    publications: mergeTextItems(parsed.publications, fallback.publications),
  }
}

function mergeSkillEntries(parsed: ResumeData['skills'] | undefined, fallback: ResumeData['skills'] | undefined): ResumeData['skills'] {
  const combined = [...(fallback ?? []), ...(parsed ?? [])]
  const seen = new Set<string>()
  const skills: ResumeData['skills'] = []
  for (const skill of combined) {
    const name = clean(skill?.name)
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    skills.push({ name, level: typeof skill.level === 'number' ? skill.level : 80 })
  }
  return normalizeCategorizedSkillEntries(skills.map(skill => skill.name)).map(name => ({ name, level: 80 }))
}

function normalizeCategorizedSkillEntries(values: string[]): string[] {
  const order: string[] = []
  const grouped = new Map<string, string[]>()
  const plain: string[] = []
  const categorizedValues = new Set<string>()

  for (const value of values) {
    const match = value.match(/^([A-Za-z][A-Za-z /&+-]{1,40}):\s*(.+)$/)
    if (!match) {
      plain.push(value)
      continue
    }

    const label = match[1].trim()
    const key = label.toLowerCase()
    const items = match[2].split(/[,;|·]/).map(item => item.trim()).filter(Boolean)
    if (!grouped.has(key)) {
      grouped.set(key, [])
      order.push(label)
    }
    const current = grouped.get(key) ?? []
    for (const item of items) {
      categorizedValues.add(normalizeSkillValue(item))
      if (!current.some(existing => existing.toLowerCase() === item.toLowerCase())) {
        current.push(item)
      }
    }
  }

  return [
    ...order.map(label => `${label}: ${(grouped.get(label.toLowerCase()) ?? []).join(', ')}`),
    ...plain.filter(value => !categorizedValues.has(normalizeSkillValue(value))),
  ]
}

function normalizeSkillValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mergeTextItems(parsed: unknown[] | undefined, fallback: unknown[] | undefined): string[] {
  const combined = [...(fallback ?? []), ...(parsed ?? [])].map(clean).filter(Boolean)
  const result: string[] = []
  for (const item of combined) {
    const key = normalizeComparableItem(item)
    const existingIndex = result.findIndex(existing => normalizeComparableItem(existing) === key || sameLabel(existing, item))
    if (existingIndex >= 0) {
      if (item.length > result[existingIndex].length) result[existingIndex] = item
      continue
    }
    result.push(item)
  }
  return result
}

function normalizeComparableItem(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function sameLabel(left: string, right: string): boolean {
  const leftLabel = left.split(':')[0]?.trim().toLowerCase()
  const rightLabel = right.split(':')[0]?.trim().toLowerCase()
  return Boolean(leftLabel && rightLabel && leftLabel === rightLabel && left.includes(':') && right.includes(':'))
}

function restoreFactsFromSource(data: ResumeData, fallback: ResumeData, text: string): ResumeData {
  return {
    ...data,
    email: fallback.email || data.email,
    phone: fallback.phone || data.phone,
    github: fallback.github || data.github,
    linkedin: fallback.linkedin || data.linkedin,
    portfolio: fallback.portfolio || data.portfolio,
    experience: restoreEntryDates(data.experience, text, 'period'),
    education: restoreEntryDates(data.education, text, 'year'),
  }
}

function restoreEntryDates<T extends object>(entries: T[], text: string, field: keyof T): T[] {
  const dateMap = buildMonthDateMap(text)
  if (!dateMap.size) return entries

  return entries.map(entry => {
    const current = String(entry[field] ?? '').trim()
    if (!current || hasMonth(current)) return entry

    const years = current.match(/(?:19|20)\d{2}/g)
    if (!years?.length) return entry

    const key = years.join(' - ')
    const restored = dateMap.get(key)
    return restored ? { ...entry, [field]: restored } : entry
  })
}

function buildMonthDateMap(text: string): Map<string, string> {
  const map = new Map<string, string>()
  const matches = text.match(MONTH_DATE_PATTERN) ?? []

  for (const match of matches) {
    const years = match.match(/(?:19|20)\d{2}/g)
    if (!years?.length) continue
    const key = years.join(' - ')
    if (!map.has(key)) {
      map.set(key, match.replace(/\s*[-–—]\s*/g, ' - ').replace(/\s+/g, ' ').trim())
    }
  }

  return map
}

function validateResumeData(data: ResumeData, fallback: ResumeData): ResumeData {
  const parsed = ResumeDataSchema.safeParse(data)
  if (parsed.success) return parsed.data

  const repaired = ResumeDataSchema.safeParse(cleanResumeData({ ...fallback, ...data }))
  return repaired.success ? repaired.data : fallback
}

function buildWarnings(data: ResumeData, base: string[] = []): string[] {
  const warnings = [...base]
  if (!data.name) warnings.push('Could not confidently detect the candidate name.')
  if (!data.email && !data.phone) warnings.push('Could not detect email or phone contact details.')
  if (!data.experience.length) warnings.push('Could not detect structured work experience.')
  if (!data.education.length) warnings.push('Could not detect structured education.')
  if (data.skills.length < 4) warnings.push('Detected fewer than four skills.')
  return unique(warnings).slice(0, 6)
}

function prefer(value: unknown, fallback: string): string {
  return clean(value) || fallback
}

function preferLonger(value: unknown, fallback: string): string {
  const cleaned = clean(value)
  return cleaned.length >= Math.min(60, fallback.length) ? cleaned : fallback
}

function nonEmptyArray<T>(value: T[] | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0
}

function asArray<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function hasMonth(value: string): boolean {
  return /\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b/i.test(value)
}

function clean(value: unknown): string {
  if (!Array.isArray(value) && value && typeof value === 'object') {
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
    ].map(clean).filter(Boolean).join(' — ')
  }
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function cleanArray(values: unknown, limit = 10): string[] {
  return Array.isArray(values) ? unique(values.map(clean).filter(Boolean)).slice(0, limit) : []
}

function unique(values: string[]): string[] {
  return [...new Map(values.map(value => [value.toLowerCase(), value])).values()]
}

function scoreParsedData(data: ResumeData): number {
  let score = 0
  if (data.name) score += 12
  if (data.email || data.phone) score += 10
  if (data.title) score += 8
  if (data.summary && data.summary.length > 60) score += 10
  if (data.experience.length) score += 25
  if (data.education.length) score += 15
  if (data.skills.length >= 4) score += 12
  if (data.projects.length) score += 8
  return Math.min(100, score)
}
