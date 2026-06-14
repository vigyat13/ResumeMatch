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
  'LaTeXCV Rows',
  'YAAC Architect CV',
  'Raphael Timeline CV',
  'Mono Slate',
  'Timeline Dots',
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
  'LaTeXCV Classic Timeline',
  'LaTeXCV Modern Orange',
  'Awesome CV Classic',
  'Online Resume Card',
  'Elegant Banner',
])

const ACADEMIC = new Set([
  'Academic',
  'LaTeXCV Minimal Research',
])

const CREATIVE = new Set([
  'Creative',
  'UI UX Designer',
  'LaTeXCV Infographic Skills',
])

const PHOTO = new Set([
  'LaTeXCV Sidebar Photo',
  'LaTeXCV Left Sidebar',
  'LaTeXCV Two Column',
  'YAAC Architect CV',
  'Awesome CV Red',
  'Raphael Timeline CV',
  'Deedy Two Column',
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
  'LaTeXCV Classic Timeline': 'Classic latexcv-inspired professional CV with compact metadata rows and strong ruled sections.',
  'LaTeXCV Modern Orange': 'Modern latexcv-inspired CV with a photo header, orange section bands, and business-friendly spacing.',
  'LaTeXCV Sidebar Photo': 'Photo-led sidebar CV inspired by latexcv, useful for business, consulting, and general profiles.',
  'LaTeXCV Left Sidebar': 'Left-sidebar latexcv-style profile with front-loaded skills, contact, education, and certifications.',
  'LaTeXCV Two Column': 'Dense two-column latexcv-inspired CV for balanced education, projects, skills, and experience.',
  'LaTeXCV Minimal Research': 'Minimal latexcv-inspired academic layout with publication, research, project, and education emphasis.',
  'LaTeXCV Infographic Skills': 'Infographic-style latexcv layout with skill bars and visual sections for creative technical profiles.',
  'LaTeXCV Rows': 'Row-based latexcv template for technical resumes with compact metadata and readable sections.',
  'YAAC Architect CV': 'YAAC-inspired architect CV with photo header, social line, skill tags, and compact technical sections.',
  'Awesome CV Red': 'Awesome-CV-inspired resume with centered header, red highlights, quote block, and crisp sections.',
  'Raphael Timeline CV': 'ModernCV timeline-inspired layout for cloud, infrastructure, open-source, and consulting backgrounds.',
  'Awesome CV Classic': 'Awesome-CV-inspired layout with a left-aligned banner name, right-stacked contact column, and thin ruled section titles.',
  'Deedy Two Column':   'Deedy-resume-inspired layout with a centered ruled name and a narrow-left / wide-right two-column body.',
  'Online Resume Card': 'Clean modern web-resume layout with a centered header, role pill, and block-accent section titles.',
  'Mono Slate':         'Light monospace developer resume with hash-marked section titles — terminal feel without a dark background.',
  'Timeline Dots':      'ModernCV-casual-inspired layout with a dotted vertical timeline marking each experience and project entry.',
  'Elegant Banner':     'Full-width gradient banner header with reversed white name and contact, over a clean serif body.',
}

export function isCompanyInspiredTemplate(_name: string): boolean {
  void _name
  return false
}

export function isVisibleTemplate(name: string): boolean {
  return !HIDDEN_TEMPLATE_NAMES.has(name)
}

export function getTemplateBadge(name: string): string {
  if (TECHNICAL.has(name))  return 'Tech'
  if (COMMERCE.has(name))   return 'Commerce'
  if (BUSINESS.has(name))   return 'Business'
  if (ACADEMIC.has(name))   return 'Academic'
  if (CREATIVE.has(name))   return 'Creative'
  if (PHOTO.has(name))      return 'Photo CV'
  if (TWO_COLUMN.has(name)) return 'Two Column'
  return 'ATS Ready'
}

export function getTemplateDescription(name: string, description?: string | null): string {
  if (description?.trim()) return description
  return FALLBACK_DESCRIPTIONS[name] ?? 'Professional resume template optimized for ATS and recruiter scanning.'
}
