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
    cgpa: string
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
  rendercvYaml: string
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

function htmlList(items: string[]): string {
  if (!items.length) return ''
  return `<ul>${items.map(item => `<li>${escHtml(item)}</li>`).join('')}</ul>`
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
      cgpa: clean(entry.cgpa),
      year: clean(entry.year),
    })).filter((entry) => entry.school || entry.degree || entry.cgpa || entry.year),
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
    ...json.education.map((entry) => `<p>${[entry.school, entry.degree, entry.cgpa ? `CGPA: ${entry.cgpa}` : '', entry.year].filter(Boolean).map(escHtml).join(' | ')}</p>`),
    json.skills.length ? '<h2>Skills</h2>' : '',
    json.skills.length ? `<p>${json.skills.map(escHtml).join(', ')}</p>` : '',
    json.publications.length ? '<h2>Publications</h2>' : '',
    json.publications.length ? htmlList(json.publications) : '',
    json.honors.length ? '<h2>Honors</h2>' : '',
    json.honors.length ? htmlList(json.honors) : '',
  ].filter(Boolean).join('')
}

// Jake's Resume preamble — compiles on Overleaf out of the box
const JAKES_PREAMBLE = `%-------------------------------------------
% ResumeMatch export — Jake's Resume format
% Paste into https://overleaf.com and compile
%-------------------------------------------
\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}\\fancyhf{}\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}
\\urlstyle{same}\\raggedbottom\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]
\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1\\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{\\vspace{-2pt}\\item
  \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
    \\textbf{#1} & #2 \\\\
    \\textit{\\small#3} & \\textit{\\small #4} \\\\
  \\end{tabular*}\\vspace{-7pt}}
\\newcommand{\\resumeProjectHeading}[2]{\\item
  \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
    \\small#1 & #2 \\\\
  \\end{tabular*}\\vspace{-7pt}}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}`

