'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { TemplateGallery } from './TemplateGallery'
import { sortTemplatesByPriority } from '@/lib/builder/templateOrdering'
import { getTemplateBadge, getTemplateDescription, isVisibleTemplate } from '@/lib/builder/templateMeta'

interface Template {
  id:           string
  name:         string
  description:  string | null
  is_ats_safe:  boolean | null
  tier:         string | null
  html_content: string
  css_content:  string
}

const CATEGORIES: Record<string, string[]> = {
  All:            [],
  Tech:           ['FAANG Standard', 'Modern Tech', 'ML Engineer', 'Backend Engineer', 'Frontend Engineer', 'Data Science', 'Cybersecurity', 'Cloud DevOps'],
  Commerce:       ['Commerce Analyst', 'Accounting & Finance', 'Banking & Risk'],
  Business:       ['Marketing & Sales', 'HR & Admin', 'Operations & Supply Chain', 'General Professional'],
  Professional:   ['Executive', 'Consulting', 'Product Manager', 'Simple Universal', 'General Professional'],
  Minimal:        ['Minimal', 'Mono Clean', 'High Density'],
  'Two Column':   ['Europass'],
  Specialty:      ['Academic', 'Startup', 'Creative', 'Intern / Entry Level', 'UK CV', 'UI UX Designer'],
}

export function BuilderTemplateBrowser({ templates }: { templates: Template[] }) {
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')

  const availableTemplates = useMemo(
    () => templates.filter(template => isVisibleTemplate(template.name)),
    [templates]
  )

  const visibleTemplates = useMemo(() => {
    const categoryNames = CATEGORIES[category] ?? []
    const normalizedQuery = query.trim().toLowerCase()
    const categoryTemplates =
      category === 'All'
        ? availableTemplates
        : availableTemplates.filter(t => categoryNames.includes(t.name))

    return sortTemplatesByPriority(
      normalizedQuery
        ? categoryTemplates.filter(t => {
            const haystack = [
              t.name,
              getTemplateBadge(t.name),
              getTemplateDescription(t.name, t.description),
              t.tier ?? '',
            ].join(' ').toLowerCase()
            return haystack.includes(normalizedQuery)
          })
        : categoryTemplates
    )
  }, [availableTemplates, category, query])

  return (
    <>
      <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-end">
        <div className="min-w-0">
          <h2
            className="text-[var(--rm-text)]"
            style={{
              fontSize: 'clamp(30px, 3vw, 42px)',
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              fontWeight: 650,
            }}
          >
            Browse layouts
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--rm-muted)]">
            Filter by role, format, or style. Each selection opens the full editor with live preview and export.
          </p>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--rm-soft)]" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search templates"
            className="h-12 w-full rounded-full border border-[var(--rm-line)] bg-[rgba(245,240,232,0.04)] pl-11 pr-4 text-sm font-medium text-[var(--rm-text)] outline-none transition-colors placeholder:text-[var(--rm-soft)] focus:border-[var(--rm-green)]"
          />
        </label>
      </div>

      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {Object.entries(CATEGORIES).map(([cat, names]) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`h-10 flex-shrink-0 rounded-full px-4 text-sm font-semibold transition-all ${
                category === cat
                  ? 'border border-[var(--rm-green)] bg-[var(--rm-green)] text-[var(--rm-bg)]'
                  : 'border border-[var(--rm-line)] bg-[rgba(245,240,232,0.04)] text-[var(--rm-muted)] hover:border-[var(--rm-green)] hover:text-[var(--rm-text)]'
              }`}
            >
              {cat}
              {cat !== 'All' && (
                <span className={`ml-1.5 text-[10px] ${category === cat ? 'opacity-70' : 'opacity-50'}`}>
                  {names.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="text-sm font-semibold text-[var(--rm-soft)]">
          {visibleTemplates.length} shown
        </span>
      </div>

      {visibleTemplates.length > 0 ? (
        <TemplateGallery templates={visibleTemplates} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--rm-line)] bg-[var(--rm-panel)] px-5 py-12 text-center">
          <p className="text-base font-semibold text-[var(--rm-text)]">No templates match that filter</p>
          <p className="mt-2 text-sm text-[var(--rm-muted)]">Try another keyword or switch back to All.</p>
        </div>
      )}
    </>
  )
}
