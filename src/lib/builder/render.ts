import type { ResumeData, ExperienceEntry, EducationEntry, ProjectEntry } from './types'

export function renderTemplate(html: string, data: ResumeData): string {
  const profileImg = data.profileImage
    ? `<img src="${data.profileImage}" alt="Profile photo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block" />`
    : ''

  const contactLine = [
    data.email     ? `<a href="mailto:${esc(data.email)}" style="color:inherit;text-decoration:none">${esc(data.email)}</a>` : null,
    data.phone     ? esc(data.phone) : null,
    data.location  ? esc(data.location) : null,
    data.linkedin  ? `<a href="${linkHref(data.linkedin)}" style="color:inherit;text-decoration:none">${esc(displayContactUrl(data.linkedin, 'LinkedIn'))}</a>` : null,
    data.github    ? `<a href="${linkHref(data.github)}" style="color:inherit;text-decoration:none">${esc(displayContactUrl(data.github, 'GitHub'))}</a>` : null,
    data.portfolio ? `<a href="${linkHref(data.portfolio)}" style="color:inherit;text-decoration:none">${esc(displayContactUrl(data.portfolio, 'Portfolio'))}</a>` : null,
  ].filter(Boolean).join(' | ')

  let output = html
    .replace(/\{\{profile_image\}\}/g, profileImg)
    .replace(/\{\{contact\}\}/g,   contactLine)
    .replace(/\{\{name\}\}/g,      esc(data.name))
    .replace(/\{\{title\}\}/g,     esc(data.title))
    .replace(/\{\{email\}\}/g,     esc(data.email))
    .replace(/\{\{phone\}\}/g,     esc(data.phone))
    .replace(/\{\{location\}\}/g,  esc(data.location))
    .replace(/\{\{github\}\}/g,    esc(data.github ? displayContactUrl(data.github, 'GitHub') : ''))
    .replace(/\{\{linkedin\}\}/g,  esc(data.linkedin ? displayContactUrl(data.linkedin, 'LinkedIn') : ''))
    .replace(/\{\{portfolio\}\}/g, esc(data.portfolio ? displayContactUrl(data.portfolio, 'Portfolio') : ''))
    .replace(/\{\{summary\}\}/g,   formatInline(data.summary))
    .replace(/\{\{experience\}\}/g, renderExperience(data.experience))
    .replace(/\{\{projects\}\}/g,   renderProjects(data.projects))
    .replace(/\{\{education\}\}/g,  renderEducation(data.education))
    .replace(/\{\{skills\}\}/g,     renderSkillsText(data.skills))
    .replace(/\{\{skills_bars\}\}/g, renderSkillsBars(data.skills))
    .replace(/\{\{certifications\}\}/g, renderList(data.certifications ?? []))
    .replace(/\{\{publications\}\}/g, renderList(data.publications ?? []))
    .replace(/\{\{honors\}\}/g,      renderList(data.honors ?? []))

  output = removeEmptySections(output)

  // Fallbacks: if a section placeholder is absent from the template HTML, append
  // it as a plain unstyled section so user edits always appear in the preview.
  function appendSection(title: string, innerHtml: string) {
    if (!innerHtml) return
    const section = `<div style="margin-top:12px">
      <div style="font-size:0.85em;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1.5px solid #111;padding-bottom:2px;margin-bottom:6px">${title}</div>
      ${innerHtml}
    </div>`
    output = insertBeforeRootClose(output, section)
  }

  if (!html.includes('{{projects}}')    && data.projects?.length)
    appendSection('Projects',     renderProjects(data.projects))

  if (!html.includes('{{summary}}')     && data.summary.trim()) {
    const summarySection = `<div style="margin-top:12px">
      <div style="font-size:0.85em;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1.5px solid #111;padding-bottom:2px;margin-bottom:6px">Summary</div>
      <p style="font-size:0.875em;line-height:1.32;margin:0">${formatInline(data.summary)}</p>
    </div>`
    output = insertBeforeFirstSection(output, summarySection)
  }

  if (!html.includes('{{honors}}')      && data.honors?.length)
    appendSection('Honors & Awards', renderList(data.honors))

  if (!html.includes('{{certifications}}') && data.certifications?.length)
    appendSection('Certifications & Training', renderList(data.certifications))

  if (!html.includes('{{publications}}') && data.publications?.length)
    appendSection('Publications', renderList(data.publications))

  output = removeEmptySections(output)

  return output
}

function renderExperience(entries: ExperienceEntry[]): string {
  return entries.filter(hasExperienceContent).map(e => `
    <div class="exp-entry" style="margin-bottom:10px;break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">
        <strong style="font-size:0.95em;min-width:0">${formatInline(e.role)}</strong>
        <span style="font-size:0.82em;color:#444;white-space:nowrap;text-align:right;flex-shrink:0">${esc(e.period)}</span>
      </div>
      ${e.company.trim() ? `<div style="font-size:0.875em;color:#444;margin-bottom:3px;font-style:italic">${esc(e.company)}</div>` : ''}
      <ul style="margin:3px 0 0 16px;padding:0">
        ${e.bullets.filter(b => b.trim()).map(b =>
          `<li style="margin-bottom:2px;font-size:0.875em;line-height:1.32">${formatInline(b)}</li>`
        ).join('')}
      </ul>
    </div>
  `).join('')
}

