import { NextRequest, NextResponse } from 'next/server'
import { parseResume } from '@/lib/resume/parser'
import { parseResumeToBuilderData } from '@/lib/resume/structuredParser'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = new Map([
  ['application/pdf', 'pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
])

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    const lowerName = file.name.toLowerCase()
    const fileType = ALLOWED_TYPES.get(file.type)
      ?? (lowerName.endsWith('.pdf') ? 'pdf' : lowerName.endsWith('.docx') ? 'docx' : undefined)
    if (!fileType) {
      return NextResponse.json({ error: 'Only PDF and DOCX files are supported.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File is too large. Maximum size is 10MB.' }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await parseResume(buffer, fileType as 'pdf' | 'docx')

    if (parsed.error && parsed.text.trim().length < 40) {
      return NextResponse.json(
        {
          error: parsed.error,
          detail: 'Try a text-based PDF or DOCX. Scanned image resumes need OCR before section extraction.',
        },
        { status: 422 }
      )
    }

    const structured = await parseResumeToBuilderData(parsed.text, parsed.skills)

    return NextResponse.json({
      data: structured.data,
      meta: {
        parser: structured.parser,
        confidence: structured.confidence,
        extracted_skills: structured.skills,
        warnings: structured.warnings,
        text_length: parsed.text.length,
        parse_error: parsed.error ?? null,
      },
    })
  } catch (error) {
    console.error('[Builder Parse Resume] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
