/**
 * GET /api/v1/resumes
 *
 * Returns all resumes for the authenticated user.
 * RLS (Row Level Security) ensures users only see their own records —
 * we don't need a WHERE clause because Postgres applies it automatically.
 *
 * Soft deletes: resumes with deleted_at set are filtered out.
 * This preserves the file for 30 days before permanent deletion (future infra task).
 */

import { NextResponse } from 'next/server'
import { createClient }  from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data: resumes, error, count } = await supabase
      .from('resumes')
      .select('id, file_name, file_url, file_type, file_size, extracted_skills, parsing_status, created_at', { count: 'exact' })
      .is('deleted_at', null)        // exclude soft-deleted
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Resumes List] DB error:', error)
      return NextResponse.json({ error: 'Failed to fetch resumes.' }, { status: 500 })
    }

    return NextResponse.json({
      data: resumes ?? [],
      meta: { total: count ?? 0 },
    })
  } catch (err) {
    console.error('[Resumes List] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
