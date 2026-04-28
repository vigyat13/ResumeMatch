'use client'

import { useState } from 'react'
import { Check, Crown, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { renderTemplate } from '@/lib/builder/render'
import { pickSampleForTemplate } from '@/lib/builder/types'
import {
  getTemplateBadge,
  getTemplateDescription,
  isCompanyInspiredTemplate,
} from '@/lib/builder/templateMeta'

interface Template {
  id:          string
  name:        string
  description: string | null
  is_ats_safe: boolean | null
  tier:        string | null
  html_content: string
  css_content:  string
}

interface Resume {
  id:          string
  file_name:   string
  template_id: string | null
}

interface Props {
  templates: Template[]
  resumes:   Resume[]
}

export function TemplateCarousel({ templates, resumes }: Props) {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? '')
  const [targetResume, setTargetResume] = useState<string>(resumes[0]?.id ?? '')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState<string | null>(null)
  const [localResumes, setLocalResumes] = useState(resumes)

  const selected = templates.find(t => t.id === selectedId)

  async function handleApply() {
    if (!selectedId || !targetResume) return
    setApplying(true)
    try {
      const res = await fetch(`/api/v1/resumes/${targetResume}/template`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: selectedId }),
      })
      if (res.ok) {
        setApplied(targetResume)
        setLocalResumes(prev =>
          prev.map(r => r.id === targetResume ? { ...r, template_id: selectedId } : r)
        )
        setTimeout(() => setApplied(null), 2500)
      }
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-3 py-1 font-semibold text-[var(--color-accent)]">
            <Sparkles className="w-3.5 h-3.5" />
            Real previews
          </span>
          <span className="text-[var(--color-text-muted)]">
            These cards now render actual template output instead of placeholder diagrams.
          </span>
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin">
        {templates.map(template => (
          <button
            key={template.id}
            onClick={() => setSelectedId(template.id)}
            className={`
              snap-start flex-shrink-0 w-72 rounded-2xl border-2 text-left overflow-hidden
              transition-all duration-200
              ${selectedId === template.id
                ? 'border-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/20'
                : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40'}
            `}
          >
            <div className="relative h-52 overflow-hidden border-b border-[var(--color-border)] bg-white">
              <TemplateThumb template={template} />
              {isCompanyInspiredTemplate(template.name) && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-white">
                  <Sparkles className="w-2.5 h-2.5" />
                  FAANG-type
                </span>
              )}
              {template.tier === 'pro' && (
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                  <Crown className="w-2.5 h-2.5" />
                  PRO
                </span>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {template.name}
                </span>
                {selectedId === template.id && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)]">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {getTemplateBadge(template.name)}
                </span>
                {template.is_ats_safe && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                    <ShieldCheck className="w-3 h-3" />
                    ATS Safe
                  </span>
                )}
              </div>

              <p className="mt-2 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                {getTemplateDescription(template.name, template.description)}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
        <h2 className="mb-1 font-semibold text-[var(--color-text-primary)]">
          Apply <span className="text-[var(--color-accent)]">{selected?.name}</span> template
        </h2>
        <p className="mb-5 text-sm text-[var(--color-text-muted)]">
          Choose which resume to update. The template controls how your resume looks when exported.
        </p>

        {localResumes.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Upload a resume first and then come back to pick a template.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {localResumes.map(resume => {
                const currentTemplate = templates.find(t => t.id === resume.template_id)
                const isTarget = targetResume === resume.id
                const justApplied = applied === resume.id && resume.template_id === selectedId

                return (
                  <label
                    key={resume.id}
                    className={`
                      flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors
                      ${isTarget
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'}
                    `}
                  >
                    <input
                      type="radio"
                      name="resume"
                      value={resume.id}
                      checked={isTarget}
                      onChange={() => setTargetResume(resume.id)}
                      className="accent-[var(--color-accent)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                        {resume.file_name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Current: {currentTemplate?.name ?? 'None (Classic)'}
                      </p>
                    </div>
                    {justApplied && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                        Applied!
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            <button
              onClick={handleApply}
              disabled={applying || !targetResume}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {applying
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
                : <><Check className="w-4 h-4" /> Apply {selected?.name} Template</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TemplateThumb({ template }: { template: Template }) {
  const scope = `tpl-${template.id.slice(0, 8)}`
  const rendered = renderTemplate(template.html_content, pickSampleForTemplate(template.name))
  const css = template.css_content
    .replace(/body\s*\{/g, `.${scope} {`)
    .replace(/\.resume\s*\{/g, `.${scope} .resume {`)

  return (
    <>
      <style>{css}</style>
      <div
        style={{
          transform: 'scale(0.34)',
          transformOrigin: 'top left',
          width: '21cm',
          pointerEvents: 'none',
        }}
      >
        <div className={scope} dangerouslySetInnerHTML={{ __html: rendered }} />
      </div>
    </>
  )
}
