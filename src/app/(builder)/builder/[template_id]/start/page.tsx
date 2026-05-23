import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { findBuiltInTemplate } from '@/lib/builder/builtinTemplates'
import { TemplateStartClient } from '@/components/builder/TemplateStartClient'

interface PageProps {
  params: Promise<{ template_id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { template_id } = await params
  const template = await getTemplate(template_id)
  return {
    title: template ? `Start ${template.name} Resume` : 'Start Resume',
  }
}

export default async function TemplateStartPage({ params }: PageProps) {
  const { template_id } = await params
  const template = await getTemplate(template_id)
  if (!template) notFound()

  return <TemplateStartClient templateId={template.id} templateName={template.name} />
}

async function getTemplate(templateId: string): Promise<{ id: string; name: string } | null> {
  const builtIn = findBuiltInTemplate(templateId)
  if (builtIn) return { id: builtIn.id, name: builtIn.name }

  const supabase = await createClient()
  const { data } = await supabase
    .from('templates')
    .select('id, name')
    .eq('id', templateId)
    .single()

  return data
}