function renderProjects(entries: ProjectEntry[]): string {
  if (!entries?.length) return ''
  return entries.filter(hasProjectContent).map(p => `
    <div class="proj-entry" style="margin-bottom:10px;break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">
        <strong style="font-size:0.95em;min-width:0">${formatInline(p.name)}</strong>
        ${p.link ? `<a href="${linkHref(p.link)}" style="font-size:0.82em;color:#111;text-decoration:none;text-align:right;overflow-wrap:anywhere">${esc(displayUrl(p.link))}</a>` : ''}
      </div>
      ${p.tech.trim() ? `<div style="font-size:0.82em;color:#444;margin-bottom:3px;font-style:italic">${esc(p.tech)}</div>` : ''}
      ${p.description.trim() ? `<div style="font-size:0.875em;color:#333;margin-bottom:2px">${formatInline(p.description)}</div>` : ''}
      <ul style="margin:3px 0 0 16px;padding:0">
        ${p.bullets.filter(b => b.trim()).map(b =>
          `<li style="margin-bottom:2px;font-size:0.875em;line-height:1.32">${formatInline(b)}</li>`
        ).join('')}
      </ul>
    </div>
  `).join('')
}

function renderEducation(entries: EducationEntry[]): string {
  return entries.filter(hasEducationContent).map(e => `
    <div class="edu-entry" style="display:flex;justify-content:space-between;gap:12px;margin-bottom:7px;break-inside:avoid">
      <div style="min-width:0">
        <strong style="font-size:0.95em">${esc(e.school)}</strong>
        ${educationDetails(e) ? `<div style="font-size:0.875em;color:#444">${educationDetails(e)}</div>` : ''}
      </div>
      <span style="font-size:0.85em;color:#444;white-space:nowrap;text-align:right;flex-shrink:0">${esc(e.year)}</span>
    </div>
  `).join('')
}

function renderSkillsText(skills: ResumeData['skills']): string {
  const names = skills
    .filter(s => s.name.trim())
    .map(s => s.name.trim())
  if (!names.length) return ''

  const groupedNames = groupCategorizedSkills(names)
  const hasCategories = groupedNames.some(name => /^[A-Za-z][A-Za-z /&+-]{1,40}:\s+\S/.test(name))
  if (!hasCategories) return names.map(formatInline).join(', ')

  return groupedNames.map(name => {
    const match = name.match(/^([A-Za-z][A-Za-z /&+-]{1,40}):\s*(.+)$/)
    if (!match) return `<span>${formatInline(name)}</span>`
    return `<span><strong style="font-weight:700;color:#000">${formatInline(match[1])}:</strong> ${formatInline(match[2])}</span>`
  }).join('<br/>')
}

