export const TEMPLATE_PRIORITY = [
  'Classic',
  'ATS Pure',
  'Harvard Format',
  'Corporate Classic',
  'Executive',
  'Consulting',
  'Finance',
  'Technical',
  'Tech Minimal',
  'Compact Pro',
  'Product Manager',
  'Data Scientist',
  'LinkedIn',
  'Academic Research',
  'Google Style',
  'Amazon Style',
  'Meta Style',
  'Apple Style',
  'Microsoft Style',
  'Netflix Style',
  'Stripe Style',
] as const

const PRIORITY_INDEX = new Map<string, number>(TEMPLATE_PRIORITY.map((name, index) => [name, index]))

export function sortTemplatesByPriority<T extends { name: string }>(templates: T[]): T[] {
  return [...templates].sort((a, b) => {
    const rankA = PRIORITY_INDEX.get(a.name) ?? 10_000
    const rankB = PRIORITY_INDEX.get(b.name) ?? 10_000

    if (rankA !== rankB) return rankA - rankB
    return a.name.localeCompare(b.name)
  })
}
