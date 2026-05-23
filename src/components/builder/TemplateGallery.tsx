'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import {
  getTemplateBadge,
  getTemplateDescription,
  isCompanyInspiredTemplate,
} from '@/lib/builder/templateMeta'
import { pickSampleForTemplate } from '@/lib/builder/types'
import { TemplatePreviewClient } from '@/components/templates/TemplatePreviewClient'

interface Template {
  id:           string
  name:         string
  description:  string | null
  is_ats_safe:  boolean | null
  tier:         string | null
  html_content: string
  css_content:  string
}

interface Props {
  templates: Template[]
}

const PAGE_SIZE = 20

export function TemplateGallery({ templates }: Props) {
  const [shown, setShown] = useState(PAGE_SIZE)

  const visible  = templates.slice(0, shown)
  const hasMore  = shown < templates.length
  const remaining = templates.length - shown

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map(t => {
          // Pick persona-matched sample for a more realistic thumbnail
          const sample = pickSampleForTemplate(t.name)
          return (
            <Link
              key={t.id}
              href={`/builder/${t.id}/start`}
              className="group overflow-hidden rounded-2xl border border-black/[0.02] bg-[var(--rm-panel)] transition-colors duration-200 hover:border-[var(--rm-green)]/45 focus:outline-none focus-visible:border-[var(--rm-green)]"
            >
              {/* Live preview thumbnail */}
              <div className="relative h-72 overflow-hidden bg-white sm:h-64">
                <TemplatePreviewClient template={t} sample={sample} scale={0.23} />
                {isCompanyInspiredTemplate(t.name) && (
                  <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-md bg-slate-950 px-2 py-1 text-[10px] font-bold text-white">
                    Company style
                  </div>
                )}
                {t.tier === 'pro' && (
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md bg-amber-400 px-2 py-1 text-[9px] font-bold text-amber-900">
                    PRO
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 z-10 flex justify-end bg-gradient-to-t from-black/35 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-md">
                    Use this template <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>

              {/* Card info */}
              <div className="border-t border-[var(--rm-line)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold leading-tight text-[var(--rm-text)]">{t.name}</h3>
                  <ArrowUpRight className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--rm-soft)] transition-colors group-hover:text-[var(--rm-green)]" />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
                    {getTemplateBadge(t.name)}
                  </span>
                  {t.is_ats_safe && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--rm-green)]">
                      <CheckCircle2 className="h-3 w-3" />
                      ATS Safe
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--rm-muted)]">
                  {getTemplateDescription(t.name, t.description)}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex flex-col items-center gap-2 mt-10">
          <button
            onClick={() => setShown(s => s + PAGE_SIZE)}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-[var(--rm-line)] bg-white px-6 text-sm font-semibold text-[var(--rm-black)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:border-[var(--rm-black)]"
          >
            Load {Math.min(PAGE_SIZE, remaining)} more templates
          </button>
          <p className="text-xs font-semibold text-[var(--rm-soft)]">
            Showing {shown} of {templates.length}
          </p>
        </div>
      )}

      {!hasMore && templates.length > PAGE_SIZE && (
        <p className="mt-10 pb-4 text-center text-sm font-semibold text-[var(--rm-soft)]">
          All {templates.length} templates shown.
        </p>
      )}
    </>
  )
}
