type RunStatus = 'starting' | 'searching' | 'needs_approval' | 'complete' | 'error'
type ApplyMode = 'review' | 'auto_open'
type StepStatus = 'pending' | 'running' | 'done' | 'error'
type JobStatus = 'found' | 'needs_approval' | 'opened'

export interface AgentStep {
  id: string
  label: string
  status: StepStatus
}

export interface AgentJob {
  id: string
  title: string
  company: string
  url: string
  source: string
  status: JobStatus
}

export interface AgentCursor {
  x: number
  y: number
  clicking: boolean
  label: string
}

export interface AgentRun {
  id: string
  sessionId: string
  query: string
  applyMode: ApplyMode
  status: RunStatus
  currentAction: string
  jobs: AgentJob[]
  steps: AgentStep[]
  screenshot: string | null
  cursor: AgentCursor | null
  error: string | null
  createdAt: string
  updatedAt: string
}

interface StartRunInput {
  sessionId: string
  connectUrl: string | null
  query: string
  applyMode: ApplyMode
}

interface AnchorResult {
  href: string
  text: string
}

const STORE_KEY = '__resumematch_browserbase_runs__'

const store = getStore()

export function startJobAgentRun(input: StartRunInput): AgentRun {
  const run: AgentRun = {
    id: crypto.randomUUID(),
    sessionId: input.sessionId,
    query: input.query,
    applyMode: input.applyMode,
    status: 'starting',
    currentAction: 'Starting Browserbase job search',
    jobs: [],
    steps: [
      { id: 'linkedin', label: 'Search LinkedIn Jobs', status: 'pending' },
      { id: 'indeed', label: 'Search Indeed', status: 'pending' },
      { id: 'ats', label: 'Search Greenhouse, Lever, Ashby', status: 'pending' },
      { id: 'collect', label: 'Collect job links', status: 'pending' },
      { id: 'apply', label: input.applyMode === 'auto_open' ? 'Open apply pages' : 'Ask before applying', status: 'pending' },
    ],
    screenshot: null,
    cursor: { x: 50, y: 50, clicking: false, label: 'Starting' },
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  store.set(run.id, run)
  void executeRun(run.id, input.connectUrl)
  return clone(run)
}

export function getJobAgentRun(runId: string): AgentRun | null {
  const run = store.get(runId)
  return run ? clone(run) : null
}

async function executeRun(runId: string, connectUrl: string | null) {
  if (!connectUrl) {
    failRun(runId, 'Browserbase did not return a connect URL for automation.')
    return
  }

  let client: CdpClient | null = null

  try {
    client = await CdpClient.connect(connectUrl)
    updateRun(runId, { status: 'searching', currentAction: 'Searching LinkedIn Jobs' })
    setStep(runId, 'linkedin', 'running')
    const linkedinJobs = await searchPage(client, {
      runId,
      source: 'LinkedIn',
      url: linkedinSearchUrl(readRun(runId).query),
      cursor: { x: 32, y: 18, clicking: true, label: 'Opening LinkedIn' },
    })
    addJobs(runId, linkedinJobs)
    setStep(runId, 'linkedin', 'done')

    updateRun(runId, { currentAction: 'Searching Indeed' })
    setStep(runId, 'indeed', 'running')
    const indeedJobs = await searchPage(client, {
      runId,
      source: 'Indeed',
      url: indeedSearchUrl(readRun(runId).query),
      cursor: { x: 36, y: 22, clicking: true, label: 'Opening Indeed' },
    })
    addJobs(runId, indeedJobs)
    setStep(runId, 'indeed', 'done')

    updateRun(runId, { currentAction: 'Searching ATS job pages' })
    setStep(runId, 'ats', 'running')
    const atsJobs = await searchPage(client, {
      runId,
      source: 'ATS',
      url: atsSearchUrl(readRun(runId).query),
      cursor: { x: 42, y: 20, clicking: true, label: 'Opening ATS search' },
    })
    addJobs(runId, atsJobs)
    setStep(runId, 'ats', 'done')

    setStep(runId, 'collect', 'running')
    updateRun(runId, { cursor: { x: 68, y: 34, clicking: true, label: 'Reading jobs' } })
    const run = readRun(runId)
    const jobs = run.jobs.slice(0, 12).map(job => ({
      ...job,
      status: run.applyMode === 'auto_open' ? 'opened' as const : 'needs_approval' as const,
    }))
    updateRun(runId, {
      jobs,
      currentAction: jobs.length ? 'Jobs found' : 'No job links extracted from the searched pages',
    })
    setStep(runId, 'collect', jobs.length ? 'done' : 'error')

    setStep(runId, 'apply', 'running')
    if (jobs.length && run.applyMode === 'auto_open') {
      updateRun(runId, { currentAction: 'Opening apply pages in browser tabs' })
      for (const job of jobs.slice(0, 5)) {
        const page = await client.openTab(job.url)
        await captureLiveFrame(runId, client, page.sessionId, { x: 72, y: 24, clicking: true, label: 'Opening apply page' })
        await delay(350)
      }
      setStep(runId, 'apply', 'done')
      updateRun(runId, { status: 'complete', currentAction: 'Apply pages opened for review' })
    } else if (jobs.length) {
      setStep(runId, 'apply', 'done')
      updateRun(runId, { status: 'needs_approval', currentAction: 'Review jobs and choose which ones to apply to' })
    } else {
      setStep(runId, 'apply', 'error')
      updateRun(runId, { status: 'complete', currentAction: 'Search finished. Open the live browser to continue manually.' })
    }
  } catch (err) {
    failRun(runId, (err as Error).message || 'Browser automation failed.')
  } finally {
    client?.close()
  }
}

async function searchPage(client: CdpClient, input: {
  runId: string
  source: string
  url: string
  cursor: AgentCursor
}): Promise<AgentJob[]> {
  const page = await client.openTab(input.url)
  await captureLiveFrame(input.runId, client, page.sessionId, input.cursor)
  await client.waitForPage(page.sessionId, 1800)
  await captureLiveFrame(input.runId, client, page.sessionId, { ...input.cursor, clicking: false, label: `Scanning ${input.source}` })
  await client.waitForPage(page.sessionId, 2200)
  await captureLiveFrame(input.runId, client, page.sessionId, { x: 64, y: 42, clicking: true, label: 'Extracting links' })
  const anchors = await client.extractAnchors(page.sessionId)
  return anchorsToJobs(anchors, input.source)
}

async function captureLiveFrame(
  runId: string,
  client: CdpClient,
  sessionId?: string,
  cursor?: AgentCursor,
) {
  const screenshot = sessionId ? await client.captureScreenshot(sessionId).catch(() => null) : null
  updateRun(runId, {
    screenshot: screenshot ?? readRun(runId).screenshot,
    cursor: cursor ?? readRun(runId).cursor,
  })
}

function anchorsToJobs(anchors: AnchorResult[], source: string): AgentJob[] {
  const seen = new Set<string>()
  const jobs: AgentJob[] = []

  for (const anchor of anchors) {
    const url = cleanUrl(anchor.href)
    const text = cleanText(anchor.text)
    if (!url || !isJobUrl(url) || seen.has(url)) continue

    seen.add(url)
    jobs.push({
      id: stableId(url),
      title: text || hostOf(url),
      company: companyFrom(url, text),
      url,
      source,
      status: 'found',
    })

    if (jobs.length >= 8) break
  }

  return jobs
}

class CdpClient {
  private ws: WebSocket
  private nextId = 0
  private pending = new Map<number, {
    resolve: (value: Record<string, unknown>) => void
    reject: (reason: Error) => void
  }>()

  private constructor(ws: WebSocket) {
    this.ws = ws
    this.ws.addEventListener('message', event => {
      const payload = safeJson(String(event.data))
      if (!payload || typeof payload.id !== 'number') return
      const pending = this.pending.get(payload.id)
      if (!pending) return
      this.pending.delete(payload.id)
      if (payload.error) pending.reject(new Error(JSON.stringify(payload.error)))
      else pending.resolve((payload.result ?? {}) as Record<string, unknown>)
    })
  }

  static connect(url: string): Promise<CdpClient> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      const timeout = setTimeout(() => reject(new Error('Browserbase connection timed out')), 15_000)
      ws.addEventListener('open', () => {
        clearTimeout(timeout)
        resolve(new CdpClient(ws))
      })
      ws.addEventListener('error', () => {
        clearTimeout(timeout)
        reject(new Error('Could not connect to Browserbase browser'))
      })
    })
  }

  async openTab(url: string): Promise<{ targetId: string; sessionId: string }> {
    const target = await this.send('Target.createTarget', { url: 'about:blank' })
    const targetId = String(target.targetId ?? '')
    if (!targetId) throw new Error('Browserbase did not create a browser tab')

    const attached = await this.send('Target.attachToTarget', { targetId, flatten: true })
    const sessionId = String(attached.sessionId ?? '')
    if (!sessionId) throw new Error('Could not attach to browser tab')

    await this.send('Page.enable', {}, sessionId)
    await this.send('Runtime.enable', {}, sessionId)
    await this.send('Page.navigate', { url }, sessionId)

    return { targetId, sessionId }
  }

  async waitForPage(sessionId: string, ms: number) {
    await delay(ms)
    await this.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true }, sessionId).catch(() => null)
  }

  async extractAnchors(sessionId: string): Promise<AnchorResult[]> {
    const script = `(() => Array.from(document.querySelectorAll('a[href]')).slice(0, 240).map(a => ({
      href: a.href,
      text: (a.innerText || a.textContent || a.getAttribute('aria-label') || document.title || '').trim()
    })))()`
    const result = await this.send('Runtime.evaluate', {
      expression: script,
      returnByValue: true,
      awaitPromise: true,
    }, sessionId)

    const value = (result.result as { value?: unknown } | undefined)?.value
    return Array.isArray(value) ? value.filter(isAnchorResult) : []
  }

  async captureScreenshot(sessionId: string): Promise<string> {
    const result = await this.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 64,
      captureBeyondViewport: false,
    }, sessionId)
    const data = typeof result.data === 'string' ? result.data : ''
    if (!data) throw new Error('No screenshot data')
    return `data:image/jpeg;base64,${data}`
  }

  close() {
    this.ws.close()
  }

  private send(method: string, params: Record<string, unknown> = {}, sessionId?: string) {
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const id = ++this.nextId
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }))
      setTimeout(() => {
        if (!this.pending.has(id)) return
        this.pending.delete(id)
        reject(new Error(`${method} timed out`))
      }, 20_000)
    })
  }
}

