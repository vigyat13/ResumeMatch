import { z } from 'zod'
import { aiProvider } from '@/lib/ai/provider'
import { getSystemPrompt } from '@/lib/ai/prompts'
import { ResumeDataSchema } from '@/lib/builder/schema'
import type { ResumeData } from '@/lib/builder/types'

export const OptimizeModeSchema = z.enum(['general', 'job_description'])
export type OptimizeMode = z.infer<typeof OptimizeModeSchema>

export const OptimizeRequestSchema = z.object({
  resumeData: ResumeDataSchema,
  mode: OptimizeModeSchema.default('general'),
  jobDescription: z.string().max(12000).optional().default(''),
  pass: z.number().int().min(1).max(8).optional().default(1),
})

export const OptimizeSummarySchema = z.object({
  bulletsImproved: z.number().int().min(0).default(0),
  keywordsAdded: z.array(z.string()).default([]),
  sectionsChanged: z.array(z.string()).default([]),
  updatedPoints: z.array(
    z.object({
      section: z.string(),
      label: z.string(),
      before: z.string(),
      after: z.string(),
    })
  ).default([]),
  score: z.object({
    before: z.number().min(0).max(100),
    after: z.number().min(0).max(100),
    delta: z.number(),
    model: z.string(),
  }).default({ before: 0, after: 0, delta: 0, model: 'ResumeQuality-v1' }),
  warnings: z.array(z.string()).default([]),
})

export const OptimizeResultSchema = z.object({
  optimizedResumeData: ResumeDataSchema,
  summary: OptimizeSummarySchema,
})

export type OptimizeSummary = z.infer<typeof OptimizeSummarySchema>
export type OptimizeResult = z.infer<typeof OptimizeResultSchema>

