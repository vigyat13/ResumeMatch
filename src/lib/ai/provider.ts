import type { AiUseCase, AiMessage, GenerateTextOptions } from './types'
import { getModelConfig } from './config'
import { registerProvider, getProvider } from './registry'
import { GroqAdapter } from './providers/groq'
import { withRetry } from './middleware/retry'

export type { AiUseCase, AiMessage, GenerateTextOptions }

// Auto-register the default Groq provider on module load
registerProvider(withRetry(new GroqAdapter(), { maxAttempts: 2, delayMs: 800 }))

// Lazily register OpenAI only if the key is present
if (process.env.OPENAI_API_KEY) {
  import('./providers/openai').then(({ OpenAIAdapter }) => {
    registerProvider(withRetry(new OpenAIAdapter(), { maxAttempts: 2, delayMs: 800 }))
  })
}

/**
 * Unified AI provider interface.
 * Routes calls through config → registry → adapter with automatic fallback.
 */
export const aiProvider = {
  async generateText(options: GenerateTextOptions): Promise<string> {
    const config = getModelConfig(options.useCase)

    const resolvedOptions: GenerateTextOptions = {
      ...options,
      temperature: options.temperature ?? config.temperature,
      maxTokens: options.maxTokens ?? config.maxTokens,
    }

    try {
      const adapter = getProvider(config.provider)
      return await adapter.generateText(config.model, resolvedOptions)
    } catch (primaryError) {
      // If a fallback is configured, try it
      if (config.fallback) {
        console.warn(
          `[AI] Primary provider "${config.provider}/${config.model}" failed, trying fallback "${config.fallback.provider}/${config.fallback.model}"`,
          primaryError instanceof Error ? primaryError.message : primaryError
        )
        const fallbackAdapter = getProvider(config.fallback.provider)
        return await fallbackAdapter.generateText(config.fallback.model, resolvedOptions)
      }
      throw primaryError
    }
  },
}
