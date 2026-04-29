import type { ResumeData, ExperienceEntry, EducationEntry, ProjectEntry } from './types'

export function renderTemplate(html: string, data: ResumeData): string {
  const profileImg = data.profileImage
    ? `<img src="${data.profileImage}" alt="Profile photo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block" />`
    : ''

  const contactLine = [data.email, data.phone, data.location, data.linkedin, data.github, data.portfolio]
    .filter(v => v?.trim())
    .map(esc)
    .join(' | ')

  let output = html
    .replace(/\{\{profile_image\}\}/g, profileImg)
    .replace(/\{\{contact\}\}/g,   contactLine)
    .replace(/\{\{name\}\}/g,      esc(data.name))
    .replace(/\{\{title\}\}/g,     esc(data.title))
    .replace(/\{\{email\}\}/g,     esc(data.email))
    .replace(/\{\{phone\}\}/g,     esc(data.phone))
    .replace(/\{\{location\}\}/g,  esc(data.location))
    .replace(/\{\{github\}\}/g,    esc(data.github))
    .replace(/\{\{linkedin\}\}/g,  esc(data.linkedin))
    .replace(/\{\{portfolio\}\}/g, esc(data.portfolio))
    .replace(/\{\{summary\}\}/g,   esc(data.summary))
    .replace(/\{\{experience\}\}/g, renderExperience(data.experience))
    .replace(/\{\{projects\}\}/g,   renderProjects(data.projects))
    .replace(/\{\{education\}\}/g,  renderEducation(data.education))
    .replace(/\{\{skills\}\}/g,     renderSkillsText(data.skills))
    .replace(/\{\{skills_bars\}\}/g, renderSkillsBars(data.skills))
    .replace(/\{\{publications\}\}/g, renderList(data.publications ?? []))
    .replace(/\{\{honors\}\}/g,      renderList(data.honors ?? []))

  // Fallbacks: if a section placeholder is absent from the template HTML, append
  // it as a plain unstyled section so user edits always appear in the preview.
  function appendSection(title: string, innerHtml: string) {
    if (!innerHtml) return
    const section = `<div style="margin-top:18px">
      <div style="font-size:0.85em;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1.5px solid #111;padding-bottom:3px;margin-bottom:10px">${title}</div>
      ${innerHtml}
    </div>`
    output = output.includes('</body>')
      ? output.replace('</body>', `${section}</body>`)
      : output + section
  }

  if (!html.includes('{{projects}}')    && data.projects?.length)
    appendSection('Projects',     renderProjects(data.projects))

  if (!html.includes('{{honors}}')      && data.honors?.length)
    appendSection('Honors & Awards', renderList(data.honors))

  if (!html.includes('{{publications}}') && data.publications?.length)
    appendSection('Publications', renderList(data.publications))

  return output
}

function renderExperience(entries: ExperienceEntry[]): string {
  return entries.map(e => `
    <div class="exp-entry" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <strong style="font-size:0.95em">${esc(e.role)}</strong>
        <span style="font-size:0.82em;color:#444;white-space:nowrap">${esc(e.period)}</span>
      </div>
      <div style="font-size:0.875em;color:#444;margin-bottom:4px;font-style:italic">${esc(e.company)}</div>
      <ul style="margin:4px 0 0 16px;padding:0">
        ${e.bullets.filter(b => b.trim()).map(b =>
          `<li style="margin-bottom:3px;font-size:0.875em;line-height:1.4">${esc(b)}</li>`
        ).join('')}
      </ul>
    </div>
  `).join('')
}

function renderProjects(entries: ProjectEntry[]): string {
  if (!entries?.length) return ''
  return entries.map(p => `
    <div class="proj-entry" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <strong style="font-size:0.95em">${esc(p.name)}</strong>
        ${p.link ? `<a href="https://${esc(p.link)}" style="font-size:0.82em;color:#111;text-decoration:none">${esc(p.link)}</a>` : ''}
      </div>
      <div style="font-size:0.82em;color:#444;margin-bottom:4px;font-style:italic">${esc(p.tech)}</div>
      ${p.description ? `<div style="font-size:0.875em;color:#333;margin-bottom:3px">${esc(p.description)}</div>` : ''}
      <ul style="margin:4px 0 0 16px;padding:0">
        ${p.bullets.filter(b => b.trim()).map(b =>
          `<li style="margin-bottom:3px;font-size:0.875em;line-height:1.4">${esc(b)}</li>`
        ).join('')}
      </ul>
    </div>
  `).join('')
}

function renderEducation(entries: EducationEntry[]): string {
  return entries.map(e => `
    <div class="edu-entry" style="display:flex;justify-content:space-between;margin-bottom:10px">
      <div>
        <strong style="font-size:0.95em">${esc(e.school)}</strong>
        <div style="font-size:0.875em;color:#444">${esc(e.degree)}</div>
      </div>
      <span style="font-size:0.85em;color:#444;white-space:nowrap">${esc(e.year)}</span>
    </div>
  `).join('')
}

function renderSkillsText(skills: ResumeData['skills']): string {
  return skills
    .filter(s => s.name.trim())
    .map(s => esc(s.name))
    .join(' • ')
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
  return `<ul style="margin:0 0 0 16px;padding:0">
    ${items.filter(i => i.trim()).map(i =>
      `<li style="font-size:0.875em;margin-bottom:3px;line-height:1.4">${esc(i)}</li>`
    ).join('')}
  </ul>`
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
