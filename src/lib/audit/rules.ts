import type { AuditIssue, AuditRecommendation } from '@/types/audit'
import { extractSkills } from '@/lib/resume/skills'

export interface GeneratedAudit {
  overall_score: number
  category_scores: {
    format: number
    content: number
    keywords: number
    length: number
    contact_info: number
  }
  issues: AuditIssue[]
  recommendations: AuditRecommendation[]
}

const SECTION_HEADINGS = [
  'summary',
  'experience',
  'work experience',
  'projects',
  'education',
  'skills',
  'certifications',
  'publications',
  'achievements',
]

const ACTION_VERBS = [
  'built', 'created', 'designed', 'developed', 'implemented', 'launched',
  'optimized', 'reduced', 'improved', 'increased', 'automated', 'led',
  'owned', 'architected', 'delivered', 'deployed', 'integrated',
]

export function generateRuleBasedAudit(text: string): GeneratedAudit {
  const normalized = text.toLowerCase()
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  const words = text.split(/\s+/).filter(Boolean)
  const bullets = lines.filter(line => /^[-•*]\s+/.test(line) || line.length > 80)
  const skills = extractSkills(text)

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(text)
  const hasLinkedIn = /linkedin\.com\/in\//i.test(text)
  const hasLocation = /\b(remote|india|usa|united states|gurugram|gurgaon|delhi|bangalore|bengaluru|mumbai|kolkata|pune|hyderabad|new york|san francisco|london)\b/i.test(text)
  const sectionMatches = SECTION_HEADINGS.filter(heading => normalized.includes(heading))
  const hasTablesOrColumns = /[│┃┆┇]| {8,}\S|(\S+\s{3,}\S+\s{3,}\S+)/.test(text)
  const hasQuantifiedBullets = bullets.filter(line => /\d+%?|\$\d+|\b\d+x\b/i.test(line)).length
  const hasActionVerbs = bullets.filter(line => ACTION_VERBS.some(verb => line.toLowerCase().startsWith(verb) || line.toLowerCase().includes(` ${verb} `))).length

  const contactScore = scoreFromBooleans([hasEmail, hasPhone, hasLinkedIn, hasLocation], 35)
  const formatScore = clampScore(55 + sectionMatches.length * 7 - (hasTablesOrColumns ? 18 : 0))
  const contentScore = clampScore(45 + Math.min(30, hasQuantifiedBullets * 7) + Math.min(20, hasActionVerbs * 4))
  const keywordsScore = clampScore(35 + Math.min(55, skills.length * 5))
  const lengthScore = clampScore(words.length < 220 ? 48 : words.length > 1100 ? 72 : 88)
  const overall = Math.round(
    formatScore * 0.20 +
    contentScore * 0.25 +
    keywordsScore * 0.25 +
    lengthScore * 0.15 +
    contactScore * 0.15
  )

  const issues: AuditIssue[] = []
  const recommendations: AuditRecommendation[] = []

  if (!hasEmail || !hasPhone || !hasLinkedIn) {
    issues.push({
      severity: 'high',
      category: 'Contact Info',
      message: 'Your contact section is incomplete. ATS systems and recruiters need email, phone, and LinkedIn clearly visible at the top.',
    })
    recommendations.push({
      priority: 'high',
      action: 'Add a complete contact line with email, phone, LinkedIn, and location.',
      impact: 'Improves parser confidence and makes recruiter follow-up easier.',
    })
  }

  if (skills.length < 8) {
    issues.push({
      severity: 'high',
      category: 'Keywords',
      message: `Only ${skills.length} recognizable skill${skills.length === 1 ? '' : 's'} were detected. Add more role-specific tools, frameworks, and technical keywords.`,
    })
    recommendations.push({
      priority: 'high',
      action: 'Add a compact skills section grouped by Languages, Frameworks, Databases, Cloud, and Tools.',
      impact: 'Improves ATS keyword matching for targeted roles.',
    })
  }

  if (hasQuantifiedBullets < 3) {
    issues.push({
      severity: 'medium',
      category: 'Content',
      message: 'Too few bullets include measurable outcomes. Recruiters and ATS scoring systems favor quantified impact.',
    })
    recommendations.push({
      priority: 'medium',
      action: 'Rewrite bullets with numbers, percentages, scale, latency, cost, revenue, or user impact.',
      impact: 'Makes achievements more credible and easier to rank.',
    })
  }

  if (sectionMatches.length < 4) {
    issues.push({
      severity: 'medium',
      category: 'Format',
      message: 'The resume is missing several standard section headings. Use clear labels like Experience, Projects, Education, and Skills.',
    })
  }

  if (hasTablesOrColumns) {
    issues.push({
      severity: 'medium',
      category: 'Format',
      message: 'The extracted text suggests columns or table-like spacing. Some ATS parsers read columns in the wrong order.',
    })
    recommendations.push({
      priority: 'medium',
      action: 'Use a single-column ATS-friendly layout for the version you submit online.',
      impact: 'Reduces parser errors and missing content.',
    })
  }

  if (words.length < 220) {
    issues.push({
      severity: 'low',
      category: 'Length',
      message: 'The resume appears short. Add more detail to projects, internships, and measurable achievements.',
    })
  } else if (words.length > 1100) {
    issues.push({
      severity: 'low',
      category: 'Length',
      message: 'The resume is long. Remove older or weaker details so the strongest experience is easier to scan.',
    })
  }

  if (recommendations.length < 3) {
    recommendations.push({
      priority: 'low',
      action: 'Tailor the resume to each job description before applying.',
      impact: 'Increases keyword overlap and improves shortlist probability.',
    })
  }

  return {
    overall_score: overall,
    category_scores: {
      format: formatScore,
      content: contentScore,
      keywords: keywordsScore,
      length: lengthScore,
      contact_info: contactScore,
    },
    issues: issues.slice(0, 7),
    recommendations: recommendations.slice(0, 5),
  }
}

export function normalizeAuditData(input: GeneratedAudit): GeneratedAudit {
  return {
    overall_score: clampScore(input.overall_score),
    category_scores: {
      format: clampScore(input.category_scores.format),
      content: clampScore(input.category_scores.content),
      keywords: clampScore(input.category_scores.keywords),
      length: clampScore(input.category_scores.length),
      contact_info: clampScore(input.category_scores.contact_info),
    },
    issues: input.issues.slice(0, 7).map(issue => ({
      severity: normalizeSeverity(issue.severity),
      category: String(issue.category || 'Content').slice(0, 40),
      message: String(issue.message || 'Review this resume area.').slice(0, 280),
    })),
    recommendations: input.recommendations.slice(0, 5).map(rec => ({
      priority: normalizePriority(rec.priority),
      action: String(rec.action || 'Improve this resume section.').slice(0, 180),
      impact: String(rec.impact || 'Improves ATS readability.').slice(0, 220),
    })),
  }
}

function scoreFromBooleans(values: boolean[], base: number): number {
  return clampScore(base + values.filter(Boolean).length * ((100 - base) / values.length))
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)))
}

function normalizeSeverity(value: unknown): 'high' | 'medium' | 'low' {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'medium'
}

function normalizePriority(value: unknown): 'high' | 'medium' | 'low' {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'medium'
}
