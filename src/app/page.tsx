"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Shield,
  Target,
  Sparkles,
  FileText,
  Star,
  CheckCircle2,
} from "lucide-react";

/**
 * Landing-page narrative scenes.
 * Each scene now owns its own deep-link `href` so the "How it works"
 * sticky panel doubles as a navigation hub into the actual product.
 */
const scenes = [
  {
    id: "upload",
    step: "01",
    headline: "Drop your resume.",
    body: "PDF or DOCX parsed in seconds. Every skill, every gap, extracted instantly.",
    href: "/dashboard/resumes",
    cta: "Upload a resume",
  },
  {
    id: "audit",
    step: "02",
    headline: "ATS score, instant.",
    body: "See exactly which formatting breaks parsers before recruiters see your name.",
    href: "/dashboard/resumes",
    cta: "Run ATS audit",
  },
  {
    id: "match",
    step: "03",
    headline: "Skill gaps exposed.",
    body: "Paste any JD. Watch your match percentage update in real time.",
    href: "/dashboard/matches",
    cta: "Match against a JD",
  },
  {
    id: "rewrite",
    step: "04",
    headline: "Every line rewritten.",
    body: "GPT-4o rewrites weak bullets with quantified impact and tone scores.",
    href: "/builder",
    cta: "Open the builder",
  },
] as const;

const testimonials = [
  {
    quote: "3 interviews in 2 weeks. The ATS audit changed everything.",
    name: "Sarah Chen",
    role: "Eng · Stripe",
    initials: "SC",
  },
  {
    quote: "Finally know why my resume was not getting past filters.",
    name: "Marcus Johnson",
    role: "PM · Notion",
    initials: "MJ",
  },
  {
    quote: "Discovered skills I did not know I had.",
    name: "Elena Rodriguez",
    role: "UX Designer",
    initials: "ER",
  },
] as const;

const heroLines = [
  "ATS-ready\nin minutes.",
  "Actually\nshortlisted.",
  "Rewritten\nby AI.",
  "Land the\noffer.",
] as const;

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
        style={{
          fontFamily: "'Bebas Neue', var(--font-headline), sans-serif",
          fontSize: "clamp(72px, 14vw, 180px)",
          lineHeight: 0.92,
          letterSpacing: "-0.01em",
          whiteSpace: "pre-line",
          color: "var(--color-marketing-text)",
          minHeight: "clamp(160px, 32vw, 400px)",
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

function useActiveScene(ref: React.RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fn = () => {
      const rect = el.getBoundingClientRect();
      const h = window.innerHeight;
      const progress = Math.min(
        1,
        Math.max(0, (h * 0.25 - rect.top) / (rect.height - h * 0.5))
      );

      setActive(
        Math.min(
          scenes.length - 1,
          Math.max(0, Math.round(progress * (scenes.length - 1)))
        )
      );
    };

    fn();
    window.addEventListener("scroll", fn, { passive: true });
    window.addEventListener("resize", fn);

    return () => {
      window.removeEventListener("scroll", fn);
      window.removeEventListener("resize", fn);
    };
  }, [ref]);

  return active;
}

