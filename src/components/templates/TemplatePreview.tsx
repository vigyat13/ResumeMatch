'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { renderTemplate } from '@/lib/builder/render'
import { EXAMPLE_RESUME_DATA, type ResumeData } from '@/lib/builder/types'
import { scopeTemplateCss } from '@/lib/builder/scopeCss'

interface TemplateLike {
  id: string
  name: string
  html_content: string
  css_content: string
}

interface Props {
  template: TemplateLike
  sample?: ResumeData
  scale?: number
  fit?: 'cover' | 'contain'
  className?: string
}

const PAGE_WIDTH  = 794
const PAGE_HEIGHT = 1123

// Appended after every template's CSS to make links and text ATS-safe B&W.
// Only overrides colors — does not touch layout-structural backgrounds.
const ATS_OVERRIDE = `
  .preview-sheet a          { color: #111 !important; text-decoration: none !important; }
  .preview-sheet            { color: #111; }
`

export function TemplatePreview({
  template,
  sample,
  scale = 0.28,
  fit = 'cover',
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Start at the prop value so the first paint uses a reasonable scale.
  // The effect immediately re-measures and corrects if needed.
  const [fitScale, setFitScale] = useState(scale)

  const rendered = useMemo(
    () => renderTemplate(template.html_content, sample ?? EXAMPLE_RESUME_DATA),
    [sample, template.html_content]
  )

  const scopedCss = useMemo(
    () =>
      scopeTemplateCss(template.css_content, '.preview-sheet') +
      ATS_OVERRIDE,
    [template.css_content]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const compute = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      const xScale = width / PAGE_WIDTH
      const yScale = height / PAGE_HEIGHT
      const next = fit === 'contain'
        ? Math.min(xScale, yScale)
        : Math.max(xScale, yScale)
      setFitScale(Number.isFinite(next) && next > 0 ? next : scale)
    }

    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [fit, scale])

  return (
    <div ref={containerRef} className={`relative h-full w-full overflow-hidden bg-white ${className}`}>
      <style>{scopedCss}</style>
      <div
        style={{
          position:        fit === 'contain' ? 'absolute' : 'relative',
          left:            fit === 'contain' ? '50%' : undefined,
          top:             fit === 'contain' ? '50%' : undefined,
          transform:       fit === 'contain'
            ? `translate(-50%, -50%) scale(${fitScale})`
            : `scale(${fitScale})`,
          transformOrigin: fit === 'contain' ? 'center center' : 'top left',
          width:           `${PAGE_WIDTH}px`,
          height:          `${PAGE_HEIGHT}px`,
          pointerEvents:   'none',
          background:      'white',
        }}
      >
        <div className="preview-sheet" dangerouslySetInnerHTML={{ __html: rendered }} />
      </div>
    </div>
  )
}