export function generateLatexFromJson(json: StructuredResumeJson): string {
  const contactParts: string[] = []
  if (json.contact.phone)     contactParts.push(escLatex(json.contact.phone))
  if (json.contact.email)     contactParts.push(`\\href{mailto:${escLatex(json.contact.email)}}{\\underline{${escLatex(json.contact.email)}}}`)
  if (json.contact.location)  contactParts.push(escLatex(json.contact.location))
  if (json.contact.linkedin)  contactParts.push(`\\href{${escLatex(normalizeUrl(json.contact.linkedin))}}{\\underline{${escLatex(displayUrl(json.contact.linkedin))}}}`)
  if (json.contact.github)    contactParts.push(`\\href{${escLatex(normalizeUrl(json.contact.github))}}{\\underline{${escLatex(displayUrl(json.contact.github))}}}`)
  if (json.contact.portfolio) contactParts.push(`\\href{${escLatex(normalizeUrl(json.contact.portfolio))}}{\\underline{${escLatex(displayUrl(json.contact.portfolio))}}}`)
  const contactLine = contactParts.join(' $|$ ')

  const lines: string[] = [
    JAKES_PREAMBLE,
    '',
    '\\begin{document}',
    '',
    '%----------HEADING----------',
    '\\begin{center}',
    `  \\textbf{\\Huge \\scshape ${escLatex(json.name)}} \\\\ \\vspace{1pt}`,
    `  \\small ${contactLine}`,
    '\\end{center}',
    '',
  ]

  if (json.education.length) {
    lines.push('%-----------EDUCATION-----------')
    lines.push('\\section{Education}')
    lines.push('  \\resumeSubHeadingListStart')
    for (const edu of json.education) {
      const degreeLine = [edu.degree, edu.cgpa ? `CGPA: ${edu.cgpa}` : ''].filter(Boolean).join(' | ')
      lines.push(`    \\resumeSubheading{${escLatex(edu.school)}}{${escLatex(edu.year)}}{${escLatex(degreeLine)}}{}`)
    }
    lines.push('  \\resumeSubHeadingListEnd')
    lines.push('')
  }

  if (json.summary) {
    lines.push('%-----------SUMMARY-----------')
    lines.push('\\section{Summary}')
    lines.push(`  ${escLatex(json.summary)}`)
    lines.push('')
  }

  if (json.experience.length) {
    lines.push('%-----------EXPERIENCE-----------')
    lines.push('\\section{Experience}')
    lines.push('  \\resumeSubHeadingListStart')
    for (const exp of json.experience) {
      lines.push(`    \\resumeSubheading{${escLatex(exp.company)}}{${escLatex(exp.duration)}}{${escLatex(exp.role)}}{}`)
      if (exp.bullets.length) {
        lines.push('      \\resumeItemListStart')
        for (const b of exp.bullets) lines.push(`        \\resumeItem{${escLatex(b)}}`)
        lines.push('      \\resumeItemListEnd')
      }
    }
    lines.push('  \\resumeSubHeadingListEnd')
    lines.push('')
  }

  if (json.projects.length) {
    lines.push('%-----------PROJECTS-----------')
    lines.push('\\section{Projects}')
    lines.push('    \\resumeSubHeadingListStart')
    for (const proj of json.projects) {
      const techStr = proj.tech ? ` $|$ \\emph{${escLatex(proj.tech)}}` : ''
      const linkStr = proj.link ? ` $|$ \\href{${escLatex(normalizeUrl(proj.link))}}{\\underline{${escLatex(displayUrl(proj.link))}}}` : ''
      lines.push(`      \\resumeProjectHeading{\\textbf{${escLatex(proj.name)}}${techStr}${linkStr}}{}`)
      if (proj.bullets.length) {
        lines.push('          \\resumeItemListStart')
        for (const b of proj.bullets) lines.push(`            \\resumeItem{${escLatex(b)}}`)
        lines.push('          \\resumeItemListEnd')
      }
    }
    lines.push('    \\resumeSubHeadingListEnd')
    lines.push('')
  }

  if (json.skills.length) {
    lines.push('%-----------TECHNICAL SKILLS-----------')
    lines.push('\\section{Technical Skills}')
    lines.push(' \\begin{itemize}[leftmargin=0.15in, label={}]')
    lines.push('    \\small{\\item{')
    lines.push(`     \\textbf{Skills}{: ${json.skills.map(escLatex).join(', ')}} \\\\`)
    lines.push('    }}')
    lines.push(' \\end{itemize}')
    lines.push('')
  }

  if (json.honors.length) {
    lines.push('%-----------HONORS & AWARDS-----------')
    lines.push('\\section{Honors \\& Awards}')
    lines.push('  \\begin{itemize}[leftmargin=0.15in]')
    for (const h of json.honors) lines.push(`    \\item \\small{${escLatex(h)}}`)
    lines.push('  \\end{itemize}')
    lines.push('')
  }

  if (json.publications.length) {
    lines.push('%-----------PUBLICATIONS-----------')
    lines.push('\\section{Publications}')
    lines.push('  \\begin{itemize}[leftmargin=0.15in]')
    for (const p of json.publications) lines.push(`    \\item \\small{${escLatex(p)}}`)
    lines.push('  \\end{itemize}')
    lines.push('')
  }

  lines.push('\\end{document}')
  return lines.join('\n')
}

