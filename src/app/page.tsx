"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { TemplatePreviewClient } from "@/components/templates/TemplatePreviewClient";
import { pickSampleForTemplate } from "@/lib/builder/types";
import {
  getTemplateBadge,
  getTemplateDescription,
  isCompanyInspiredTemplate,
} from "@/lib/builder/templateMeta";

const scenes = [
  {
    id: "build",
    tag: "Build",
    headline: "Create or edit your CV",
    body: "Start from scratch or improve your existing resume in a clean, ATS-friendly builder.",
    href: "/builder",
    cta: "Open the builder",
  },
  {
    id: "score",
    tag: "Optimize",
    headline: "Get your ATS score and improve it with AI",
    body: "Check formatting, find missing keywords, and rewrite weak bullet points in clear, professional English.",
    href: "/dashboard/resumes",
    cta: "Review your ATS score",
  },
  {
    id: "apply",
    tag: "Apply",
    headline: "Apply to jobs posted across the internet",
    body: "Type the role you want, compare your resume against relevant job requirements, and apply with more confidence. Let the agent apply for you.",
    href: "/dashboard/matches",
    cta: "Find matching jobs",
  },
] as const;

const heroLines = [
  "ATS-ready\nin minutes.",
  "Actually\nshortlisted.",
  "Rewritten\nby AI.",
  "Land the\noffer.",
] as const;

interface ShowcaseTemplate {
  id: string
  name: string
  description: string | null
  is_ats_safe: boolean | null
  tier: string | null
  html_content: string
  css_content: string
}

const LANDING_PREVIEW_CSS = `
  body,html{margin:0;padding:0}
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:13px;line-height:1.4;color:#111;padding:24px 28px}
  h1{font-size:17px;font-weight:700;margin:0 0 3px}
  h2{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;border-bottom:1.5px solid #333;padding-bottom:2px;margin:10px 0 5px}
  h3{font-size:12px;font-weight:600;margin:0 0 2px}
  p,li{font-size:11.5px;line-height:1.4;margin:0 0 2px}
  ul{margin:3px 0 3px 14px;padding:0}
  a{color:inherit;text-decoration:none}
  .twocol,.two-col,.layout-two-col,.europass-wrap{display:flex;gap:0}
  .twocol .sidebar,.two-col .left,.sidebar,.left-col{width:30%;padding:16px 12px;background:#f2f2f2}
  .twocol .main,.two-col .right,.main-col,.right-col{width:70%;padding:16px 14px}
`

