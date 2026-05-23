"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TemplatePreviewClient } from "@/components/templates/TemplatePreviewClient";
import { getTemplateBadge, getTemplateDescription } from "@/lib/builder/templateMeta";
import { pickSampleForTemplate } from "@/lib/builder/types";

const heroPhrases = [
  "ATS-ready\nin minutes.",
  "Actually\nshortlisted.",
  "Rewritten\nby AI.",
  "Land the\noffer.",
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

export function HeroStats() {
  const [downloaded, setDownloaded] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStats() {
      try {
        const res = await fetch("/api/v1/landing/stats", { signal: controller.signal });
        const json = await res.json();
        const value = json?.data?.resumes_downloaded ?? json?.data?.resumes_analyzed;
        if (typeof value === "number") setDownloaded(value);
      } catch {
        if (!controller.signal.aborted) setDownloaded(null);
      }
    }

    loadStats();
    return () => controller.abort();
  }, []);

  const stats = [
    [downloaded === null ? "200+" : downloaded.toLocaleString(), "Resumes downloaded"],
    ["28 pts", "Average ATS score improvement"],
    ["3x", "Better interview response rate"],
  ] as const;

  return (
    <div className="rm-hero-stats" aria-label="ResumeMatch impact metrics">
      {stats.map(([value, label]) => (
        <div className="rm-hero-stat-card" key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function LandingTemplateFlow() {
  const [items, setItems] = useState<ShowcaseTemplate[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTemplates() {
      try {
        const res = await fetch("/api/v1/templates/showcase", { signal: controller.signal });
        const json = await res.json();
        const templates = json?.data?.templates;
        if (Array.isArray(templates)) setItems(templates);
      } catch {
        if (!controller.signal.aborted) setItems([]);
      }
    }

    loadTemplates();
    return () => controller.abort();
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
                    {selected && <span>Use this {"->"}</span>}
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

export function CookieBanner() {
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

export function TypedHeroTitle() {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCursorVisible((value) => !value);
    }, 500);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const phrase = heroPhrases[phraseIndex];
    let timeout: number | undefined;

    if (phase === "typing") {
      if (text.length < phrase.length) {
        timeout = window.setTimeout(() => {
          setText(phrase.slice(0, text.length + 1));
        }, 55);
      } else {
        timeout = window.setTimeout(() => setPhase("holding"), 1800);
      }
    } else if (phase === "holding") {
      timeout = window.setTimeout(() => setPhase("deleting"), 200);
    } else if (text.length > 0) {
      timeout = window.setTimeout(() => {
        setText((value) => value.slice(0, -1));
      }, 28);
    } else {
      timeout = window.setTimeout(() => {
        setPhraseIndex((value) => (value + 1) % heroPhrases.length);
        setPhase("typing");
      }, 0);
    }

    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [text, phase, phraseIndex]);

  return (
    <h1 className="rm-typed-title">
      {text}
      <span
        className="rm-typed-cursor"
        style={{ opacity: cursorVisible ? 1 : 0 }}
        aria-hidden="true"
      />
    </h1>
  );
}
