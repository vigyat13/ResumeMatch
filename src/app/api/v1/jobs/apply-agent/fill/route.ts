import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const LIVE_BROWSER_API_URL = process.env.LIVE_BROWSER_API_URL
  ?? process.env.NEXT_PUBLIC_LIVE_BROWSER_API_URL
  ?? 'http://localhost:8000'

const Schema = z.object({
  job: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    company: z.string().min(1),
    url: z.string().url(),
  }),
  applicant: z.object({
    phone: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    work_auth: z.enum(['authorized', 'needs_sponsorship', 'unknown']).optional(),
    requires_visa_sponsorship: z.boolean().optional(),
    willing_to_relocate: z.boolean().optional(),
    remote_preference: z.enum(['remote', 'hybrid', 'onsite', 'any']).optional(),
    desired_salary_min: z.number().int().optional(),
    desired_salary_max: z.number().int().optional(),
    linkedin_url: z.string().optional(),
    github_url: z.string().optional(),
    portfolio_url: z.string().optional(),
    years_of_experience: z.number().int().optional(),
    current_title: z.string().optional(),
    current_company: z.string().optional(),
  }).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  const { data: resume } = await supabase
    .from('resumes')
    .select('id, file_url, parsed_text, extracted_skills')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const applicant = buildApplicant({
    email: user.email ?? '',
    firstName: profile?.first_name ?? '',
    lastName: profile?.last_name ?? '',
    resumeUrl: resume?.file_url ?? '',
    resumeText: resume?.parsed_text ?? '',
    overrides: parsed.data.applicant ?? {},
  })

  const res = await fetch(`${LIVE_BROWSER_API_URL}/apply-agent/fill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_id: parsed.data.job.id,
      job_url: parsed.data.job.url,
      title: parsed.data.job.title,
      company: parsed.data.job.company,
      applicant,
    }),
  })

  const json = await res.json().catch(() => ({}))
  return NextResponse.json(json, { status: res.ok ? 200 : res.status })
}

function buildApplicant({
  email,
  firstName,
  lastName,
  resumeUrl,
  resumeText,
  overrides,
}: {
  email: string
  firstName: string
  lastName: string
  resumeUrl: string
  resumeText: string
  overrides: Record<string, unknown>
}) {
  const inferred = inferFromResume(resumeText)
  return {
    first_name: firstName,
    last_name: lastName,
    email,
    phone: stringValue(overrides.phone) || inferred.phone,
    city: stringValue(overrides.city) || inferred.city,
    state: stringValue(overrides.state) || inferred.state,
    country: stringValue(overrides.country) || inferred.country,
    resume_url: resumeUrl || undefined,
    work_auth: stringValue(overrides.work_auth) || 'unknown',
    requires_visa_sponsorship: Boolean(overrides.requires_visa_sponsorship),
    willing_to_relocate: Boolean(overrides.willing_to_relocate),
    remote_preference: stringValue(overrides.remote_preference) || 'any',
    desired_salary_min: numberValue(overrides.desired_salary_min),
    desired_salary_max: numberValue(overrides.desired_salary_max),
    linkedin_url: stringValue(overrides.linkedin_url) || inferred.linkedinUrl || undefined,
    github_url: stringValue(overrides.github_url) || inferred.githubUrl || undefined,
    portfolio_url: stringValue(overrides.portfolio_url) || undefined,
    years_of_experience: numberValue(overrides.years_of_experience) ?? inferred.yearsExperience ?? 0,
    current_title: stringValue(overrides.current_title) || undefined,
    current_company: stringValue(overrides.current_company) || undefined,
  }
}

function inferFromResume(text: string) {
  const phone = text.match(/(\+\d{1,3}[-.\s]?)?(\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,6})/)?.[0]?.trim() ?? ''
  const linkedinUrl = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/)?.[0] ?? ''
  const githubUrl = text.match(/https?:\/\/(?:www\.)?github\.com\/[^\s)]+/)?.[0] ?? ''
  const yearsMatch = text.match(/(\d+)\+?\s+years?/i)
  const locationLine = text.split('\n').slice(0, 8).find(line => /india|united states|usa|canada|uk|remote/i.test(line)) ?? ''
  const parts = locationLine.split(/[|,]/).map(part => part.trim()).filter(Boolean)
  return {
    phone,
    linkedinUrl,
    githubUrl,
    yearsExperience: yearsMatch ? Number(yearsMatch[1]) : null,
    city: parts[0] ?? '',
    state: parts.length > 2 ? parts[1] : '',
    country: parts.find(part => /india|united states|usa|canada|uk/i.test(part)) ?? '',
  }
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
