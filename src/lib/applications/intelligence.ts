export type ApplicationAction =
  | 'apply_now'
  | 'apply_with_referral'
  | 'tailor_first'
  | 'research_first'
  | 'skip'

export interface ScoreSet {
  overall_fit: number
  ats_alignment: number
  recruiter_signal: number
  company_quality: number
  ghost_job_risk: number
  referral_potential: number
  interview_readiness: number
  salary_alignment: number
  application_priority: number
}

export interface SkillGap {
  skill: string
  importance: 'low' | 'medium' | 'high'
  evidence: string
  action: string
}

export interface ApplicationIntelligence {
  summary: string
  recommended_action: ApplicationAction
  scores: ScoreSet
  strengths: string[]
  weaknesses: string[]
  skill_gaps: SkillGap[]
  role_strategy: {
    positioning: string
    resume_focus: string[]
    keywords: string[]
    risk_flags: string[]
  }
  artifacts: {
    cover_letter: string
    recruiter_message: string
    referral_message: string
    linkedin_connection_note: string
    follow_up_message: string
    salary_talk_track: string
  }
  interview: {
    likely_questions: string[]
    stories_to_prepare: string[]
    weaknesses_to_address: string[]
  }
  projects_certifications: string[]
  application_plan: string[]
  analytics_tags: string[]
}

const ACTIONS = new Set<ApplicationAction>([
  'apply_now',
  'apply_with_referral',
  'tailor_first',
  'research_first',
  'skip',
])

const DEFAULT_SCORES: ScoreSet = {
  overall_fit: 55,
  ats_alignment: 55,
  recruiter_signal: 50,
  company_quality: 50,
  ghost_job_risk: 35,
  referral_potential: 45,
  interview_readiness: 50,
  salary_alignment: 50,
  application_priority: 55,
}

export function buildApplicationPrompt(input: {
  resumeText: string
  profileNotes: string
  jobTitle?: string
  company?: string
  jobDescription: string
  location?: string
  salaryTarget?: string
}): string {
  return `You are ResumeMatch's senior career strategist and application intelligence engine.

Analyze this candidate and role like a pragmatic recruiter, ATS consultant, interview coach, and job-search operator.

Rules:
- Be specific and realistic. Do not flatter.
- Never invent candidate experience. If proof is missing, call it missing.
- Prioritize high-conversion applications, not high application volume.
- Ghost-job risk means the listing may be stale, vague, duplicated, always-open, or low-intent.
- Company quality should use only signals visible in the provided JD unless explicitly known from the text.
- Salary alignment should be based on provided target and JD signals; if salary is absent, score uncertainty conservatively.
- Generate supervised networking/application drafts only. Do not imply silent automation.

CANDIDATE RESUME:
---
${input.resumeText.slice(0, 6500) || 'No parsed resume provided.'}
---

CANDIDATE NOTES:
---
${input.profileNotes.slice(0, 3500) || 'No extra candidate notes provided.'}
---

TARGET ROLE:
Title: ${input.jobTitle || 'Unknown'}
Company: ${input.company || 'Unknown'}
Location: ${input.location || 'Unknown'}
Salary target: ${input.salaryTarget || 'Unknown'}

JOB DESCRIPTION:
---
${input.jobDescription.slice(0, 7000)}
---

Return ONLY valid JSON. No markdown. No commentary.
Use this exact shape:
{
  "summary": "2 sentence application strategy summary",
  "recommended_action": "apply_now | apply_with_referral | tailor_first | research_first | skip",
  "scores": {
    "overall_fit": 0,
    "ats_alignment": 0,
    "recruiter_signal": 0,
    "company_quality": 0,
    "ghost_job_risk": 0,
    "referral_potential": 0,
    "interview_readiness": 0,
    "salary_alignment": 0,
    "application_priority": 0
  },
  "strengths": ["specific strength with resume/JD evidence"],
  "weaknesses": ["specific weakness or risk"],
  "skill_gaps": [
    { "skill": "skill name", "importance": "low | medium | high", "evidence": "why this matters", "action": "what to do next" }
  ],
  "role_strategy": {
    "positioning": "how candidate should position themselves",
    "resume_focus": ["resume change to prioritize"],
    "keywords": ["ATS/recruiter keyword"],
    "risk_flags": ["role/company/application risk"]
  },
  "artifacts": {
    "cover_letter": "3 concise paragraphs, no headers",
    "recruiter_message": "short recruiter DM",
    "referral_message": "short referral ask",
    "linkedin_connection_note": "under 300 characters",
    "follow_up_message": "short follow-up message",
    "salary_talk_track": "salary positioning script"
  },
  "interview": {
    "likely_questions": ["question"],
    "stories_to_prepare": ["STAR story prompt"],
    "weaknesses_to_address": ["interview risk to prepare"]
  },
  "projects_certifications": ["project or certification suggestion tied to gaps"],
  "application_plan": ["ordered next step"],
  "analytics_tags": ["short lowercase tag"]
}

Score guidance:
- 80-100: strong, high-confidence signal
- 60-79: viable but needs tailoring or proof
- 40-59: mixed or uncertain
- 0-39: weak, risky, or likely low conversion
- For ghost_job_risk, higher means more suspicious.`
}

export function parseApplicationIntelligence(raw: string): ApplicationIntelligence {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  return normalizeApplicationIntelligence(JSON.parse(cleaned) as Partial<ApplicationIntelligence>)
}

