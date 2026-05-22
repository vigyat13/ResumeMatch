import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  LayoutTemplate,
  Minus,
  Search,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import {
  CookieBanner,
  HeroStats,
  LandingTemplateFlow,
  TypedHeroTitle,
} from "@/components/landing/LandingInteractive";

const examples = [
  {
    title: "Upload resume",
    body: "Parse a PDF or DOCX into clean sections before choosing a template.",
    icon: UploadCloud,
  },
  {
    title: "Improve bullets",
    body: "Rewrite weak points while preserving real companies, dates, and skills.",
    icon: Sparkles,
  },
  {
    title: "Match jobs",
    body: "Compare your resume against the job description and expose gaps.",
    icon: Search,
  },
] as const;

const comparisonRows = [
  ["Parsing", "Manual copy-paste from old documents.", "PDF/DOCX import with structured field mapping."],
  ["Templates", "One generic layout for every role.", "Role-specific ATS-safe templates for different industries."],
  ["Feedback", "Vague advice after you already applied.", "Specific fixes for skills, bullets, formatting, and match gaps."],
  ["Export", "Formatting breaks between tools.", "Builder, preview, PDF, and LaTeX stay aligned."],
  ["Applications", "Guess whether a resume fits the job.", "Compare against job descriptions before spending time applying."],
] as const;

const templates = [
  "Software Engineer",
  "Data Science",
  "Product Manager",
  "Finance Analyst",
  "Marketing",
  "Intern",
] as const;

const logoStripItems = [
  "PDF import",
  "ATS audit",
  "LaTeX export",
  "Job matching",
  "Live preview",
  "Template switching",
] as const;

