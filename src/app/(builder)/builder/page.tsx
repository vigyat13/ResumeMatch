import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EXAMPLE_RESUME_DATA } from '@/lib/builder/types'
import { TemplatePreviewClient } from '@/components/templates/TemplatePreviewClient'
import { BuilderTemplateBrowser } from '@/components/builder/BuilderTemplateBrowser'
import { isCompanyInspiredTemplate } from '@/lib/builder/templateMeta'
import { sortTemplatesByPriority } from '@/lib/builder/templateOrdering'

export const metadata = {
  title: 'Resume Builder — Pick a Template',
  description: 'Choose from professional and company-inspired resume templates. No account needed to start.',
}

export default async function BuilderPage() {
  const supabase = await createClient()

  const { data: allTemplates } = await supabase
    .from('templates')
    .select('id, name, description, is_ats_safe, tier, html_content, css_content')
    .order('created_at')

  const exampleTemplate = allTemplates?.find(t => t.name === 'Classic') ?? allTemplates?.[0]
  const templates = sortTemplatesByPriority(allTemplates ?? [])

  const total = allTemplates?.length ?? 0
  const featuredTemplate =
    allTemplates?.find(t => isCompanyInspiredTemplate(t.name))
    ?? exampleTemplate

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "var(--font-body), 'Helvetica Neue', sans-serif",
        background: 'var(--color-marketing-bg)',
        color: 'var(--color-marketing-text)',
      }}
    >

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-sm"
        style={{
          borderBottom: '1px solid rgba(245,240,232,0.055)',
          background: 'rgba(8,8,8,0.82)',
        }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" style={{ fontFamily: 'var(--font-headline), sans-serif', fontSize: 22, letterSpacing: '0.01em', fontWeight: 700 }}>
            Resume<span style={{ color: 'var(--color-marketing-accent)' }}>Match</span>
          </Link>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link href="/login"
              className="hidden px-3 py-1.5 text-sm text-[rgba(245,240,232,0.55)] transition-colors hover:text-[var(--color-marketing-text)] sm:inline-flex">
              Sign in
            </Link>
            <Link href="/signup"
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:px-4">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(245,240,232,0.055)', background: 'var(--color-marketing-surface)' }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:flex-row lg:items-center lg:gap-20 lg:py-[4.5rem]">

          {/* Left copy */}
          <div className="flex-1 max-w-[720px] space-y-6 lg:pl-1">
            <h1 style={{ fontFamily: 'var(--font-headline), sans-serif', fontSize: 'clamp(36px, 6vw, 74px)', lineHeight: 0.92, letterSpacing: '-0.01em', color: 'var(--color-marketing-text)', fontWeight: 700, margin: 0 }}>
              Build a resume<br />
              <span style={{ color: 'var(--color-marketing-accent)' }}>that gets interviews</span>
            </h1>
            <p className="max-w-[720px] text-base leading-relaxed text-[rgba(245,240,232,0.42)] sm:text-lg">
              Pick from {total}+ professional and company-inspired templates, fill in
              your details, and download a pixel-perfect PDF. Sign-in only at download.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="#templates"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm">
                Browse {total} templates →
              </a>
              {featuredTemplate && (
                <Link href={`/builder/${featuredTemplate.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-border hover:bg-accent/5 transition-colors">
                  Start with {featuredTemplate.name}
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2 sm:flex sm:gap-12">
              {[
                { value: `${total}+`, label: 'Templates' },
                { value: '7',         label: 'FAANG styles' },
                { value: '100%',      label: 'Free to edit' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'var(--font-headline), sans-serif', fontSize: 28, fontWeight: 700, color: 'var(--color-marketing-text)', lineHeight: 1 }}>{s.value}</div>
                  <div className="text-xs text-[rgba(245,240,232,0.45)] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: resume thumbnail */}
          <div className="relative hidden lg:block flex-shrink-0 lg:mr-2">
            <div className="absolute -inset-7 rounded-3xl blur-2xl opacity-25"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }} />
            <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-border bg-white"
              style={{ width: '352px', height: '480px' }}>
              {exampleTemplate && (
                <TemplatePreviewClient template={exampleTemplate} sample={EXAMPLE_RESUME_DATA} scale={0.33} />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-5 pb-5 pt-10">
                <p className="text-white text-sm font-semibold">
                  Sample resume · {exampleTemplate?.name ?? 'Template'}
                </p>
                <p className="text-white/55 text-xs mt-1">Scroll down to pick yours →</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Template Gallery ────────────────────────────────── */}
      <div id="templates" className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">

        <BuilderTemplateBrowser templates={templates} />
      </div>
    </div>
  )
}
