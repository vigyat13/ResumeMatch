import { aiProvider } from '@/lib/ai/provider'
import { getSystemPrompt } from '@/lib/ai/prompts'
import type { ResumeData } from '@/lib/builder/types'
import type { JobPosting, TailoredResume, TailorChange, TailorResult, CoverLetter } from './types'

export async function tailorResumeForJob(
  resume: ResumeData,
  job: JobPosting,
  options?: { signal?: AbortSignal }
): Promise<TailorResult> {
  const resumeJson = JSON.stringify(resume, null, 2)
  const jobJson = JSON.stringify(job, null, 2)

  const prompt = `You are an expert resume tailor. Optimize the given resume for the specific job description.

Resume:
${resumeJson}

Job Description:
${jobJson}

Return ONLY valid JSON:
{
  "tailored": {
    "original": <the original resume as-is>,
    "tailored": <the optimized resume>,
    "changes": [
      { "section": "experience", "type": "modified", "description": "Reworded bullet to include keyword X" }
    ],
    "matchScore": <0-100>,
    "missingSkills": ["skill from JD not in resume"],
    "addedSkills": ["skill added during tailoring"],
    "modifiedSections": ["experience", "summary"]
  },
  "coverLetter": {
    "subject": "Application for [Role] at [Company]",
    "body": "Full cover letter text...",
    "recipientName": "Hiring Manager or name if known",
    "recipientCompany": "Company Name"
  },
  "suggestions": ["Consider adding certification X", "Highlight achievement Y"]
}

Rules:
1. Reword experience bullets to include keywords from the job description naturally.
2. Reorder skills to prioritize those mentioned in the JD.
3. Update the professional summary to align with the target role.
4. Do NOT invent experience or qualifications that don't exist.
5. Preserve all factual information (dates, company names, education).
6. Add missing skills from the JD to the "missingSkills" array.
7. Score 0-100 on how well the original resume matches the JD.
8. Generate a professional cover letter.`

  const raw = await aiProvider.generateText({
    useCase: 'resume_tailor',
    messages: [
      getSystemPrompt('resume_tailor'),
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    maxTokens: 5000,
    signal: options?.signal,
  })
  if (!raw) {
    throw new Error('Tailor: AI returned empty response')
  }

  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  const parsed = JSON.parse(cleaned) as TailorResult
  return parsed
}

const KNOWN_JOB_SOURCES = [
  { urlPattern: /linkedin\.com\/jobs/i, name: 'LinkedIn', scrapeSupported: false },
  { urlPattern: /indeed\.com/i, name: 'Indeed', scrapeSupported: false },
  { urlPattern: /naukri\.com/i, name: 'Naukri', scrapeSupported: false },
  { urlPattern: /glassdoor\.com/i, name: 'Glassdoor', scrapeSupported: false },
  { urlPattern: /monster\.com/i, name: 'Monster', scrapeSupported: false },
]

export function identifyJobSource(url: string): { name: string; supported: boolean } {
  for (const source of KNOWN_JOB_SOURCES) {
    if (source.urlPattern.test(url)) {
      return { name: source.name, supported: source.scrapeSupported }
    }
  }
  return { name: 'Unknown', supported: false }
}

export async function extractJobFromUrl(
  url: string
): Promise<JobPosting> {
  const prompt = `Extract the job posting details from this URL content. Return ONLY valid JSON.
URL: ${url}

{
  "title": "Job Title",
  "company": "Company Name",
  "location": "Location",
  "description": "Full job description text",
  "requirements": ["req 1", "req 2"],
  "responsibilities": ["resp 1"],
  "preferredQualifications": ["pref 1"],
  "salary": "if mentioned",
  "employmentType": "Full-time/Part-time/Contract",
  "url": "${url}",
  "source": "website name"
}`

  const raw = await aiProvider.generateText({
    useCase: 'application_intelligence',
    messages: [
      {
        role: 'system',
        content: 'Extract job posting details. If the URL content is not available, extract from whatever text is provided.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    maxTokens: 2000,
  })

  const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  return JSON.parse(cleaned) as JobPosting
}
