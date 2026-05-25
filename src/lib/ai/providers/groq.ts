import OpenAI from 'openai'
import type { AiAdapter, GenerateTextOptions } from '../types'

export class GroqAdapter implements AiAdapter {
  readonly name = 'groq'
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: 'https://api.groq.com/openai/v1',
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

  async *streamText(model: string, options: GenerateTextOptions): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model,
      messages: options.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 4000,
      stream: true,
      ...(options.signal ? { signal: options.signal } : {}),
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) yield delta
    }
  }
}
