import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const BASE_RESUMES_ANALYZED = 200

export async function GET() {
  const admin = createAdminClient()

  const { count, error } = await admin
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .in('event_type', ['login', 'oauth_login'])

  if (error) {
    return NextResponse.json(
      { data: { resumes_analyzed: BASE_RESUMES_ANALYZED } },
      { status: 200 }
    )
  }

  return NextResponse.json({
    data: {
      resumes_analyzed: BASE_RESUMES_ANALYZED + (count ?? 0),
    },
  })
}
