import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const Schema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name:  z.string().max(50).optional(),
  timezone:   z.string().max(60).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, avatar_url, timezone, subscription_tier, role')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  return NextResponse.json({ data: { ...data, email: user.email } })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 422 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 })
  return NextResponse.json({ data: { message: 'Profile updated.' } })
}
