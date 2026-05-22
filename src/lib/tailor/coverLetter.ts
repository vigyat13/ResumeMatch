import { groq, GROQ_MODELS } from '@/lib/ai/groq'
import type { ResumeData } from '@/lib/builder/types'
import type { JobPosting, CoverLetter } from './types'

export async function generateCoverLetter(
  resume: ResumeData,
  job: JobPosting,
  tone: 'professional' | 'enthusiastic' | 'concise' = 'professional',
  options?: { signal?: AbortSignal }
): Promise<CoverLetter> {
  const resumeSummary = `${resume.name} - ${resume.title}`
  const topExperience = resume.experience.slice(0, 2).map(e =>
    `${e.role} at ${e.company} (${e.period})`
  ).join(', ')

  const prompt = `Write a ${tone} cover letter for:

Applicant: ${resumeSummary}
Key Experience: ${topExperience}
Top Skills: ${resume.skills.slice(0, 5).map(s => s.name).join(', ')}

Target Role: ${job.title} at ${job.company}
Job Requirements: ${job.requirements.slice(0, 5).join(', ')}

Return ONLY valid JSON:
{
  "subject": "Application for ${job.title} at ${job.company}",
  "body": "Full cover letter with 3-4 paragraphs...",
  "recipientName": "Hiring Manager",
  "recipientCompany": "${job.company}"
}`

  const completion = await groq.chat.completions.create({
    model: GROQ_MODELS.default,
    messages: [
      {
        role: 'system',
        content: `You write compelling, ATS-friendly cover letters. Keep them to 3-4 paragraphs. 
Match the applicant's experience to the job requirements. Be specific, not generic.
Never invent qualifications. Tone: ${tone}.`,
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1500,
    ...(options?.signal ? { signal: options.signal } : {}),
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  if (!raw) throw new Error('Cover letter generation: empty response')

  const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  return JSON.parse(cleaned) as CoverLetter
}

export function formatCoverLetterForPrint(letter: CoverLetter): string {
  return `${letter.subject}\n\n${letter.body}`
}
