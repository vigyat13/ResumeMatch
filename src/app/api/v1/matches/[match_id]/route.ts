import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ match_id: string }> }

const PatchSchema = z.object({
  saved:       z.boolean().optional(),
  saved_notes: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  const { match_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 422 })

  const { data, error } = await supabase
    .from('job_matches')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', match_id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Match not found.' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { match_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('job_matches')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', match_id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to delete.' }, { status: 500 })
  return NextResponse.json({ data: { message: 'Deleted.' } })
}
