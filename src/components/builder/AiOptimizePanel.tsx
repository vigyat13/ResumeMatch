'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, FileText, GitCompareArrows, Loader2, RotateCcw, Sparkles, Target, X } from 'lucide-react'
import { AnimatedDiff } from './TypewriterText'
import type { OptimizeMode, OptimizeSummary } from '@/lib/resume/optimizer'
import type { ReactNode } from 'react'

interface OptimizeInput {
  mode: OptimizeMode
  jobDescription: string
}

interface Props {
  open: boolean
  status: 'idle' | 'requesting' | 'applying' | 'complete'
  summary: OptimizeSummary | null
  error: string | null
  activeStage: string | null
  canUndo: boolean
  onClose: () => void
  onOptimize: (input: OptimizeInput) => void
  onUndo: () => void
}

const progressStages = [
  'Reading resume',
  'Improving bullets',
  'Aligning keywords',
  'Applying changes',
]

export function AiOptimizePanel({
  open,
  status,
  summary,
  error,
  activeStage,
  canUndo,
  onClose,
  onOptimize,
  onUndo,
}: Props) {
  const [mode, setMode] = useState<OptimizeMode>('general')
  const [jobDescription, setJobDescription] = useState('')
  const [showCompare, setShowCompare] = useState(false)
  const isBusy = status === 'requesting' || status === 'applying'

  if (!open) return null

  return (
    <div className="print:hidden fixed inset-0 z-50">
      <button aria-label="Close AI Optimize" className="absolute inset-0 bg-black/45" onClick={isBusy ? undefined : onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-[min(92vw,420px)] flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-foreground">AI Optimize</h2>
            <p className="text-xs text-muted-foreground">Rewrite resume content while preserving personal facts.</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-2">
            <ModeButton
              active={mode === 'general'}
              icon={<FileText className="h-4 w-4" />}
              label="General"
              onClick={() => setMode('general')}
            />
            <ModeButton
              active={mode === 'job_description'}
              icon={<Target className="h-4 w-4" />}
              label="Job match"
              onClick={() => setMode('job_description')}
            />
          </div>

          {mode === 'job_description' ? (
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Job description
              </label>
              <textarea
                value={jobDescription}
                onChange={event => setJobDescription(event.target.value)}
                rows={7}
                placeholder="Paste a job description to optimize keywords, summary, and bullets for that role."
                className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Paste at least a few lines from the role so the optimizer can target the right keywords.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-semibold text-foreground">General resume cleanup</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Improves summary, bullets, project descriptions, and skills without targeting a specific job.
              </p>
            </div>
          )}

          <div className="mt-5 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Optimization status</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {statusLabel(status, activeStage)}
                </p>
              </div>
              {isBusy ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            </div>
            <div className="mt-4 space-y-3">
              {progressStages.map((stage, index) => (
                <div key={stage} className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${stageState(status, index, activeStage)}`} />
                  <span className="text-xs text-muted-foreground">{stage}</span>
                </div>
              ))}
            </div>
          </div>

          {summary && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryTile label="Bullets improved" value={String(summary.bulletsImproved)} />
              <SummaryTile label="Sections changed" value={String(summary.sectionsChanged.length)} />
              <SummaryTile label="Score before" value={`${summary.score.before}`} />
              <SummaryTile label="Score after" value={`${summary.score.after}`} />
              <div className="col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-2xl font-bold text-emerald-700">
                  {summary.score.delta >= 0 ? '+' : ''}{summary.score.delta}
                </p>
                <p className="mt-1 text-xs font-medium text-emerald-700">Optimization lift</p>
              </div>
              <div className="col-span-2 rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-semibold text-muted-foreground">Keywords added</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {summary.keywordsAdded.length > 0
                    ? summary.keywordsAdded.map(keyword => (
                        <span key={keyword} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {keyword}
                        </span>
                      ))
                    : <span className="text-xs text-muted-foreground">No new keywords reported.</span>}
                </div>
              </div>
              <div className="col-span-2 rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">Updated CV points</p>
                  <button
                    type="button"
                    onClick={() => setShowCompare(v => !v)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    <GitCompareArrows className="h-3.5 w-3.5" />
                    {showCompare ? 'Hide compare' : 'Compare'}
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {summary.updatedPoints.length > 0 ? summary.updatedPoints.slice(0, 8).map((item, idx) => (
                    <div key={`${item.label}-${idx}`} className="rounded-md border border-border/80 bg-background p-2">
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{item.section}</p>
                      {showCompare ? (
                        <div className="mt-2">
                          <AnimatedDiff
                            before={item.before || '-'}
                            after={item.after || '-'}
                            delay={idx * 400}
                            className="text-xs text-foreground"
                          />
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-foreground">{item.after || '-'}</p>
                      )}
                    </div>
                  )) : <span className="text-xs text-muted-foreground">No explicit point-level changes reported.</span>}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="border-t border-border px-5 py-4">
          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={isBusy}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Undo optimization
            </button>
          )}
          <button
            type="button"
            onClick={() => onOptimize({ mode, jobDescription })}
            disabled={isBusy || (mode === 'job_description' && jobDescription.trim().length < 80)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-45"
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {status === 'complete' ? 'Optimize again' : 'Start optimization'}
          </button>
        </div>
      </aside>
    </div>
  )
}

function ModeButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  )
}

function statusLabel(status: Props['status'], activeStage: string | null): string {
  if (status === 'requesting') return 'Preparing an optimized resume'
  if (status === 'applying') return activeStage ? `Updating ${activeStage}` : 'Applying section updates'
  if (status === 'complete') return 'Optimization applied'
  return 'Ready'
}

function stageState(status: Props['status'], index: number, activeStage: string | null): string {
  if (status === 'complete') return 'bg-emerald-500'
  if (status === 'requesting' && index === 0) return 'bg-primary animate-pulse'
  if (status === 'applying') {
    if (index < 3) return 'bg-emerald-500'
    return activeStage ? 'bg-primary animate-pulse' : 'bg-muted'
  }
  return 'bg-muted'
}
