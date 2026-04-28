import type { ResumeData } from './types'

// ─── Unescape LaTeX special characters ───────────────────────────────────────
function unesc(s: string): string {
  return s
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\textasciitilde\{\}/g, '~')
    .replace(/\\textasciicircum\{\}/g, '^')
    .replace(/\$\\rightarrow\$/g, '→')
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/\\textbullet\{\}/g, '•')
    .replace(/\\emph\{([^}]+)\}/g, '$1')
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\textit\{([^}]+)\}/g, '$1')
    .replace(/\\scshape\s*/g, '')
    .replace(/\\Large\s*/g, '')
    .replace(/\\LARGE\s*/g, '')
    .replace(/\\Huge\s*/g, '')
    .replace(/\\small\s*/g, '')
    .replace(/\\normalsize\s*/g, '')
    .replace(/\\vspace\{[^}]+\}/g, '')
    .replace(/\\hspace\{[^}]+\}/g, '')
    .replace(/\\quad/g, ' ')
    .replace(/\$\s*\|\s*\$/g, '|')
    .replace(/\\\\/g, '')
    .trim()
}

// ─── Extract the body text of a named \section{Name} block ───────────────────
function sectionText(latex: string, name: string): string {
  // Handles both \section*{Name} and \section{Name}
  const re = new RegExp(
    `\\\\section\\*?\\{${name}\\}([\\s\\S]*?)(?=\\\\section\\*?\\{|\\\\end\\{document\\})`,
  )
  return latex.match(re)?.[1]?.trim() ?? ''
}

// ─── Split a "Role | Company | Period" header line ────────────────────────────
function parsePipeLine(line: string): string[] {
  return line
    .replace(/\\par\s*$/g, '')
    .split(/\s+\|\s+/)
    .map(part => unesc(part.trim()))
    .filter(Boolean)
}

// ─── Extract intro+bullets blocks from a section (original format) ────────────
function extractItemBlocks(section: string): { intro: string; items: string[] }[] {
  const blocks: { intro: string; items: string[] }[] = []
  const re = /([^\n][^]*?)\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g
  for (const match of section.matchAll(re)) {
    const intro = match[1].trim()
    const items = [...match[2].matchAll(/\\item\s+([\s\S]*?)(?=\n\s*\\item|$)/g)]
      .map(item => unesc(item[1].replace(/\\par\s*$/g, '').trim()))
      .filter(Boolean)
    blocks.push({ intro, items })
  }
  return blocks
}

function parseHrefDisplay(value: string): string {
  const hrefMatch = value.match(/\\href\{[^}]+\}\{([^}]+)\}/)
  return unesc(hrefMatch?.[1] ?? value)
}

// ─── Jake's Resume format parser ─────────────────────────────────────────────
// Handles the most common Overleaf template structure:
//   \resumeSubheading{Company}{Date}{Role}{City}
//   \resumeItemListStart  \resumeItem{...}  \resumeItemListEnd
//   \resumeProjectHeading{\textbf{Name} $|$ \emph{Tech}}{Date}

