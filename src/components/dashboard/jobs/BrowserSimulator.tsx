'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Globe2, Lock, Search } from 'lucide-react'

export type BrowserPhase = 0 | 1 | 2 | 3 | 4 | 5
// 0 = idle, 1 = opening browser, 2 = typing query, 3 = submitting, 4 = scanning sites, 5 = results visible

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
  activePreviewIndex?: number
}

type Scene = 'google' | 'linkedin' | 'indeed' | 'glassdoor' | 'results'

const SCENE_URL: Record<Scene, string> = {
  google:    'google.com/search',
  linkedin:  'linkedin.com/jobs/search',
  indeed:    'indeed.com/jobs',
  glassdoor: 'glassdoor.com/Job',
  results:   'resumematch.ai/jobs/results',
}

function useTyping(target: string, active: boolean, speed = 42): string {
  const [typed, setTyped] = useState('')

  useEffect(() => {
    const reset = window.setTimeout(() => setTyped(''), 0)
    if (!active) return () => window.clearTimeout(reset)

    let i = 0
    const interval = window.setInterval(() => {
      i += 1
      setTyped(target.slice(0, i))
      if (i >= target.length) window.clearInterval(interval)
    }, speed)

    return () => {
      window.clearTimeout(reset)
      window.clearInterval(interval)
    }
  }, [active, speed, target])

  return typed
}

export function BrowserSimulator({ phase, query, location, previewJobs, activePreviewIndex = 0 }: BrowserSimulatorProps) {
  const [sceneTick, setSceneTick] = useState(0)
  const searchText = location ? `${query} jobs in ${location}` : `${query} jobs`
  const typedQuery = useTyping(searchText.trim(), phase >= 2, 38)
  const shownJobs = previewJobs.slice(0, 5)
  const activeRow = shownJobs.length > 0 ? Math.min(activePreviewIndex, shownJobs.length - 1) : 0

  useEffect(() => {
    if (phase < 1 || phase >= 5) return
    const interval = window.setInterval(() => setSceneTick(prev => prev + 1), 1700)
    return () => window.clearInterval(interval)
  }, [phase])

  const scene = useMemo<Scene>(() => {
    if (phase === 0) return 'google'
    if (phase === 5) return 'results'
    const scenes: Scene[] = ['google', 'linkedin', 'indeed', 'glassdoor']
    if (phase === 1) return 'google'
    if (phase === 2) return scenes[Math.min(sceneTick, 1)]
    return scenes[sceneTick % scenes.length]
  }, [phase, sceneTick])

  const cursor = getCursor(scene, phase, activeRow)
  const shouldClick = phase === 3 || phase === 5

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[#111] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#171717] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="hidden h-5 w-px bg-white/10 sm:block" />
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Globe2 className="h-4 w-4 text-white/45" />
            <span className="font-medium">Run 1</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-white/50">
          <span className={`h-2 w-2 rounded-full ${phase === 5 ? 'bg-green-400' : phase > 0 ? 'animate-pulse bg-blue-400' : 'bg-white/25'}`} />
          {phase === 5 ? `${shownJobs.length} jobs found` : phase > 0 ? 'Running' : 'Waiting'}
        </div>
      </div>

      <div className="relative aspect-video overflow-hidden bg-[#202020]">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 border-b border-black/10 bg-white px-4 py-2 text-xs text-gray-500">
          <Lock className="h-3.5 w-3.5 text-green-600" />
          <span className="truncate">{phase === 0 ? 'new-tab' : SCENE_URL[scene]}</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-5 pb-4 pt-16">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            {phase === 5 ? <Check className="h-4 w-4 text-green-300" /> : <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
            <span>{captionFor(scene, phase, searchText)}</span>
          </div>
        </div>

        {phase === 0 && <IdleScene />}
        {scene === 'google' && phase > 0 && (
          <GoogleScene query={typedQuery} rawQuery={query} active={phase >= 2} />
        )}
        {scene === 'linkedin' && phase > 0 && (
          <LinkedInScene query={typedQuery} rawQuery={query} jobs={shownJobs} activeRow={activeRow} phase={phase} />
        )}
        {scene === 'indeed' && phase > 0 && (
          <IndeedScene query={typedQuery} rawQuery={query} jobs={shownJobs} activeRow={activeRow} phase={phase} />
        )}
        {scene === 'glassdoor' && phase > 0 && (
          <GlassdoorScene query={typedQuery} rawQuery={query} jobs={shownJobs} activeRow={activeRow} phase={phase} />
        )}
        {scene === 'results' && (
          <ResultsScene jobs={shownJobs} activeRow={activeRow} />
        )}

        {phase > 0 && (
          <div
            className="pointer-events-none absolute z-20 transition-all duration-700 ease-in-out"
            style={{ left: cursor.left, top: cursor.top, transform: `rotate(${cursor.rotate})` }}
          >
            <CursorIcon clicked={shouldClick} pulseKey={`${scene}-${phase}-${activeRow}`} />
          </div>
        )}
      </div>
    </div>
  )
}

