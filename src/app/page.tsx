"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutTemplate,
  Minus,
  Search,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { TemplatePreviewClient } from "@/components/templates/TemplatePreviewClient";
import { getTemplateBadge, getTemplateDescription } from "@/lib/builder/templateMeta";
import { pickSampleForTemplate } from "@/lib/builder/types";

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

const workflow = [
  {
    step: "STEP 1",
    title: "Bring in your existing resume",
    body: "Start from a blank template or upload your current PDF/DOCX. ResumeMatch detects contact details, education, projects, experience, and skills.",
  },
  {
    step: "STEP 2",
    title: "Shape it into an ATS-safe version",
    body: "Pick a role-specific layout, edit live, tune spacing, and export clean HTML, PDF, or LaTeX from one source of truth.",
  },
  {
    step: "STEP 3",
    title: "Know what to fix before applying",
    body: "Run audits and job-description matching to see missing keywords, weak sections, and practical next edits.",
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

interface ShowcaseTemplate {
  id: string;
  name: string;
  description: string | null;
  is_ats_safe: boolean | null;
  tier: string | null;
  html_content: string;
  css_content: string;
}

function LandingTemplateFlow() {
  const [items, setItems] = useState<ShowcaseTemplate[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTemplates() {
      try {
        const res = await fetch("/api/v1/templates/showcase");
        const json = await res.json();
        const templates = json?.data?.templates;
        if (!cancelled && Array.isArray(templates)) {
          setItems(templates);
        }
      } catch {
        if (!cancelled) setItems([]);
      }
    }

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const interval = window.setInterval(() => {
      setActive((value) => (value + 1) % items.length);
    }, 3600);

    return () => window.clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const move = (direction: -1 | 1) => {
    setActive((value) => (value + direction + items.length) % items.length);
  };

  return (
    <section className="rm-flow-section" aria-label="Live resume template previews">
      <div className="rm-flow-stage">
        <button className="rm-flow-arrow left" type="button" onClick={() => move(-1)} aria-label="Previous template">
          <ChevronLeft size={26} />
        </button>
        <button className="rm-flow-arrow right" type="button" onClick={() => move(1)} aria-label="Next template">
          <ChevronRight size={26} />
        </button>

        <div className="rm-flow-track">
          {items.map((template, index) => {
            const offset = ((index - active + items.length + Math.floor(items.length / 2)) % items.length) - Math.floor(items.length / 2);
            const hidden = Math.abs(offset) > 3;
            const selected = offset === 0;
            const sample = pickSampleForTemplate(template.name);

            return (
              <Link
                key={template.id}
                href={`/builder/${template.id}/start`}
                className={`rm-flow-card ${selected ? "active" : ""} ${hidden ? "hidden-card" : ""}`}
                style={{
                  transform: `translateX(${offset * 330}px) scale(${selected ? 1 : 0.86})`,
                  opacity: hidden ? 0 : selected ? 1 : 0.36,
                  zIndex: 20 - Math.abs(offset),
                }}
                aria-hidden={hidden}
              >
                <div className="rm-flow-preview">
                  <TemplatePreviewClient template={template} sample={sample} fit="cover" />
                </div>
                <div className="rm-flow-card-body">
                  <div className="rm-flow-card-head">
                    <h3>{template.name}</h3>
                    {selected && <span>Use this →</span>}
                  </div>
                  <div className="rm-flow-meta">
                    <span>{getTemplateBadge(template.name)}</span>
                    {template.is_ats_safe && <strong>ATS Safe</strong>}
                  </div>
                  <p>{getTemplateDescription(template.name, template.description)}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="rm-flow-dots" aria-hidden="true">
          {items.map((template, index) => (
            <button
              key={template.id}
              type="button"
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
              tabIndex={-1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CookieBanner() {
  const [choice, setChoice] = useState<string | null>("checking");
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setChoice(window.localStorage.getItem("resumematch_cookie_choice"));
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  const saveChoice = (value: "accepted" | "essential") => {
    window.localStorage.setItem("resumematch_cookie_choice", value);
    setChoice(value);
  };

  if (choice) return null;

  return (
    <div className="rm-cookie" role="dialog" aria-label="Cookie preferences">
      <div>
        <h2>Cookies improve your experience.</h2>
        <p>
          Essential cookies keep login and security working. Analytics cookies are optional and help us improve ResumeMatch.
        </p>
        {preferencesOpen && (
          <div className="rm-cookie-note">
            Essential cookies are always on. Choose essential only to disable optional analytics.
          </div>
        )}
      </div>
      <div className="rm-cookie-actions">
        <button type="button" onClick={() => saveChoice("accepted")}>Accept all</button>
        <button type="button" onClick={() => saveChoice("essential")}>Essential only</button>
        <button type="button" onClick={() => setPreferencesOpen((value) => !value)}>Preferences</button>
      </div>
    </div>
  );
}

function ProductMockup() {
  return (
    <div className="rm-hero-visual" aria-label="ResumeMatch product preview">
      <div className="rm-browser-bar">
        <span />
        <span />
        <span />
        <p>resumematch.live/builder</p>
      </div>
      <div className="rm-workspace">
        <aside>
          <nav>
            <span className="active">Builder</span>
            <span>Audit</span>
            <span>Matches</span>
            <span>Templates</span>
          </nav>
        </aside>
        <main>
          <div className="rm-upload-card">
            <div>
              <p className="rm-eyebrow">Resume import</p>
              <h3>Do you have an existing resume?</h3>
            </div>
            <div className="rm-upload-actions">
              <span><UploadCloud size={15} /> Yes, upload</span>
              <span>No, start blank</span>
            </div>
          </div>
          <div className="rm-editor-grid">
            <div className="rm-form-panel">
              {["Name", "Summary", "Experience", "Projects", "Skills"].map((item, index) => (
                <div key={item} className="rm-field-row">
                  <span>{item}</span>
                  <div style={{ width: `${76 - index * 7}%` }} />
                </div>
              ))}
            </div>
            <div className="rm-resume-paper">
              <h4>Pratik Singh</h4>
              <p>Senior Software Engineer</p>
              <div />
              <section>
                <strong>Experience</strong>
                <span />
                <span />
                <span />
              </section>
              <section>
                <strong>Projects</strong>
                <span />
                <span />
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ReportMockup() {
  return (
    <div className="rm-report-card">
      <div className="rm-report-head">
        <div>
          <p className="rm-eyebrow">ATS report</p>
          <h3>Frontend Engineer at Stripe</h3>
        </div>
        <div className="rm-score">82</div>
      </div>
      <div className="rm-bars">
        {[
          ["React", 96],
          ["TypeScript", 88],
          ["Accessibility", 72],
          ["Testing", 54],
        ].map(([label, width]) => (
          <div key={label}>
            <span>{label}</span>
            <div><i style={{ width: `${width}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="rm-warning">
        <BarChart3 size={17} />
        Add stronger testing evidence before applying.
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <style>{`
        :root {
          --rm-bg: #faf9f5;
          --rm-panel: #f2f0e8;
          --rm-panel-strong: #e8e3d5;
          --rm-text: #0f0e0e;
          --rm-muted: #44413f;
          --rm-soft: #77716b;
          --rm-line: #e2ded4;
          --rm-black: #161616;
          --rm-green: #2f8f68;
          --rm-cream: #fffaf0;
        }

        html { scroll-behavior: smooth; }
        body { background: var(--rm-bg); }
        a { color: inherit; text-decoration: none; }
        ::selection { background: #d8f3df; color: var(--rm-text); }

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
          background: rgba(250, 249, 245, 0.88);
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
          font-weight: 760;
          letter-spacing: -0.01em;
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
          box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
        }
        .rm-button.secondary:hover { box-shadow: 0 0 0 1px rgba(0,0,0,0.16), 0 3px 12px rgba(0,0,0,0.06); }

        .rm-hero {
          display: flex;
          flex-direction: column;
          gap: 72px;
          padding: 66px 0 76px;
        }

        .rm-hero-copy {
          max-width: 660px;
        }

        .rm-hero h1 {
          max-width: 680px;
          font-size: clamp(44px, 6vw, 76px);
          line-height: 0.96;
          letter-spacing: -0.045em;
          font-weight: 650;
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

        .rm-hero-visual {
          overflow: hidden;
          border-radius: 18px;
          background: #171512;
          min-height: 500px;
          box-shadow: 0 26px 80px rgba(22, 22, 22, 0.16);
        }

        .rm-browser-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 48px;
          padding: 0 18px;
          background: #25221e;
          color: #9f9a8e;
          font-size: 13px;
        }

        .rm-browser-bar span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #756f63;
        }

        .rm-browser-bar p { margin-left: 10px; }

        .rm-workspace {
          display: grid;
          grid-template-columns: 220px 1fr;
          min-height: 452px;
        }

        .rm-workspace aside {
          padding: 26px 18px;
          border-right: 1px solid rgba(255,255,255,0.08);
          background: #1e1b17;
        }

        .rm-workspace nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rm-workspace nav span {
          border-radius: 10px;
          padding: 11px 12px;
          color: #a9a295;
          font-size: 14px;
          font-weight: 600;
        }

        .rm-workspace nav .active {
          background: #302b25;
          color: #fff4dc;
        }

        .rm-workspace main {
          padding: 26px;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.04), transparent 34%),
            #191713;
        }

        .rm-upload-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-radius: 16px;
          padding: 20px;
          background: #f6efe0;
          color: #18140f;
        }

        .rm-eyebrow {
          color: #817663;
          font-size: 11px;
          font-weight: 760;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .rm-upload-card h3 {
          margin-top: 6px;
          font-size: 24px;
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-weight: 650;
        }

        .rm-upload-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .rm-upload-actions span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          padding: 9px 13px;
          background: #161616;
          color: white;
          font-size: 13px;
          font-weight: 650;
        }

        .rm-upload-actions span + span {
          background: white;
          color: #161616;
        }

        .rm-editor-grid {
          display: grid;
          grid-template-columns: 1fr 330px;
          gap: 20px;
          margin-top: 22px;
        }

        .rm-form-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-radius: 16px;
          padding: 18px;
          background: rgba(255,255,255,0.06);
        }

        .rm-field-row {
          display: grid;
          grid-template-columns: 104px 1fr;
          align-items: center;
          gap: 12px;
          color: #c8c0b2;
          font-size: 13px;
          font-weight: 620;
        }

        .rm-field-row div {
          height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,0.11);
        }

        .rm-resume-paper {
          min-height: 300px;
          border-radius: 8px;
          padding: 26px;
          background: white;
          color: #171717;
          box-shadow: 0 12px 40px rgba(0,0,0,0.22);
        }

        .rm-resume-paper h4 {
          font-size: 24px;
          font-weight: 760;
          letter-spacing: -0.03em;
        }

        .rm-resume-paper p {
          margin-top: 4px;
          color: #555;
          font-size: 12px;
        }

        .rm-resume-paper > div {
          height: 2px;
          margin: 16px 0;
          background: #171717;
        }

        .rm-resume-paper section {
          margin-top: 16px;
        }

        .rm-resume-paper strong {
          display: block;
          margin-bottom: 8px;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .rm-resume-paper span {
          display: block;
          height: 8px;
          margin-top: 7px;
          border-radius: 4px;
          background: #ddd8ce;
        }

        .rm-resume-paper span:nth-child(2) { width: 94%; }
        .rm-resume-paper span:nth-child(3) { width: 82%; }
        .rm-resume-paper span:nth-child(4) { width: 70%; }

        .rm-logo-strip {
          border-top: 1px solid var(--rm-line);
          border-bottom: 1px solid var(--rm-line);
          background: rgba(255,255,255,0.24);
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
          color: #908a80;
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
            linear-gradient(180deg, rgba(255,255,255,0.36), rgba(242,240,232,0.74)),
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
          border-color: rgba(47,143,104,0.48);
          box-shadow: 0 34px 100px rgba(22,22,22,0.22), 0 0 0 1px rgba(47,143,104,0.18);
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
          background: rgba(47,143,104,0.10);
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
          letter-spacing: -0.04em;
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
        .rm-template-card,
        .rm-step-card {
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

        .rm-workflow {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
          gap: 56px;
          align-items: center;
        }

        .rm-step-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .rm-step-card {
          padding: 24px;
        }

        .rm-step-card span {
          color: #8b857a;
          font-size: 11px;
          font-weight: 780;
          letter-spacing: 0.16em;
        }

        .rm-step-card h3 {
          margin-top: 10px;
          font-size: 24px;
          line-height: 1.1;
          letter-spacing: -0.025em;
          font-weight: 650;
        }

        .rm-step-card p {
          margin-top: 10px;
          color: var(--rm-muted);
          font-size: 16px;
          line-height: 1.5;
        }

        .rm-report-card {
          border-radius: 16px;
          padding: 28px;
          background: #161616;
          color: white;
          box-shadow: 0 24px 70px rgba(22, 22, 22, 0.16);
        }

        .rm-report-head {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 20px;
        }

        .rm-report-head h3 {
          margin-top: 8px;
          max-width: 300px;
          font-size: 32px;
          line-height: 1;
          letter-spacing: -0.035em;
          font-weight: 650;
        }

        .rm-score {
          display: grid;
          place-items: center;
          width: 82px;
          height: 82px;
          border-radius: 50%;
          background: #dbf2c7;
          color: #183017;
          font-size: 30px;
          font-weight: 750;
        }

        .rm-bars {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 32px;
        }

        .rm-bars span {
          display: block;
          margin-bottom: 7px;
          color: #cfc8ba;
          font-size: 13px;
          font-weight: 650;
        }

        .rm-bars div div {
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
        }

        .rm-bars i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #dbf2c7;
        }

        .rm-warning {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 30px;
          border-radius: 14px;
          padding: 14px;
          background: rgba(255,255,255,0.08);
          color: #fff6df;
          font-size: 15px;
          line-height: 1.4;
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
          letter-spacing: -0.045em;
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
          .rm-workspace { grid-template-columns: 1fr; }
          .rm-workspace aside { display: none; }
          .rm-editor-grid,
          .rm-example-grid,
          .rm-template-grid,
          .rm-workflow {
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
          .rm-hero h1 { font-size: clamp(42px, 13vw, 58px); }
          .rm-hero p { font-size: 18px; }
          .rm-hero-visual { min-height: auto; }
          .rm-upload-card { align-items: flex-start; flex-direction: column; }
          .rm-editor-grid { grid-template-columns: 1fr; }
          .rm-form-panel { display: none; }
          .rm-resume-paper { min-height: 270px; }
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
          .rm-report-head { flex-direction: column; }
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
              <a href="#workflow">Workflow</a>
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
              <h1>Make every job application feel tailored.</h1>
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
            </div>
            <ProductMockup />
          </section>

          <section className="rm-logo-strip" aria-label="Supported job workflows">
            <div className="rm-container">
              {["PDF import", "ATS audit", "LaTeX export", "Job matching", "Live preview", "Template switching"].map((item) => (
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

          <section id="workflow" className="rm-container rm-section">
            <div className="rm-workflow">
              <div className="rm-step-list">
                {workflow.map((item) => (
                  <article className="rm-step-card" key={item.step}>
                    <span>{item.step}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
              <ReportMockup />
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
