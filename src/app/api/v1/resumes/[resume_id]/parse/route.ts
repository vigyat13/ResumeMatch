import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseResume } from '@/lib/resume/parser'

interface Params {
  params: Promise<{ resume_id: string }>
}

export const runtime = 'nodejs'

export async function POST(_req: NextRequest, { params }: Params) {
  const { resume_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { data: resume, error: resumeError } = await supabase
    .from('resumes')
    .select('id, file_type, storage_path')
    .eq('id', resume_id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (resumeError || !resume) {
    return NextResponse.json({ error: 'Resume not found.' }, { status: 404 })
  }

  if (!resume.storage_path) {
    return NextResponse.json(
      { error: 'Original file is not available for re-processing. Please upload the resume again.' },
      { status: 422 }
    )
  }

  if (resume.file_type !== 'pdf' && resume.file_type !== 'docx') {
    return NextResponse.json({ error: 'Only PDF and DOCX resumes can be parsed.' }, { status: 422 })
  }

  await supabase
    .from('resumes')
    .update({ parsing_status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', resume_id)

  const { data: file, error: downloadError } = await supabase.storage
    .from('resumes')
    .download(resume.storage_path)

  if (downloadError || !file) {
    await supabase
      .from('resumes')
      .update({ parsing_status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', resume_id)

    return NextResponse.json(
      { error: 'Could not download the original resume file. Please upload it again.' },
      { status: 500 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { text, skills, error } = await parseResume(buffer, resume.file_type)
  const parsingStatus = error ? 'failed' : 'processed'

  const { data: updated, error: updateError } = await supabase
    .from('resumes')
    .update({
      parsed_text:      text,
      extracted_skills: skills,
      parsing_status:   parsingStatus,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', resume_id)
    .select('id, extracted_skills, parsing_status')
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: 'Failed to update parsed resume.' }, { status: 500 })
  }

  return NextResponse.json({
    data: {
      ...updated,
      parse_error: error ?? null,
    },
  })
}