function getCursor(scene: Scene, phase: BrowserPhase, activeRow: number) {
  if (phase === 1) return { left: '58%', top: '47%', rotate: '-8deg' }
  if (phase === 2) return { left: '57%', top: '43%', rotate: '-3deg' }
  if (phase === 3) return { left: '69%', top: '45%', rotate: '4deg' }
  if (phase === 5) return { left: '79%', top: `${33 + activeRow * 10}%`, rotate: '3deg' }
  if (scene === 'linkedin') return { left: '31%', top: '52%', rotate: '8deg' }
  if (scene === 'indeed') return { left: '62%', top: '46%', rotate: '-4deg' }
  if (scene === 'glassdoor') return { left: '71%', top: '54%', rotate: '7deg' }
  return { left: '47%', top: '47%', rotate: '-5deg' }
}

function captionFor(scene: Scene, phase: BrowserPhase, query: string): string {
  if (phase === 0) return 'Enter a prompt to start the job search agent.'
  if (phase === 1) return 'Opening browser session and preparing job boards.'
  if (phase === 2) return `Typing search query: ${query}`
  if (phase === 3) return 'Submitting search and collecting result pages.'
  if (phase === 5) return 'Jobs found. The browser run is complete and the matching listings are ready below.'
  if (scene === 'linkedin') return 'Scanning LinkedIn listings and opening relevant roles.'
  if (scene === 'indeed') return 'Checking Indeed results, filters, and recent postings.'
  if (scene === 'glassdoor') return 'Reviewing Glassdoor company listings and details.'
  return 'Searching Google for matching job pages.'
}

function IdleScene() {
  return (
    <div className="flex h-full items-center justify-center bg-[#f7f7f7] pt-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
          <Search className="h-6 w-6" />
        </div>
        <p className="text-lg font-semibold text-gray-900">Ready to search jobs</p>
        <p className="mt-1 text-sm text-gray-500">The live browser preview will appear here.</p>
      </div>
    </div>
  )
}

