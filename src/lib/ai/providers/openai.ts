import OpenAI from 'openai'
import type { AiAdapter, GenerateTextOptions } from '../types'

/**
 * OpenAI-compatible adapter.
 * Works with OpenAI, Azure OpenAI, or any OpenAI-compatible endpoint.
 */
export class OpenAIAdapter implements AiAdapter {
  readonly name = 'openai'
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
    })
  }

  async generateText(model: string, options: GenerateTextOptions): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model,
      messages: options.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 4000,
      ...(options.signal ? { signal: options.signal } : {}),
    })

    return completion.choices[0]?.message?.content ?? ''
  }
}
