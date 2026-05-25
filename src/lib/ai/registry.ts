import type { AiAdapter } from './types'

const providers = new Map<string, AiAdapter>()

export function registerProvider(adapter: AiAdapter): void {
  providers.set(adapter.name, adapter)
}

export function getProvider(name: string): AiAdapter {
  const adapter = providers.get(name)
  if (!adapter) {
    throw new Error(
      `AI provider "${name}" is not registered. Available: [${Array.from(providers.keys()).join(', ')}]`
    )
  }
  return adapter
}

export function listProviders(): string[] {
  return Array.from(providers.keys())
}