function parseJakesFormat(latex: string): Partial<ResumeData> | null {
  // Detect Jake's Resume by presence of \resumeSubheading or \resumeItem
  if (!/\\resumeSubheading|\\resumeItem/.test(latex)) return null

  const result: Partial<ResumeData> = {}

  // ── Name ──
  const nameMatch =
    latex.match(/\\textbf\{\\Huge\s+\\scshape\s+([^}]+)\}/) ||
    latex.match(/\\textbf\{\\Huge\s+([^}]+)\}/) ||
    latex.match(/\{\\Huge\s+\\scshape\s+([^}]+)\}/) ||
    latex.match(/\{\\Huge\s+([^}]+)\}/)
  if (nameMatch) result.name = unesc(nameMatch[1])

  // ── Contact line (email, phone, linkedin, github, portfolio) ──
  const contactSection = latex.split('\\section')[0]
  const emailMatch = contactSection.match(/href\{mailto:([^}]+)\}/)
  if (emailMatch) result.email = emailMatch[1].trim()

  const phoneMatch = contactSection.match(/(\+?[\d\s\-().]{7,20})(?=\s*\$?\||\s*\\quad|\s*\n)/)
  if (phoneMatch) result.phone = phoneMatch[1].trim()

  const linkedinMatch = contactSection.match(/href\{https?:\/\/(?:www\.)?linkedin[^}]+\}\{([^}]+)\}/)
  if (linkedinMatch) result.linkedin = unesc(linkedinMatch[1])

  const githubMatch = contactSection.match(/href\{https?:\/\/(?:www\.)?github[^}]+\}\{([^}]+)\}/)
  if (githubMatch) result.github = unesc(githubMatch[1])

  // ── Experience ──
  const expSection = sectionText(latex, 'Experience')
  if (expSection) {
    // Each \resumeSubheading{Company}{Date}{Role}{Location}
    const subheadings = [
      ...expSection.matchAll(
        /\\resumeSubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g,
      ),
    ]
    const bulletBlocks = [
      ...expSection.matchAll(
        /\\resumeItemListStart([\s\S]*?)\\resumeItemListEnd/g,
      ),
    ]
    result.experience = subheadings.map((m, i) => ({
      company: unesc(m[1]),
      period:  unesc(m[2]),
      role:    unesc(m[3]),
      bullets: bulletBlocks[i]
        ? [...bulletBlocks[i][1].matchAll(/\\resumeItem\{([\s\S]*?)\}(?=\s*\\resumeItem|\s*\\resumeItemListEnd)/g)]
            .map(b => unesc(b[1].trim()))
            .filter(Boolean)
        : [],
    })).filter(e => e.company || e.role)
  }

  // ── Projects ──
  const projSection = sectionText(latex, 'Projects')
  if (projSection) {
    // \resumeProjectHeading{\textbf{Name} $|$ \emph{Tech}}{Date}
    const headings = [
      ...projSection.matchAll(/\\resumeProjectHeading\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\{([^}]*)\}/g),
    ]
    const bulletBlocks = [
      ...projSection.matchAll(/\\resumeItemListStart([\s\S]*?)\\resumeItemListEnd/g),
    ]
    result.projects = headings.map((m, i) => {
      const rawHeading = unesc(m[1])
      // Split on | to get name and tech
      const parts = rawHeading.split(/\s*\|\s*/)
      return {
        name:        parts[0]?.trim() ?? '',
        tech:        parts[1]?.trim() ?? '',
        link:        '',
        description: '',
        bullets: bulletBlocks[i]
          ? [...bulletBlocks[i][1].matchAll(/\\resumeItem\{([\s\S]*?)\}(?=\s*\\resumeItem|\s*\\resumeItemListEnd)/g)]
              .map(b => unesc(b[1].trim()))
              .filter(Boolean)
          : [],
      }
    }).filter(p => p.name)
  }

  // ── Education ──
  const eduSection = sectionText(latex, 'Education')
  if (eduSection) {
    const eduEntries = [
      ...eduSection.matchAll(/\\resumeSubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g),
    ]
    result.education = eduEntries.map(m => ({
      school: unesc(m[1]),
      degree: unesc(m[3]),
      year:   unesc(m[2]),
    })).filter(e => e.school)
  }

  // ── Skills ──
  const skillsSection = sectionText(latex, 'Technical Skills') ||
                        sectionText(latex, 'Skills')
  if (skillsSection) {
    // Often: \textbf{Languages}: Python, Java, ... \\ \textbf{Frameworks}: ...
    const skillNames: string[] = []
    for (const line of skillsSection.split(/\\\\|\n/).map(l => l.trim()).filter(Boolean)) {
      const afterColon = line.replace(/^\\textbf\{[^}]+\}:\s*/, '')
      skillNames.push(
        ...afterColon.split(/,/).map(s => unesc(s.trim())).filter(s => s && s.length < 40),
      )
    }
    if (skillNames.length) {
      result.skills = skillNames.slice(0, 16).map(name => ({ name, level: 80 }))
    }
  }

  return result
}