function FloatingTemplatePreview({
  template,
  offset,
  onSelect,
}: {
  template: ShowcaseTemplate
  offset: number
  onSelect: () => void
}) {
  const active = offset === 0

  if (Math.abs(offset) > 4) return null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className="landing-template-float-card"
      data-offset={offset}
      aria-label={`Select ${template.name} template`}
      style={{
        position: "absolute",
        left: "50%",
        top: active ? 18 : 46,
        width: active ? "clamp(280px, 22vw, 340px)" : "clamp(220px, 16vw, 280px)",
        color: "inherit",
        cursor: "pointer",
        transform: `translateX(calc(-50% + ${offset * 300}px)) translateY(${Math.abs(offset) * 5}px) scale(${active ? 1 : Math.abs(offset) > 2 ? 0.72 : 0.84})`,
        opacity: active ? 1 : Math.abs(offset) > 2 ? 0.24 : 0.46,
        zIndex: 10 - Math.abs(offset),
        transition: "transform 680ms cubic-bezier(.2,.8,.2,1), opacity 680ms ease, top 680ms ease",
      }}
    >
      <Link
        href={`/builder/${template.id}`}
        onClick={(event) => {
          if (!active) {
            event.preventDefault();
            onSelect();
          }
        }}
        style={{
          display: "block",
          borderRadius: 18,
          border: active ? "2px solid rgba(52,211,153,0.52)" : "2px solid rgba(245,240,232,0.08)",
          background: "var(--color-card)",
          overflow: "hidden",
          boxShadow: active
            ? "0 34px 110px rgba(0,0,0,0.48), 0 0 0 1px rgba(245,240,232,0.08)"
            : "0 20px 70px rgba(0,0,0,0.28), 0 0 0 1px rgba(245,240,232,0.05)",
          animation: active ? "template-float 4.2s ease-in-out infinite" : "template-float-soft 5.5s ease-in-out infinite",
        }}
      >
        <div style={{ position: "relative", height: active ? 258 : 232, background: "#fff", overflow: "hidden" }}>
          <TemplatePreviewClient
            template={{ ...template, css_content: LANDING_PREVIEW_CSS }}
            sample={pickSampleForTemplate(template.name)}
            scale={0.23}
          />
          {isCompanyInspiredTemplate(template.name) && (
            <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, borderRadius: 999, background: "#020617", color: "#fff", padding: "3px 8px", fontSize: 10, fontWeight: 800 }}>
              FAANG-type
            </div>
          )}
          {template.tier === "pro" && (
            <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10, borderRadius: 999, background: "#facc15", color: "#713f12", padding: "3px 8px", fontSize: 9, fontWeight: 900 }}>
              PRO
            </div>
          )}
          {!active && <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,8,0.14)" }} />}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: active ? 1 : 0,
              transition: "opacity 180ms ease",
              background: active ? "rgba(52,211,153,0.08)" : "transparent",
            }}
          >
            {active && (
              <span style={{ borderRadius: 999, background: "#fff", color: "var(--color-marketing-accent)", padding: "9px 14px", fontSize: 12, fontWeight: 900, boxShadow: "0 16px 40px rgba(0,0,0,0.18)" }}>
                Use this →
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: active ? 16 : 14, borderTop: "1px solid rgba(245,240,232,0.08)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2, color: "var(--color-marketing-text)" }}>
            {template.name}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
            <span style={{ borderRadius: 999, background: "rgba(245,240,232,0.06)", color: "rgba(245,240,232,0.62)", padding: "3px 8px", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {getTemplateBadge(template.name)}
            </span>
            {template.is_ats_safe && (
              <span style={{ color: "var(--color-marketing-accent)", fontSize: 10, fontWeight: 700 }}>
                ATS Safe
              </span>
            )}
          </div>
          <p style={{ marginTop: 9, minHeight: 32, fontSize: 11, lineHeight: 1.45, color: "rgba(245,240,232,0.42)" }}>
            {getTemplateDescription(template.name, template.description)}
          </p>
        </div>
      </Link>
    </div>
  )
}

function TemplateShowcase() {
  const [templates, setTemplates] = useState<ShowcaseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(2);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let alive = true;

    const loadTemplates = async () => {
      try {
        const res = await fetch("/api/v1/templates/showcase", { cache: "no-store" });
        if (!res.ok) return;
        const body = await res.json();
        const next = body?.data?.templates;
        if (alive && Array.isArray(next) && next.length > 0) {
          setTemplates(next);
        }
      } catch {
        // The fallback below keeps the section useful if the API is unavailable.
      } finally {
        if (alive) setLoading(false);
      }
    };

    void loadTemplates();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (isPaused || templates.length < 2) return;

    const id = window.setInterval(() => {
      setSelectedIndex((index) => (index + 1) % templates.length);
    }, 3000);

    return () => window.clearInterval(id);
  }, [isPaused, templates.length]);

  const move = (direction: 1 | -1) => {
    if (templates.length === 0) return;
    setSelectedIndex((index) => (index + direction + templates.length) % templates.length);
  };

  const getOffset = (index: number) => {
    const raw = index - selectedIndex;
    if (raw > templates.length / 2) return raw - templates.length;
    if (raw < -templates.length / 2) return raw + templates.length;
    return raw;
  };

  return (
    <section
      id="templates"
      style={{
        position: "relative",
        margin: "0 calc(50% - 50vw)",
        padding: "58px 0 62px",
        width: "100vw",
        overflow: "hidden",
        borderTop: "1px solid rgba(245,240,232,0.045)",
        borderBottom: "1px solid rgba(245,240,232,0.045)",
        background: "linear-gradient(180deg, rgba(245,240,232,0.012), rgba(52,211,153,0.018), rgba(245,240,232,0.008))",
      }}
    >
      <div className="landing-section" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px", display: "flex", alignItems: "end", justifyContent: "space-between", gap: 28, flexWrap: "wrap", marginBottom: 28 }}>
        <div style={{ maxWidth: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <div style={{ width: 20, height: 1, background: "var(--color-marketing-accent)" }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", color: "rgba(245,240,232,0.25)", textTransform: "uppercase" }}>
              Templates
            </span>
          </div>
          <h2 style={{ fontSize: "clamp(36px, 4.8vw, 58px)", lineHeight: 0.96, letterSpacing: "-0.03em", marginBottom: 14 }}>
            Start from a proven resume layout.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.72, color: "rgba(245,240,232,0.42)", maxWidth: 540 }}>
            These are the same template cards and previews used in the builder.
          </p>
        </div>
        <Link
          href="/builder#templates"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 44,
            padding: "0 18px",
            borderRadius: 999,
            border: "1px solid rgba(52,211,153,0.24)",
            color: "var(--color-marketing-accent)",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          Browse all templates <ArrowRight size={14} />
        </Link>
      </div>

      {templates.length > 0 ? (
        <div
          className="landing-template-float"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            position: "relative",
            width: "100%",
            overflow: "hidden",
            height: "470px",
            padding: "8px 0 18px",
          }}
        >
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous template"
            style={{
              position: "absolute",
              left: "max(22px, calc(50% - 610px))",
              top: "44%",
              transform: "translateY(-50%)",
              zIndex: 20,
              width: 46,
              height: 46,
              borderRadius: 999,
              border: "1px solid rgba(52,211,153,0.25)",
              background: "var(--color-marketing-accent)",
              color: "var(--color-marketing-bg)",
              fontSize: 28,
              lineHeight: 1,
              boxShadow: "0 16px 45px rgba(52,211,153,0.18)",
              cursor: "pointer",
            }}
          >
            ‹
          </button>

          {templates.map((template, index) => {
            const offset = getOffset(index);
            return <FloatingTemplatePreview key={template.id} template={template} offset={offset} onSelect={() => setSelectedIndex(index)} />;
          })}

          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next template"
            style={{
              position: "absolute",
              right: "max(22px, calc(50% - 610px))",
              top: "44%",
              transform: "translateY(-50%)",
              zIndex: 20,
              width: 46,
              height: 46,
              borderRadius: 999,
              border: "1px solid rgba(52,211,153,0.25)",
              background: "var(--color-marketing-accent)",
              color: "var(--color-marketing-bg)",
              fontSize: 28,
              lineHeight: 1,
              boxShadow: "0 16px 45px rgba(52,211,153,0.18)",
              cursor: "pointer",
            }}
          >
            ›
          </button>

          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 12, display: "flex", justifyContent: "center", gap: 8 }}>
            {templates.map((template, index) => (
              <button
                key={`template-dot-${template.id}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Show ${template.name}`}
                style={{
                  width: index === selectedIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 99,
                  border: 0,
                  background: index === selectedIndex ? "var(--color-marketing-accent)" : "rgba(245,240,232,0.16)",
                  cursor: "pointer",
                  transition: "width 220ms ease, background 220ms ease",
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            border: "1px solid rgba(245,240,232,0.075)",
            borderRadius: 24,
            padding: "34px 24px",
            background: "rgba(245,240,232,0.018)",
            color: "rgba(245,240,232,0.42)",
            textAlign: "center",
          }}
        >
          {loading ? "Loading templates..." : "Templates could not load here. Open the builder to browse all layouts."}
          <div style={{ marginTop: 16 }}>
            <Link href="/builder#templates" style={{ color: "var(--color-marketing-accent)", fontWeight: 800 }}>
              Open builder
            </Link>
          </div>
        </div>
      )}
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
    <div
      role="dialog"
      aria-label="Cookie preferences"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 22,
        transform: "translateX(-50%)",
        zIndex: 200,
        width: "min(720px, calc(100vw - 28px))",
        border: "1px solid rgba(245,240,232,0.12)",
        borderRadius: 26,
        background: "rgba(14,14,14,0.94)",
        boxShadow: "0 28px 100px rgba(0,0,0,0.45)",
        backdropFilter: "blur(22px)",
        padding: 24,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "start" }}>
        <div>
          <h2 style={{ fontSize: 20, lineHeight: 1.15, marginBottom: 10 }}>Cookies improve your experience.</h2>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(245,240,232,0.52)", maxWidth: 580 }}>
            We use essential cookies for login and security. With your permission, we may also use analytics cookies to understand product usage and improve ResumeMatch.
          </p>
          {preferencesOpen && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: "rgba(245,240,232,0.035)", color: "rgba(245,240,232,0.58)", fontSize: 12, lineHeight: 1.6 }}>
              Essential cookies are always on because authentication needs them. Analytics cookies are optional and can be disabled by choosing essential only.
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => saveChoice("accepted")}
          style={{ border: 0, borderRadius: 12, padding: "12px 16px", background: "var(--color-marketing-accent)", color: "var(--color-marketing-bg)", fontWeight: 900, cursor: "pointer" }}
        >
          Accept all
        </button>
        <button
          type="button"
          onClick={() => saveChoice("essential")}
          style={{ border: "1px solid rgba(245,240,232,0.12)", borderRadius: 12, padding: "12px 16px", background: "rgba(245,240,232,0.04)", color: "var(--color-marketing-text)", fontWeight: 800, cursor: "pointer" }}
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={() => setPreferencesOpen((value) => !value)}
          style={{ border: "1px solid rgba(52,211,153,0.22)", borderRadius: 12, padding: "12px 16px", background: "rgba(52,211,153,0.06)", color: "var(--color-marketing-accent)", fontWeight: 800, cursor: "pointer" }}
        >
          Preferences
        </button>
      </div>
    </div>
  );
}

