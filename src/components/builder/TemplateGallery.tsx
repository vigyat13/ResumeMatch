'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Crown, ShieldCheck, ArrowRight, Sparkles, ChevronDown } from 'lucide-react'
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

// Normalised base CSS for gallery thumbnails — overrides browser defaults so
// every card renders at a consistent text size regardless of the template's
// own CSS (which is stripped so cards don't bleed colour into each other).
const GALLERY_BASE_CSS = `
  body,html{margin:0;padding:0}
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:13px;line-height:1.4;color:#111;padding:24px 28px}
  h1{font-size:17px;font-weight:700;margin:0 0 3px}
  h2{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;border-bottom:1.5px solid #333;padding-bottom:2px;margin:10px 0 5px}
  h3{font-size:12px;font-weight:600;margin:0 0 2px}
  p,li{font-size:11.5px;line-height:1.4;margin:0 0 2px}
  ul{margin:3px 0 3px 14px;padding:0}
  a{color:inherit;text-decoration:none}
  .twocol,.two-col,.layout-two-col,.europass-wrap{display:flex;gap:0}
  .twocol .sidebar,.two-col .left,.sidebar,.left-col{width:30%;padding:16px 12px;background:#f2f2f2}
  .twocol .main,.two-col .right,.main-col,.right-col{width:70%;padding:16px 14px}
`

export function TemplateGallery({ templates }: Props) {
  const [shown, setShown] = useState(PAGE_SIZE)

  const visible  = templates.slice(0, shown)
  const hasMore  = shown < templates.length
  const remaining = templates.length - shown

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {visible.map(t => {
          // Pick persona-matched sample for a more realistic thumbnail
          const sample = pickSampleForTemplate(t.name)
          return (
            <Link
              key={t.id}
              href={`/builder/${t.id}`}
              className="group rounded-2xl border-2 border-border hover:border-primary overflow-hidden transition-all duration-200 hover:shadow-xl bg-card"
            >
              {/* Live preview thumbnail */}
              <div className="h-64 bg-white relative overflow-hidden">
                <TemplatePreviewClient template={{ ...t, css_content: GALLERY_BASE_CSS }} sample={sample} scale={0.23} />
                {isCompanyInspiredTemplate(t.name) && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 text-white z-10">
                    <Sparkles className="w-2.5 h-2.5" /> FAANG-type
                  </div>
                )}
                {t.tier === 'pro' && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 z-10">
                    <Crown className="w-2.5 h-2.5" /> PRO
                  </div>
                )}
                <div className="absolute inset-0 bg-primary/8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-white px-3 py-1.5 rounded-full shadow-md">
                    Use this <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Card info */}
              <div className="p-4 border-t border-border">
                <h3 className="font-semibold text-sm text-foreground leading-tight">{t.name}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                    {getTemplateBadge(t.name)}
                  </span>
                  {t.is_ats_safe && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                      <ShieldCheck className="w-3 h-3" /> ATS Safe
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-2">
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
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-accent/5 hover:border-primary/40 transition-all"
          >
            <ChevronDown className="w-4 h-4" />
            Load {Math.min(PAGE_SIZE, remaining)} more templates
          </button>
          <p className="text-xs text-muted-foreground">
            Showing {shown} of {templates.length}
          </p>
        </div>
      )}

      {!hasMore && templates.length > PAGE_SIZE && (
        <p className="text-center text-sm text-muted-foreground mt-10 pb-4">
          All {templates.length} templates shown.
        </p>
      )}
    </>
  )
}