// ─── Original ResumeMatch format parser ──────────────────────────────────────
function parseResumeMatchFormat(latex: string): Partial<ResumeData> {
  const result: Partial<ResumeData> = {}

  const imageMatch = latex.match(/\\includegraphics\[width=0\.13\\textwidth\]\{([^}]+)\}/)
  if (imageMatch) result.profileImage = unesc(imageMatch[1])

  const nameMatch = latex.match(/\{\\LARGE\s+\\textbf\{([^}]+)\}\}\\par/)
  if (nameMatch) result.name = unesc(nameMatch[1])

  const titleMatch = latex.match(/\{\\LARGE[\s\S]*?\\par\n\\textbf\{([^}]+)\}\\par/)
  if (titleMatch) result.title = unesc(titleMatch[1])

  const headerLines = latex
    .split('\\section*{Summary}')[0]
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const contactLine = headerLines.reverse().find(
    line => line.includes('\\href{mailto:') || line.includes('\\quad') || line.includes('@'),
  )
  if (contactLine) {
    const parts = contactLine
      .replace(/\\par\s*$/g, '')
      .split(/\\quad/)
      .map(part => part.trim())
      .filter(Boolean)
    for (const part of parts) {
      if (part.includes('mailto:')) {
        const email = part.match(/mailto:([^}]+)/)?.[1]
        if (email) result.email = unesc(email)
        continue
      }
      if (part.includes('linkedin')) { result.linkedin = parseHrefDisplay(part); continue }
      if (part.includes('github'))   { result.github   = parseHrefDisplay(part); continue }
      if (part.includes('href'))     { result.portfolio = parseHrefDisplay(part); continue }
      if (/\d/.test(part))           { result.phone    = unesc(part); continue }
      result.location = unesc(part)
    }
  }

  const summary = sectionText(latex, 'Summary').replace(/\\par\s*$/g, '').trim()
  if (summary) result.summary = unesc(summary)

  const experienceSection = sectionText(latex, 'Experience')
  if (experienceSection) {
    result.experience = extractItemBlocks(experienceSection).map(({ intro, items }) => {
      const [role = '', company = '', period = ''] = parsePipeLine(intro)
      return { role, company, period, bullets: items }
    }).filter(e => e.role || e.company || e.period || e.bullets.length)
  }

  const projectsSection = sectionText(latex, 'Projects')
  if (projectsSection) {
    result.projects = extractItemBlocks(projectsSection).map(({ intro, items }) => {
      const lines      = intro.split('\n').map(l => l.trim()).filter(Boolean)
      const headParts  = parsePipeLine(lines[0] ?? '')
      const [name = '', tech = '', link = ''] = headParts.map(p =>
        p.includes('href') ? parseHrefDisplay(p) : p,
      )
      return {
        name,
        tech,
        link,
        description: unesc(lines[1]?.replace(/\\par\s*$/g, '') ?? ''),
        bullets: items,
      }
    }).filter(e => e.name || e.tech || e.link || e.description || e.bullets.length)
  }

  const educationSection = sectionText(latex, 'Education')
  if (educationSection) {
    result.education = educationSection
      .split('\\par')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [school = '', degree = '', year = ''] = parsePipeLine(line)
        return { school, degree, year }
      })
      .filter(e => e.school || e.degree || e.year)
  }

  const skillsSection = sectionText(latex, 'Skills').replace(/\\par\s*$/g, '').trim()
  if (skillsSection) {
    result.skills = unesc(skillsSection)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => ({ name, level: 80 }))
  }

  const publicationsSection = sectionText(latex, 'Publications')
  if (publicationsSection) {
    const items = [
      ...publicationsSection.matchAll(/\\item\s+([\s\S]*?)(?=\n\s*\\item|$|\\end\{itemize\})/g),
    ].map(m => unesc(m[1].trim())).filter(Boolean)
    if (items.length) result.publications = items
  }

  const honorsSection = sectionText(latex, 'Honors')
  if (honorsSection) {
    const items = [
      ...honorsSection.matchAll(/\\item\s+([\s\S]*?)(?=\n\s*\\item|$|\\end\{itemize\})/g),
    ].map(m => unesc(m[1].trim())).filter(Boolean)
    if (items.length) result.honors = items
  }

  return result
}

// ─── Public entry point ───────────────────────────────────────────────────────
// Tries Jake's Resume format first (most common on Overleaf), then falls back
// to ResumeMatch's own generated format.  Any partial data from either pass is
// returned so the caller can merge it into the current form state.
export function parseLatex(latex: string): Partial<ResumeData> {
  const jakes = parseJakesFormat(latex)
  if (jakes && Object.keys(jakes).length > 2) return jakes
  return parseResumeMatchFormat(latex)
}
