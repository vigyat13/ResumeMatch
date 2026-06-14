/**
 * Minimal Chrome DevTools Protocol client for Browserbase sessions.
 * Connects over the session's WebSocket connect URL and drives one tab.
 */

interface CdpMessage {
  id?: number
  error?: unknown
  result?: Record<string, unknown>
}

export class Cdp {
  private ws: WebSocket
  private nextId = 0
  private pending = new Map<number, {
    resolve: (value: Record<string, unknown>) => void
    reject: (reason: Error) => void
  }>()

  private constructor(ws: WebSocket) {
    this.ws = ws
    this.ws.addEventListener('message', event => {
      const payload = parse(String(event.data))
      if (!payload || typeof payload.id !== 'number') return
      const waiter = this.pending.get(payload.id)
      if (!waiter) return
      this.pending.delete(payload.id)
      if (payload.error) waiter.reject(new Error(JSON.stringify(payload.error)))
      else waiter.resolve(payload.result ?? {})
    })
  }

  static connect(url: string, timeoutMs = 15_000): Promise<Cdp> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      const timer = setTimeout(() => reject(new Error('Browserbase connection timed out')), timeoutMs)
      ws.addEventListener('open', () => {
        clearTimeout(timer)
        resolve(new Cdp(ws))
      })
      ws.addEventListener('error', () => {
        clearTimeout(timer)
        reject(new Error('Could not connect to Browserbase browser'))
      })
    })
  }

  send(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<Record<string, unknown>> {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error(`CDP ${method} timed out`))
        }
      }, 20_000)
    })
  }

  /** Attach to the session's default page target and navigate it. */
  async openPage(url: string): Promise<string> {
    const targets = await this.send('Target.getTargets')
    const list = (targets.targetInfos ?? []) as Array<{ targetId: string; type: string }>
    let targetId = list.find(t => t.type === 'page')?.targetId

    if (!targetId) {
      const created = await this.send('Target.createTarget', { url: 'about:blank' })
      targetId = String(created.targetId ?? '')
    }
    if (!targetId) throw new Error('No browser tab available')

    const attached = await this.send('Target.attachToTarget', { targetId, flatten: true })
    const sessionId = String(attached.sessionId ?? '')
    if (!sessionId) throw new Error('Could not attach to browser tab')

    await this.send('Page.enable', {}, sessionId)
    await this.send('Runtime.enable', {}, sessionId)
    await this.send('Page.navigate', { url }, sessionId)
    return sessionId
  }

  async evaluate<T>(sessionId: string, expression: string): Promise<T | null> {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }, sessionId)
    const result = res.result as { value?: T } | undefined
    return result?.value ?? null
  }

  close() {
    try { this.ws.close() } catch { /* already closed */ }
  }
}

function parse(raw: string): CdpMessage | null {
  try { return JSON.parse(raw) } catch { return null }
}

export function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
