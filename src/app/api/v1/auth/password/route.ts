import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const Schema = z.object({
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 422 })
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data: { message: 'Password updated.' } })
}
