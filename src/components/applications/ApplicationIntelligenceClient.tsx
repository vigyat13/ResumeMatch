'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Copy,
  DollarSign,
  Gauge,
  Loader2,
  Mic,
  Send,
  ShieldAlert,
  Sparkles,
  Wand2,
} from 'lucide-react'
import type { ApplicationAction, ApplicationIntelligence, ScoreSet } from '@/lib/applications/intelligence'
import { cn } from '@/lib/utils'

interface ResumeOption {
  id: string
  file_name: string
}

interface Props {
  resumes: ResumeOption[]
}

const ACTION_LABELS: Record<ApplicationAction, string> = {
  apply_now: 'Apply now',
  apply_with_referral: 'Get referral first',
  tailor_first: 'Tailor first',
  research_first: 'Research first',
  skip: 'Skip',
}

const SCORE_LABELS: Array<{ key: keyof ScoreSet; label: string; invert?: boolean }> = [
  { key: 'overall_fit', label: 'Overall fit' },
  { key: 'ats_alignment', label: 'ATS alignment' },
  { key: 'recruiter_signal', label: 'Recruiter signal' },
  { key: 'company_quality', label: 'Company quality' },
  { key: 'ghost_job_risk', label: 'Ghost-job risk', invert: true },
  { key: 'referral_potential', label: 'Referral potential' },
  { key: 'interview_readiness', label: 'Interview readiness' },
  { key: 'salary_alignment', label: 'Salary alignment' },
  { key: 'application_priority', label: 'Application priority' },
]

const STARTERS = [
  'Analyze this for realistic fit, not just keyword overlap.',
  'Prioritize applications where a referral or recruiter message would change the odds.',
  'Find ghost-job risk, weak company signals, and whether this is worth tailoring.',
]

