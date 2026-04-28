import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ResumeDataSchema } from '@/lib/builder/schema'
import { buildResumeSystemOutput } from '@/lib/builder/systemOutput'

const BodySchema = z.object({
  resumeData: ResumeDataSchema,
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid resume data' }, { status: 422 })
  }

  return NextResponse.json(buildResumeSystemOutput(parsed.data.resumeData))
}
