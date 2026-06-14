import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { searchAllSources } from '@/lib/jobs/aggregate'

export const maxDuration = 60

const Schema = z.object({
  query: z.string().min(2).max(200),
  location: z.string().max(120).optional(),
  recencyDays: z.number().int().min(1).max(30).default(7),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  try {
    const result = await searchAllSources(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Search failed' }, { status: 502 })
  }
}
