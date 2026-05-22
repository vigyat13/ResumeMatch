'use client'

/**
 * LIVE PREVIEW
 *
 * Renders the template HTML+CSS with the user's data substituted in.
 *
 * WHY dangerouslySetInnerHTML?
 * Templates are stored as raw HTML strings in our own DB — not user input.
 * We DO escape all user-typed content via the esc() function in render.ts
 * (converts <, >, &, " to HTML entities) so XSS from form fields is prevented.
 * The template HTML itself comes from our DB, not from the user.
 *
 * WHY not an iframe?
 * An iframe with srcdoc would be cleaner for style isolation, but:
 *  1. window.print() in the parent doesn't print iframe content in all browsers
 *  2. We'd need postMessage to communicate data changes
 * Instead we inject a <style> tag with a unique scoped prefix to avoid
 * template CSS bleeding into the rest of the page.
 *
 * PRINT: @media print hides everything except .preview-sheet.
 * The builder form and controls vanish — only the resume prints.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { renderTemplate } from '@/lib/builder/render'
import type { ResumeData } from '@/lib/builder/types'
import { scopeTemplateCss } from '@/lib/builder/scopeCss'

interface Props {
  templateHtml: string
  templateCss:  string
  data:         ResumeData
  tuning:       PreviewTuning
}

// Same ATS override applied in TemplatePreview so the live builder view
// matches the gallery thumbnails exactly.
const ATS_OVERRIDE = `.preview-sheet a{color:#111!important;text-decoration:none!important}.preview-sheet *{color:inherit}.preview-sheet{color:#111}`

const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297

export interface PreviewTuning {
  spacing:       number
  contentScale:  number
  cropBottomMm:  number
}

function normalizeTuning(tuning: PreviewTuning): PreviewTuning {
  return {
    spacing:      Math.max(-2, Math.min(2, tuning.spacing)),
    contentScale: Math.max(90, Math.min(120, tuning.contentScale)),
    cropBottomMm: Math.max(0, Math.min(120, tuning.cropBottomMm)),
  }
}

export function previewPageHeightMm(tuning: PreviewTuning): number {
  return PAGE_HEIGHT_MM - normalizeTuning(tuning).cropBottomMm
}

export function previewSpacingCss(tuning: PreviewTuning, scope = '.preview-sheet'): string {
  const normalized = normalizeTuning(tuning)
  const sectionGap = 12 + normalized.spacing * 3
  const entryGap   = 8 + normalized.spacing * 2
  const bulletGap  = Math.max(1, 2 + normalized.spacing)
  const lineHeight = 1.28 + normalized.spacing * 0.04
  const pageHeight = previewPageHeightMm(normalized)
  const zoom       = normalized.contentScale / 100

  return `
    ${scope}{width:${PAGE_WIDTH_MM}mm;min-height:${pageHeight}mm;background-color:#fff;background-image:repeating-linear-gradient(to bottom,#fff 0,#fff calc(${pageHeight}mm - 1px),#d7d7d7 calc(${pageHeight}mm - 1px),#d7d7d7 ${pageHeight}mm);background-size:100% ${pageHeight}mm;overflow:hidden}
    ${scope} .cv{width:calc(100% / ${zoom})!important;min-height:${pageHeight}mm!important;height:auto!important;max-width:none!important;margin:0!important;overflow:visible!important;zoom:${zoom}}
    ${scope} h1{break-after:avoid}
    ${scope} h2{break-after:avoid;margin-top:${sectionGap}px!important;margin-bottom:${Math.max(4, sectionGap - 8)}px!important}
    ${scope} p{line-height:${lineHeight}!important;margin-bottom:${Math.max(3, bulletGap + 1)}px!important;overflow-wrap:anywhere}
    ${scope} ul{margin-top:3px!important;margin-bottom:${entryGap}px!important}
    ${scope} li{line-height:${lineHeight}!important;margin-bottom:${bulletGap}px!important;overflow-wrap:anywhere}
    ${scope} .exp-entry,${scope} .proj-entry,${scope} .edu-entry{break-inside:avoid;margin-bottom:${entryGap}px!important}
  `
}

export function LivePreview({ templateHtml, templateCss, data, tuning }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)
  const pageHeightMm = previewPageHeightMm(tuning)
  const pageRatio    = pageHeightMm / PAGE_WIDTH_MM
  const renderedHtml = useMemo(
    () => renderTemplate(templateHtml, data),
    [templateHtml, data]
  )

  // Memoize scopedCss — templateCss is a static prop that never changes while
  // the user is editing, so this avoids re-injecting the <style> tag on every
  // keystroke (which can cause a brief style flash).
  const scopedCss = useMemo(
    () =>
      scopeTemplateCss(templateCss, '.preview-sheet') +
      ATS_OVERRIDE +
      previewSpacingCss(tuning),
    [templateCss, tuning]
  )

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return

    const computePages = () => {
      const pageHeight = sheet.getBoundingClientRect().width * pageRatio
      if (!pageHeight) return
      setPageCount(Math.max(1, Math.ceil(sheet.scrollHeight / pageHeight)))
    }

    const frame = requestAnimationFrame(computePages)
    const observer = new ResizeObserver(computePages)
    observer.observe(sheet)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [pageRatio, renderedHtml, tuning])

  return (
    <>
      {/* Print-only global style: hide everything except the preview */}
      <style>{`
        @media print {
          body > *:not(.print-target) { display: none !important; }
          .print-target { display: block !important; position: fixed; inset: 0; z-index: 9999; }
          .preview-sheet { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      {/* Scoped template CSS + ATS override */}
      <style>{scopedCss}</style>

      {/* The resume preview */}
      <div className="relative">
        <div className="absolute -top-7 right-0 text-[11px] font-medium text-muted-foreground print:hidden">
          {pageCount} {tuning.cropBottomMm ? 'cropped' : 'A4'} page{pageCount === 1 ? '' : 's'}
        </div>
        <div
          ref={sheetRef}
          className="preview-sheet bg-white shadow-xl rounded-sm overflow-visible"
          style={{ width: '21cm', maxWidth: '100%' }}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </>
  )
}
