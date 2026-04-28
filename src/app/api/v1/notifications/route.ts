import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const Schema = z.object({
  ats_tips:                      z.boolean().optional(),
  real_time_alerts:              z.boolean().optional(),
  marketing_emails:              z.boolean().optional(),
  billing_emails:                z.boolean().optional(),
  job_alerts_frequency:          z.enum(['never', 'daily', 'weekly']).optional(),
  application_updates_frequency: z.enum(['never', 'daily', 'weekly']).optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ data: data ?? null })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid.' }, { status: 422 })
  }

  const { error } = await supabase
    .from('email_preferences')
    .upsert({ user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: 'Failed to save preferences.' }, { status: 500 })
  return NextResponse.json({ data: { message: 'Preferences saved.' } })
}
