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

import { useMemo } from 'react'
import { renderTemplate } from '@/lib/builder/render'
import type { ResumeData } from '@/lib/builder/types'
import { scopeTemplateCss } from '@/lib/builder/scopeCss'

interface Props {
  templateHtml: string
  templateCss:  string
  data:         ResumeData
}

// Same ATS override applied in TemplatePreview so the live builder view
// matches the gallery thumbnails exactly.
const ATS_OVERRIDE = `
  .preview-sheet a          { color: #111 !important; text-decoration: none !important; }
  .preview-sheet *          { color: inherit; }
  .preview-sheet            { color: #111; }
`

export function LivePreview({ templateHtml, templateCss, data }: Props) {
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
      ATS_OVERRIDE,
    [templateCss]
  )

  return (
    <>
      {/* Print-only global style: hide everything except the preview */}
      <style>{`
        @media print {
          body > *:not(.print-target) { display: none !important; }
          .print-target { display: block !important; position: fixed; inset: 0; z-index: 9999; }
          .preview-sheet { box-shadow: none !important; }
        }
      `}</style>

      {/* Scoped template CSS + ATS override */}
      <style>{scopedCss}</style>

      {/* The resume preview */}
      <div
        className="preview-sheet bg-white shadow-xl rounded-lg overflow-auto"
        style={{ minHeight: '29.7cm', width: '21cm', maxWidth: '100%', padding: '1cm' }}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </>
  )
}