function TypewriterHero() {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const iv = window.setInterval(() => setCursor((p) => !p), 500);
    return () => window.clearInterval(iv);
  }, []);

  useEffect(() => {
    const line = heroLines[lineIdx];
    let timeout: number | undefined;

    if (phase === 0) {
      if (displayed.length < line.length) {
        timeout = window.setTimeout(() => {
          setDisplayed(line.slice(0, displayed.length + 1));
        }, 55);
      } else {
        timeout = window.setTimeout(() => setPhase(1), 1800);
      }
    } else if (phase === 1) {
      timeout = window.setTimeout(() => setPhase(2), 200);
    } else if (displayed.length > 0) {
      timeout = window.setTimeout(() => {
        setDisplayed((p) => p.slice(0, -1));
      }, 28);
    } else {
      timeout = window.setTimeout(() => {
        setLineIdx((p) => (p + 1) % heroLines.length);
        setPhase(0);
      }, 0);
    }

    return () => {
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
    };
  }, [displayed, lineIdx, phase]);

  return (
    <div style={{ position: "relative" }}>
      <h1
        className="landing-hero-title"
        style={{
          fontFamily: "var(--font-headline), sans-serif",
          fontSize: "clamp(48px, 9vw, 108px)",
          lineHeight: 0.92,
          letterSpacing: "-0.01em",
          whiteSpace: "pre-line",
          color: "var(--color-marketing-text)",
          minHeight: "clamp(120px, 20vw, 220px)",
        }}
      >
        {displayed}
        <span
          style={{
            display: "inline-block",
            width: "0.06em",
            height: "0.85em",
            background: "var(--color-marketing-accent)",
            verticalAlign: "text-top",
            marginLeft: "0.06em",
            opacity: cursor ? 1 : 0,
            transition: "opacity 0.1s",
          }}
        />
      </h1>
    </div>
  );
}

