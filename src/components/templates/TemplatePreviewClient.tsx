'use client'

import dynamic from 'next/dynamic'
import type { ResumeData } from '@/lib/builder/types'

const TemplatePreview = dynamic(
  () => import('./TemplatePreview').then(mod => mod.TemplatePreview),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-white" />,
  }
)

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
  className?: string
}

export function TemplatePreviewClient(props: Props) {
  return <TemplatePreview {...props} />
}