export async function optimizeResume(input: z.infer<typeof OptimizeRequestSchema>): Promise<OptimizeResult> {
  const prompt = buildOptimizationPrompt(input.resumeData, input.mode, input.jobDescription, input.pass)

  const raw = await aiProvider.generateText({
    useCase: 'resume_optimize',
    messages: [
      getSystemPrompt('resume_optimize'),
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    maxTokens: 5200,
  })

  if (!raw.trim()) throw new Error('AI returned an empty optimization response.')

  const parsed = OptimizeResultSchema.parse(JSON.parse(cleanJson(raw)))
  const optimizedResumeData = ResumeDataSchema.parse(preserveLockedFields(input.resumeData, parsed.optimizedResumeData))
  const beforeScore = computeResumeQualityScore(input.resumeData, input.jobDescription)
  const detectedPoints = detectUpdatedPoints(input.resumeData, optimizedResumeData)
  const afterScore = scoreOptimizedResume(input.resumeData, optimizedResumeData, input.jobDescription, beforeScore)
  const mergedSummary = {
    ...parsed.summary,
    bulletsImproved: Math.max(parsed.summary.bulletsImproved, detectedPoints.filter(p => p.section !== 'summary').length),
    updatedPoints: parsed.summary.updatedPoints.length > 0 ? parsed.summary.updatedPoints : detectedPoints,
    score: {
      before: beforeScore,
      after: afterScore,
      delta: round2(afterScore - beforeScore),
      model: 'ResumeQuality-v1',
    },
  }

  return { optimizedResumeData, summary: normalizeSummary(mergedSummary) }
}

function buildOptimizationPrompt(resumeData: ResumeData, mode: OptimizeMode, jobDescription = '', pass = 1): string {
  const jdBlock = mode === 'job_description'
    ? `\nTarget job description:\n${jobDescription.trim() || 'No job description provided.'}\n`
    : ''
  const repeatInstruction = pass > 1
    ? `\nThis is optimization pass ${pass}. Do not return the same wording as the current resume. Perform a deeper pass: tighten repetition, replace generic verbs, improve recruiter-facing specificity, and upgrade weak bullets that still read flat.\n`
    : ''

  return `Optimize this resume for a real job seeker.

Resume JSON:
${JSON.stringify(resumeData, null, 2)}
${jdBlock}
${repeatInstruction}
Return exactly this JSON shape:
{
  "optimizedResumeData": <full ResumeData JSON>,
  "summary": {
    "bulletsImproved": 0,
    "keywordsAdded": [],
    "sectionsChanged": [],
    "updatedPoints": [
      {
        "section": "experience",
        "label": "Experience #1 bullet #2",
        "before": "old bullet text",
        "after": "new bullet text"
      }
    ],
    "score": {
      "before": 0,
      "after": 0,
      "delta": 0,
      "model": "ResumeQuality-v1"
    },
    "warnings": []
  }
}

Editing rules:
- Improve summary, experience bullets, project bullets, skills ordering/naming, honors, and publications.
- Rewrite weak bullets into sharper accomplishment statements using action verb + scope + method + result where the source facts support it.
- Preserve existing numbers exactly, but make the impact around those numbers clearer.
- Never remove numeric evidence, scale, percentages, dates, latency, revenue, throughput, users, uptime, or counts from a bullet.
- Replace passive or vague phrases with specific ownership, technical depth, and business outcome.
- Keep every rewritten bullet natural and credible for a real recruiter; do not overstuff keywords.
- ${mode === 'job_description' ? 'Use the target job description aggressively but naturally: mirror the target role wording, required skills, tools, responsibilities, seniority level, and domain language wherever the resume has truthful supporting evidence.' : 'Optimize for a strong general-purpose resume with polished professional language, strong verbs, clear scope, and measurable impact.'}
- For job-description mode, add or reorder skills only when the resume already supports them. If the JD says "React", "FastAPI", "stakeholder management", or similar and the resume has evidence, use those exact words in summary, skills, or bullets.
- Prefer professional words like delivered, led, implemented, automated, reduced, increased, shipped, designed, owned, coordinated, analyzed, improved, accelerated, and standardized when accurate.
- Preserve truthfulness. Do not invent employers, dates, degrees, certifications, tools, metrics, links, or achievements.
- If a metric is already present, you may make the sentence clearer but do not change the number.
- Do not edit name, target title, email, phone, location, GitHub, LinkedIn, portfolio, profileImage, company names, role titles, employment periods, project names, project links, school names, degrees, CGPA, or education years.
- Keep the same array lengths for experience, projects, education, and every bullet list.
- Keep bullet points concise, achievement-led, and ATS friendly.
- Empty user-provided fields may remain empty.`
}

function cleanJson(value: string): string {
  return value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export function preserveLockedFields(original: ResumeData, optimized: ResumeData): ResumeData {
  return {
    ...optimized,
    name: original.name,
    title: original.title,
    email: original.email,
    phone: original.phone,
    location: original.location,
    github: original.github,
    linkedin: original.linkedin,
    portfolio: original.portfolio,
    profileImage: original.profileImage,
    experience: original.experience.map((entry, index) => ({
      ...(optimized.experience[index] ?? entry),
      company: entry.company,
      role: entry.role,
      period: entry.period,
      bullets: preserveBulletList(entry.bullets, optimized.experience[index]?.bullets),
    })),
    projects: original.projects.map((project, index) => ({
      ...(optimized.projects[index] ?? project),
      name: project.name,
      link: project.link,
      bullets: preserveBulletList(project.bullets, optimized.projects[index]?.bullets),
    })),
    education: original.education.map((education, index) => ({
      ...(optimized.education[index] ?? education),
      school: education.school,
      degree: education.degree,
      cgpa: education.cgpa,
      year: education.year,
    })),
  }
}

function preserveBulletList(originalBullets: string[], optimizedBullets: string[] | undefined): string[] {
  return originalBullets.map((original, index) => {
    const candidate = optimizedBullets?.[index]?.trim()
    if (!candidate) return original
    if (hasMetricSignal(original) && !preservesNumericEvidence(original, candidate)) return original
    return candidate
  })
}

function normalizeSummary(summary: OptimizeSummary): OptimizeSummary {
  return {
    bulletsImproved: summary.bulletsImproved,
    keywordsAdded: summary.keywordsAdded.slice(0, 12),
    sectionsChanged: Array.from(new Set(summary.sectionsChanged)).slice(0, 8),
    updatedPoints: summary.updatedPoints.slice(0, 18),
    score: {
      before: clamp100(summary.score.before),
      after: clamp100(summary.score.after),
      delta: round2(summary.score.after - summary.score.before),
      model: summary.score.model || 'ResumeQuality-v1',
    },
    warnings: summary.warnings.slice(0, 6),
  }
}

function detectUpdatedPoints(original: ResumeData, optimized: ResumeData) {
  const points: OptimizeSummary['updatedPoints'] = []

  if (normalizeText(original.summary) !== normalizeText(optimized.summary)) {
    points.push({
      section: 'summary',
      label: 'Professional summary',
      before: original.summary,
      after: optimized.summary,
    })
  }

  original.experience.forEach((entry, expIdx) => {
    const next = optimized.experience[expIdx]
    if (!next) return
    entry.bullets.forEach((bullet, bulletIdx) => {
      const nextBullet = next.bullets[bulletIdx] ?? ''
      if (normalizeText(bullet) !== normalizeText(nextBullet)) {
        points.push({
          section: 'experience',
          label: `Experience #${expIdx + 1} bullet #${bulletIdx + 1}`,
          before: bullet,
          after: nextBullet,
        })
      }
    })
  })

  original.projects.forEach((project, projIdx) => {
    const next = optimized.projects[projIdx]
    if (!next) return
    if (normalizeText(project.description) !== normalizeText(next.description)) {
      points.push({
        section: 'projects',
        label: `Project #${projIdx + 1} description`,
        before: project.description,
        after: next.description,
      })
    }
    project.bullets.forEach((bullet, bulletIdx) => {
      const nextBullet = next.bullets[bulletIdx] ?? ''
      if (normalizeText(bullet) !== normalizeText(nextBullet)) {
        points.push({
          section: 'projects',
          label: `Project #${projIdx + 1} bullet #${bulletIdx + 1}`,
          before: bullet,
          after: nextBullet,
        })
      }
    })
  })

  return points
}

function computeResumeQualityScore(resume: ResumeData, jobDescription: string): number {
  const expBullets = resume.experience.flatMap(entry => entry.bullets || []).map(v => v.trim()).filter(Boolean)
  const projectBullets = resume.projects.flatMap(entry => entry.bullets || []).map(v => v.trim()).filter(Boolean)
  const allBullets = [...expBullets, ...projectBullets]
  const summaryLen = resume.summary.trim().length
  const skillCount = resume.skills.map(s => s.name.trim()).filter(Boolean).length
  const quantified = allBullets.filter(hasMetricSignal).length
  const actionVerb = allBullets.filter(startsWithActionVerb).length
  const avgBulletLen = allBullets.length > 0 ? allBullets.reduce((n, b) => n + b.length, 0) / allBullets.length : 0
  const conciseRatio = allBullets.length > 0 ? allBullets.filter(b => b.length >= 55 && b.length <= 180).length / allBullets.length : 0
  const jdScore = jobDescription.trim() ? keywordMatchScore(resume, jobDescription) : 0.6

  let score = 0
  score += Math.min(summaryLen / 280, 1) * 18
  score += Math.min(allBullets.length / 14, 1) * 16
  score += (allBullets.length ? quantified / allBullets.length : 0) * 18
  score += (allBullets.length ? actionVerb / allBullets.length : 0) * 14
  score += conciseRatio * 12
  score += Math.min(skillCount / 10, 1) * 10
  score += jdScore * 12

  if (avgBulletLen > 200) score -= 5
  if (summaryLen < 80) score -= 4

  return clamp100(round2(score))
}

function scoreOptimizedResume(original: ResumeData, optimized: ResumeData, jobDescription: string, beforeScore: number): number {
  const rawAfterScore = computeResumeQualityScore(optimized, jobDescription)
  const oldSignals = scoreSignals(original, jobDescription)
  const newSignals = scoreSignals(optimized, jobDescription)
  const changedPoints = detectUpdatedPoints(original, optimized).length

  let adjustment = 0
  adjustment += Math.max(0, newSignals.keywordMatch - oldSignals.keywordMatch) * 8
  adjustment += Math.max(0, newSignals.actionVerbRatio - oldSignals.actionVerbRatio) * 7
  adjustment += Math.max(0, newSignals.conciseRatio - oldSignals.conciseRatio) * 5
  adjustment += Math.max(0, newSignals.summaryStrength - oldSignals.summaryStrength) * 4
  adjustment += Math.min(6, changedPoints * 0.45)

  if (newSignals.metricRatio < oldSignals.metricRatio) adjustment -= 6
  if (newSignals.bulletCount < oldSignals.bulletCount) adjustment -= 4

  const comparedScore = rawAfterScore + adjustment
  return clamp100(round2(Math.max(comparedScore, changedPoints > 0 ? beforeScore + 1 : rawAfterScore)))
}

function scoreSignals(resume: ResumeData, jobDescription: string) {
  const bullets = [
    ...resume.experience.flatMap(entry => entry.bullets || []),
    ...resume.projects.flatMap(project => project.bullets || []),
  ].map(v => v.trim()).filter(Boolean)

  const bulletCount = bullets.length
  const metricRatio = bulletCount ? bullets.filter(hasMetricSignal).length / bulletCount : 0
  const actionVerbRatio = bulletCount ? bullets.filter(startsWithActionVerb).length / bulletCount : 0
  const conciseRatio = bulletCount ? bullets.filter(b => b.length >= 55 && b.length <= 180).length / bulletCount : 0
  const keywordMatch = jobDescription.trim() ? keywordMatchScore(resume, jobDescription) : 0
  const summaryStrength = clamp100(resume.summary.trim().length / 280 * 100) / 100

  return { bulletCount, metricRatio, actionVerbRatio, conciseRatio, keywordMatch, summaryStrength }
}

function keywordMatchScore(resume: ResumeData, jobDescription: string): number {
  const resumeText = [
    resume.summary,
    ...resume.experience.flatMap(v => v.bullets),
    ...resume.projects.flatMap(v => [v.description, ...v.bullets]),
    ...resume.skills.map(v => v.name),
  ].join(' ').toLowerCase()

  const jdTokens = tokenize(jobDescription).filter(token => token.length > 3)
  const uniqueTokens = Array.from(new Set(jdTokens)).slice(0, 80)
  if (uniqueTokens.length === 0) return 0.6
  const hitCount = uniqueTokens.filter(token => resumeText.includes(token)).length
  return hitCount / uniqueTokens.length
}

function tokenize(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
}

function hasMetricSignal(text: string): boolean {
  return /\d/.test(text) || /%|x|million|k\b|ms\b|mwh|mw|uptime/i.test(text)
}

function preservesNumericEvidence(original: string, candidate: string): boolean {
  const originalTokens = extractNumericTokens(original)
  if (originalTokens.length === 0) return true
  const candidateTokens = extractNumericTokens(candidate)
  return originalTokens.every(token => candidateTokens.includes(token))
}

function extractNumericTokens(value: string): string[] {
  return value.toLowerCase().match(/\d+(?:\.\d+)?\s*(?:%|x|k|m|ms|sec|seconds|min|minutes|hrs|hours|mwh|mw|gb|tb)?/g) ?? []
}

function startsWithActionVerb(text: string): boolean {
  return /^(led|built|improved|optimized|designed|implemented|reduced|increased|developed|launched|migrated|automated|delivered)\b/i.test(text.trim())
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
