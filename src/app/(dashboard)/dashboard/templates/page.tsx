import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, FileText, LayoutTemplate, ShieldCheck } from 'lucide-react'
import { BuilderTemplateBrowser } from '@/components/builder/BuilderTemplateBrowser'
import { createClient } from '@/lib/supabase/server'
import { sortTemplatesByPriority } from '@/lib/builder/templateOrdering'
import { isVisibleTemplate } from '@/lib/builder/templateMeta'
import { mergeWithBuiltInTemplates } from '@/lib/builder/builtinTemplates'

export const metadata = { title: 'Templates - ResumeMatch' }

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: allTemplates } = await supabase
    .from('templates')
    .select('id, name, description, is_ats_safe, tier, html_content, css_content')
    .order('created_at')

  const templates = sortTemplatesByPriority(
    mergeWithBuiltInTemplates(allTemplates).filter(template => isVisibleTemplate(template.name))
  )
  const atsSafeCount = templates.filter(template => template.is_ats_safe).length
  const proCount = templates.filter(template => template.tier === 'pro').length

  return (
    <div className="space-y-6 pb-8">
      <section className="border-b border-[var(--color-border)] pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Dashboard / Templates
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-4xl">
              Template library
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              Browse the same layouts used in the builder. Pick a template, edit the content, and export when the resume is ready.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[23rem]">
            <Link
              href="/builder"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Open builder <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/resumes"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent)]/35"
            >
              My resumes
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TemplateMetric icon={<LayoutTemplate className="h-4 w-4" />} label="Templates" value={templates.length} />
          <TemplateMetric icon={<ShieldCheck className="h-4 w-4" />} label="ATS-safe" value={atsSafeCount} />
          <TemplateMetric icon={<FileText className="h-4 w-4" />} label="Pro layouts" value={proCount} />
        </div>
      </section>

      {templates.length > 0 ? (
        <section>
          <BuilderTemplateBrowser templates={templates} />
        </section>
      ) : (
        <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8 text-center">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            No templates found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
            The template table is empty right now. Add templates in Supabase and they will appear here automatically.
          </p>
        </section>
      )}
    </div>
  )
}

function TemplateMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-accent)]">
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold leading-none text-[var(--color-text-primary)]">{value}</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  )
}
