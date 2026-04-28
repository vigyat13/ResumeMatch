const COMPANY_INSPIRED = new Set([
  'Google Style',
  'Amazon Style',
  'Meta Style',
  'Apple Style',
  'Microsoft Style',
  'Netflix Style',
  'Stripe Style',
])

const TWO_COLUMN = new Set([
  'Navy Sidebar',
  'Two Column Pro',
  'Data Scientist',
])

const TECHNICAL = new Set([
  'Technical',
  'Tech Minimal',
  'Data Scientist',
  'Academic Research',
  'Product Manager',
  'LinkedIn',
])

const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  'Google Style': 'Clean, dense, product-engineering format inspired by top-tier tech resumes.',
  'Amazon Style': 'Structured leadership-focused layout for high-ownership roles.',
  'Meta Style': 'Fast-scanning product and growth format with sharp section rhythm.',
  'Apple Style': 'Minimal premium layout with tight typography and disciplined white space.',
  'Microsoft Style': 'Balanced enterprise format for platform, cloud, and systems roles.',
  'Netflix Style': 'High-signal performance layout built for senior individual contributors.',
  'Stripe Style': 'Modern operator layout with crisp metrics and polished hierarchy.',
  'Classic': 'Straight ATS-first single-column resume with traditional hierarchy.',
  'Executive': 'Senior-level layout emphasizing scope, leadership, and business impact.',
  'Consulting': 'Consulting-style format with strong scanning and quantified bullets.',
  'Finance': 'Compact professional layout built for dense, analytical experience.',
  'Technical': 'Engineer-focused format with strong projects and skills sections.',
  'Tech Minimal': 'Minimal modern layout that keeps technical depth easy to scan.',
  'Academic Research': 'Research-forward template for publications and formal credentials.',
  'Product Manager': 'Outcome-first layout for product, strategy, and cross-functional leadership.',
  'Data Scientist': 'Hybrid technical template for modeling, experimentation, and analytics work.',
}

export function isCompanyInspiredTemplate(name: string): boolean {
  return COMPANY_INSPIRED.has(name)
}

export function getTemplateBadge(name: string): string {
  if (COMPANY_INSPIRED.has(name)) return 'Company Inspired'
  if (TECHNICAL.has(name)) return 'Technical'
  if (TWO_COLUMN.has(name)) return 'Two Column'
  return 'ATS Ready'
}

export function getTemplateDescription(name: string, description?: string | null): string {
  if (description?.trim()) return description
  return FALLBACK_DESCRIPTIONS[name] ?? 'Professional resume template optimized for fast recruiter scanning.'
}
