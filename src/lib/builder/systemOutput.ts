import type { ResumeData } from './types'

export interface StructuredResumeJson {
  name: string
  title: string
  image: string
  contact: {
    email: string
    phone: string
    location: string
    linkedin: string
    github: string
    portfolio: string
  }
  summary: string
  experience: Array<{
    company: string
    role: string
    duration: string
    bullets: string[]
  }>
  projects: Array<{
    name: string
    tech: string
    link: string
    description: string
    bullets: string[]
  }>
  education: Array<{
    school: string
    degree: string
    year: string
  }>
  skills: string[]
  publications: string[]
  honors: string[]
}

export interface ResumeSystemOutput {
  json: StructuredResumeJson
  html: string
  latex: string
}

function clean(value: string | undefined | null): string {
  return (value ?? '').trim()
}

function cleanLines(values: string[] | undefined | null): string[] {
  return (values ?? []).map(clean).filter(Boolean)
}

function normalizeUrl(raw: string): string {
  const value = clean(raw)
  if (!value) return ''
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value
  return `https://${value}`
}

function displayUrl(raw: string): string {
  return clean(raw).replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escLatex(value: string): string {
  return value
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/–/g, '--')
    .replace(/—/g, '---')
    .replace(/•/g, '\\textbullet{}')
    .replace(/→/g, '$\\rightarrow$')
}

function latexHref(raw: string): string {
  const href = normalizeUrl(raw)
  if (!href) return ''
  return `\\href{${escLatex(href)}}{${escLatex(displayUrl(raw))}}`
}

function latexMail(email: string): string {
  const value = clean(email)
  return value ? `\\href{mailto:${escLatex(value)}}{${escLatex(value)}}` : ''
}

function contactParts(json: StructuredResumeJson): string[] {
  return [
    json.contact.email,
    json.contact.phone,
    json.contact.location,
    json.contact.linkedin,
    json.contact.github,
    json.contact.portfolio,
  ].filter(Boolean)
}

function latexContactParts(json: StructuredResumeJson): string[] {
  return [
    latexMail(json.contact.email),
    json.contact.phone ? escLatex(json.contact.phone) : '',
    json.contact.location ? escLatex(json.contact.location) : '',
    latexHref(json.contact.linkedin),
    latexHref(json.contact.github),
    latexHref(json.contact.portfolio),
  ].filter(Boolean)
}

function htmlList(items: string[]): string {
  if (!items.length) return ''
  return `<ul>${items.map(item => `<li>${escHtml(item)}</li>`).join('')}</ul>`
}

function latexList(items: string[]): string {
  if (!items.length) return ''
  return [
    '\\begin{itemize}',
    ...items.map(item => `  \\item ${escLatex(item)}`),
    '\\end{itemize}',
  ].join('\n')
}

export function toStructuredResumeJson(data: ResumeData): StructuredResumeJson {
  return {
    name: clean(data.name),
    title: clean(data.title),
    image: clean(data.profileImage),
    contact: {
      email: clean(data.email),
      phone: clean(data.phone),
      location: clean(data.location),
      linkedin: clean(data.linkedin),
      github: clean(data.github),
      portfolio: clean(data.portfolio),
    },
    summary: clean(data.summary),
    experience: (data.experience ?? []).map((entry) => ({
      company: clean(entry.company),
      role: clean(entry.role),
      duration: clean(entry.period),
      bullets: cleanLines(entry.bullets),
    })).filter((entry) => entry.company || entry.role || entry.duration || entry.bullets.length),
    projects: (data.projects ?? []).map((entry) => ({
      name: clean(entry.name),
      tech: clean(entry.tech),
      link: clean(entry.link),
      description: clean(entry.description),
      bullets: cleanLines(entry.bullets),
    })).filter((entry) => entry.name || entry.tech || entry.link || entry.description || entry.bullets.length),
    education: (data.education ?? []).map((entry) => ({
      school: clean(entry.school),
      degree: clean(entry.degree),
      year: clean(entry.year),
    })).filter((entry) => entry.school || entry.degree || entry.year),
    skills: (data.skills ?? []).map((entry) => clean(entry.name)).filter(Boolean),
    publications: cleanLines(data.publications),
    honors: cleanLines(data.honors),
  }
}

