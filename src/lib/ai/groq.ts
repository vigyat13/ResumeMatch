/**
 * @deprecated Use `import { aiProvider } from '@/lib/ai/provider'` instead.
 * This file is kept for backward compatibility. New code should use the
 * provider abstraction which handles model selection, retry, and fallback.
 *
 * GROQ AI CLIENT
 *
 * Why Groq instead of OpenAI?
 *  • ~10x cheaper per million tokens (great for free-tier users)
 *  • ~10x faster latency (sub-second responses on Llama 3.3 70B)
 *  • OpenAI-compatible API → we use the openai npm package as-is
 *
 * Model selection:
 *  • llama-3.3-70b-versatile — best quality, ~250 tokens/sec
 *  • llama-3.1-8b-instant    — fastest, ~750 tokens/sec, lower quality
 *  • mixtral-8x7b-32768      — long-context (32k tokens)
 *
 * For resume feedback we use 70b (quality > speed for written advice).
 */

import OpenAI from 'openai'

// Reuse the OpenAI SDK by pointing it at Groq's endpoint
// This avoids vendor lock-in: switch baseURL + apiKey to swap providers
export const groq = new OpenAI({
  apiKey:  process.env.GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
})

export const GROQ_MODELS = {
  // Best balance of quality + speed for resume feedback
  default:  'llama-3.3-70b-versatile',
  // For low-stakes tasks like skill extraction
  fast:     'llama-3.1-8b-instant',
  // For long inputs (full resume + long JD)
  longCtx:  'mixtral-8x7b-32768',
} as const

export type GroqModel = typeof GROQ_MODELS[keyof typeof GROQ_MODELS]