function groupCategorizedSkills(names: string[]): string[] {
  const order: string[] = []
  const grouped = new Map<string, string[]>()
  const plain: string[] = []
  const categorizedValues = new Set<string>()

  for (const name of names) {
    const match = name.match(/^([A-Za-z][A-Za-z /&+-]{1,40}):\s*(.+)$/)
    if (!match) {
      plain.push(name)
      continue
    }

    const label = match[1].trim()
    const key = label.toLowerCase()
    const values = match[2]
      .split(/[,;|·]/)
      .map(value => value.trim())
      .filter(Boolean)
    if (!grouped.has(key)) {
      grouped.set(key, [])
      order.push(label)
    }
    const current = grouped.get(key) ?? []
    for (const value of values) {
      categorizedValues.add(normalizeSkillValue(value))
      if (!current.some(existing => existing.toLowerCase() === value.toLowerCase())) {
        current.push(value)
      }
    }
  }

  return [
    ...order.map(label => `${label}: ${(grouped.get(label.toLowerCase()) ?? []).join(', ')}`),
    ...plain.filter(name => !categorizedValues.has(normalizeSkillValue(name))),
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

function renderSkillsBars(skills: ResumeData['skills']): string {
  return skills.filter(s => s.name.trim()).map(s => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
      <span style="font-size:0.82em;width:90px;flex-shrink:0">${esc(s.name)}</span>
      <div style="flex:1;height:5px;background:#e8e8e8;border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${s.level}%;background:#111;border-radius:3px"></div>
      </div>
    </div>
  `).join('')
}

function renderList(items: unknown[]): string {
  if (!items.length) return ''
  // Split each entry on newlines so one textarea entry with multiple lines
  // becomes multiple bullets.
  const bullets = items.flatMap(item => listItemText(item).split('\n').map(line => line.trim())).filter(Boolean)
  if (!bullets.length) return ''
  return `<ul style="margin:0 0 0 16px;padding:0">
    ${bullets.map(i =>
      `<li style="font-size:0.875em;margin-bottom:2px;line-height:1.32">${formatLabeledLine(i)}</li>`
    ).join('')}
  </ul>`
}

function formatLabeledLine(value: string): string {
  const match = value.match(/^([A-Za-z][A-Za-z /&+-]{1,48}):\s*(.+)$/)
  if (!match) return formatInline(value)
  return `<strong style="font-weight:700;color:#000">${formatInline(match[1])}:</strong> ${formatInline(match[2])}`
}

function listItemText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (!Array.isArray(value) && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const preferred = [
      record.name,
      record.title,
      record.certification,
      record.issuer,
      record.provider,
      record.organization,
      record.description,
      record.date,
      record.year,
    ].map(listItemText).filter(Boolean)
    if (preferred.length) return preferred.join(' — ')
  }
  return ''
}

function hasExperienceContent(entry: ExperienceEntry): boolean {
  return Boolean(
    entry.company.trim() ||
    entry.role.trim() ||
    entry.period.trim() ||
    entry.bullets.some(b => b.trim())
  )
}

function hasProjectContent(entry: ProjectEntry): boolean {
  return Boolean(
    entry.name.trim() ||
    entry.tech.trim() ||
    (entry.link ?? '').trim() ||
    entry.description.trim() ||
    entry.bullets.some(b => b.trim())
  )
}

function hasEducationContent(entry: EducationEntry): boolean {
  return Boolean(entry.school.trim() || entry.degree.trim() || (entry.cgpa ?? '').trim() || entry.year.trim())
}

function educationDetails(entry: EducationEntry): string {
  return [
    entry.degree.trim() ? esc(entry.degree) : '',
    (entry.cgpa ?? '').trim() ? `CGPA: ${esc(entry.cgpa ?? '')}` : '',
  ].filter(Boolean).join(' | ')
}

function removeEmptySections(html: string): string {
  return html
    .replace(/<section[^>]*>\s*<h2[^>]*>\s*[^<]*\s*<\/h2>\s*<\/section>/gi, '')
    .replace(/<h2[^>]*>\s*[^<]*\s*<\/h2>\s*<div[^>]*>\s*<\/div>/gi, '')
    .replace(/<h2[^>]*>\s*[^<]*\s*<\/h2>\s*<p[^>]*>\s*<\/p>/gi, '')
    .replace(/<h2[^>]*>\s*[^<]*\s*<\/h2>\s*<ul[^>]*>\s*<\/ul>/gi, '')
}

function insertBeforeRootClose(html: string, section: string): string {
  if (html.includes('</body>')) return html.replace('</body>', `${section}</body>`)

  const closeIndex = html.trimEnd().lastIndexOf('</div>')
  if (closeIndex === -1) return html + section

  return `${html.slice(0, closeIndex)}${section}${html.slice(closeIndex)}`
}

function insertBeforeFirstSection(html: string, section: string): string {
  const firstHeading = html.search(/<h2\b/i)
  if (firstHeading === -1) return insertBeforeRootClose(html, section)
  return `${html.slice(0, firstHeading)}${section}${html.slice(firstHeading)}`
}

/** Escape HTML entities — prevents XSS from user-typed content */
export function esc(str: string): string {
  return (str ?? '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;')
    .replace(/\n/g, '<br/>')
}

function formatInline(value: string): string {
  const escaped = esc(value)
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:700;color:#000">$1</strong>')
}

function displayUrl(raw: string, fallback = 'Website'): string {
  const value = (raw ?? '').trim()
  if (!value) return ''
  if (/^(mailto:|tel:)/i.test(value)) return value

  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(normalized)
    const host = url.hostname.replace(/^www\./i, '').replace(/^m\./i, '').toLowerCase()

    if (host.includes('github.com')) return 'GitHub'
    if (host.includes('linkedin.com')) return 'LinkedIn'
    if (host.includes('gitlab.com')) return 'GitLab'
    if (host.includes('bitbucket.org')) return 'Bitbucket'
    if (host.includes('behance.net')) return 'Behance'
    if (host.includes('dribbble.com')) return 'Dribbble'
    if (host.includes('figma.com')) return 'Figma'
    if (host.includes('medium.com')) return 'Medium'
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube'
    if (host.includes('vercel.app') || host.includes('vercel.com')) return 'Vercel'
    if (host.includes('netlify.app') || host.includes('netlify.com')) return 'Netlify'
    if (host.includes('onrender.com') || host.includes('render.com')) return 'Render'

    const parts = host.split('.').filter(Boolean)
    const domain = parts.length > 1 ? parts[parts.length - 2] : parts[0]
    if (!domain) return fallback

    return domain
      .split(/[-_]/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  } catch {
    return fallback
  }
}

function displayContactUrl(raw: string, label: 'GitHub' | 'LinkedIn' | 'Portfolio'): string {
  const display = displayUrl(raw, label)
  if (label === 'Portfolio' && display !== 'GitHub' && display !== 'LinkedIn') return 'Portfolio'
  return display
}

/** Ensure a URL string has a protocol prefix for use in href attributes. */
function linkHref(url: string): string {
  const u = (url ?? '').trim()
  if (!u) return '#'
  return /^https?:\/\//i.test(u) ? esc(u) : `https://${esc(u)}`
}
