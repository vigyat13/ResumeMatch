const TWO_COLUMN = new Set([
  'Two Column',
  'Europass',
])

const HIDDEN_TEMPLATE_NAMES = new Set([
  'Two Column',
])

const TECHNICAL = new Set([
  'FAANG Standard',
  'ML Engineer',
  'Backend Engineer',
  'Frontend Engineer',
  'Data Science',
  'Mono Clean',
  'RenderCV EngineeringResumes',
  'Cybersecurity',
  'Cloud DevOps',
])

const COMMERCE = new Set([
  'Commerce Analyst',
  'Accounting & Finance',
  'Banking & Risk',
])

const BUSINESS = new Set([
  'Marketing & Sales',
  'HR & Admin',
  'Operations & Supply Chain',
  'General Professional',
])

const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  'FAANG Standard':     'Classic single-column layout used at top tech companies. Times New Roman, ruled section headers.',
  'Modern Tech':        'Blue-accent modern layout for software engineers and tech roles.',
  'Minimal':            'Ultra-clean minimal layout. Zero decoration, maximum readability.',
  'Two Column':         'Skills sidebar + main content. Good for dense technical profiles.',
  'Executive':          'Formal Georgia serif layout for senior and leadership roles.',
  'Startup':            'Bold green-accent layout putting projects and impact first.',
  'Academic':           'Serif academic CV with research, publications, and education emphasis.',
  'Consulting':         'Strong ruled headers and impact-first bullets for consulting roles.',
  'Product Manager':    'Outcome-first layout for product strategy and cross-functional leadership.',
  'Data Science':       'Blue-sky accent layout for ML, data, and analytics roles.',
  'ML Engineer':        'Purple-accent systems layout for machine learning engineers.',
  'Backend Engineer':   'Monospace-headers layout for APIs, systems, and backend roles.',
  'Frontend Engineer':  'Amber-accent layout putting UI projects front and center.',
  'Creative':           'Red-accent Trebuchet layout — expressive but ATS-safe.',
  'High Density':       'Compact 11px layout that fits more content on one page.',
  'Intern / Entry Level': 'Clean simple layout leading with education and projects.',
  'UK CV':              'British CV format with a personal profile section.',
  'Europass':           'European two-column CV format with dark blue sidebar.',
  'Mono Clean':         'Monospace developer layout — terminal-style clean.',
  'RenderCV EngineeringResumes': 'RenderCV engineeringresumes-inspired CV with centered header, serif typography, ruled section titles, and dense ATS-safe entries.',
  'Simple Universal':   'Universal single-column layout that works for any role.',
  'Commerce Analyst':   'Clean commerce CV for analyst, finance, business operations, and fresher roles.',
  'Accounting & Finance': 'Formal finance resume with strong sections for accounting, audit, tax, and FP&A roles.',
  'Banking & Risk':     'Conservative banking CV for risk, credit, compliance, and investment operations.',
  'Marketing & Sales':  'Business resume for marketing, sales, CRM, growth, and client-facing roles.',
  'HR & Admin':         'Professional CV for HR, recruiting, administration, and coordinator roles.',
  'Operations & Supply Chain': 'Metrics-first operations CV for logistics, procurement, and process roles.',
  'Cybersecurity':      'Technical security resume for SOC, cloud security, GRC, and analyst roles.',
  'Cloud DevOps':       'Infrastructure-focused layout for DevOps, SRE, cloud, platform, and backend engineers.',
  'UI UX Designer':     'Portfolio-friendly ATS-safe CV for UX, UI, product design, and research roles.',
  'General Professional': 'Flexible all-purpose CV for non-technical corporate, support, and management roles.',
}

export function isCompanyInspiredTemplate(_name: string): boolean {
  void _name
  return false
}

export function isVisibleTemplate(name: string): boolean {
  return !HIDDEN_TEMPLATE_NAMES.has(name)
}

export function getTemplateBadge(name: string): string {
  if (TECHNICAL.has(name))  return 'Technical'
  if (COMMERCE.has(name))   return 'Commerce'
  if (BUSINESS.has(name))   return 'Business'
  if (TWO_COLUMN.has(name)) return 'Two Column'
  return 'ATS Ready'
}

export function getTemplateDescription(name: string, description?: string | null): string {
  if (description?.trim()) return description
  return FALLBACK_DESCRIPTIONS[name] ?? 'Professional resume template optimized for ATS and recruiter scanning.'
}
