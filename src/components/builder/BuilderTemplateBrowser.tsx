'use client'

import { useMemo, useState } from 'react'
import { TemplateGallery } from './TemplateGallery'
import { sortTemplatesByPriority } from '@/lib/builder/templateOrdering'

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
  Tech:           ['FAANG Standard', 'Modern Tech', 'ML Engineer', 'Backend Engineer', 'Frontend Engineer', 'Data Science'],
  Professional:   ['Executive', 'Consulting', 'Product Manager', 'Simple Universal'],
  Minimal:        ['Minimal', 'Mono Clean', 'High Density'],
  'Two Column':   ['Two Column', 'Europass'],
  Specialty:      ['Academic', 'Startup', 'Creative', 'Intern / Entry Level', 'UK CV'],
}

export function BuilderTemplateBrowser({ templates }: { templates: Template[] }) {
  const [category, setCategory] = useState('All')

  const visibleTemplates = useMemo(() => {
    const categoryNames = CATEGORIES[category] ?? []
    return sortTemplatesByPriority(
      category === 'All'
        ? templates
        : templates.filter(t => categoryNames.includes(t.name))
    )
  }, [category, templates])

  return (
    <>
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-headline), sans-serif', fontSize: 'clamp(28px, 4vw, 50px)', lineHeight: 0.93, letterSpacing: '-0.01em', color: 'var(--color-marketing-text)', fontWeight: 700, margin: 0 }}>
            Choose your template
          </h2>
          <p className="text-[rgba(245,240,232,0.45)] text-base mt-2">
            All templates are ATS-safe unless marked otherwise
          </p>
        </div>
        <span className="text-sm text-[rgba(245,240,232,0.45)] sm:pb-1 sm:text-base">{visibleTemplates.length} templates</span>
      </div>

      <div className="-mx-4 mb-8 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {Object.entries(CATEGORIES).map(([cat, names]) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${
              category === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
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

      <TemplateGallery templates={visibleTemplates} />
    </>
  )
}
