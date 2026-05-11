'use client'

import { useEffect, useState } from 'react'

export type BrowserPhase = 0 | 1 | 2 | 3 | 4 | 5
// 0 = idle, 1 = navigating, 2 = typing query, 3 = clicked search, 4 = loading results, 5 = results visible

interface PreviewJob {
  id:       string
  title:    string
  company:  string
  location: string
  source:   string
}

interface BrowserSimulatorProps {
  phase:       BrowserPhase
  query:       string
  location?:   string
  previewJobs: PreviewJob[]
}

const CURSOR_POS: Record<BrowserPhase, { left: string; top: string }> = {
  0: { left: '50%',  top: '50%'  },
  1: { left: '48%',  top: '11%'  },
  2: { left: '38%',  top: '36%'  },
  3: { left: '68%',  top: '36%'  },
  4: { left: '30%',  top: '60%'  },
  5: { left: '60%',  top: '70%'  },
}

const URLS: Record<BrowserPhase, string> = {
  0: 'New Tab',
  1: 'linkedin.com/jobs',
  2: 'linkedin.com/jobs',
  3: 'linkedin.com/jobs/search',
  4: 'linkedin.com/jobs/search',
  5: 'linkedin.com/jobs/search',
}

function useTyping(target: string, active: boolean, speed = 60): string {
  const [typed, setTyped] = useState('')
  useEffect(() => {
    if (!active) { setTyped(''); return }
    setTyped('')
    let i = 0
    const iv = setInterval(() => {
      i++
      setTyped(target.slice(0, i))
      if (i >= target.length) clearInterval(iv)
    }, speed)
    return () => clearInterval(iv)
  }, [target, active, speed])
  return typed
}

export function BrowserSimulator({ phase, query, location, previewJobs }: BrowserSimulatorProps) {
  const cursorPos  = CURSOR_POS[phase]
  const urlText    = URLS[phase]
  const typedQuery = useTyping(
    location ? `${query} ${location}` : query,
    phase === 2 || phase === 3 || phase === 4 || phase === 5,
    55,
  )
  const [clickPulse, setClickPulse] = useState(false)

  useEffect(() => {
    if (phase === 3) {
      setClickPulse(true)
      const t = setTimeout(() => setClickPulse(false), 400)
      return () => clearTimeout(t)
    }
  }, [phase])

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[#1a1a1a] shadow-xl lg:w-[420px] lg:shrink-0">

      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#2a2a2a] px-3 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex flex-1 items-center gap-1.5 rounded-md bg-[#1a1a1a] px-2.5 py-1 text-xs text-white/50">
          {phase > 0 && <LockIcon className="h-3 w-3 shrink-0 text-green-400" />}
          <span className="truncate transition-all duration-500">{urlText}</span>
        </div>
      </div>

      {/* Page content */}
      <div className="relative h-[340px] overflow-hidden bg-white">

        {/* Phase 0 — blank */}
        {phase === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400">Waiting to search…</p>
          </div>
        )}

        {/* Phase 1+ — LinkedIn-like page */}
        {phase >= 1 && (
          <div className="h-full w-full">
            {/* LinkedIn header */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
              <LinkedInLogo />
              <div className="flex-1" />
              <div className="h-5 w-16 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded bg-gray-200" />
              <div className="h-7 w-20 rounded-full bg-blue-600" />
            </div>

            {/* Search bar area */}
            <div className="bg-[#f3f2ef] px-4 py-4">
              <div className="flex gap-2">
                <div className={`flex flex-1 items-center rounded border-2 bg-white px-3 py-2 text-sm text-gray-700 transition-all ${phase === 2 ? 'border-blue-500 shadow-sm' : 'border-gray-300'}`}>
                  <span className="text-gray-400 mr-2 text-xs">🔍</span>
                  <span className="truncate">{typedQuery}{phase === 2 ? <span className="animate-pulse">|</span> : null}</span>
                </div>
                <button
                  className={`rounded px-4 py-2 text-sm font-semibold text-white transition-all ${
                    phase >= 3 ? 'bg-blue-700 scale-95' : 'bg-blue-600'
                  } ${clickPulse ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="overflow-hidden bg-[#f3f2ef] px-4 pb-4">
              {/* Loading skeleton */}
              {(phase === 3 || phase === 4) && (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse rounded-lg bg-white p-3 shadow-sm">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-3/4 rounded bg-gray-200" />
                          <div className="h-3 w-1/2 rounded bg-gray-200" />
                          <div className="h-3 w-1/3 rounded bg-gray-200" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Real mini cards */}
              {phase === 5 && previewJobs.length > 0 && (
                <div className="space-y-2">
                  {previewJobs.slice(0, 3).map((job, i) => (
                    <div
                      key={job.id}
                      className="rounded-lg bg-white p-3 shadow-sm transition-all"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-700">
                          {job.company.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-800">{job.title}</p>
                          <p className="truncate text-[10px] text-gray-500">{job.company}</p>
                          <p className="truncate text-[10px] text-gray-400">{job.location}</p>
                        </div>
                        <span className="ml-auto shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">
                          Apply
                        </span>
                      </div>
                    </div>
                  ))}
                  {previewJobs.length > 3 && (
                    <p className="text-center text-[10px] text-gray-400">
                      +{previewJobs.length - 3} more results
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Animated cursor */}
        {phase > 0 && (
          <div
            className="pointer-events-none absolute z-10 transition-all duration-700 ease-in-out"
            style={{ left: cursorPos.left, top: cursorPos.top }}
          >
            <CursorIcon clicked={clickPulse} />
          </div>
        )}
      </div>
    </div>
  )
}

function CursorIcon({ clicked }: { clicked: boolean }) {
  return (
    <svg
      width="20" height="24"
      viewBox="0 0 20 24"
      className={`drop-shadow-md transition-transform duration-150 ${clicked ? 'scale-75' : 'scale-100'}`}
    >
      <path d="M0 0L0 20L5 15L8 22L11 21L8 14L14 14Z" fill="white" stroke="#333" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function LinkedInLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="4" fill="#0A66C2" />
      <text x="5" y="21" fontSize="16" fontWeight="bold" fill="white" fontFamily="serif">in</text>
    </svg>
  )
}