export function fallbackApplicationIntelligence(): ApplicationIntelligence {
  return {
    summary: 'The role needs a manual review because AI analysis could not complete. Use the checklist below to decide whether this is worth a tailored application.',
    recommended_action: 'research_first',
    scores: DEFAULT_SCORES,
    strengths: ['Resume and job description were received for comparison.'],
    weaknesses: ['Automated analysis failed, so fit, company quality, and ghost-job risk need manual confirmation.'],
    skill_gaps: [],
    role_strategy: {
      positioning: 'Lead with the strongest directly relevant experience and quantify outcomes wherever possible.',
      resume_focus: ['Mirror the exact role title and top hard skills from the JD.', 'Move the most relevant project or work bullets near the top.'],
      keywords: [],
      risk_flags: ['Confirm the posting date, company careers-page listing, recruiter identity, and salary range before investing heavily.'],
    },
    artifacts: {
      cover_letter: '',
      recruiter_message: '',
      referral_message: '',
      linkedin_connection_note: '',
      follow_up_message: '',
      salary_talk_track: '',
    },
    interview: {
      likely_questions: [],
      stories_to_prepare: [],
      weaknesses_to_address: [],
    },
    projects_certifications: [],
    application_plan: ['Validate the job is active.', 'Tailor the resume to the top 5 requirements.', 'Find a referral before applying if possible.'],
    analytics_tags: ['manual-review'],
  }
}

function normalizeApplicationIntelligence(value: Partial<ApplicationIntelligence>): ApplicationIntelligence {
  const action = value.recommended_action
  return {
    summary: stringOr(value.summary, 'Application analysis completed. Review the scores and generated artifacts before applying.'),
    recommended_action: action && ACTIONS.has(action) ? action : 'tailor_first',
    scores: normalizeScores(value.scores),
    strengths: stringList(value.strengths).slice(0, 8),
    weaknesses: stringList(value.weaknesses).slice(0, 8),
    skill_gaps: normalizeSkillGaps(value.skill_gaps).slice(0, 8),
    role_strategy: {
      positioning: stringOr(value.role_strategy?.positioning, 'Position the resume around the role requirements with clear quantified proof.'),
      resume_focus: stringList(value.role_strategy?.resume_focus).slice(0, 8),
      keywords: stringList(value.role_strategy?.keywords).slice(0, 18),
      risk_flags: stringList(value.role_strategy?.risk_flags).slice(0, 8),
    },
    artifacts: {
      cover_letter: stringOr(value.artifacts?.cover_letter, ''),
      recruiter_message: stringOr(value.artifacts?.recruiter_message, ''),
      referral_message: stringOr(value.artifacts?.referral_message, ''),
      linkedin_connection_note: stringOr(value.artifacts?.linkedin_connection_note, ''),
      follow_up_message: stringOr(value.artifacts?.follow_up_message, ''),
      salary_talk_track: stringOr(value.artifacts?.salary_talk_track, ''),
    },
    interview: {
      likely_questions: stringList(value.interview?.likely_questions).slice(0, 10),
      stories_to_prepare: stringList(value.interview?.stories_to_prepare).slice(0, 8),
      weaknesses_to_address: stringList(value.interview?.weaknesses_to_address).slice(0, 8),
    },
    projects_certifications: stringList(value.projects_certifications).slice(0, 8),
    application_plan: stringList(value.application_plan).slice(0, 8),
    analytics_tags: stringList(value.analytics_tags).slice(0, 12),
  }
}

function normalizeScores(scores?: Partial<ScoreSet>): ScoreSet {
  return {
    overall_fit: score(scores?.overall_fit, DEFAULT_SCORES.overall_fit),
    ats_alignment: score(scores?.ats_alignment, DEFAULT_SCORES.ats_alignment),
    recruiter_signal: score(scores?.recruiter_signal, DEFAULT_SCORES.recruiter_signal),
    company_quality: score(scores?.company_quality, DEFAULT_SCORES.company_quality),
    ghost_job_risk: score(scores?.ghost_job_risk, DEFAULT_SCORES.ghost_job_risk),
    referral_potential: score(scores?.referral_potential, DEFAULT_SCORES.referral_potential),
    interview_readiness: score(scores?.interview_readiness, DEFAULT_SCORES.interview_readiness),
    salary_alignment: score(scores?.salary_alignment, DEFAULT_SCORES.salary_alignment),
    application_priority: score(scores?.application_priority, DEFAULT_SCORES.application_priority),
  }
}

function normalizeSkillGaps(gaps?: SkillGap[]): SkillGap[] {
  if (!Array.isArray(gaps)) return []
  return gaps
    .filter(gap => gap && typeof gap === 'object')
    .map(gap => ({
      skill: stringOr(gap.skill, 'Unspecified skill'),
      importance: gap.importance === 'low' || gap.importance === 'medium' || gap.importance === 'high' ? gap.importance : 'medium',
      evidence: stringOr(gap.evidence, 'Mentioned in the role requirements.'),
      action: stringOr(gap.action, 'Add truthful proof or a small project that demonstrates this skill.'),
    }))
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim())
}

function score(value: unknown, fallback: number): number {
  const next = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(next)) return fallback
  return Math.max(0, Math.min(100, Math.round(next)))
}
