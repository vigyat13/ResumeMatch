export type AiUseCase =
  | 'resume_optimize'
  | 'resume_tailor'
  | 'resume_parse'
  | 'application_intelligence'

export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerateTextOptions {
  useCase: AiUseCase
  messages: AiMessage[]
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
}

export interface AiAdapter {
  readonly name: string
  generateText(model: string, options: GenerateTextOptions): Promise<string>
  streamText?(model: string, options: GenerateTextOptions): AsyncIterable<string>
}

export interface ModelConfig {
  provider: string
  model: string
  temperature: number
  maxTokens: number
  fallback?: {
    provider: string
    model: string
  }
}