export default function LandingPage() {
  const [resumesAnalyzed, setResumesAnalyzed] = useState(200)

  useEffect(() => {
    let alive = true

    const loadStats = async () => {
      try {
        const res = await fetch('/api/v1/landing/stats', { cache: 'no-store' })
        if (!res.ok) return
        const body = await res.json()
        const next = Number(body?.data?.resumes_analyzed)
        if (alive && Number.isFinite(next)) {
          setResumesAnalyzed(next)
        }
      } catch {
        // Keep the default 200 on network or API failure.
      }
    }

    void loadStats()
    const id = window.setInterval(loadStats, 60000)

    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [])

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        body { background: #080808; }
        a { text-decoration: none; color: inherit; }
        ::selection { background: rgba(52,211,153,0.2); color: #f5f0e8; }

        @media (max-width: 960px) {
          .landing-shell { overflow-x: clip; }
          .landing-header { padding: 0 20px !important; }
          .landing-nav { display: none !important; }
          .landing-section { padding-left: 20px !important; padding-right: 20px !important; }
          .landing-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
          .landing-cta { padding: 40px 24px !important; }
          .landing-proof-grid { grid-template-columns: 1fr !important; }
          .landing-anchor-grid { grid-template-columns: 1fr !important; }
          .landing-flow-grid { grid-template-columns: 1fr !important; }
          .landing-flow-arrow { display: none !important; }
          .landing-template-float { height: 440px !important; }
          .landing-template-float-card { width: 250px !important; }
        }

        @media (max-width: 640px) {
          .landing-header { height: 58px !important; padding: 0 12px !important; }
          .landing-header > a:first-child { font-size: 19px !important; }
          .landing-header > div:last-child { gap: 8px !important; }
          .landing-header a[href="/login"] { display: inline-flex !important; font-size: 12px !important; color: rgba(245,240,232,0.62) !important; }
          .landing-header a[href="/builder"] { height: 34px !important; padding: 0 12px !important; font-size: 12px !important; }
          .landing-section { padding-left: 16px !important; padding-right: 16px !important; }
          .landing-hero-title { font-size: clamp(44px, 17vw, 72px) !important; min-height: 156px !important; }
          .landing-proof-grid { gap: 10px !important; }
          .landing-proof-grid > div { padding: 14px !important; border: 1px solid rgba(245,240,232,0.055); }
          .landing-flow-grid { gap: 14px !important; }
          .landing-flow-grid a { min-height: auto !important; padding: 22px !important; border-radius: 22px !important; }
          .landing-flow-grid h3 { font-size: 24px !important; }
          .landing-template-float { height: 410px !important; }
          .landing-template-float-card { width: 218px !important; }
          .landing-template-float-card[data-offset="-3"] { transform: translateX(calc(-50% - 480px)) scale(0.72) !important; }
          .landing-template-float-card[data-offset="-2"] { transform: translateX(calc(-50% - 320px)) scale(0.76) !important; }
          .landing-template-float-card[data-offset="-1"] { transform: translateX(calc(-50% - 160px)) scale(0.8) !important; }
          .landing-template-float-card[data-offset="0"] { transform: translateX(-50%) scale(1) !important; }
          .landing-template-float-card[data-offset="1"] { transform: translateX(calc(-50% + 160px)) scale(0.8) !important; }
          .landing-template-float-card[data-offset="2"] { transform: translateX(calc(-50% + 320px)) scale(0.76) !important; }
          .landing-template-float-card[data-offset="3"] { transform: translateX(calc(-50% + 480px)) scale(0.72) !important; }
          .landing-cta { border-radius: 22px !important; padding: 30px 20px !important; gap: 24px !important; }
          .landing-cta a { width: 100% !important; justify-content: center !important; }
        }
      `}</style>

      <div
        className="landing-shell"
        style={{
          fontFamily: "var(--font-body), 'Helvetica Neue', sans-serif",
          background: "var(--color-marketing-bg)",
          color: "var(--color-marketing-text)",
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              top: "-15%",
              left: "-8%",
              width: 700,
              height: 700,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(52,211,153,0.055) 0%, transparent 65%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "35%",
              right: "-12%",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(59,130,246,0.035) 0%, transparent 65%)",
            }}
          />
        </div>

        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            borderBottom: "1px solid rgba(245,240,232,0.055)",
            backdropFilter: "blur(24px)",
            background: "rgba(8,8,8,0.82)",
          }}
        >
          <div
            className="landing-header"
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "0 40px",
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Link href="/" style={{ fontFamily: "var(--font-headline), sans-serif", fontSize: 22, letterSpacing: "0.01em" }}>
              Resume<span style={{ color: "var(--color-marketing-accent)" }}>Match</span>
            </Link>
            <nav className="landing-nav" style={{ display: "flex", gap: 36, alignItems: "center" }}>
                {[
                { label: "Builder", href: "/builder", internal: true },
                { label: "Templates", href: "#templates", internal: false },
                { label: "How it works", href: "#how-it-works", internal: false },
                              ].map((link) =>
                link.internal ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "rgba(245,240,232,0.38)",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-marketing-text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(245,240,232,0.38)";
                    }}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "rgba(245,240,232,0.38)",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-marketing-text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(245,240,232,0.38)";
                    }}
                  >
                    {link.label}
                  </a>
                )
              )}
            </nav>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Link
                href="/login"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(245,240,232,0.35)",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-marketing-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(245,240,232,0.35)";
                }}
              >
                Log in
              </Link>
              <Link
                href="/builder"
                style={{
                  height: 38,
                  padding: "0 20px",
                  borderRadius: 99,
                  background: "var(--color-marketing-accent)",
                  color: "var(--color-marketing-bg)",
                  fontSize: 13,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  letterSpacing: "0.01em",
                }}
              >
                Build for free
              </Link>
            </div>
          </div>
        </header>

        <main style={{ position: "relative", zIndex: 1 }}>
          <section
            className="landing-section"
            style={{ maxWidth: 1280, margin: "0 auto", padding: "76px 40px 48px" }}
          >
            <div style={{ maxWidth: 980, position: "relative" }}>
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: "-6% -4% auto -4%",
                    height: 360,
                    borderRadius: 40,
                    background: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(255,255,255,0.015) 48%, rgba(59,130,246,0.05))",
                    filter: "blur(28px)",
                    opacity: 0.9,
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative" }}>
                <TypewriterHero />

                <div className="landing-hero-actions" style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Link
                    href="/builder"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      height: 52,
                      padding: "0 28px",
                      borderRadius: 99,
                      background: "var(--color-marketing-text)",
                      color: "var(--color-marketing-bg)",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    Start in the builder <ArrowRight size={14} strokeWidth={2.5} />
                  </Link>
                  <a
                    href="#how-it-works"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      height: 52,
                      padding: "0 28px",
                      borderRadius: 99,
                      border: "1px solid rgba(245,240,232,0.1)",
                      color: "rgba(245,240,232,0.6)",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    View workflow
                  </a>
                </div>

                <div
                  className="landing-proof-grid"
                  style={{
                    marginTop: 28,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 16,
                  }}
                >
                  {[
                    [String(resumesAnalyzed), "Resumes analyzed"],
                    ["28 pts", "Average ATS score improvement"],
                    ["3x", "Better interview response rate"],
                  ].map(([value, label]) => (
                    <div
                      key={value}
                      style={{
                        padding: "18px 18px",
                        borderRadius: 22,
                        background: "rgba(245,240,232,0.018)",
                        backdropFilter: "blur(14px)",
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-headline), sans-serif", fontSize: 40, lineHeight: 0.95, color: "var(--color-marketing-text)" }}>
                        {value}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.55, color: "rgba(245,240,232,0.38)", letterSpacing: "0.04em" }}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                </div>
            </div>
          </section>

          <div style={{ borderTop: "1px solid rgba(245,240,232,0.04)", borderBottom: "1px solid rgba(245,240,232,0.04)", background: "rgba(245,240,232,0.012)" }}>
            <div
              className="landing-section"
              style={{ maxWidth: 1280, margin: "0 auto", padding: "18px 40px", display: "flex", gap: 40, overflowX: "auto", justifyContent: "flex-start" }}
            >
              {["LinkedIn", "Indeed", "Greenhouse", "Lever", "Workday", "iCIMS"].map((l) => (
                <span
                  key={l}
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "rgba(245,240,232,0.26)",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          <TemplateShowcase />

          <section
            id="how-it-works"
            className="landing-section"
            style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 40px" }}
          >
            <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: "8% -4% 16% -4%",
                  borderRadius: 40,
                  background: "linear-gradient(135deg, rgba(245,240,232,0.02), rgba(52,211,153,0.05), rgba(255,255,255,0.012))",
                  filter: "blur(26px)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative" }}>
              <div style={{ maxWidth: 620, marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                  <div style={{ width: 20, height: 1, background: "var(--color-marketing-accent)" }} />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.22em",
                      color: "rgba(245,240,232,0.25)",
                      textTransform: "uppercase",
                    }}
                  >
                    How it works
                  </span>
                </div>
                <h2 style={{ fontFamily: "var(--font-headline), sans-serif", fontSize: "clamp(40px, 5vw, 60px)", lineHeight: 0.94, color: "var(--color-marketing-text)", marginBottom: 18 }}>
                  A clearer path from resume to application.
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.72, color: "rgba(245,240,232,0.4)", maxWidth: 560 }}>
                  The workflow stays practical: write, improve, match, and apply. No extra noise, no unnecessary steps.
                </p>
              </div>

              <div
                className="landing-flow-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${scenes.length * 2 - 1}, minmax(0, 1fr))`,
                  gap: 22,
                  alignItems: "stretch",
                }}
              >
                {scenes.map((scene, index) => (
                  <Fragment key={scene.id}>
                    <Link
                      href={scene.href}
                      style={{
                        gridColumn: "span 1",
                        padding: 30,
                        minHeight: 260,
                        border: "1px solid rgba(245,240,232,0.065)",
                        borderRadius: 24,
                        background: "linear-gradient(180deg, rgba(245,240,232,0.035) 0%, rgba(245,240,232,0.012) 100%)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.borderColor = "rgba(52,211,153,0.28)";
                        e.currentTarget.style.background = "linear-gradient(180deg, rgba(52,211,153,0.09) 0%, rgba(245,240,232,0.02) 100%)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "rgba(245,240,232,0.065)";
                        e.currentTarget.style.background = "linear-gradient(180deg, rgba(245,240,232,0.035) 0%, rgba(245,240,232,0.012) 100%)";
                      }}
                      >
                      {scene.id !== "build" && (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 14,
                            padding: "5px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(245,240,232,0.1)",
                            background: "rgba(245,240,232,0.02)",
                            color: "rgba(245,240,232,0.68)",
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                          }}
                        >
                          Coming soon
                        </div>
                      )}
                      <div>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(52,211,153,0.08)",
                            border: "1px solid rgba(52,211,153,0.2)",
                            color: "var(--color-marketing-accent)",
                            marginBottom: 22,
                            padding: "8px 12px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                          }}
                        >
                          {scene.tag}
                        </div>
                        <h3 style={{ fontSize: 26, lineHeight: 1.05, color: "var(--color-marketing-text)", marginBottom: 16 }}>
                          {scene.headline}
                        </h3>
                        <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(245,240,232,0.42)" }}>
                          {scene.body}
                        </p>
                      </div>
                      <div style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--color-marketing-accent)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {scene.cta} <ArrowUpRight size={13} />
                      </div>
                    </Link>

                    {index < scenes.length - 1 ? (
                      <div
                        className="landing-flow-arrow"
                        aria-hidden="true"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: 260,
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            maxWidth: 120,
                            height: 1,
                            background: "linear-gradient(90deg, rgba(52,211,153,0.12), rgba(52,211,153,0.55), rgba(52,211,153,0.12))",
                            position: "relative",
                          }}
                        >
                          <ArrowRight
                            size={18}
                            color="var(--color-marketing-accent)"
                            style={{
                              position: "absolute",
                              right: -4,
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </Fragment>
                ))}
              </div>
              </div>
            </div>
          </section>

          <section className="landing-section" style={{ padding: "28px 40px 92px" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <div
                className="landing-cta"
                style={{
                  borderRadius: 28,
                  padding: "56px 48px",
                  background: "rgba(245,240,232,0.018)",
                  backdropFilter: "blur(18px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 48,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ fontFamily: "var(--font-headline), sans-serif", fontSize: "clamp(38px, 4.5vw, 60px)", lineHeight: 0.93, color: "var(--color-marketing-text)", marginBottom: 14 }}>
                    Ready to turn your resume
                    <br />
                    into better applications?
                  </h2>
                  <p style={{ fontSize: 15, color: "rgba(245,240,232,0.38)", lineHeight: 1.72, maxWidth: 380 }}>
                    Start in the builder, improve what matters, and move into matching roles without changing tools.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
                  <Link
                    href="/builder"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      height: 54,
                      padding: "0 32px",
                      borderRadius: 99,
                      background: "var(--color-marketing-text)",
                      color: "var(--color-marketing-bg)",
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    Open the builder <ArrowRight size={15} strokeWidth={2.5} />
                  </Link>
                  <span style={{ fontSize: 11, color: "rgba(245,240,232,0.2)", paddingLeft: 4, fontWeight: 500 }}>
                    No credit card · Sign in only at PDF download
                  </span>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer style={{ borderTop: "1px solid rgba(245,240,232,0.055)", padding: "60px 40px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 48, marginBottom: 56 }}>
              <div>
                <span style={{ fontFamily: "var(--font-headline), sans-serif", fontSize: 20, letterSpacing: "0.01em" }}>
                  Resume<span style={{ color: "var(--color-marketing-accent)" }}>Match</span>
                </span>
                <p style={{ marginTop: 10, fontSize: 13, color: "rgba(245,240,232,0.22)", lineHeight: 1.65, maxWidth: 220 }}>
                  AI-powered resume optimization for modern job seekers.
                </p>
              </div>
              <div style={{ display: "flex", gap: 60, flexWrap: "wrap" }}>
                {[
                  {
                    head: "Product",
                    links: [
                      { label: "Resume Builder", href: "/builder" },
                      { label: "ATS Checker",    href: "/dashboard/resumes" },
                      { label: "JD Matcher",     href: "/dashboard/matches" },
                    ],
                  },
                  {
                    head: "Account",
                    links: [
                      { label: "Sign in",   href: "/login" },
                      { label: "Sign up",   href: "/signup" },
                      { label: "Dashboard", href: "/dashboard" },
                    ],
                  },
                  {
                    head: "Resources",
                    links: [
                      { label: "How it works", href: "#how-it-works" },
                                          ],
                  },
                ].map((col) => (
                  <div key={col.head}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", color: "rgba(245,240,232,0.18)", textTransform: "uppercase", marginBottom: 18 }}>
                      {col.head}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                      {col.links.map((link) =>
                        link.href.startsWith("#") ? (
                          <a key={link.label} href={link.href} style={{ fontSize: 13, color: "rgba(245,240,232,0.32)", fontWeight: 500 }}>
                            {link.label}
                          </a>
                        ) : (
                          <Link key={link.label} href={link.href} style={{ fontSize: 13, color: "rgba(245,240,232,0.32)", fontWeight: 500 }}>
                            {link.label}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ paddingTop: 28, borderTop: "1px solid rgba(245,240,232,0.04)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <span style={{ fontSize: 10, color: "rgba(245,240,232,0.18)", fontWeight: 600, letterSpacing: "0.12em" }}>
                © {new Date().getFullYear()} RESUMEMATCH
              </span>
              <span style={{ fontSize: 10, color: "rgba(245,240,232,0.18)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Built for job seekers.
              </span>
            </div>
          </div>
        </footer>
        <CookieBanner />
      </div>
    </>
  );
}
