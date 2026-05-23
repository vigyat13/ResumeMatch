import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const LIVE_BROWSER_API_URL = process.env.LIVE_BROWSER_API_URL
  ?? process.env.NEXT_PUBLIC_LIVE_BROWSER_API_URL
  ?? 'http://localhost:8000'

const Schema = z.object({ session_id: z.string().min(1) })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 422 })

  const res = await fetch(`${LIVE_BROWSER_API_URL}/apply-agent/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  })

  const json = await res.json().catch(() => ({}))
  return NextResponse.json(json, { status: res.ok ? 200 : res.status })
}