export function renderResumeHtmlFromJson(json: StructuredResumeJson): string {
  const contacts = contactParts(json)

  return [
    json.image ? `<img src="${escHtml(json.image)}" alt="${escHtml(json.name || 'Profile photo')}" />` : '',
    `<h1>${escHtml(json.name)}</h1>`,
    json.title ? `<p>${escHtml(json.title)}</p>` : '',
    contacts.length ? `<p>${contacts.map(escHtml).join(' | ')}</p>` : '',
    json.summary ? `<h2>Summary</h2><p>${escHtml(json.summary)}</p>` : '',
    json.experience.length ? '<h2>Experience</h2>' : '',
    ...json.experience.flatMap((entry) => [
      `<p>${[entry.role, entry.company, entry.duration].filter(Boolean).map(escHtml).join(' | ')}</p>`,
      htmlList(entry.bullets),
    ]),
    json.projects.length ? '<h2>Projects</h2>' : '',
    ...json.projects.flatMap((entry) => [
      `<p>${[entry.name, entry.tech, entry.link].filter(Boolean).map(escHtml).join(' | ')}</p>`,
      entry.description ? `<p>${escHtml(entry.description)}</p>` : '',
      htmlList(entry.bullets),
    ]),
    json.education.length ? '<h2>Education</h2>' : '',
    ...json.education.map((entry) => `<p>${[entry.school, entry.degree, entry.year].filter(Boolean).map(escHtml).join(' | ')}</p>`),
    json.skills.length ? '<h2>Skills</h2>' : '',
    json.skills.length ? `<p>${json.skills.map(escHtml).join(', ')}</p>` : '',
    json.publications.length ? '<h2>Publications</h2>' : '',
    json.publications.length ? htmlList(json.publications) : '',
    json.honors.length ? '<h2>Honors</h2>' : '',
    json.honors.length ? htmlList(json.honors) : '',
  ].filter(Boolean).join('')
}

export function generateLatexFromJson(json: StructuredResumeJson): string {
  const contact = latexContactParts(json).join(' \\quad ')

  return [
    '\\documentclass[11pt]{article}',
    '\\usepackage[margin=0.75in]{geometry}',
    '\\usepackage{graphicx}',
    '\\usepackage[hidelinks]{hyperref}',
    '\\usepackage{enumitem}',
    '\\setlength{\\parindent}{0pt}',
    '\\setlength{\\parskip}{0.35em}',
    '\\begin{document}',
    json.image ? '\\begin{center}' : '',
    json.image ? `\\includegraphics[width=0.13\\textwidth]{${escLatex(json.image)}}\\par` : '',
    json.image ? '\\end{center}' : '',
    `{\\LARGE \\textbf{${escLatex(json.name)}}}\\par`,
    json.title ? `\\textbf{${escLatex(json.title)}}\\par` : '',
    contact ? `${contact}\\par` : '',
    json.summary ? `\\section*{Summary}\n${escLatex(json.summary)}` : '',
    json.experience.length ? '\\section*{Experience}' : '',
    ...json.experience.flatMap((entry) => [
      `\\textbf{${escLatex(entry.role)}}${entry.company ? ` | ${escLatex(entry.company)}` : ''}${entry.duration ? ` | ${escLatex(entry.duration)}` : ''}\\par`,
      latexList(entry.bullets),
    ]),
    json.projects.length ? '\\section*{Projects}' : '',
    ...json.projects.flatMap((entry) => {
      const heading = [
        `\\textbf{${escLatex(entry.name)}}`,
        entry.tech ? escLatex(entry.tech) : '',
        entry.link ? latexHref(entry.link) : '',
      ].filter(Boolean).join(' | ')

      return [
        `${heading}\\par`,
        entry.description ? `${escLatex(entry.description)}\\par` : '',
        latexList(entry.bullets),
      ]
    }),
    json.education.length ? '\\section*{Education}' : '',
    ...json.education.map((entry) => `\\textbf{${escLatex(entry.school)}}${entry.degree ? ` | ${escLatex(entry.degree)}` : ''}${entry.year ? ` | ${escLatex(entry.year)}` : ''}\\par`),
    json.skills.length ? '\\section*{Skills}' : '',
    json.skills.length ? escLatex(json.skills.join(', ')) + '\\par' : '',
    json.publications.length ? '\\section*{Publications}' : '',
    json.publications.length ? latexList(json.publications) : '',
    json.honors.length ? '\\section*{Honors}' : '',
    json.honors.length ? latexList(json.honors) : '',
    '\\end{document}',
    '',
  ].filter(Boolean).join('\n')
}

export function buildResumeSystemOutput(data: ResumeData): ResumeSystemOutput {
  const json = toStructuredResumeJson(data)
  return {
    json,
    html: renderResumeHtmlFromJson(json),
    latex: generateLatexFromJson(json),
  }
}
