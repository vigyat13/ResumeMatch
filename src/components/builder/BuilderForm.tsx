'use client'

import { useRef } from 'react'
import { Plus, Trash2, GripVertical, Upload, X } from 'lucide-react'
import type { ResumeData, ExperienceEntry, EducationEntry, ProjectEntry } from '@/lib/builder/types'

interface Props {
  data:     ResumeData
  onChange: (data: ResumeData) => void
}

export function BuilderForm({ data, onChange }: Props) {
  const set = <K extends keyof ResumeData>(key: K, val: ResumeData[K]) =>
    onChange({ ...data, [key]: val })

  const photoRef = useRef<HTMLInputElement>(null)

  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('profileImage', reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Experience helpers
  const setExp = (i: number, patch: Partial<ExperienceEntry>) =>
    set('experience', data.experience.map((e, idx) => idx === i ? { ...e, ...patch } : e))
  const addExp = () =>
    set('experience', [...data.experience, { company: '', role: '', period: '', bullets: [''] }])
  const removeExp = (i: number) =>
    set('experience', data.experience.filter((_, idx) => idx !== i))

  // ── Project helpers
  const setProj = (i: number, patch: Partial<ProjectEntry>) =>
    set('projects', data.projects.map((p, idx) => idx === i ? { ...p, ...patch } : p))
  const addProj = () =>
    set('projects', [...data.projects, { name: '', tech: '', link: '', description: '', bullets: [''] }])
  const removeProj = (i: number) =>
    set('projects', data.projects.filter((_, idx) => idx !== i))

  // ── Education helpers
  const setEdu = (i: number, patch: Partial<EducationEntry>) =>
    set('education', data.education.map((e, idx) => idx === i ? { ...e, ...patch } : e))
  const addEdu = () =>
    set('education', [...data.education, { school: '', degree: '', cgpa: '', year: '' }])
  const removeEdu = (i: number) =>
    set('education', data.education.filter((_, idx) => idx !== i))

  // ── Publications / Honors helpers
  const setPub = (i: number, val: string) =>
    set('publications', (data.publications ?? []).map((p, idx) => idx === i ? val : p))
  const addPub = () => set('publications', [...(data.publications ?? []), ''])
  const removePub = (i: number) =>
    set('publications', (data.publications ?? []).filter((_, idx) => idx !== i))

  const setHonor = (i: number, val: string) =>
    set('honors', (data.honors ?? []).map((h, idx) => idx === i ? val : h))
  const addHonor = () => set('honors', [...(data.honors ?? []), ''])
  const removeHonor = (i: number) =>
    set('honors', (data.honors ?? []).filter((_, idx) => idx !== i))

  return (
    <div className="space-y-7 pb-20">

      {/* ── Personal Info ──────────────────────────────────── */}
      <section>
        <SectionHeading>Personal Info</SectionHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldGroup label="Full Name" span="sm:col-span-2">
            <Input value={data.name} onChange={v => set('name', v)} placeholder="Jane Smith" />
          </FieldGroup>
          <FieldGroup label="Job Title" span="sm:col-span-2">
            <Input value={data.title} onChange={v => set('title', v)} placeholder="Software Engineer" />
          </FieldGroup>
          {/* Photo upload */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
              Profile Photo <span className="text-[var(--color-text-muted)] font-normal">(optional — only for templates that support it)</span>
            </label>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
            {data.profileImage ? (
              <div className="flex items-center gap-3">
                <img src={data.profileImage} alt="Profile" className="w-14 h-14 rounded-full object-cover border border-[var(--color-border)]" />
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-text-secondary)]">Photo uploaded</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => photoRef.current?.click()}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors">
                      <Upload className="w-3 h-3" /> Replace
                    </button>
                    <button type="button" onClick={() => set('profileImage', '')}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors text-red-500">
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => photoRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] transition-colors text-sm text-[var(--color-text-muted)]">
                <Upload className="w-4 h-4" /> Upload photo
              </button>
            )}
          </div>
          <FieldGroup label="Email">
            <Input value={data.email} onChange={v => set('email', v)} placeholder="jane@example.com" />
          </FieldGroup>
          <FieldGroup label="Phone">
            <Input value={data.phone} onChange={v => set('phone', v)} placeholder="+1 (555) 000-0000" />
          </FieldGroup>
          <FieldGroup label="Location">
            <Input value={data.location} onChange={v => set('location', v)} placeholder="New York, NY" />
          </FieldGroup>
          <FieldGroup label="GitHub">
            <Input value={data.github} onChange={v => set('github', v)} placeholder="github.com/handle" />
          </FieldGroup>
          <FieldGroup label="LinkedIn">
            <Input value={data.linkedin} onChange={v => set('linkedin', v)} placeholder="linkedin.com/in/handle" />
          </FieldGroup>
          <FieldGroup label="Portfolio / Website">
            <Input value={data.portfolio} onChange={v => set('portfolio', v)} placeholder="yoursite.dev" />
          </FieldGroup>
        </div>
      </section>

      {/* ── Summary ───────────────────────────────────────── */}
      <section>
        <SectionHeading>Summary</SectionHeading>
        <textarea
          value={data.summary}
          onChange={e => set('summary', e.target.value)}
          rows={3}
          placeholder="2–3 sentences about your background and what you bring to the table."
          className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg
                     bg-[var(--color-surface)] resize-none focus:outline-none focus:ring-2
                     focus:ring-[var(--color-accent)]/40 transition"
        />
      </section>

      {/* ── Experience ────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionHeading className="mb-0">Experience</SectionHeading>
          <AddButton onClick={addExp}>Add role</AddButton>
        </div>
        <div className="space-y-4">
          {data.experience.map((exp, i) => (
            <div key={i} className="rounded-lg border border-[var(--color-border)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                  <GripVertical className="w-3.5 h-3.5" /> Role {i + 1}
                </span>
                {data.experience.length > 1 && (
                  <button onClick={() => removeExp(i)} className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FieldGroup label="Company">
                  <Input value={exp.company} onChange={v => setExp(i, { company: v })} placeholder="Acme Corp" />
                </FieldGroup>
                <FieldGroup label="Role / Title">
                  <Input value={exp.role} onChange={v => setExp(i, { role: v })} placeholder="Senior Engineer" />
                </FieldGroup>
                <FieldGroup label="Period" span="sm:col-span-2">
                  <Input value={exp.period} onChange={v => setExp(i, { period: v })} placeholder="Jan 2022 – Present" />
                </FieldGroup>
              </div>
              <FieldGroup label="Bullet points (one per line)">
                <textarea
                  value={exp.bullets.join('\n')}
                  onChange={e => setExp(i, { bullets: e.target.value.split('\n') })}
                  rows={3}
                  placeholder="Led the team to ship product X&#10;Reduced latency by 40%"
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg
                             bg-[var(--color-surface)] resize-none focus:outline-none
                             focus:ring-2 focus:ring-[var(--color-accent)]/40 transition"
                />
              </FieldGroup>
            </div>
          ))}
        </div>
      </section>

      {/* ── Projects ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionHeading className="mb-0">Projects</SectionHeading>
          <AddButton onClick={addProj}>Add project</AddButton>
        </div>
        <div className="space-y-4">
          {data.projects.map((proj, i) => (
            <div key={i} className="rounded-lg border border-[var(--color-border)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                  <GripVertical className="w-3.5 h-3.5" /> Project {i + 1}
                </span>
                <button onClick={() => removeProj(i)} className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FieldGroup label="Project Name">
                  <Input value={proj.name} onChange={v => setProj(i, { name: v })} placeholder="My Project" />
                </FieldGroup>
                <FieldGroup label="Tech Stack">
                  <Input value={proj.tech} onChange={v => setProj(i, { tech: v })} placeholder="React, Node.js, PostgreSQL" />
                </FieldGroup>
                <FieldGroup label="Link (GitHub / Live)" span="sm:col-span-2">
                  <Input value={proj.link ?? ''} onChange={v => setProj(i, { link: v })} placeholder="github.com/handle/project" />
                </FieldGroup>
                <FieldGroup label="Description" span="sm:col-span-2">
                  <Input value={proj.description} onChange={v => setProj(i, { description: v })} placeholder="Brief description of what it does" />
                </FieldGroup>
              </div>
              <FieldGroup label="Bullet points (one per line)">
                <textarea
                  value={proj.bullets.join('\n')}
                  onChange={e => setProj(i, { bullets: e.target.value.split('\n') })}
                  rows={2}
                  placeholder="Built X achieving Y&#10;Reduced latency by Z"
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg
                             bg-[var(--color-surface)] resize-none focus:outline-none
                             focus:ring-2 focus:ring-[var(--color-accent)]/40 transition"
                />
              </FieldGroup>
            </div>
          ))}
          {data.projects.length === 0 && (
            <button
              onClick={addProj}
              className="w-full py-4 border-2 border-dashed border-[var(--color-border)] rounded-lg
                         text-sm text-[var(--color-text-muted)] hover:border-[var(--color-accent)]
                         hover:text-[var(--color-accent)] transition-colors"
            >
              + Add your first project
            </button>
          )}
        </div>
      </section>

      {/* ── Education ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionHeading className="mb-0">Education</SectionHeading>
          <AddButton onClick={addEdu}>Add school</AddButton>
        </div>
        <div className="space-y-3">
          {data.education.map((edu, i) => (
            <div key={i} className="rounded-lg border border-[var(--color-border)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                  Education {i + 1}
                </span>
                {data.education.length > 1 && (
                  <button onClick={() => removeEdu(i)} className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FieldGroup label="School" span="sm:col-span-2">
                  <Input value={edu.school} onChange={v => setEdu(i, { school: v })} placeholder="State University" />
                </FieldGroup>
                <FieldGroup label="Degree">
                  <Input value={edu.degree} onChange={v => setEdu(i, { degree: v })} placeholder="B.S. Computer Science" />
                </FieldGroup>
                <FieldGroup label="Year">
                  <Input value={edu.year} onChange={v => setEdu(i, { year: v })} placeholder="2019" />
                </FieldGroup>
                <FieldGroup label="CGPA / GPA" span="sm:col-span-2">
                  <Input value={edu.cgpa ?? ''} onChange={v => setEdu(i, { cgpa: v })} placeholder="8.7/10 or 3.8/4.0" />
                </FieldGroup>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Publications ──────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionHeading className="mb-0">Publications</SectionHeading>
          <AddButton onClick={addPub}>Add</AddButton>
        </div>
        <div className="space-y-2">
          {(data.publications ?? []).map((pub, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                value={pub}
                onChange={e => setPub(i, e.target.value)}
                rows={2}
                placeholder="Journal/conference — paper title — authors"
                className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg
                           bg-[var(--color-surface)] resize-none focus:outline-none
                           focus:ring-2 focus:ring-[var(--color-accent)]/40 transition"
              />
              <button onClick={() => removePub(i)} className="mt-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {(data.publications ?? []).length === 0 && (
            <button onClick={addPub} className="w-full py-3 border-2 border-dashed border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
              + Add publication
            </button>
          )}
        </div>
      </section>

      {/* ── Honors & Leadership ───────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionHeading className="mb-0">Honors &amp; Leadership</SectionHeading>
          <AddButton onClick={addHonor}>Add</AddButton>
        </div>
        <div className="space-y-2">
          {(data.honors ?? []).map((h, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                value={h}
                onChange={e => setHonor(i, e.target.value)}
                rows={2}
                placeholder="Award or recognition (one item per line = one bullet)"
                className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg
                           bg-[var(--color-surface)] resize-none focus:outline-none
                           focus:ring-2 focus:ring-[var(--color-accent)]/40 transition"
              />
              <button onClick={() => removeHonor(i)} className="mt-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {(data.honors ?? []).length === 0 && (
            <button onClick={addHonor} className="w-full py-3 border-2 border-dashed border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
              + Add honor or award
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide mb-3 ${className}`}>
      {children}
    </h3>
  )
}

function FieldGroup({
  label, children, span = '',
}: { label: string; children: React.ReactNode; span?: string }) {
  return (
    <div className={`space-y-1 ${span}`}>
      <label className="text-xs font-medium text-[var(--color-text-muted)]">{label}</label>
      {children}
    </div>
  )
}

function Input({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg
                 bg-[var(--color-surface)] focus:outline-none focus:ring-2
                 focus:ring-[var(--color-accent)]/40 transition"
    />
  )
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:opacity-80 transition-opacity"
    >
      <Plus className="w-3.5 h-3.5" /> {children}
    </button>
  )
}
