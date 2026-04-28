/**
 * GET  /api/v1/resumes/:resume_id — Get single resume with full parsed text
 * DELETE /api/v1/resumes/:resume_id — Soft delete a resume
 *
 * Why soft delete?
 * Hard deletes are irreversible. Soft deletes (setting deleted_at) let us:
 * - Show "undo delete" in the UI (future)
 * - Keep the file for 30 days before permanent cleanup (future infra job)
 * - Maintain audit history
 *
 * RLS guarantees the user can only touch their own resumes —
 * Supabase's row-level policies apply auth.uid() checks automatically.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Soft delete: set deleted_at timestamp instead of removing the row
    const { error } = await supabase
      .from('resumes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', resume_id)
      .eq('user_id', user.id)  // belt-and-suspenders even with RLS

    if (error) {
      console.error('[Resume Delete] DB error:', error)
      return NextResponse.json({ error: 'Failed to delete resume.' }, { status: 500 })
    }

    return NextResponse.json({ data: { message: 'Resume deleted successfully.' } })
  } catch (err) {
    console.error('[Resume Delete] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
