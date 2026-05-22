export const TEMPLATE_PRIORITY = [
  'FAANG Standard',
  'Modern Tech',
  'Minimal',
  'Two Column',
  'Executive',
  'Startup',
  'Academic',
  'Consulting',
  'Commerce Analyst',
  'Accounting & Finance',
  'Banking & Risk',
  'Marketing & Sales',
  'HR & Admin',
  'Operations & Supply Chain',
  'Product Manager',
  'Data Science',
  'ML Engineer',
  'Backend Engineer',
  'Frontend Engineer',
  'RenderCV EngineeringResumes',
  'Cybersecurity',
  'Cloud DevOps',
  'UI UX Designer',
  'General Professional',
  'Creative',
  'High Density',
  'Intern / Entry Level',
  'UK CV',
  'Europass',
  'Mono Clean',
  'Simple Universal',
] as const

const PRIORITY_INDEX = new Map<string, number>(
  TEMPLATE_PRIORITY.map((name, index) => [name, index])
)

export function sortTemplatesByPriority<T extends { name: string }>(templates: T[]): T[] {
  return [...templates].sort((a, b) => {
    const rankA = PRIORITY_INDEX.get(a.name) ?? 10_000
    const rankB = PRIORITY_INDEX.get(b.name) ?? 10_000
    if (rankA !== rankB) return rankA - rankB
    return a.name.localeCompare(b.name)
  })
}
