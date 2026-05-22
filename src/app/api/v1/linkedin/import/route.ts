import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { importLinkedinProfile, linkedinProfileToResumeData } from '@/lib/linkedin/importer'
import { checkRateLimit } from '@/lib/rate-limit/limiter'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured. Contact support.' },
        { status: 503 }
      )
    }

    let supabase
    try {
      supabase = await createClient()
    } catch {
      return NextResponse.json(
        { error: 'Authentication service unavailable.' },
        { status: 503 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in to import from LinkedIn.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || (!body.url && !body.text)) {
      return NextResponse.json(
        { error: 'Provide a LinkedIn URL or paste profile text.' },
        { status: 400 }
      )
    }

    const input = (body.url || body.text).trim()
    if (input.length < 5) {
      return NextResponse.json(
        { error: 'Input is too short. Paste a full LinkedIn profile URL or text.' },
        { status: 400 }
      )
    }

    const rateLimit = await checkRateLimit({
      identifier: user.id,
      endpoint: 'linkedin_import',
      limit: 10,
      windowSec: 3600,
    })
    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.` },
        { status: 429 }
      )
    }

    const result = await importLinkedinProfile(input)

    const resumeData = linkedinProfileToResumeData(result.profile)

    return NextResponse.json({
      data: {
        profile: result.profile,
        resumeData,
        warnings: result.warnings,
        confidence: result.confidence,
      },
    })
  } catch (err) {
    console.error('[LinkedIn Import] Error:', err)
    const message = err instanceof Error ? err.message : 'Import failed.'
    return NextResponse.json(
      { error: message.includes('401') ? 'Authentication failed. Please try again.' : message },
      { status: 500 }
    )
  }
}