function SceneVisual({ idx }: { idx: number }) {
  const items = [
    <div
      key="01"
      style={{
        padding: 32,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            color: "var(--color-marketing-accent)",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 12,
            letterSpacing: "0.2em",
          }}
        >
          PARSING
        </div>
        <div style={{ color: "var(--color-marketing-text)", fontSize: 24, fontWeight: 700, marginTop: 8 }}>
          sarah_chen_resume.pdf
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        {[
          ["Work Experience", "4 roles extracted"],
          ["Skills", "18 keywords indexed"],
          ["Education", "2 entries found"],
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(245,240,232,0.07)",
              paddingBottom: 12,
            }}
          >
            <span style={{ color: "rgba(245,240,232,0.35)", fontSize: 13, fontWeight: 600 }}>
              {k}
            </span>
            <span style={{ color: "var(--color-marketing-accent)", fontSize: 13, fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          background: "rgba(52,211,153,0.06)",
          border: "1px solid rgba(52,211,153,0.18)",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <CheckCircle2 size={14} color="var(--color-marketing-accent)" />
        <span style={{ color: "var(--color-marketing-accent)", fontSize: 12, fontWeight: 700 }}>
          342 tokens processed in 1.2s
        </span>
      </div>
    </div>,

    <div
      key="02"
      style={{ padding: 32, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          color: "var(--color-marketing-accent)",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 12,
          letterSpacing: "0.2em",
        }}
      >
        ATS AUDIT
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 20 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={100} height={100} viewBox="0 0 100 100">
            <circle cx={50} cy={50} r={42} fill="none" stroke="rgba(245,240,232,0.07)" strokeWidth={7} />
            <circle
              cx={50}
              cy={50}
              r={42}
              fill="none"
              stroke="var(--color-marketing-accent)"
              strokeWidth={7}
              strokeDasharray={264}
              strokeDashoffset={66}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "var(--color-marketing-text)", fontSize: 26, fontWeight: 900, lineHeight: 1 }}>75</span>
            <span style={{ color: "rgba(245,240,232,0.3)", fontSize: 10, fontWeight: 600 }}>/100</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          {[
            { label: "Missing keywords", sev: "high" },
            { label: "Font embedding", sev: "med" },
            { label: "Header structure", sev: "low" },
          ].map(({ label, sev }) => (
            <div
              key={label}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span style={{ color: "rgba(245,240,232,0.55)", fontSize: 12, fontWeight: 600 }}>
                {label}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background:
                    sev === "high"
                      ? "rgba(248,113,113,0.12)"
                      : sev === "med"
                        ? "rgba(251,191,36,0.12)"
                        : "rgba(52,211,153,0.12)",
                  color:
                    sev === "high" ? "var(--color-marketing-error)" : sev === "med" ? "var(--color-marketing-warn)" : "var(--color-marketing-accent)",
                  letterSpacing: "0.06em",
                }}
              >
                {sev.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <div
          style={{
            color: "rgba(245,240,232,0.2)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.15em",
            marginBottom: 8,
          }}
        >
          RECOMMENDATION
        </div>
        <p style={{ color: "rgba(245,240,232,0.6)", fontSize: 13, lineHeight: 1.6 }}>
          Add distributed systems and gRPC to push score past 88.
        </p>
      </div>
    </div>,

    <div
      key="03"
      style={{ padding: 32, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          color: "var(--color-marketing-accent)",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 12,
          letterSpacing: "0.2em",
        }}
      >
        JD MATCH · SOFTWARE ENGINEER @ STRIPE
      </div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ color: "var(--color-marketing-text)", fontSize: 52, fontWeight: 900, lineHeight: 1 }}>68%</span>
        <span style={{ color: "rgba(245,240,232,0.3)", fontSize: 13 }}>match score</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20, flex: 1 }}>
        {[
          { skill: "React / TypeScript", pct: 92, have: true },
          { skill: "System Design", pct: 68, have: true },
          { skill: "Distributed Systems", pct: 24, have: false },
          { skill: "Kubernetes", pct: 10, have: false },
        ].map(({ skill, pct, have }) => (
          <div key={skill}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span
                style={{
                  color: have ? "rgba(245,240,232,0.75)" : "rgba(245,240,232,0.3)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {skill}
              </span>
              <span style={{ color: have ? "var(--color-marketing-accent)" : "var(--color-marketing-error)", fontSize: 12, fontWeight: 800 }}>
                {pct}%
              </span>
            </div>
            <div
              style={{
                height: 3,
                borderRadius: 99,
                background: "rgba(245,240,232,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  borderRadius: 99,
                  background: have ? "var(--color-marketing-accent)" : "var(--color-marketing-error)",
                  opacity: have ? 1 : 0.55,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>,

    <div
      key="04"
      style={{ padding: 32, height: "100%", display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div
        style={{
          color: "var(--color-marketing-accent)",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 12,
          letterSpacing: "0.2em",
        }}
      >
        AI REWRITE
      </div>
      <div
        style={{
          border: "1px solid rgba(248,113,113,0.18)",
          background: "rgba(248,113,113,0.04)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ color: "var(--color-marketing-error)", fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", marginBottom: 8 }}>
          BEFORE · IMPACT 2/10
        </div>
        <p style={{ color: "rgba(245,240,232,0.4)", fontSize: 13, lineHeight: 1.6 }}>
          &quot;Worked on backend services and helped improve performance of the API.&quot;
        </p>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ArrowRight size={14} color="rgba(245,240,232,0.15)" />
      </div>
      <div
        style={{
          border: "1px solid rgba(52,211,153,0.22)",
          background: "rgba(52,211,153,0.05)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ color: "var(--color-marketing-accent)", fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", marginBottom: 8 }}>
          AFTER · IMPACT 9/10
        </div>
        <p style={{ color: "rgba(245,240,232,0.88)", fontSize: 13, lineHeight: 1.6, fontWeight: 500 }}>
          &quot;Architected 3 gRPC microservices reducing p99 API latency by 42%, serving 2M+ daily requests.&quot;
        </p>
      </div>
      <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["Quantified", "Action verb", "Impact-first"].map((t) => (
          <span
            key={t}
            style={{
              fontSize: 9,
              fontWeight: 800,
              padding: "3px 10px",
              borderRadius: 99,
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.18)",
              color: "var(--color-marketing-accent)",
              letterSpacing: "0.06em",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>,
  ];

  return (
    <div
      key={idx}
      style={{
        background: "var(--color-marketing-surface)",
        border: "1px solid rgba(245,240,232,0.07)",
        borderRadius: 20,
        overflow: "hidden",
        aspectRatio: "16/10",
        width: "100%",
      }}
    >
      {items[idx]}
    </div>
  );
}

export default function LandingPage() {
  const scrollRef = useRef<HTMLElement | null>(null);
  const activeScene = useActiveScene(scrollRef);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
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
          .landing-sticky { position: static !important; }
          .landing-cta { padding: 40px 24px !important; }
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
            <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.04em" }}>
              Resume<span style={{ color: "var(--color-marketing-accent)" }}>Match</span>
            </Link>
            <nav className="landing-nav" style={{ display: "flex", gap: 36, alignItems: "center" }}>
              {[
                { label: "Builder", href: "/builder", internal: true },
                { label: "Templates", href: "/builder", internal: true },
                { label: "How it works", href: "#how-it-works", internal: false },
                { label: "Pricing", href: "#pricing", internal: false },
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
            style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 40px 64px" }}
          >
            <div style={{ maxWidth: 860 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 44 }}>
                <div style={{ width: 28, height: 1, background: "var(--color-marketing-accent)" }} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    color: "rgba(245,240,232,0.3)",
                    textTransform: "uppercase",
                  }}
                >
                  Resume optimization
                </span>
              </div>

              <TypewriterHero />

              <div style={{ marginTop: 48, display: "flex", alignItems: "flex-start", gap: 48, flexWrap: "wrap" }}>
                <p style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(245,240,232,0.4)", maxWidth: 380, fontWeight: 400 }}>
                  Stop guessing if your resume passes ATS. Instant score, skill matching, AI rewrites.
                </p>
                <div style={{ display: "flex", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
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
                    Build for free <ArrowRight size={14} strokeWidth={2.5} />
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
                      color: "rgba(245,240,232,0.5)",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    See how it works
                  </a>
                </div>
              </div>

              {/* Free-editing callout — auth-at-download value prop */}
              <div
                style={{
                  marginTop: 24,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  borderRadius: 99,
                  background: "rgba(52,211,153,0.06)",
                  border: "1px solid rgba(52,211,153,0.18)",
                }}
              >
                <CheckCircle2 size={14} color="var(--color-marketing-accent)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-marketing-accent)", letterSpacing: "0.02em" }}>
                  100% free editing
                </span>
                <span style={{ fontSize: 12, color: "rgba(245,240,232,0.5)" }}>
                  · Sign in only when you download a PDF
                </span>
              </div>

              <div
                style={{
                  marginTop: 72,
                  paddingTop: 40,
                  borderTop: "1px solid rgba(245,240,232,0.055)",
                  display: "flex",
                  gap: 56,
                  flexWrap: "wrap",
                }}
              >
                {[
                  ["50k+", "resumes analyzed"],
                  ["+28 pts", "avg ATS score gain"],
                  ["3x", "interview rate"],
                ].map(([val, label]) => (
                  <div key={val}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: "var(--color-marketing-text)", lineHeight: 1 }}>
                      {val}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(245,240,232,0.3)", marginTop: 4, fontWeight: 500, letterSpacing: "0.04em" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div style={{ borderTop: "1px solid rgba(245,240,232,0.04)" }}>
            <div
              className="landing-section"
              style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 40px", display: "flex", gap: 40, overflowX: "auto" }}
            >
              {["LinkedIn", "Indeed", "Greenhouse", "Lever", "Workday", "iCIMS"].map((l) => (
                <span
                  key={l}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(245,240,232,0.13)",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          <section
            id="how-it-works"
            ref={scrollRef}
            className="landing-section"
            style={{ maxWidth: 1280, margin: "0 auto", padding: "84px 40px" }}
          >
            <div className="landing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 80, alignItems: "start" }}>
              <div className="landing-sticky" style={{ position: "sticky", top: 100 }}>
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

                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, color: "var(--color-marketing-accent)", letterSpacing: "0.22em", marginBottom: 14 }}>
                    STEP {scenes[activeScene].step}
                  </div>
                  <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(44px, 5vw, 68px)", lineHeight: 0.93, color: "var(--color-marketing-text)", marginBottom: 18 }}>
                    {scenes[activeScene].headline}
                  </h2>
                  <p style={{ fontSize: 16, lineHeight: 1.72, color: "rgba(245,240,232,0.4)", maxWidth: 340 }}>
                    {scenes[activeScene].body}
                  </p>

                  {/* Per-step deep link into the actual product surface */}
                  <Link
                    href={scenes[activeScene].href}
                    style={{
                      marginTop: 22,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--color-marketing-accent)",
                    }}
                  >
                    {scenes[activeScene].cta} <ArrowUpRight size={13} />
                  </Link>
                </div>

                <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 2 }}>
                  {scenes.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        const el = scrollRef.current;
                        if (!el) return;
                        const rect = el.getBoundingClientRect();
                        const top = window.scrollY + rect.top;
                        const seg = (el.offsetHeight - window.innerHeight * 0.5) / (scenes.length - 1);
                        window.scrollTo({ top: top + i * seg + 24, behavior: "smooth" });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "none",
                        cursor: "pointer",
                        background: i === activeScene ? "rgba(245,240,232,0.04)" : "transparent",
                        transition: "background 0.25s",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: 11,
                          letterSpacing: "0.15em",
                          color: i === activeScene ? "var(--color-marketing-accent)" : "rgba(245,240,232,0.18)",
                          minWidth: 22,
                        }}
                      >
                        {s.step}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: i === activeScene ? 700 : 500,
                          color: i === activeScene ? "var(--color-marketing-text)" : "rgba(245,240,232,0.28)",
                          textAlign: "left",
                        }}
                      >
                        {s.headline}
                      </span>
                      {i === activeScene ? (
                        <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "var(--color-marketing-accent)" }} />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="landing-sticky" style={{ position: "sticky", top: 100 }}>
                  <SceneVisual idx={activeScene} />
                </div>
                {/* Scroll-runway spacer: lets the sticky scene panel cycle
                    through the four scenes as the user scrolls. Keep it long
                    enough that each scene gets ~one viewport of dwell time. */}
                <div style={{ height: "70vh" }} aria-hidden="true" />
              </div>
            </div>
          </section>

          <section id="features" className="landing-section" style={{ borderTop: "1px solid rgba(245,240,232,0.045)", padding: "84px 40px" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, flexWrap: "wrap", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={{ width: 20, height: 1, background: "var(--color-marketing-accent)" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "rgba(245,240,232,0.25)", textTransform: "uppercase" }}>
                      Features
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(38px, 5vw, 60px)", lineHeight: 0.93, color: "var(--color-marketing-text)" }}>
                    Everything to
                    <br />
                    land the job.
                  </h2>
                </div>
                <Link href="/builder" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "var(--color-marketing-accent)" }}>
                  Build for free <ArrowUpRight size={13} />
                </Link>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 2 }}>
                {[
                  { icon: Shield,   num: "50+",  label: "ATS Audit",     desc: "Compatibility rules checked instantly. 0-100 score.",   href: "/dashboard/resumes" },
                  { icon: Target,   num: "68%",  label: "Skill Match",   desc: "Paste any JD. Real-time match percentage and gap detection.", href: "/dashboard/matches" },
                  { icon: Sparkles, num: "9/10", label: "AI Rewrites",   desc: "GPT-4o rewrites bullets with tone and impact scores.",  href: "/builder" },
                  { icon: FileText, num: "15+",  label: "ATS Templates", desc: "Parser-safe templates. Guaranteed to pass ATS systems.", href: "/builder" },
                ].map(({ icon: Icon, num, label, desc, href }) => (
                  <Link
                    key={label}
                    href={href}
                    style={{
                      padding: 28,
                      border: "1px solid rgba(245,240,232,0.055)",
                      borderRadius: 4,
                      background: "rgba(245,240,232,0.012)",
                      display: "block",
                      transition: "background 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(245,240,232,0.035)";
                      e.currentTarget.style.borderColor = "rgba(52,211,153,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(245,240,232,0.012)";
                      e.currentTarget.style.borderColor = "rgba(245,240,232,0.055)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                      <Icon size={18} color="rgba(245,240,232,0.2)" strokeWidth={1.5} />
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "var(--color-marketing-accent)", lineHeight: 1 }}>{num}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-marketing-text)", marginBottom: 8 }}>{label}</div>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(245,240,232,0.32)" }}>{desc}</p>
                    <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--color-marketing-accent)", letterSpacing: "0.06em" }}>
                      OPEN <ArrowUpRight size={11} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="landing-section" style={{ borderTop: "1px solid rgba(245,240,232,0.045)", padding: "84px 40px" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 56 }}>
                <div style={{ width: 20, height: 1, background: "var(--color-marketing-accent)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "rgba(245,240,232,0.25)", textTransform: "uppercase" }}>
                  What people say
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 2 }}>
                {testimonials.map((t) => (
                  <div
                    key={t.name}
                    style={{
                      padding: 28,
                      border: "1px solid rgba(245,240,232,0.055)",
                      borderRadius: 4,
                      background: "rgba(245,240,232,0.012)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 20,
                    }}
                  >
                    <div style={{ display: "flex", gap: 3 }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={11} fill="var(--color-marketing-accent)" color="var(--color-marketing-accent)" />
                      ))}
                    </div>
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(245,240,232,0.62)", fontStyle: "italic", flex: 1 }}>
                      &quot;{t.quote}&quot;
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 18, borderTop: "1px solid rgba(245,240,232,0.05)" }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "rgba(52,211,153,0.08)",
                          border: "1px solid rgba(52,211,153,0.18)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 800,
                          color: "var(--color-marketing-accent)",
                        }}
                      >
                        {t.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-marketing-text)" }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(245,240,232,0.28)", marginTop: 2 }}>{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="pricing" className="landing-section" style={{ borderTop: "1px solid rgba(245,240,232,0.045)", padding: "84px 40px" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                <div style={{ width: 20, height: 1, background: "var(--color-marketing-accent)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "rgba(245,240,232,0.25)", textTransform: "uppercase" }}>
                  Pricing
                </span>
              </div>
              <div className="landing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {[
                  {
                    plan: "Free",
                    price: "$0",
                    sub: "forever",
                    copy: "Build & edit unlimited resumes. Pick from 30+ templates. ATS scan + basic scoring. Sign in only when you download a PDF.",
                    bullets: ["Unlimited builder edits", "30+ ATS-safe templates", "Basic ATS score", "PDF download (sign-in)"],
                    cta: "Start building",
                    href: "/builder",
                    primary: false,
                  },
                  {
                    plan: "Pro",
                    price: "₹50",
                    sub: "/ month",
                    copy: "Everything in Free, plus unlimited audits, JD matching, and GPT-4o bullet rewrites with impact scoring. Priced for India — less than a coffee.",
                    bullets: ["Unlimited audits", "Real-time JD matching", "AI bullet rewrites", "Multi-resume tracking"],
                    cta: "Upgrade to Pro",
                    href: "/signup?plan=pro",
                    primary: true,
                  },
                ].map((plan) => (
                  <div
                    key={plan.plan}
                    style={{
                      padding: 32,
                      border: plan.primary
                        ? "1px solid rgba(52,211,153,0.35)"
                        : "1px solid rgba(245,240,232,0.065)",
                      borderRadius: 20,
                      background: plan.primary
                        ? "rgba(52,211,153,0.04)"
                        : "rgba(245,240,232,0.018)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.08em", color: "var(--color-marketing-accent)" }}>
                      {plan.plan}
                    </div>
                    <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, lineHeight: 1, color: "var(--color-marketing-text)" }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: 13, color: "rgba(245,240,232,0.4)", fontWeight: 500 }}>{plan.sub}</span>
                    </div>
                    <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.7, color: "rgba(245,240,232,0.5)", maxWidth: 360 }}>
                      {plan.copy}
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                      {plan.bullets.map((b) => (
                        <li key={b} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(245,240,232,0.7)" }}>
                          <CheckCircle2 size={13} color="var(--color-marketing-accent)" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.href}
                      style={{
                        marginTop: "auto",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        height: 46,
                        borderRadius: 99,
                        fontSize: 13,
                        fontWeight: 800,
                        background: plan.primary ? "var(--color-marketing-accent)" : "var(--color-marketing-text)",
                        color: "var(--color-marketing-bg)",
                      }}
                    >
                      {plan.cta} <ArrowRight size={13} strokeWidth={2.5} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="landing-section" style={{ padding: "48px 40px 96px" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <div
                className="landing-cta"
                style={{
                  border: "1px solid rgba(245,240,232,0.065)",
                  borderRadius: 20,
                  padding: "72px 56px",
                  background: "rgba(245,240,232,0.018)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 48,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(38px, 4.5vw, 60px)", lineHeight: 0.93, color: "var(--color-marketing-text)", marginBottom: 14 }}>
                    Ready to get
                    <br />
                    shortlisted?
                  </h2>
                  <p style={{ fontSize: 15, color: "rgba(245,240,232,0.32)", lineHeight: 1.65, maxWidth: 340 }}>
                    Join 50,000+ job seekers. Free forever - upgrade when you need more.
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
                    Start building free <ArrowRight size={15} strokeWidth={2.5} />
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
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "0.04em" }}>
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
                      { label: "Templates",      href: "/builder" },
                      { label: "ATS Checker",    href: "/dashboard/resumes" },
                      { label: "JD Matcher",     href: "/dashboard/matches" },
                      { label: "Pricing",        href: "#pricing" },
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
                      { label: "Features",     href: "#features" },
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
      </div>
    </>
  );
}
