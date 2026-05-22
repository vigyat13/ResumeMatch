import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sortTemplatesByPriority } from '@/lib/builder/templateOrdering'
import { isVisibleTemplate } from '@/lib/builder/templateMeta'
import { mergeWithBuiltInTemplates } from '@/lib/builder/builtinTemplates'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('templates')
    .select('id, name, description, is_ats_safe, tier, html_content, css_content, created_at')
    .order('created_at')

  if (error) {
    return NextResponse.json(
      { success: false, error: 'Unable to load templates.' },
      { status: 500 }
    )
  }

  const templates = sortTemplatesByPriority(
    mergeWithBuiltInTemplates(data).filter(template => isVisibleTemplate(template.name))
  ).slice(0, 9)

  return NextResponse.json({
    success: true,
    data: { templates },
  })
}
