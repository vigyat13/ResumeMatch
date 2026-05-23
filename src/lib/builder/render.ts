import type { ResumeData, ExperienceEntry, EducationEntry, ProjectEntry } from './types'

export function renderTemplate(html: string, data: ResumeData): string {
  const profileImg = data.profileImage
    ? `<img src="${data.profileImage}" alt="Profile photo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block" />`
    : ''

  const contactLine = [
    data.email     ? `<a href="mailto:${esc(data.email)}" style="color:inherit;text-decoration:none">${esc(data.email)}</a>` : null,
    data.phone     ? esc(data.phone) : null,
    data.location  ? esc(data.location) : null,
    data.linkedin  ? `<a href="${linkHref(data.linkedin)}" style="color:inherit;text-decoration:none">${esc(contactLinkLabel('linkedin'))}</a>` : null,
    data.github    ? `<a href="${linkHref(data.github)}" style="color:inherit;text-decoration:none">${esc(contactLinkLabel('github'))}</a>` : null,
    data.portfolio ? `<a href="${linkHref(data.portfolio)}" style="color:inherit;text-decoration:none">${esc(data.portfolio)}</a>` : null,
  ].filter(Boolean).join(' | ')

  let output = html
    .replace(/\{\{profile_image\}\}/g, profileImg)
    .replace(/\{\{contact\}\}/g,   contactLine)
    .replace(/\{\{name\}\}/g,      esc(data.name))
    .replace(/\{\{title\}\}/g,     esc(data.title))
    .replace(/\{\{email\}\}/g,     esc(data.email))
    .replace(/\{\{phone\}\}/g,     esc(data.phone))
    .replace(/\{\{location\}\}/g,  esc(data.location))
    .replace(/\{\{github\}\}/g,    data.github ? esc(contactLinkLabel('github')) : '')
    .replace(/\{\{linkedin\}\}/g,  data.linkedin ? esc(contactLinkLabel('linkedin')) : '')
    .replace(/\{\{portfolio\}\}/g, esc(data.portfolio))
    .replace(/\{\{summary\}\}/g,   esc(data.summary))
    .replace(/\{\{experience\}\}/g, renderExperience(data.experience))
    .replace(/\{\{projects\}\}/g,   renderProjects(data.projects))
    .replace(/\{\{education\}\}/g,  renderEducation(data.education))
    .replace(/\{\{skills\}\}/g,     renderSkillsText(data.skills))
    .replace(/\{\{skills_bars\}\}/g, renderSkillsBars(data.skills))
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
      <p style="font-size:0.875em;line-height:1.32;margin:0">${esc(data.summary)}</p>
    </div>`
    output = insertBeforeFirstSection(output, summarySection)
  }

  if (!html.includes('{{honors}}')      && data.honors?.length)
    appendSection('Honors & Awards', renderList(data.honors))

  if (!html.includes('{{publications}}') && data.publications?.length)
    appendSection('Publications', renderList(data.publications))

  output = removeEmptySections(output)

  return output
}

function renderExperience(entries: ExperienceEntry[]): string {
  return entries.filter(hasExperienceContent).map(e => `
    <div class="exp-entry" style="margin-bottom:10px;break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">
        <strong style="font-size:0.95em;min-width:0">${esc(e.role)}</strong>
        <span style="font-size:0.82em;color:#444;white-space:nowrap;text-align:right;flex-shrink:0">${esc(e.period)}</span>
      </div>
      ${e.company.trim() ? `<div style="font-size:0.875em;color:#444;margin-bottom:3px;font-style:italic">${esc(e.company)}</div>` : ''}
      <ul style="margin:3px 0 0 16px;padding:0">
        ${e.bullets.filter(b => b.trim()).map(b =>
          `<li style="margin-bottom:2px;font-size:0.875em;line-height:1.32">${esc(b)}</li>`
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
        <strong style="font-size:0.95em;min-width:0">${esc(p.name)}</strong>
        ${p.link ? `<a href="${linkHref(p.link)}" style="font-size:0.82em;color:#111;text-decoration:none;text-align:right;overflow-wrap:anywhere">${esc(p.link)}</a>` : ''}
      </div>
      ${p.tech.trim() ? `<div style="font-size:0.82em;color:#444;margin-bottom:3px;font-style:italic">${esc(p.tech)}</div>` : ''}
      ${p.description.trim() ? `<div style="font-size:0.875em;color:#333;margin-bottom:2px">${esc(p.description)}</div>` : ''}
      <ul style="margin:3px 0 0 16px;padding:0">
        ${p.bullets.filter(b => b.trim()).map(b =>
          `<li style="margin-bottom:2px;font-size:0.875em;line-height:1.32">${esc(b)}</li>`
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
  return skills
    .filter(s => s.name.trim())
    .map(s => esc(s.name))
    .join(', ')
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

function renderList(items: string[]): string {
  if (!items.length) return ''
  // Split each entry on newlines so one textarea entry with multiple lines
  // becomes multiple bullets.
  const bullets = items.flatMap(i => i.split('\n').map(l => l.trim())).filter(Boolean)
  if (!bullets.length) return ''
  return `<ul style="margin:0 0 0 16px;padding:0">
    ${bullets.map(i =>
      `<li style="font-size:0.875em;margin-bottom:2px;line-height:1.32">${esc(i)}</li>`
    ).join('')}
  </ul>`
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

/** Ensure a URL string has a protocol prefix for use in href attributes. */
function linkHref(url: string): string {
  const u = (url ?? '').trim()
  if (!u) return '#'
  return /^https?:\/\//i.test(u) ? esc(u) : `https://${esc(u)}`
}

function contactLinkLabel(kind: 'github' | 'linkedin'): string {
  return kind === 'github' ? 'GitHub' : 'LinkedIn'
}