export function generateRenderCvYamlFromJson(json: StructuredResumeJson): string {
  const lines: string[] = [
    'cv:',
    `  name: ${yamlString(json.name)}`,
  ]

  if (json.title) lines.push(`  headline: ${yamlString(json.title)}`)
  if (json.contact.location) lines.push(`  location: ${yamlString(json.contact.location)}`)
  if (json.contact.email) lines.push(`  email: ${yamlString(json.contact.email)}`)
  if (json.contact.phone) lines.push(`  phone: ${yamlString(json.contact.phone)}`)
  if (json.contact.portfolio) lines.push(`  website: ${yamlString(normalizeUrl(json.contact.portfolio))}`)

  const socialNetworks = [
    json.contact.linkedin ? { network: 'LinkedIn', username: stripSocialUsername(json.contact.linkedin, 'linkedin.com/in/') } : null,
    json.contact.github ? { network: 'GitHub', username: stripSocialUsername(json.contact.github, 'github.com/') } : null,
  ].filter(Boolean) as Array<{ network: string; username: string }>

  if (socialNetworks.length) {
    lines.push('  social_networks:')
    for (const social of socialNetworks) {
      lines.push(`    - network: ${yamlString(social.network)}`)
      lines.push(`      username: ${yamlString(social.username)}`)
    }
  }

  lines.push('  sections:')

  if (json.summary) {
    lines.push('    Summary:')
    lines.push(`      - ${yamlString(json.summary)}`)
  }

  if (json.education.length) {
    lines.push('    Education:')
    for (const edu of json.education) {
      const area = [edu.degree, edu.cgpa ? `CGPA: ${edu.cgpa}` : ''].filter(Boolean).join(' | ')
      lines.push(`      - institution: ${yamlString(edu.school)}`)
      lines.push(`        area: ${yamlString(area || edu.degree || 'Education')}`)
      if (edu.year) lines.push(`        date: ${yamlString(edu.year)}`)
    }
  }

  if (json.experience.length) {
    lines.push('    Experience:')
    for (const exp of json.experience) {
      lines.push(`      - company: ${yamlString(exp.company)}`)
      lines.push(`        position: ${yamlString(exp.role || 'Experience')}`)
      if (exp.duration) lines.push(`        date: ${yamlString(exp.duration)}`)
      appendYamlList(lines, '        highlights:', exp.bullets, 10)
    }
  }

  if (json.projects.length) {
    lines.push('    Projects:')
    for (const project of json.projects) {
      lines.push(`      - name: ${yamlString(project.name || 'Project')}`)
      const summaryParts = [project.tech, project.link ? displayUrl(project.link) : '', project.description].filter(Boolean)
      if (summaryParts.length) lines.push(`        summary: ${yamlString(summaryParts.join(' | '))}`)
      appendYamlList(lines, '        highlights:', project.bullets, 10)
    }
  }

  if (json.skills.length) {
    lines.push('    Skills:')
    lines.push('      - label: "Skills"')
    lines.push(`        details: ${yamlString(json.skills.join(', '))}`)
  }

  if (json.honors.length) {
    lines.push('    Honors and Awards:')
    appendYamlBulletEntries(lines, json.honors)
  }

  if (json.publications.length) {
    lines.push('    Publications:')
    appendYamlBulletEntries(lines, json.publications)
  }

  lines.push('design:')
  lines.push('  theme: engineeringresumes')
  lines.push('  page:')
  lines.push('    size: us-letter')
  lines.push('    top_margin: 0.7in')
  lines.push('    bottom_margin: 0.7in')
  lines.push('    left_margin: 0.7in')
  lines.push('    right_margin: 0.7in')
  lines.push('locale:')
  lines.push('  language: english')

  return lines.join('\n')
}

function appendYamlList(lines: string[], heading: string, values: string[], indentSpaces: number): void {
  const cleaned = cleanLines(values)
  if (!cleaned.length) return

  lines.push(heading)
  const indent = ' '.repeat(indentSpaces)
  for (const value of cleaned) {
    lines.push(`${indent}- ${yamlString(value)}`)
  }
}

function appendYamlBulletEntries(lines: string[], values: string[]): void {
  for (const value of cleanLines(values)) {
    lines.push(`      - bullet: ${yamlString(value)}`)
  }
}

function yamlString(value: string): string {
  return JSON.stringify(clean(value))
}

function stripSocialUsername(raw: string, marker: string): string {
  const value = displayUrl(raw)
  const index = value.toLowerCase().indexOf(marker)
  const username = index >= 0 ? value.slice(index + marker.length) : value
  return username.replace(/^@/, '').replace(/\/$/, '')
}

export function buildResumeSystemOutput(data: ResumeData): ResumeSystemOutput {
  const json = toStructuredResumeJson(data)
  return {
    json,
    html: renderResumeHtmlFromJson(json),
    latex: generateLatexFromJson(json),
    rendercvYaml: generateRenderCvYamlFromJson(json),
  }
}
