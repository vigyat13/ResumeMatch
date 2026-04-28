/**
 * BUILDER EDITOR PAGE
 *
 * Route: /builder/[template_id] (PUBLIC — no auth)
 *
 * Server Component — fetches the template by ID server-side.
 * Passes html_content and css_content as props to BuilderEditor (Client Component).
 *
 * Why fetch server-side even though this page is public?
 *  1. Faster first paint — HTML arrives with data, no loading spinner
 *  2. The Supabase anon key is still kept in .env.local for server use
 *  3. Client Component (BuilderEditor) gets static props, not dynamic fetch
 *
 * If template not found: 404.
 */

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BuilderEditor } from '@/components/builder/BuilderEditor'

interface PageProps {
  params: Promise<{ template_id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { template_id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('templates')
    .select('name')
    .eq('id', template_id)
    .single()

  return {
    title: data ? `${data.name} Template — Build Your Resume` : 'Build Your Resume',
  }
}

export default async function BuilderEditorPage({ params }: PageProps) {
  const { template_id } = await params
  const supabase = await createClient()

  const { data: template } = await supabase
    .from('templates')
    .select('id, name, html_content, css_content')
    .eq('id', template_id)
    .single()

  if (!template) notFound()

  return (
    <BuilderEditor
      templateId={template.id}
      templateName={template.name}
      templateHtml={template.html_content}
      templateCss={template.css_content}
    />
  )
}
