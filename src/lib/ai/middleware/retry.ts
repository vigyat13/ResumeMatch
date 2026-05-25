import type { AiAdapter, GenerateTextOptions } from '../types'

interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
}

/**
 * Wraps an adapter with retry logic.
 * On exhaustion of retries, throws the last error.
 */
export function withRetry(adapter: AiAdapter, options: RetryOptions = {}): AiAdapter {
  const { maxAttempts = 2, delayMs = 800 } = options

  return {
    name: adapter.name,
    async generateText(model: string, opts: GenerateTextOptions): Promise<string> {
      let lastError: unknown
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await adapter.generateText(model, opts)
        } catch (err) {
          lastError = err
          if (attempt < maxAttempts) {
            await sleep(delayMs * attempt)
          }
        }
      }
      throw lastError
    },
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