export default function LandingPage() {
  return (
    <>
      <style>{`
        :root {
          --rm-bg: #f7f6f1;
          --rm-panel: #ffffff;
          --rm-panel-strong: #ebe7dd;
          --rm-text: #0f0e0e;
          --rm-muted: #3c3933;
          --rm-soft: #6f6a61;
          --rm-line: #ded8cc;
          --rm-black: #161616;
          --rm-green: #20b26b;
          --rm-cream: #fffaf0;
        }

        html { scroll-behavior: smooth; }
        body { background: var(--rm-bg); }
        a { color: inherit; text-decoration: none; }
        ::selection { background: #d8f7e4; color: var(--rm-text); }

        .rm-page {
          min-height: 100vh;
          background: var(--rm-bg);
          color: var(--rm-text);
          font-family: var(--font-body), Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          letter-spacing: 0;
        }

        .rm-container {
          width: min(100% - 48px, 1280px);
          margin: 0 auto;
        }

        .rm-header {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid rgba(15, 14, 14, 0.06);
          background: rgba(247, 246, 241, 0.9);
          backdrop-filter: blur(18px);
        }

        .rm-header-inner {
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
        }

        .rm-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 21px;
          font-family: var(--font-body), Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-weight: 760;
          letter-spacing: 0;
        }

        .rm-brand-match {
          color: var(--rm-green);
        }

        .rm-nav {
          display: flex;
          align-items: center;
          gap: 30px;
          color: var(--rm-muted);
          font-size: 14px;
          font-weight: 560;
        }

        .rm-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 620;
        }

        .rm-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          border-radius: 999px;
          padding: 0 18px;
          font-size: 15px;
          font-weight: 650;
          transition: transform 150ms ease, background 150ms ease, box-shadow 150ms ease;
        }

        .rm-button:active { transform: scale(0.97); }
        .rm-button.primary { background: var(--rm-black); color: white; }
        .rm-button.primary:hover { background: #2a2927; }
        .rm-button.secondary {
          background: white;
          color: var(--rm-black);
          box-shadow: 0 0 0 1px rgba(15,14,14,0.08), 0 2px 8px rgba(15,14,14,0.04);
        }
        .rm-button.secondary:hover { box-shadow: 0 0 0 1px rgba(32,178,107,0.22), 0 8px 22px rgba(15,14,14,0.08); }

        .rm-hero {
          display: flex;
          flex-direction: column;
          gap: 72px;
          padding: 66px 0 76px;
        }

        .rm-hero-copy {
          max-width: 980px;
        }

        .rm-hero h1,
        .rm-typed-title {
          max-width: 720px;
          font-size: clamp(36px, 4.8vw, 58px);
          line-height: 1;
          letter-spacing: 0;
          font-family: var(--font-body), Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-weight: 650;
        }

        .rm-typed-title {
          min-height: clamp(82px, 10vw, 118px);
          white-space: pre-line;
        }

        .rm-typed-cursor {
          display: inline-block;
          width: 0.06em;
          height: 0.85em;
          margin-left: 0.06em;
          background: var(--rm-green);
          vertical-align: text-top;
          transition: opacity 100ms ease;
        }

        .rm-hero p {
          margin-top: 22px;
          max-width: 620px;
          color: #302d2b;
          font-size: clamp(18px, 2vw, 22px);
          line-height: 1.32;
        }

        .rm-hero-actions {
          margin-top: 26px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .rm-hero-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 28px;
          width: 100%;
          max-width: 980px;
        }

        .rm-hero-stat-card {
          border-radius: 22px;
          border: 1px solid rgba(15,14,14,0.06);
          background: rgba(255,255,255,0.7);
          padding: 18px;
          box-shadow: 0 18px 46px rgba(15,14,14,0.045);
        }

        .rm-hero-stat-card strong {
          display: block;
          color: var(--rm-text);
          font-family: var(--font-body), Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 40px;
          line-height: 0.95;
          font-weight: 750;
          letter-spacing: 0;
          white-space: nowrap;
        }

        .rm-hero-stat-card span {
          display: block;
          margin-top: 8px;
          color: var(--rm-soft);
          font-size: 12px;
          line-height: 1.55;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .rm-logo-strip {
          border-top: 1px solid var(--rm-line);
          border-bottom: 1px solid var(--rm-line);
          background: rgba(255,255,255,0.42);
        }

        .rm-logo-strip .rm-container {
          display: flex;
          justify-content: center;
          gap: 38px;
          overflow-x: auto;
          padding: 20px 0;
        }

        .rm-logo-strip span {
          white-space: nowrap;
          color: #817b71;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .rm-flow-section {
          overflow: hidden;
          border-top: 1px solid var(--rm-line);
          border-bottom: 1px solid var(--rm-line);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.72), rgba(235,231,221,0.58)),
            var(--rm-bg);
          padding: 70px 0 62px;
        }

        .rm-flow-stage {
          position: relative;
          min-height: 520px;
        }

        .rm-flow-track {
          position: relative;
          height: 470px;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1200px;
        }

        .rm-flow-card {
          position: absolute;
          width: min(78vw, 360px);
          overflow: hidden;
          border: 1px solid var(--rm-line);
          border-radius: 18px;
          background: var(--rm-panel);
          box-shadow: 0 28px 90px rgba(22,22,22,0.16);
          transition: transform 520ms ease, opacity 520ms ease, border-color 520ms ease;
        }

        .rm-flow-card.active {
          border-color: rgba(32,178,107,0.48);
          box-shadow: 0 34px 100px rgba(22,22,22,0.18), 0 0 0 1px rgba(32,178,107,0.18);
        }

        .rm-flow-card.hidden-card {
          pointer-events: none;
        }

        .rm-flow-preview {
          height: 270px;
          overflow: hidden;
          border-bottom: 1px solid var(--rm-line);
          background: #f8faf8;
        }

        .rm-flow-card-body {
          padding: 20px 22px 24px;
          color: var(--rm-text);
        }

        .rm-flow-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .rm-flow-card h3 {
          font-size: 22px;
          line-height: 1.1;
          font-weight: 720;
          letter-spacing: -0.02em;
        }

        .rm-flow-card-head span {
          flex: none;
          border-radius: 999px;
          background: rgba(32,178,107,0.10);
          padding: 8px 12px;
          color: var(--rm-green);
          font-size: 13px;
          font-weight: 800;
        }

        .rm-flow-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 9px;
          margin-top: 14px;
          font-size: 11px;
          font-weight: 800;
        }

        .rm-flow-meta span {
          border-radius: 999px;
          background: white;
          padding: 6px 9px;
          color: var(--rm-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .rm-flow-meta strong {
          color: var(--rm-green);
        }

        .rm-flow-card p {
          margin-top: 14px;
          color: var(--rm-muted);
          font-size: 15px;
          line-height: 1.45;
        }

        .rm-flow-arrow {
          position: absolute;
          top: 43%;
          z-index: 45;
          display: grid;
          place-items: center;
          width: 56px;
          height: 56px;
          border: 0;
          border-radius: 50%;
          background: var(--rm-green);
          color: white;
          box-shadow: 0 12px 34px rgba(22,22,22,0.16);
          cursor: pointer;
          transition: transform 150ms ease, background 150ms ease;
        }

        .rm-flow-arrow:hover {
          background: #277a59;
          transform: scale(1.04);
        }

        .rm-flow-arrow.left {
          left: calc(50% - 420px);
        }

        .rm-flow-arrow.right {
          right: calc(50% - 420px);
        }

        .rm-flow-dots {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .rm-flow-dots button {
          width: 10px;
          height: 10px;
          border: 0;
          border-radius: 999px;
          background: rgba(22,22,22,0.16);
          cursor: pointer;
        }

        .rm-flow-dots button.active {
          width: 30px;
          background: var(--rm-green);
        }

        .rm-section {
          padding: 92px 0;
        }

        .rm-section-heading {
          max-width: 690px;
        }

        .rm-section-heading h2 {
          font-size: clamp(38px, 4vw, 56px);
          line-height: 0.98;
          letter-spacing: 0;
          font-weight: 650;
        }

        .rm-section-heading p {
          margin-top: 18px;
          color: #302d2b;
          font-size: 20px;
          line-height: 1.32;
        }

        .rm-example-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          margin-top: 44px;
        }

        .rm-example-card,
        .rm-template-card {
          border: 1px solid rgba(0,0,0,0.02);
          border-radius: 16px;
          background: var(--rm-panel);
        }

        .rm-example-card {
          display: flex;
          min-height: 250px;
          flex-direction: column;
          justify-content: space-between;
          padding: 28px;
        }

        .rm-example-card svg {
          color: var(--rm-green);
        }

        .rm-example-card h3 {
          font-size: 22px;
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-weight: 650;
        }

        .rm-example-card p {
          margin-top: 8px;
          color: var(--rm-muted);
          font-size: 16px;
          line-height: 1.5;
        }

        .rm-comparison {
          position: relative;
          margin-top: 50px;
        }

        .rm-comparison::before {
          content: "";
          position: absolute;
          top: -10px;
          right: 0;
          bottom: -10px;
          width: 47%;
          border-radius: 18px;
          background: white;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.03);
        }

        .rm-comparison-grid {
          position: relative;
          display: grid;
          grid-template-columns: 18% 35% 47%;
          border-bottom: 1px solid var(--rm-line);
        }

        .rm-comparison-grid > div {
          padding: 19px 22px;
          color: var(--rm-muted);
          font-size: 16px;
          line-height: 1.45;
        }

        .rm-comparison-grid > div:first-child {
          color: var(--rm-text);
          font-weight: 650;
        }

        .rm-comparison-grid.header > div {
          color: var(--rm-soft);
          font-weight: 650;
        }

        .rm-compare-cell {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .rm-compare-cell svg {
          flex: none;
          margin-top: 3px;
          color: #9c968d;
        }

        .rm-compare-cell.good {
          color: var(--rm-text);
        }

        .rm-template-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          margin-top: 44px;
        }

        .rm-template-card {
          display: flex;
          min-height: 196px;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px;
        }

        .rm-template-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: white;
          color: var(--rm-green);
        }

        .rm-template-card h3 {
          font-size: 21px;
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-weight: 650;
        }

        .rm-template-card p {
          margin-top: 8px;
          color: var(--rm-muted);
          font-size: 15px;
          line-height: 1.45;
        }

        .rm-final {
          padding: 90px 0 100px;
        }

        .rm-final-panel {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          background:
            linear-gradient(135deg, rgba(219, 242, 199, 0.88), rgba(246, 232, 182, 0.68)),
            #eee2c7;
          padding: clamp(34px, 8vw, 104px) 28px;
          text-align: left;
        }

        .rm-final-panel h2 {
          font-size: clamp(40px, 6vw, 72px);
          line-height: 0.96;
          letter-spacing: 0;
          font-weight: 650;
        }

        .rm-final-panel p {
          margin: 18px 0 0;
          max-width: 620px;
          color: #3a392f;
          font-size: 22px;
          line-height: 1.25;
        }

        .rm-final-panel .rm-button {
          margin-top: 30px;
          color: #fff4dc;
        }

        .rm-footer {
          padding: 74px 0 42px;
          border-top: 1px solid var(--rm-line);
        }

        .rm-footer-top {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
        }

        .rm-footer p {
          margin-top: 12px;
          max-width: 380px;
          color: var(--rm-soft);
          font-size: 18px;
          line-height: 1.45;
        }

        .rm-footer-links {
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
          color: var(--rm-muted);
          font-size: 14px;
          font-weight: 560;
        }

        .rm-footer-bottom {
          margin-top: 52px;
          color: #9a9489;
          font-size: 12px;
        }

        .rm-cookie {
          position: fixed;
          left: 50%;
          bottom: 22px;
          z-index: 100;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          width: min(760px, calc(100vw - 28px));
          transform: translateX(-50%);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 28px 80px rgba(0,0,0,0.18);
          padding: 20px;
          backdrop-filter: blur(18px);
        }

        .rm-cookie h2 {
          font-size: 18px;
          line-height: 1.15;
          font-weight: 680;
        }

        .rm-cookie p {
          margin-top: 7px;
          color: var(--rm-muted);
          font-size: 13px;
          line-height: 1.45;
        }

        .rm-cookie-note {
          margin-top: 10px;
          border-radius: 12px;
          background: var(--rm-panel);
          padding: 11px;
          color: var(--rm-muted);
          font-size: 12px;
          line-height: 1.45;
        }

        .rm-cookie-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .rm-cookie button {
          min-height: 36px;
          border: 0;
          border-radius: 999px;
          padding: 0 13px;
          background: var(--rm-black);
          color: white;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
        }

        .rm-cookie button + button {
          background: var(--rm-panel);
          color: var(--rm-black);
        }

        @media (max-width: 980px) {
          .rm-container { width: min(100% - 32px, 1280px); }
          .rm-nav { display: none; }
          .rm-hero { gap: 42px; padding-top: 48px; }
          .rm-hero-stats { grid-template-columns: 1fr; }
          .rm-example-grid,
          .rm-template-grid {
            grid-template-columns: 1fr;
          }
          .rm-comparison::before { display: none; }
          .rm-comparison-grid {
            grid-template-columns: 1fr;
            border-bottom: 1px solid var(--rm-line);
          }
          .rm-comparison-grid.header { display: none; }
          .rm-comparison-grid > div {
            padding: 14px 0;
          }
          .rm-comparison-grid > div:first-child {
            padding-top: 24px;
          }
          .rm-cookie { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .rm-header-inner { height: 62px; }
          .rm-brand { font-size: 18px; }
          .rm-header-actions a:first-child { display: none; }
          .rm-button { min-height: 38px; padding: 0 14px; font-size: 14px; }
          .rm-hero h1,
          .rm-typed-title { font-size: clamp(40px, 12vw, 58px); }
          .rm-typed-title { min-height: 116px; }
          .rm-hero p { font-size: 18px; }
          .rm-logo-strip .rm-container { justify-content: flex-start; }
          .rm-flow-section { padding: 46px 0 48px; }
          .rm-flow-stage { min-height: 470px; }
          .rm-flow-track { height: 420px; }
          .rm-flow-card { width: min(84vw, 320px); }
          .rm-flow-preview { height: 235px; }
          .rm-flow-arrow { width: 46px; height: 46px; }
          .rm-flow-arrow.left { left: 16px; }
          .rm-flow-arrow.right { right: 16px; }
          .rm-section { padding: 64px 0; }
          .rm-section-heading p { font-size: 18px; }
          .rm-example-card { min-height: 210px; }
          .rm-footer-links { gap: 18px; }
        }
      `}</style>

      <div className="rm-page">
        <header className="rm-header">
          <div className="rm-container rm-header-inner">
            <Link href="/" className="rm-brand" aria-label="ResumeMatch">
              <span>Resume<span className="rm-brand-match">Match</span></span>
            </Link>
            <nav className="rm-nav" aria-label="Primary navigation">
              <a href="#compare">Compare</a>
              <a href="#templates">Templates</a>
            </nav>
            <div className="rm-header-actions">
              <Link href="/login">Sign in</Link>
              <Link href="/builder" className="rm-button primary">Try now</Link>
            </div>
          </div>
        </header>

        <main>
          <section className="rm-container rm-hero">
            <div className="rm-hero-copy">
              <TypedHeroTitle />
              <p>
                Upload your resume this morning. Choose an ATS-safe template by lunch. Know what to fix before you apply.
              </p>
              <div className="rm-hero-actions">
                <Link href="/builder" className="rm-button secondary">
                  Start building <ArrowRight size={16} />
                </Link>
                <Link href="/dashboard/templates" className="rm-button primary">
                  Browse templates
                </Link>
              </div>
              <HeroStats />
            </div>
          </section>

          <section className="rm-logo-strip" aria-label="Supported job workflows">
            <div className="rm-container">
              {logoStripItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </section>

          <LandingTemplateFlow />

          <section className="rm-container rm-section">
            <div className="rm-section-heading">
              <h2>The resume workspace that stays practical.</h2>
              <p>
                ResumeMatch turns the parts people usually do manually into one clean flow: import, edit, score, match, and export.
              </p>
            </div>
            <div className="rm-example-grid">
              {examples.map((item) => {
                const Icon = item.icon;
                return (
                  <article className="rm-example-card" key={item.title}>
                    <Icon size={42} strokeWidth={1.6} />
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="compare" className="rm-container rm-section">
            <div className="rm-section-heading">
              <h2>Resume work the old way vs. ResumeMatch.</h2>
              <p>
                There is enough uncertainty in job hunting. Your resume workflow should not add more.
              </p>
            </div>
            <div className="rm-comparison">
              <div className="rm-comparison-grid header">
                <div />
                <div>The old workflow</div>
                <div>With ResumeMatch</div>
              </div>
              {comparisonRows.map(([label, oldWay, newWay]) => (
                <div className="rm-comparison-grid" key={label}>
                  <div>{label}</div>
                  <div className="rm-compare-cell">
                    <Minus size={16} />
                    <span>{oldWay}</span>
                  </div>
                  <div className="rm-compare-cell good">
                    <Check size={16} />
                    <span>{newWay}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="templates" className="rm-container rm-section">
            <div className="rm-section-heading">
              <h2>Start from the template that matches the role.</h2>
              <p>
                Keep the visual system quiet and recruiter-friendly, then let the content do the work.
              </p>
            </div>
            <div className="rm-template-grid">
              {templates.map((name) => (
                <Link href="/builder" className="rm-template-card" key={name}>
                  <span className="rm-template-icon">
                    {name === "Software Engineer" ? <FileText size={24} /> : <LayoutTemplate size={24} />}
                  </span>
                  <div>
                    <h3>{name}</h3>
                    <p>Clean single-page structure with role-aware section hierarchy and ATS-readable spacing.</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rm-container rm-final">
            <div className="rm-final-panel">
              <h2>Build the resume you will actually apply with.</h2>
              <p>Bring your current resume, pick a better layout, and see what needs work before the application.</p>
              <Link href="/builder" className="rm-button primary">
                Open the builder <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </main>

        <footer className="rm-footer">
          <div className="rm-container">
            <div className="rm-footer-top">
              <div>
                <Link href="/" className="rm-brand">
                  <span>Resume<span className="rm-brand-match">Match</span></span>
                </Link>
                <p>AI-powered resume building, audits, templates, and job matching for practical applications.</p>
              </div>
              <div className="rm-footer-links">
                <Link href="/builder">Builder</Link>
                <Link href="/dashboard/templates">Templates</Link>
                <Link href="/login">Sign in</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
              </div>
            </div>
            <div className="rm-footer-bottom">© {new Date().getFullYear()} ResumeMatch. Built for job seekers.</div>
          </div>
        </footer>

        <CookieBanner />
      </div>
    </>
  );
}
