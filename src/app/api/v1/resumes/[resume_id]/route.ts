/**
 * GET  /api/v1/resumes/:resume_id — Get single resume with full parsed text
 * DELETE /api/v1/resumes/:resume_id — Permanently delete a resume
 *
 * RLS guarantees the user can only touch their own resumes —
 * Supabase's row-level policies apply auth.uid() checks automatically.
 * The hard delete path validates ownership with the user session first, then
 * uses the service-role client to remove dependent rows and storage objects.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ resume_id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { resume_id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data: resume, error } = await supabase
      .from('resumes')
      .select('id, file_name, file_url, file_type, file_size, parsed_text, extracted_skills, parsing_status, created_at, updated_at')
      .eq('id', resume_id)
      .is('deleted_at', null)
      .single()

    if (error || !resume) {
      return NextResponse.json({ error: 'Resume not found.' }, { status: 404 })
    }

    return NextResponse.json({ data: resume })
  } catch (err) {
    console.error('[Resume Detail] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { resume_id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data: resume, error: lookupError } = await supabase
      .from('resumes')
      .select('id, storage_path')
      .eq('id', resume_id)
      .eq('user_id', user.id)
      .single()

    if (lookupError || !resume) {
      return NextResponse.json({ error: 'Resume not found.' }, { status: 404 })
    }

    const admin = createAdminClient()

    const { error: auditDeleteError } = await admin
      .from('audit_reports')
      .delete()
      .eq('resume_id', resume_id)
      .eq('user_id', user.id)

    if (auditDeleteError) {
      console.error('[Resume Delete] Audit delete error:', auditDeleteError)
      return NextResponse.json({ error: 'Failed to delete resume audits.' }, { status: 500 })
    }

    const { error: matchDeleteError } = await admin
      .from('job_matches')
      .delete()
      .eq('resume_id', resume_id)
      .eq('user_id', user.id)

    if (matchDeleteError) {
      console.error('[Resume Delete] Match delete error:', matchDeleteError)
      return NextResponse.json({ error: 'Failed to delete resume matches.' }, { status: 500 })
    }

    if (resume.storage_path) {
      const { error: storageError } = await admin.storage
        .from('resumes')
        .remove([resume.storage_path])

      if (storageError) {
        console.error('[Resume Delete] Storage delete error:', storageError)
        return NextResponse.json({ error: 'Failed to delete resume file.' }, { status: 500 })
      }
    }

    const { error: resumeDeleteError } = await admin
      .from('resumes')
      .delete()
      .eq('id', resume_id)
      .eq('user_id', user.id)

    if (resumeDeleteError) {
      console.error('[Resume Delete] DB delete error:', resumeDeleteError)
      return NextResponse.json({ error: 'Failed to delete resume.' }, { status: 500 })
    }

    return NextResponse.json({ data: { message: 'Resume permanently deleted.' } })
  } catch (err) {
    console.error('[Resume Delete] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
