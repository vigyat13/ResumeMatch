import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata = { title: 'Saved Templates — ResumeMatch' }

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <ComingSoon
      feature="Saved Templates"
      description="Save your favourite templates, apply them to uploaded resumes in one click, and switch between layouts without losing your content."
      eta="Coming soon"
      backHref="/dashboard"
      bullets={[
        'Star and save templates you like',
        'Apply a template to any uploaded resume instantly',
        'Switch templates without re-entering your data',
        'Compare side-by-side before exporting',
      ]}
    />
  )
}
