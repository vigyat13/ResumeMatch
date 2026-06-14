import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseResume } from '@/lib/resume/parser'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const resumeId = formData.get('resume_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    const ALLOWED_TYPES: Record<string, 'pdf' | 'docx' | 'image'> = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'image/png': 'image',
      'image/jpeg': 'image',
      'image/jpg': 'image',
      'image/webp': 'image',
    }

    const fileType = ALLOWED_TYPES[file.type]
    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Accepted: PDF, DOCX, PNG, JPG, WebP.' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { text, skills, parsed, error } = await parseResume(buffer, fileType, { useAI: true, useOCR: true })

    const result = parsed
      ? {
          resumeData: parsed.resumeData,
          sections: parsed.sections,
          confidence: parsed.confidence,
          warnings: [...parsed.warnings, ...(error ? [error] : [])],
        }
      : null

    if (resumeId) {
      const parsingStatus = error ? 'failed' : 'completed'
      await supabase
        .from('resumes')
        .update({
          parsed_text: text,
          extracted_skills: skills,
          parsing_status: parsingStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resumeId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      data: {
        text,
        skills,
        parsed: result,
        error: error ?? null,
      },
    })
  } catch (err) {
    console.error('[Parse AI] Error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
