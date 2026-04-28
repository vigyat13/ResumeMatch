import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Crown, ShieldCheck, ArrowRight, Sparkles, Zap } from 'lucide-react'
import { renderTemplate } from '@/lib/builder/render'
import { EXAMPLE_RESUME_DATA, pickSampleForTemplate } from '@/lib/builder/types'
import { getTemplateBadge, getTemplateDescription, isCompanyInspiredTemplate } from '@/lib/builder/templateMeta'

export const metadata = {
  title: 'Resume Builder — Pick a Template',
  description: 'Choose from professional and company-inspired resume templates. No account needed to start.',
}

const CATEGORIES: Record<string, string[]> = {
  'All':          [],
  'FAANG':        ['Google Style', 'Amazon Style', 'Meta Style', 'Apple Style', 'Microsoft Style', 'Netflix Style', 'Stripe Style'],
  'Professional': ['Classic', 'Executive', 'Consulting', 'Finance', 'Senior Executive', 'Elegant Serif', 'Dark Professional', 'Charcoal', 'Jakes Resume', 'ATS Pure', 'Corporate Classic', 'Harvard Format', 'Compact Pro'],
  'Modern':       ['Modern', 'Minimal', 'Bold Header', 'Startup', 'Sharp Lines', 'Tech Minimal', 'Left Accent'],
  'Two Column':   ['Navy Sidebar', 'Two Column Pro', 'Data Scientist'],
  'Specialty':    ['Technical', 'LinkedIn', 'Academic Research', 'Product Manager', 'Entry Level'],
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
  const exampleHtml = exampleTemplate
    ? renderTemplate(exampleTemplate.html_content, EXAMPLE_RESUME_DATA)
    : ''
  const exampleCss = (exampleTemplate?.css_content ?? '')
    .replace(/body\s*\{/g, '.eg-preview {')

  const categoryNames = CATEGORIES[category] ?? []
  const templates = category === 'All'
    ? (allTemplates ?? [])
    : (allTemplates ?? []).filter(t => categoryNames.includes(t.name))

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
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col lg:flex-row items-center gap-16">

          {/* Left copy */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border"
              style={{ background: 'hsl(var(--accent)/0.1)', borderColor: 'hsl(var(--accent)/0.3)', color: 'hsl(var(--accent))' }}>
              <Zap className="w-3 h-3" />
              Build your resume in minutes
            </div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight font-headline">
              Build a resume<br />
              <span className="text-primary">that gets interviews</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
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
            <div className="flex gap-10 pt-2">
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
          <div className="relative flex-shrink-0 hidden lg:block">
            <div className="absolute -inset-6 rounded-3xl blur-2xl opacity-30"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }} />
            <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-border bg-white"
              style={{ width: '264px', height: '360px' }}>
              <style>{exampleCss}</style>
              <div style={{ transform: 'scale(0.34)', transformOrigin: 'top left', width: '21cm', pointerEvents: 'none' }}>
                <div className="eg-preview" dangerouslySetInnerHTML={{ __html: exampleHtml }} />
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 pb-4 pt-8">
                <p className="text-white text-xs font-semibold">
                  Sample resume · {exampleTemplate?.name ?? 'Template'}
                </p>
                <p className="text-white/55 text-[10px] mt-0.5">Scroll down to pick yours →</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Template Gallery ────────────────────────────────── */}
      <div id="templates" className="max-w-7xl mx-auto px-6 py-12">

        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold font-headline">Choose your template</h2>
            <p className="text-muted-foreground text-sm mt-1">All templates are ATS-safe unless marked otherwise</p>
          </div>
          <span className="text-sm text-muted-foreground">{templates.length} shown</span>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.keys(CATEGORIES).map(cat => (
            <Link
              key={cat}
              href={`/builder?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
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

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {templates.map(t => {
            // Each template renders against the persona it was designed for —
            // a "Product Manager" template gets the PM sample, a "Minimal"
            // template gets the designer, FAANG/professional templates get
            // the engineer. Coherent variety per card.
            const sample   = pickSampleForTemplate(t.name)
            const rendered = renderTemplate(t.html_content, sample)
            const css = t.css_content.replace(/body\s*\{/g, `.tpl-${t.id.slice(0,8)} {`)
            return (
              <Link
                key={t.id}
                href={`/builder/${t.id}`}
                className="group rounded-2xl border-2 border-border hover:border-primary overflow-hidden transition-all duration-200 hover:shadow-xl bg-card"
              >
                {/* Live preview thumbnail */}
                <div className="h-64 bg-white relative overflow-hidden">
                  <style>{css}</style>
                  <div
                    style={{ transform: 'scale(0.39)', transformOrigin: 'top left', width: '21cm', pointerEvents: 'none' }}
                  >
                    <div className={`tpl-${t.id.slice(0,8)}`} dangerouslySetInnerHTML={{ __html: rendered }} />
                  </div>
                  {isCompanyInspiredTemplate(t.name) && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 text-white z-10">
                      <Sparkles className="w-2.5 h-2.5" /> FAANG-type
                    </div>
                  )}
                  {t.tier === 'pro' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 z-10">
                      <Crown className="w-2.5 h-2.5" /> PRO
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-white px-3 py-1.5 rounded-full shadow-md">
                      Use this <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Card info */}
                <div className="p-4 border-t border-border">
                  <h3 className="font-semibold text-sm text-foreground leading-tight">{t.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                      {getTemplateBadge(t.name)}
                    </span>
                    {t.is_ats_safe && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                        <ShieldCheck className="w-3 h-3" /> ATS Safe
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-2">
                    {getTemplateDescription(t.name, t.description)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-12 pb-4">
          Pick a template and start building your resume instantly.
        </p>
      </div>
    </div>
  )
}
