import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { searchPeople } from '@/lib/people/search'

export const maxDuration = 30

const Schema = z.object({
  company: z.string().min(2).max(120),
  role: z.string().max(120).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  try {
    const result = await searchPeople(parsed.data.company, parsed.data.role)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'People search failed' }, { status: 502 })
  }
}
