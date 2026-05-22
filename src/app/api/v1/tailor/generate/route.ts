import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { tailorResumeForJob } from '@/lib/tailor/tailor'
import { checkRateLimit } from '@/lib/rate-limit/limiter'
import { ResumeDataSchema } from '@/lib/builder/schema'
import type { JobPosting } from '@/lib/tailor/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimit = await checkRateLimit({
      identifier: user.id,
      endpoint: 'resume_tailor',
      limit: 10,
      windowSec: 3600,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit reached. Max 10 tailoring requests per hour.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || !body.resumeData || !body.jobDescription) {
      return NextResponse.json(
        { error: 'Provide resumeData and jobDescription.' },
        { status: 400 }
      )
    }

    const resumeValidation = ResumeDataSchema.safeParse(body.resumeData)
    if (!resumeValidation.success) {
      return NextResponse.json(
        { error: 'Invalid resume data.' },
        { status: 422 }
      )
    }

    const job: JobPosting = {
      title: body.jobTitle || '',
      company: body.company || '',
      location: body.location || '',
      description: body.jobDescription || '',
      requirements: body.requirements ?? [],
      responsibilities: body.responsibilities ?? [],
      preferredQualifications: body.preferredQualifications ?? [],
      salary: body.salary || '',
      employmentType: body.employmentType || '',
      url: body.jobUrl || '',
      source: body.source || 'direct_input',
    }

    const result = await tailorResumeForJob(resumeValidation.data, job)

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error('[Tailor Generate] Error:', err)
    const message = err instanceof Error ? err.message : 'Tailoring failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
