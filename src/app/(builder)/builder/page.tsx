import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EXAMPLE_RESUME_DATA } from '@/lib/builder/types'
import { TemplatePreviewClient } from '@/components/templates/TemplatePreviewClient'
import { BuilderTemplateBrowser } from '@/components/builder/BuilderTemplateBrowser'
import { isCompanyInspiredTemplate, isVisibleTemplate } from '@/lib/builder/templateMeta'
import { sortTemplatesByPriority } from '@/lib/builder/templateOrdering'
import { mergeWithBuiltInTemplates } from '@/lib/builder/builtinTemplates'

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

  const visibleTemplates = mergeWithBuiltInTemplates(allTemplates).filter(template => isVisibleTemplate(template.name))
  const exampleTemplate = visibleTemplates.find(t => t.name === 'Classic') ?? visibleTemplates[0]
  const templates = sortTemplatesByPriority(visibleTemplates)

  const total = templates.length
  const featuredTemplate =
    templates.find(t => isCompanyInspiredTemplate(t.name))
    ?? exampleTemplate

  return (
    <div className="rm-builder-page">
      <style>{`
        .rm-builder-page {
          --rm-bg: var(--color-marketing-bg);
          --rm-panel: var(--color-marketing-surface);
          --rm-panel-strong: rgba(245,240,232,0.06);
          --rm-text: var(--color-marketing-text);
          --rm-muted: rgba(245,240,232,0.56);
          --rm-soft: rgba(245,240,232,0.36);
          --rm-line: var(--color-marketing-line);
          --rm-black: #080808;
          --rm-green: var(--color-marketing-accent);
          --rm-cream: rgba(245,240,232,0.04);
          min-height: 100vh;
          background: var(--rm-bg);
          color: var(--rm-text);
          font-family: var(--font-body), sans-serif;
          letter-spacing: 0;
          position: relative;
          overflow: hidden;
        }

        .rm-builder-page::before,
        .rm-builder-page::after {
          content: "";
          position: fixed;
          z-index: 0;
          pointer-events: none;
          border-radius: 50%;
        }

        .rm-builder-page::before {
          top: -15%;
          left: -8%;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(52,211,153,0.055) 0%, transparent 65%);
        }

        .rm-builder-page::after {
          top: 35%;
          right: -12%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(59,130,246,0.035) 0%, transparent 65%);
        }

        .rm-builder-page a {
          color: inherit;
          text-decoration: none;
        }

        .rm-builder-container {
          position: relative;
          z-index: 1;
          width: min(100% - 48px, 1280px);
          margin: 0 auto;
        }

        .rm-builder-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(8,8,8,0.82);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(245,240,232,0.055);
        }

        .rm-builder-header-inner {
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
        }

        .rm-builder-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 21px;
          font-weight: 760;
          letter-spacing: -0.01em;
        }

        .rm-builder-brand-match {
          color: var(--rm-green);
        }

        .rm-builder-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 620;
        }

        .rm-builder-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 38px;
          border-radius: 999px;
          padding: 0 18px;
          font-size: 15px;
          font-weight: 650;
          transition: transform 150ms ease, background 150ms ease, box-shadow 150ms ease;
        }

        .rm-builder-button:active {
          transform: scale(0.97);
        }

        .rm-builder-button.primary {
          background: var(--rm-green);
          color: var(--rm-bg);
        }

        .rm-builder-button.primary:hover {
          background: #65e2b0;
        }

        .rm-builder-button.secondary {
          background: rgba(245,240,232,0.04);
          color: var(--rm-text);
          box-shadow: 0 0 0 1px rgba(245,240,232,0.10);
        }

        .rm-builder-button.secondary:hover {
          background: rgba(245,240,232,0.07);
          box-shadow: 0 0 0 1px rgba(245,240,232,0.18);
        }

        .rm-builder-hero {
          padding: 42px 0 58px;
          background: transparent;
        }

        .rm-builder-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          align-items: center;
          gap: 72px;
        }

        .rm-builder-copy {
          max-width: 720px;
        }

        .rm-builder-copy h1 {
          max-width: 720px;
          font-size: clamp(36px, 4.8vw, 58px);
          line-height: 1;
          letter-spacing: -0.035em;
          font-weight: 650;
        }

        .rm-builder-copy h1 span {
          color: var(--rm-green);
        }

        .rm-builder-copy p {
          margin-top: 22px;
          max-width: 620px;
          color: rgba(245,240,232,0.52);
          font-size: clamp(16px, 1.6vw, 19px);
          line-height: 1.42;
        }

        .rm-builder-hero-actions {
          margin-top: 26px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .rm-builder-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 34px;
          margin-top: 26px;
        }

        .rm-builder-stat strong {
          display: block;
          color: var(--rm-text);
          font-size: 28px;
          line-height: 1;
          font-weight: 750;
          letter-spacing: -0.025em;
        }

        .rm-builder-stat span {
          display: block;
          margin-top: 5px;
          color: var(--rm-soft);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .rm-builder-preview {
          position: relative;
          display: none;
        }

        .rm-builder-preview-shell {
          position: relative;
          overflow: hidden;
          width: 300px;
          height: 410px;
          border: 1px solid var(--rm-line);
          border-radius: 18px;
          background: white;
          box-shadow: 0 28px 90px rgba(0,0,0,0.28);
        }

        .rm-builder-preview-caption {
          position: absolute;
          inset-inline: 0;
          bottom: 0;
          padding: 42px 20px 20px;
          background: linear-gradient(to top, rgba(22,22,22,0.78), rgba(22,22,22,0.28), transparent);
          color: white;
        }

        .rm-builder-preview-caption p {
          font-size: 14px;
          font-weight: 650;
        }

        .rm-builder-preview-caption span {
          display: block;
          margin-top: 4px;
          color: rgba(255,255,255,0.62);
          font-size: 12px;
        }

        .rm-builder-gallery {
          position: relative;
          z-index: 1;
          border-top: 1px solid rgba(245,240,232,0.045);
          padding: 56px 0 76px;
          background: linear-gradient(180deg, rgba(245,240,232,0.012), rgba(52,211,153,0.018), rgba(245,240,232,0.008));
        }

        @media (min-width: 1024px) {
          .rm-builder-preview {
            display: block;
          }
        }

        @media (max-width: 980px) {
          .rm-builder-container {
            width: min(100% - 32px, 1280px);
          }

          .rm-builder-hero {
            padding-top: 48px;
          }

          .rm-builder-hero-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .rm-builder-header-inner {
            height: 62px;
          }

          .rm-builder-brand {
            font-size: 18px;
          }

          .rm-builder-actions a:first-child {
            display: none;
          }

          .rm-builder-button {
            min-height: 38px;
            padding: 0 14px;
            font-size: 14px;
          }

          .rm-builder-copy h1 {
            font-size: clamp(34px, 11vw, 46px);
          }

          .rm-builder-copy p {
            font-size: 18px;
          }
        }
      `}</style>

      <nav className="rm-builder-header">
        <div className="rm-builder-container rm-builder-header-inner">
          <Link href="/" className="rm-builder-brand">
            <span>Resume<span className="rm-builder-brand-match">Match</span></span>
          </Link>
          <div className="rm-builder-actions">
            <Link href="/login" className="rm-builder-button secondary">
              Sign in
            </Link>
            <Link href="/login?next=/dashboard/templates" className="rm-builder-button primary">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <section className="rm-builder-hero">
        <div className="rm-builder-container rm-builder-hero-grid">
          <div className="rm-builder-copy">
            <h1>
              Build a resume<br />
              <span>that gets interviews</span>
            </h1>
            <p>
              Pick from {total}+ professional and company-inspired templates, fill in
              your details, and download a pixel-perfect PDF. Sign-in only at download.
            </p>
            <div className="rm-builder-hero-actions">
              <a href="#templates" className="rm-builder-button primary">
                Browse {total} templates →
              </a>
              {featuredTemplate && (
                <Link href={`/builder/${featuredTemplate.id}/start`} className="rm-builder-button secondary">
                  Start with {featuredTemplate.name}
                </Link>
              )}
            </div>
            <div className="rm-builder-stats">
              {[
                { value: `${total}+`, label: 'Templates' },
                { value: '7',         label: 'FAANG styles' },
                { value: '100%',      label: 'Free to edit' },
              ].map(s => (
                <div key={s.label} className="rm-builder-stat">
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rm-builder-preview">
            <div className="rm-builder-preview-shell">
              {exampleTemplate && (
                <TemplatePreviewClient template={exampleTemplate} sample={EXAMPLE_RESUME_DATA} scale={0.33} />
              )}
              <div className="rm-builder-preview-caption">
                <p>Sample resume · {exampleTemplate?.name ?? 'Template'}</p>
                <span>Scroll down to pick yours →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="templates" className="rm-builder-gallery">
        <div className="rm-builder-container">
        <BuilderTemplateBrowser templates={templates} />
        </div>
      </section>
    </div>
  )
}
