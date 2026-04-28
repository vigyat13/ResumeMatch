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

interface Props {
  templateHtml: string
  templateCss:  string
  data:         ResumeData
}

export function LivePreview({ templateHtml, templateCss, data }: Props) {
  const renderedHtml = useMemo(
    () => renderTemplate(templateHtml, data),
    [templateHtml, data]
  )

  // Scope the template CSS to .preview-sheet so it doesn't leak
  const scopedCss = templateCss
    .replace(/body\s*\{/g, '.preview-sheet {')
    .replace(/\.resume\s*\{/g, '.preview-sheet .resume {')

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

      {/* Scoped template CSS */}
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
