import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('tracked_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Failed to fetch applications.' }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

const STATUSES = ['saved', 'applied', 'submitted', 'interview', 'offer', 'rejected'] as const

const TrackSchema = z.object({
  job_title: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  job_url: z.string().url(),
  status: z.enum(STATUSES).default('saved'),
})

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUSES),
})

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  const { error } = await supabase
    .from('tracked_applications')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to update status.' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = TrackSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  // Avoid duplicate entries for the same job URL per user.
  const { data: existing } = await supabase
    .from('tracked_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('job_url', parsed.data.job_url)
    .limit(1)

  if (existing?.length) {
    return NextResponse.json({ success: true, duplicate: true })
  }

  const { error } = await supabase.from('tracked_applications').insert({
    user_id: user.id,
    ...parsed.data,
  })

  if (error) return NextResponse.json({ error: 'Failed to save job.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
