import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, Sparkles } from 'lucide-react'
import { EXAMPLE_RESUME_DATA } from '@/lib/builder/types'
import { TemplatePreviewClient } from '@/components/templates/TemplatePreviewClient'
import { TemplateGallery } from '@/components/builder/TemplateGallery'
import { isCompanyInspiredTemplate } from '@/lib/builder/templateMeta'
import { sortTemplatesByPriority } from '@/lib/builder/templateOrdering'

export const metadata = {
  title: 'Resume Builder — Pick a Template',
  description: 'Choose from professional and company-inspired resume templates. No account needed to start.',
}

const CATEGORIES: Record<string, string[]> = {
  'All':          [],
  'Tech':         ['FAANG Standard', 'Modern Tech', 'ML Engineer', 'Backend Engineer', 'Frontend Engineer', 'Data Science'],
  'Professional': ['Executive', 'Consulting', 'Product Manager', 'Simple Universal'],
  'Minimal':      ['Minimal', 'Mono Clean', 'High Density'],
  'Two Column':   ['Two Column', 'Europass'],
  'Specialty':    ['Academic', 'Startup', 'Creative', 'Intern / Entry Level', 'UK CV'],
}

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category = 'All' } = await searchParams
  const supabase = await createClient()

  const { data: allTemplates } = await supabase
    .from('templates')
    .select('id, name, description, is_ats_safe, tier, html_content, css_content')
    .order('created_at')

  const exampleTemplate = allTemplates?.find(t => t.name === 'Classic') ?? allTemplates?.[0]
  const categoryNames = CATEGORIES[category] ?? []
  const templates = sortTemplatesByPriority(
    category === 'All'
      ? (allTemplates ?? [])
      : (allTemplates ?? []).filter(t => categoryNames.includes(t.name))
  )

  const total = allTemplates?.length ?? 0
  const featuredTemplate =
    allTemplates?.find(t => isCompanyInspiredTemplate(t.name))
    ?? exampleTemplate

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            Resume<span className="text-primary">Match</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/signup"
              className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-[4.5rem] flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-20">

          {/* Left copy */}
          <div className="flex-1 max-w-[720px] space-y-6 lg:pl-1">
            <h1 className="text-[4rem] lg:text-[4.6rem] font-bold leading-[0.94] tracking-[-0.03em] font-headline text-[#f3efe8] m-0">
              Build a resume<br />
              <span className="text-[#69e0ab]">that gets interviews</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-[720px]">
              Pick from {total}+ professional and company-inspired templates, fill in
              your details, and download a pixel-perfect PDF. Sign-in only at download.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="#templates"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm">
                Browse {total} templates <ArrowRight className="w-4 h-4" />
              </a>
              {featuredTemplate && (
                <Link href={`/builder/${featuredTemplate.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-border hover:bg-accent/5 transition-colors">
                  Start with {featuredTemplate.name}
                </Link>
              )}
            </div>
            <div className="flex gap-12 pt-2">
              {[
                { value: `${total}+`, label: 'Templates' },
                { value: '7',         label: 'FAANG styles' },
                { value: '100%',      label: 'Free to edit' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-bold font-headline text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
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
      <div id="templates" className="max-w-7xl mx-auto px-6 pt-14 pb-10">

        {/* Section header */}
        <div className="flex items-end justify-between mb-7">
          <div>
            <h2 className="text-3xl lg:text-[3.1rem] leading-none font-bold font-headline tracking-tight text-[#f3efe8] m-0">
              Choose your template
            </h2>
            <p className="text-muted-foreground text-base mt-2">
              All templates are ATS-safe unless marked otherwise
            </p>
          </div>
          <span className="text-base text-muted-foreground pb-1">{templates.length} templates</span>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {Object.keys(CATEGORIES).map(cat => (
            <Link
              key={cat}
              href={`/builder?category=${encodeURIComponent(cat)}`}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
            >
              {cat}
              {cat !== 'All' && (
                <span className={`ml-1.5 text-[10px] ${category === cat ? 'opacity-70' : 'opacity-50'}`}>
                  {CATEGORIES[cat].length}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Grid — client component handles show-20 / load-more */}
        <TemplateGallery templates={templates} />
      </div>
    </div>
  )
}