function readRun(runId: string): AgentRun {
  const run = store.get(runId)
  if (!run) throw new Error('Run not found')
  return run
}

function updateRun(runId: string, patch: Partial<AgentRun>) {
  const run = readRun(runId)
  store.set(runId, { ...run, ...patch, updatedAt: new Date().toISOString() })
}

function addJobs(runId: string, jobs: AgentJob[]) {
  const run = readRun(runId)
  const existing = new Set(run.jobs.map(job => job.url))
  const next = [...run.jobs]
  for (const job of jobs) {
    if (existing.has(job.url)) continue
    existing.add(job.url)
    next.push(job)
  }
  updateRun(runId, { jobs: next })
}

function setStep(runId: string, stepId: string, status: StepStatus) {
  const run = readRun(runId)
  updateRun(runId, {
    steps: run.steps.map(step => step.id === stepId ? { ...step, status } : step),
  })
}

function failRun(runId: string, error: string) {
  const run = readRun(runId)
  store.set(runId, {
    ...run,
    status: 'error',
    currentAction: 'Browser automation failed',
    error,
    steps: run.steps.map(step => step.status === 'running' ? { ...step, status: 'error' } : step),
    updatedAt: new Date().toISOString(),
  })
}

function getStore(): Map<string, AgentRun> {
  const globalStore = globalThis as typeof globalThis & { [STORE_KEY]?: Map<string, AgentRun> }
  if (!globalStore[STORE_KEY]) globalStore[STORE_KEY] = new Map()
  return globalStore[STORE_KEY]
}