function GoogleScene({ query, rawQuery, active }: { query: string; rawQuery: string; active: boolean }) {
  const role = roleFromQuery(rawQuery)
  const suggestions = [
    `${role} jobs`,
    `${role} jobs remote`,
    `${role} jobs near me`,
    `${role} developer jobs`,
    `${role} jobs openings today`,
  ]
  return (
    <div className="flex h-full flex-col items-center bg-white pt-[17%]">
      <div className="mb-8 text-5xl font-semibold tracking-tight">
        <span className="text-blue-500">G</span><span className="text-red-500">o</span><span className="text-yellow-500">o</span><span className="text-blue-500">g</span><span className="text-green-500">l</span><span className="text-red-500">e</span>
      </div>
      <div className="w-[min(560px,90%)] rounded-2xl border border-gray-200 bg-white shadow-lg">
        <div className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700">
          <Search className="h-4 w-4 text-gray-400" />
          <span className="min-h-5 flex-1">{active ? query : ''}<span className="animate-pulse">|</span></span>
        </div>
        <div className="border-t border-gray-100 py-2">
          {suggestions.map(item => (
            <div key={item} className="flex items-center gap-3 px-4 py-1.5 text-sm text-gray-700">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LinkedInScene({ query, rawQuery, jobs, activeRow, phase }: { query: string; rawQuery: string; jobs: PreviewJob[]; activeRow: number; phase: BrowserPhase }) {
  const roles = jobs.length > 0 ? jobs.map(job => job.title) : rolesForQuery(rawQuery, 'linkedin')
  const companies = jobs.length > 0 ? jobs.map(job => job.company) : ['Northstar Labs', 'Stripeworks', 'Apex Systems', 'NovaCloud']
  return (
    <BoardScene
      brand="LinkedIn"
      brandClass="text-[#0A66C2]"
      buttonClass="bg-[#0A66C2]"
      query={query}
      activeRow={activeRow}
      phase={phase}
      roles={roles}
      companies={companies}
    />
  )
}

function IndeedScene({ query, rawQuery, jobs, activeRow, phase }: { query: string; rawQuery: string; jobs: PreviewJob[]; activeRow: number; phase: BrowserPhase }) {
  const roles = jobs.length > 0 ? jobs.map(job => job.title) : rolesForQuery(rawQuery, 'indeed')
  const companies = jobs.length > 0 ? jobs.map(job => job.company) : ['BrightLayer', 'OrbitPay', 'LaunchGrid', 'ScaleDesk']
  return (
    <BoardScene
      brand="indeed"
      brandClass="text-[#2557a7]"
      buttonClass="bg-[#2557a7]"
      query={query}
      activeRow={activeRow}
      phase={phase}
      roles={roles}
      companies={companies}
    />
  )
}

function GlassdoorScene({ query, rawQuery, jobs, activeRow, phase }: { query: string; rawQuery: string; jobs: PreviewJob[]; activeRow: number; phase: BrowserPhase }) {
  const roles = jobs.length > 0 ? jobs.map(job => job.title) : rolesForQuery(rawQuery, 'glassdoor')
  const companies = jobs.length > 0 ? jobs.map(job => job.company) : ['Greenhouse AI', 'CloudNine', 'MetricLoop', 'NimbleHQ']
  return (
    <BoardScene
      brand="Glassdoor"
      brandClass="text-[#0caa41]"
      buttonClass="bg-[#0caa41]"
      query={query}
      activeRow={activeRow}
      phase={phase}
      roles={roles}
      companies={companies}
    />
  )
}

function BoardScene({
  brand,
  brandClass,
  buttonClass,
  query,
  activeRow,
  phase,
  roles,
  companies,
}: {
  brand: string
  brandClass: string
  buttonClass: string
  query: string
  activeRow: number
  phase: BrowserPhase
  roles: string[]
  companies: string[]
}) {
  return (
    <div className="h-full bg-[#f4f2ef] pt-10">
      <div className="flex items-center gap-5 border-b border-gray-200 bg-white px-12 py-4">
        <div className={`text-xl font-bold ${brandClass}`}>{brand}</div>
        <div className="flex flex-1 gap-3">
          <div className="flex flex-1 items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
            <Search className="mr-2 h-4 w-4 text-gray-400" />
            <span className="truncate">{query}</span>
          </div>
          <button className={`rounded-lg px-5 py-2 text-sm font-semibold text-white ${buttonClass} ${phase >= 3 ? 'scale-95' : ''}`}>
            Search
          </button>
        </div>
      </div>
      <div className="grid grid-cols-[300px_1fr] gap-5 px-12 py-5">
        <div className="space-y-3">
          {roles.slice(0, 5).map((role, index) => (
            <div
              key={`${role}-${index}`}
              className={`rounded-xl border bg-white p-4 shadow-sm transition-all duration-500 ${
                activeRow % roles.length === index ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200'
              }`}
            >
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-200" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{role}</p>
                  <p className="truncate text-xs text-gray-500">{companies[index] ?? 'Hiring team'}</p>
                  <p className="mt-1 text-xs text-gray-400">{index + 1}h ago · Remote</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 h-5 w-1/2 rounded bg-gray-200" />
          <div className="mb-3 h-4 w-2/3 rounded bg-gray-100" />
          <div className="mb-6 h-4 w-1/3 rounded bg-gray-100" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-11/12 rounded bg-gray-100" />
            <div className="h-3 w-9/12 rounded bg-gray-100" />
          </div>
          <button className={`mt-6 rounded-full px-5 py-2 text-sm font-semibold text-white ${buttonClass}`}>Open job</button>
        </div>
      </div>
    </div>
  )
}

function roleFromQuery(query: string): string {
  const cleaned = query
    .replace(/\b(jobs?|roles?|openings?|hiring|remote|onsite|hybrid|in)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return 'software engineer'
  return cleaned.toLowerCase()
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function rolesForQuery(query: string, board: 'linkedin' | 'indeed' | 'glassdoor'): string[] {
  const role = roleFromQuery(query)
  const title = titleCase(role)
  const isBackend = /\b(back\s*end|backend|api|node|java|python|go|golang|django|spring)\b/i.test(role)
  const isData = /\b(data|analyst|analytics|ml|machine learning|ai)\b/i.test(role)
  const isProduct = /\b(product|pm|manager)\b/i.test(role)

  if (isBackend) {
    return board === 'indeed'
      ? ['Backend Developer', 'API Engineer', 'Node.js Backend Engineer', 'Platform Backend Engineer', 'Java Backend Developer']
      : ['Backend Engineer', 'Senior Backend Engineer', 'Software Engineer, Backend', 'Cloud API Engineer', 'Distributed Systems Engineer']
  }

  if (isData) {
    return ['Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'Analytics Engineer', 'BI Analyst']
  }

  if (isProduct) {
    return ['Product Manager', 'Associate Product Manager', 'Technical Product Manager', 'Product Analyst', 'Growth Product Manager']
  }

  return [`${title} Engineer`, `Senior ${title}`, `${title} Developer`, `${title} Specialist`, `${title} Intern`]
}

function ResultsScene({ jobs, activeRow }: { jobs: PreviewJob[]; activeRow: number }) {
  return (
    <div className="h-full bg-[#f7f7f7] px-12 pt-14">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-gray-950">ResumeMatch results</p>
          <p className="text-sm text-gray-500">Ranked from live job-board data</p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">{jobs.length} selected</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {jobs.map((job, index) => (
          <div
            key={job.id}
            className={`rounded-xl border bg-white p-4 shadow-sm transition-all duration-500 ${
              index === activeRow ? 'scale-[1.02] border-green-500 ring-2 ring-green-500/20' : 'border-gray-200'
            }`}
          >
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-xs font-bold text-white">
                {job.company.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-950">{job.title}</p>
                <p className="truncate text-xs text-gray-500">{job.company} · {job.location}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-600">{job.source}</span>
              <span className={index === activeRow ? 'font-semibold text-green-700' : 'text-gray-400'}>
                {index === activeRow ? 'Opening' : 'Queued'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CursorIcon({ clicked, pulseKey }: { clicked: boolean; pulseKey: string }) {
  return (
    <div className="relative">
      {clicked && <span key={pulseKey} className="absolute -left-2 -top-2 h-9 w-9 rounded-full border-2 border-blue-500/70 animate-cursor-click" />}
      <svg width="24" height="30" viewBox="0 0 20 24" className={`drop-shadow-md transition-transform duration-150 ${clicked ? 'scale-75' : 'scale-100'}`}>
        <path d="M0 0L0 20L5 15L8 22L11 21L8 14L14 14Z" fill="white" stroke="#242424" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