export function ApplicationIntelligenceClient({ resumes }: Props) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? '')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [salaryTarget, setSalaryTarget] = useState('')
  const [profileNotes, setProfileNotes] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<ApplicationIntelligence | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const canAnalyze = useMemo(
    () => jobDescription.trim().length >= 50 && (resumeId || profileNotes.trim().length >= 30),
    [jobDescription, profileNotes, resumeId],
  )

  async function analyze() {
    if (!canAnalyze) return
    setLoading(true)
    setError('')
    setCopied('')

    try {
      const res = await fetch('/api/v1/applications/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          resumeId: resumeId || undefined,
          profileNotes,
          jobTitle,
          company,
          location,
          salaryTarget,
          jobDescription,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Analysis failed.')
        return
      }

      setAnalysis(json.data.analysis)
    } catch {
      setError('Network error while analyzing this application.')
    } finally {
      setLoading(false)
    }
  }

  async function copyText(label: string, text: string) {
    if (!text.trim()) return
    await navigator.clipboard.writeText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1400)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            Application Intelligence
          </div>
          <h1 className="text-2xl font-semibold tracking-normal text-[var(--color-text-primary)] sm:text-3xl">
            Decide where to apply, what to tailor, and who to contact.
          </h1>
        </div>
        <button
          type="button"
          onClick={analyze}
          disabled={!canAnalyze || loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? 'Analyzing' : 'Analyze application'}
        </button>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
          <Field label="Resume">
            <select
              value={resumeId}
              onChange={event => setResumeId(event.target.value)}
              className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            >
              {resumes.length === 0 && <option value="">No parsed resumes yet</option>}
              {resumes.map(resume => (
                <option key={resume.id} value={resume.id}>{resume.file_name}</option>
              ))}
            </select>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role">
              <Input value={jobTitle} onChange={setJobTitle} placeholder="Product Manager" />
            </Field>
            <Field label="Company">
              <Input value={company} onChange={setCompany} placeholder="Acme" />
            </Field>
            <Field label="Location">
              <Input value={location} onChange={setLocation} placeholder="Remote, New York" />
            </Field>
            <Field label="Salary target">
              <Input value={salaryTarget} onChange={setSalaryTarget} placeholder="$120k base" />
            </Field>
          </div>

          <Field label="Profile notes">
            <textarea
              value={profileNotes}
              onChange={event => setProfileNotes(event.target.value)}
              rows={5}
              placeholder="Career target, constraints, visa status, strongest wins, preferred industries, companies to avoid..."
              className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
            />
          </Field>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Brainstorm prompts</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map(starter => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => setProfileNotes(prev => prev ? `${prev}\n${starter}` : starter)}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-left text-xs text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
          <Field label="Job description">
            <textarea
              value={jobDescription}
              onChange={event => setJobDescription(event.target.value)}
              rows={17}
              placeholder="Paste the full JD, recruiter message, or job listing..."
              className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
            />
          </Field>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
            <span>{jobDescription.trim().length} characters</span>
            {!canAnalyze && <span>Add a JD and resume/profile context.</span>}
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {analysis ? (
        <section className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Recommendation</p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
                    {ACTION_LABELS[analysis.recommended_action]}
                  </h2>
                </div>
                <ScorePill value={analysis.scores.application_priority} />
              </div>
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{analysis.summary}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {SCORE_LABELS.map(score => (
                <ScoreCard
                  key={score.key}
                  label={score.label}
                  value={analysis.scores[score.key]}
                  invert={score.invert}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <InsightPanel icon={<CheckCircle2 className="h-4 w-4" />} title="Strengths" items={analysis.strengths} />
            <InsightPanel icon={<ShieldAlert className="h-4 w-4" />} title="Weaknesses" items={analysis.weaknesses} tone="warn" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="font-semibold text-[var(--color-text-primary)]">Role strategy</h2>
              </div>
              <p className="mb-4 text-sm leading-6 text-[var(--color-text-secondary)]">{analysis.role_strategy.positioning}</p>
              <TagGroup label="Resume focus" items={analysis.role_strategy.resume_focus} />
              <TagGroup label="Keywords" items={analysis.role_strategy.keywords} />
              <TagGroup label="Risk flags" items={analysis.role_strategy.risk_flags} warn />
            </section>

            <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="font-semibold text-[var(--color-text-primary)]">Application plan</h2>
              </div>
              <OrderedList items={analysis.application_plan} />
            </section>
          </div>

          {analysis.skill_gaps.length > 0 && (
            <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                <h2 className="font-semibold text-[var(--color-text-primary)]">Skill gaps</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {analysis.skill_gaps.map((gap, index) => (
                  <div key={`${gap.skill}-${index}`} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-medium text-[var(--color-text-primary)]">{gap.skill}</h3>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        gap.importance === 'high' ? 'bg-red-500/15 text-red-200' : gap.importance === 'medium' ? 'bg-amber-500/15 text-amber-200' : 'bg-white/10 text-[var(--color-text-secondary)]',
                      )}>
                        {gap.importance}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{gap.evidence}</p>
                    <p className="mt-3 text-sm text-[var(--color-text-primary)]">{gap.action}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Artifact title="Cover letter" icon={<Briefcase className="h-4 w-4" />} text={analysis.artifacts.cover_letter} onCopy={copyText} copied={copied} />
            <Artifact title="Recruiter message" icon={<Send className="h-4 w-4" />} text={analysis.artifacts.recruiter_message} onCopy={copyText} copied={copied} />
            <Artifact title="Referral request" icon={<Sparkles className="h-4 w-4" />} text={analysis.artifacts.referral_message} onCopy={copyText} copied={copied} />
            <Artifact title="LinkedIn note" icon={<Copy className="h-4 w-4" />} text={analysis.artifacts.linkedin_connection_note} onCopy={copyText} copied={copied} />
            <Artifact title="Follow-up" icon={<ClipboardList className="h-4 w-4" />} text={analysis.artifacts.follow_up_message} onCopy={copyText} copied={copied} />
            <Artifact title="Salary talk track" icon={<DollarSign className="h-4 w-4" />} text={analysis.artifacts.salary_talk_track} onCopy={copyText} copied={copied} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <InsightPanel icon={<Mic className="h-4 w-4" />} title="Interview questions" items={analysis.interview.likely_questions} />
            <InsightPanel icon={<Sparkles className="h-4 w-4" />} title="Stories to prepare" items={analysis.interview.stories_to_prepare} />
            <InsightPanel icon={<AlertTriangle className="h-4 w-4" />} title="Address these risks" items={analysis.interview.weaknesses_to_address} tone="warn" />
          </div>

          <InsightPanel
            icon={<Wand2 className="h-4 w-4" />}
            title="Projects and certifications"
            items={analysis.projects_certifications}
          />
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8 text-center">
          <Gauge className="mx-auto h-8 w-8 text-[var(--color-accent)]" />
          <h2 className="mt-3 text-lg font-semibold text-[var(--color-text-primary)]">No application analyzed yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
            Add a job description and resume context to generate fit scores, ghost-job risk, outreach drafts, interview prep, salary positioning, and a prioritized application plan.
          </p>
        </section>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  )
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
    />
  )
}

function ScorePill({ value }: { value: number }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-lg font-bold text-[var(--color-accent)]">
      {value}
    </div>
  )
}

function ScoreCard({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const positive = invert ? value <= 35 : value >= 70
  const mixed = invert ? value > 35 && value <= 65 : value >= 45 && value < 70
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
        <span className={cn(
          'text-sm font-bold',
          positive ? 'text-[var(--color-accent)]' : mixed ? 'text-amber-300' : 'text-red-300',
        )}>
          {value}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn('h-full rounded-full', positive ? 'bg-[var(--color-accent)]' : mixed ? 'bg-amber-300' : 'bg-red-300')}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function InsightPanel({ icon, title, items, tone }: { icon: React.ReactNode; title: string; items: string[]; tone?: 'warn' }) {
  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className={tone === 'warn' ? 'text-amber-300' : 'text-[var(--color-accent)]'}>{icon}</span>
        <h2 className="font-semibold text-[var(--color-text-primary)]">{title}</h2>
      </div>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="text-sm leading-6 text-[var(--color-text-secondary)]">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">No items returned.</p>
      )}
    </section>
  )
}

function TagGroup({ label, items, warn }: { label: string; items: string[]; warn?: boolean }) {
  if (!items.length) return null
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <span
            key={item}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-xs',
              warn
                ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function OrderedList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-[var(--color-text-muted)]">No plan returned.</p>
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-xs font-semibold text-[var(--color-accent)]">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function Artifact({
  title,
  icon,
  text,
  onCopy,
  copied,
}: {
  title: string
  icon: React.ReactNode
  text: string
  onCopy: (label: string, text: string) => void
  copied: string
}) {
  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-accent)]">{icon}</span>
          <h2 className="font-semibold text-[var(--color-text-primary)]">{title}</h2>
        </div>
        <button
          type="button"
          onClick={() => onCopy(title, text)}
          disabled={!text.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied === title ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">
        {text.trim() || 'No draft returned.'}
      </p>
    </section>
  )
}
