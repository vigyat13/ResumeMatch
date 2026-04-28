import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata = { title: 'My Resumes — ResumeMatch' }

export default async function ResumesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <ComingSoon
      feature="Resume Library"
      description="Upload existing PDFs or Word docs, manage multiple resume versions, and run ATS audits to see how parsers read your resume."
      eta="Coming soon"
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      bullets={[
        'Upload PDF or .docx resumes',
        'ATS parsing score for any uploaded resume',
        'Manage multiple versions — tailor per role',
        'One-click apply template to uploaded resume',
      ]}
    />
  )
}
