import type { ResumeData } from './types'

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
    .replace(/\$\\star\$/g, '★')
    .replace(/\\textbullet\{\}/g, '•')
    .trim()
}

// Extract the content of the first balanced {…} starting at index `from`
function extractBraced(str: string, from: number): { content: string; end: number } {
  let depth = 0, result = '', i = from
  while (i < str.length) {
    const ch = str[i]
    if (ch === '\\') { i += 2; continue } // skip escaped char
    if (ch === '{') { if (depth++ > 0) result += ch }
    else if (ch === '}') { if (--depth === 0) { i++; break }; result += ch }
    else if (depth > 0) result += ch
    i++
  }
  return { content: result, end: i }
}

// Return text of a section (from \section{Name} to the next \section{ or \end{document})
function sectionText(latex: string, name: string): string {
  const re = new RegExp(`\\\\section\\{${name}\\}([\\s\\S]*?)(?=\\\\section\\{|\\\\end\\{document\\})`)
  return latex.match(re)?.[1] ?? ''
}

// Extract all \resumeItem{…} from a block
function extractItems(block: string): string[] {
  const items: string[] = []
  let idx = 0
  while (true) {
    const pos = block.indexOf('\\resumeItem{', idx)
    if (pos === -1) break
    const { content, end } = extractBraced(block, pos + '\\resumeItem'.length)
    items.push(unesc(content))
    idx = end
  }
  return items
}

export function parseLatex(latex: string): Partial<ResumeData> {
  const result: Partial<ResumeData> = {}

  // ── Name ───────────────────────────────────────────────────────────
  const nameM = latex.match(/\\Huge\s+\\scshape\s+(.*?)\s*\}\s*\\\\/)
  if (nameM) result.name = unesc(nameM[1].trim())

  // ── Contact line ────────────────────────────────────────────────────
  const contactM = latex.match(/\\small\s+([\s\S]*?)\\end\{center\}/)
  if (contactM) {
    const parts = contactM[1].split(/\$\|\$/).map(p => p.trim()).filter(Boolean)
    for (const part of parts) {
      if (part.includes('mailto:')) {
        const m = part.match(/mailto:([^}]+)/)
        if (m) result.email = m[1].trim()
      } else if (part.includes('\\href')) {
        const urlM = part.match(/\\href\{https?:\/\/([^}]+)\}/)
        if (urlM) {
          const url = urlM[1]
          if (url.includes('linkedin')) result.linkedin = url
          else if (url.includes('github')) result.github = url
          else result.portfolio = url
        }
      } else if (/[\d(+\-\s)]{7,}/.test(part.replace(/\\[a-zA-Z]+/g, ''))) {
        result.phone = unesc(part)
      } else {
        result.location = unesc(part)
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────
  const sumText = sectionText(latex, 'Summary')
  if (sumText.trim()) result.summary = unesc(sumText.trim())

  // ── Experience ──────────────────────────────────────────────────────
  const expText = sectionText(latex, 'Experience')
  if (expText) {
    const experience: ResumeData['experience'] = []
    let idx = 0
    while (true) {
      const subPos = expText.indexOf('\\resumeSubheading', idx)
      if (subPos === -1) break
      let cur = subPos + '\\resumeSubheading'.length
      const { content: role,    end: e1 } = extractBraced(expText, cur); cur = e1
      const { content: period,  end: e2 } = extractBraced(expText, cur); cur = e2
      const { content: company, end: e3 } = extractBraced(expText, cur); cur = e3

      // find next \resumeSubheading or end of section for bullets
      const nextSub = expText.indexOf('\\resumeSubheading', cur)
      const block   = nextSub === -1 ? expText.slice(cur) : expText.slice(cur, nextSub)
      experience.push({ company: unesc(company), role: unesc(role), period: unesc(period), bullets: extractItems(block) })
      idx = nextSub === -1 ? expText.length : nextSub
    }
    if (experience.length) result.experience = experience
  }

  // ── Education ───────────────────────────────────────────────────────
  const eduText = sectionText(latex, 'Education')
  if (eduText) {
    const education: ResumeData['education'] = []
    let idx = 0
    while (true) {
      const subPos = eduText.indexOf('\\resumeSubheading', idx)
      if (subPos === -1) break
      let cur = subPos + '\\resumeSubheading'.length
      const { content: school, end: e1 } = extractBraced(eduText, cur); cur = e1
      const { content: year,   end: e2 } = extractBraced(eduText, cur); cur = e2
      const { content: degree, end: e3 } = extractBraced(eduText, cur)
      education.push({ school: unesc(school), degree: unesc(degree), year: unesc(year) })
      idx = e3
    }
    if (education.length) result.education = education
  }

  // ── Skills ──────────────────────────────────────────────────────────
  const skillsText = sectionText(latex, 'Technical Skills')
  const skillsM = skillsText.match(/\\small\{\\item\{([^}]*)\}\}/)
  if (skillsM) {
    result.skills = skillsM[1]
      .split(',')
      .map(s => unesc(s.trim()))
      .filter(Boolean)
      .map(name => ({ name, level: 80 }))
  }

  // ── Projects ────────────────────────────────────────────────────────
  const projText = sectionText(latex, 'Projects')
  if (projText) {
    const projects: ResumeData['projects'] = []
    let idx = 0
    while (true) {
      const pos = projText.indexOf('\\resumeProjectHeading', idx)
      if (pos === -1) break
      let cur = pos + '\\resumeProjectHeading'.length
      const { content: nameAndTech, end: e1 } = extractBraced(projText, cur); cur = e1
      const { content: linkRaw,     end: e2 } = extractBraced(projText, cur)

      // nameAndTech = \textbf{name} $|$ \emph{tech}
      const nameM2 = nameAndTech.match(/\\textbf\{([^}]+)\}/)
      const techM  = nameAndTech.match(/\\emph\{([^}]+)\}/)
      const linkM  = linkRaw.match(/\\href\{https?:\/\/([^}]+)\}/)

      const nextPos = projText.indexOf('\\resumeProjectHeading', e2)
      const block   = nextPos === -1 ? projText.slice(e2) : projText.slice(e2, nextPos)
      projects.push({
        name:        unesc(nameM2?.[1] ?? ''),
        tech:        unesc(techM?.[1] ?? ''),
        link:        linkM?.[1] ?? '',
        description: '',
        bullets:     extractItems(block),
      })
      idx = nextPos === -1 ? projText.length : nextPos
    }
    if (projects.length) result.projects = projects
  }

  return result
}
