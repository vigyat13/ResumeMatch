/**
 * TEMPLATES PAGE
 *
 * Route: /dashboard/templates
 *
 * Server Component — fetches templates + user's resumes, passes to carousel.
 *
 * Architecture concept — WHY Server Component here?
 *  The list of templates is the same for all users (public data).
 *  Fetching it server-side means:
 *  1. Zero loading state visible to the user (data arrives with the HTML)
 *  2. Supabase keys never exposed to the browser
 *  3. The carousel Client Component gets data via props — no client-side fetch needed
 *
 * Template concept: A template is a HTML/CSS layout shell with {{placeholder}} slots.
 * When applied to a resume, the export engine substitutes the user's data into those slots.
 * The template_id is stored on the resume row — not a copy of the template HTML.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TemplateCarousel } from '@/components/templates/TemplateCarousel'
import { LayoutTemplate } from 'lucide-react'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel: templates are public (no user filter), resumes are per-user
  const [templatesResult, resumesResult] = await Promise.all([
    supabase
      .from('templates')
      .select('id, name, description, is_ats_safe, tier, html_content, css_content')
      .order('created_at'),

    supabase
      .from('resumes')
      .select('id, file_name, template_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  const templates = templatesResult.data ?? []
  const resumes   = resumesResult.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <LayoutTemplate className="w-5 h-5 text-[var(--color-accent)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Resume Templates</h1>
        </div>
        <p className="text-[var(--color-text-muted)]">
          Browse templates and apply one to any of your resumes with a single click.
        </p>
      </div>

      {/* Concept callout — how templates work */}
      <div className="rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
        <strong className="text-[var(--color-text-primary)]">How templates work:</strong>{' '}
        Each template is an HTML/CSS layout. When you export a resume, your data is injected
        into the template&apos;s placeholder slots. All templates are ATS-safe — no graphics, tables,
        or columns that confuse parsers.
      </div>

      <TemplateCarousel templates={templates} resumes={resumes} />
    </div>
  )
}
