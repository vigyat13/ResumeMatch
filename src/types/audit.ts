export type IssueSeverity = 'high' | 'medium' | 'low'
export type RecommendationPriority = 'high' | 'medium' | 'low'

export interface AuditIssue {
  severity: IssueSeverity
  category: string
  message: string
}

export interface AuditRecommendation {
  priority: RecommendationPriority
  action: string
  impact: string
}

export interface AuditCategoryScores {
  format: number
  content: number
  keywords: number
  length: number
  contact_info: number
}

export interface AuditReport {
  id: string
  resume_id: string
  user_id: string
  overall_score: number
  category_scores: AuditCategoryScores
  issues: AuditIssue[]
  recommendations: AuditRecommendation[]
  created_at: string
  updated_at: string | null
}

export const CATEGORY_META: Record<
  keyof AuditCategoryScores,
  { label: string; weight: number; description: string }
> = {
  format:       { label: 'Format',       weight: 20, description: 'Section structure & parser compatibility' },
  content:      { label: 'Content',      weight: 25, description: 'Quantified achievements & action verbs' },
  keywords:     { label: 'Keywords',     weight: 25, description: 'Technical skills & role terminology' },
  length:       { label: 'Length',       weight: 15, description: 'Page count & content density' },
  contact_info: { label: 'Contact Info', weight: 15, description: 'Name, email, phone & LinkedIn' },
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#34d399'  // emerald
  if (score >= 60) return '#fbbf24'  // amber
  if (score >= 40) return '#f97316'  // orange
  return '#f87171'                   // red
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'ATS Ready'
  if (score >= 60) return 'Needs Work'
  if (score >= 40) return 'Weak'
  return 'Critical Issues'
}

export function severityColor(severity: IssueSeverity): string {
  return severity === 'high' ? '#f87171'
       : severity === 'medium' ? '#fbbf24'
       : '#60a5fa'
}

export function priorityColor(priority: RecommendationPriority): string {
  return priority === 'high' ? '#f87171'
       : priority === 'medium' ? '#fbbf24'
       : '#60a5fa'
}
