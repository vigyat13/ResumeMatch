import type { AiUseCase, ModelConfig } from './types'

const DEFAULT_CONFIGS: Record<AiUseCase, ModelConfig> = {
  resume_optimize: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    maxTokens: 5200,
    fallback: { provider: 'groq', model: 'llama-3.1-8b-instant' },
  },
  resume_tailor: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    maxTokens: 5200,
    fallback: { provider: 'groq', model: 'llama-3.1-8b-instant' },
  },
  resume_parse: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    maxTokens: 4000,
    fallback: { provider: 'groq', model: 'llama-3.1-8b-instant' },
  },
  application_intelligence: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    maxTokens: 4000,
    fallback: { provider: 'groq', model: 'llama-3.1-8b-instant' },
  },
}

/**
 * Resolve model config for a use case.
 * Priority: env var per-use-case > env var global > default config.
 */
export function getModelConfig(useCase: AiUseCase): ModelConfig {
  const defaults = DEFAULT_CONFIGS[useCase]

  const envKey = `AI_${useCase.toUpperCase()}_MODEL`
  const perUseCaseModel = process.env[envKey]
  const globalProvider = process.env.AI_PROVIDER
  const globalModel = process.env.AI_MODEL
  const fallbackProvider = process.env.AI_FALLBACK_PROVIDER
  const fallbackModel = process.env.AI_FALLBACK_MODEL

  return {
    provider: globalProvider || defaults.provider,
    model: perUseCaseModel || globalModel || defaults.model,
    temperature: defaults.temperature,
    maxTokens: defaults.maxTokens,
    fallback: fallbackModel
      ? { provider: fallbackProvider || defaults.fallback?.provider || defaults.provider, model: fallbackModel }
      : defaults.fallback,
  }
}