function clone(run: AgentRun): AgentRun {
  return {
    ...run,
    jobs: run.jobs.map(job => ({ ...job })),
    steps: run.steps.map(step => ({ ...step })),
    cursor: run.cursor ? { ...run.cursor } : null,
  }
}

function linkedinSearchUrl(query: string): string {
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`
}

function indeedSearchUrl(query: string): string {
  return `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}`
}

function atsSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} apply site:greenhouse.io OR site:jobs.lever.co OR site:ashbyhq.com`)}`
}

function isJobUrl(url: string): boolean {
  return /linkedin\.com\/jobs|indeed\.com|greenhouse\.io|jobs\.lever\.co|ashbyhq\.com|workdayjobs|\/careers?\/|\/jobs?\/|\/apply/i.test(url)
}

function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      parsed.searchParams.delete(key)
    }
    return parsed.toString()
  } catch {
    return ''
  }
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim().slice(0, 140)
}

function companyFrom(url: string, text: string): string {
  const cleaned = cleanText(text)
  const atMatch = cleaned.match(/\bat\s+([^|,-]+)/i)
  if (atMatch?.[1]) return atMatch[1].trim().slice(0, 80)
  return hostOf(url).split('.')[0] || 'Company'
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function stableId(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  }
  return `job_${Math.abs(hash)}`
}

function isAnchorResult(value: unknown): value is AnchorResult {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.href === 'string' && typeof candidate.text === 'string'
}

function safeJson(value: string): Record<string, unknown> | null {
  try { return JSON.parse(value) as Record<string, unknown> } catch { return null }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
