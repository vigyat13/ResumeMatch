/**
 * PATCH /api/v1/resumes/[resume_id]/template
 *
 * One-tap template apply. Updates template_id on a single resume.
 *
 * Security model:
 *  1. Authenticate with getUser() — never trust the client
 *  2. Supabase RLS ensures users can only UPDATE their own resumes
 *  3. We verify template_id exists before accepting it (no orphan references)
 *
 * Pattern: validate → check ownership via RLS → update → return new state
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/log'

const Schema = z.object({
  template_id: z.string().uuid(),
})

interface Params { params: Promise<{ resume_id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { resume_id } = await params

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 })
  }

  const { template_id } = parsed.data

  // Verify template exists
  const { data: template } = await supabase
    .from('templates')
    .select('id, name')
    .eq('id', template_id)
    .single()

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Update — RLS ensures only the owner's resume can be updated
  const { data: updated, error } = await supabase
    .from('resumes')
    .update({ template_id })
    .eq('id', resume_id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select('id, template_id')
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: 'Resume not found or update failed' }, { status: 404 })
  }

  void logAuditEvent({
    userId:    user.id,
    eventType: 'template_applied',
    resource:  `resume:${resume_id}`,
    request:   req,
    metadata:  { template_id, template_name: template.name },
  })

  return NextResponse.json({ resume_id: updated.id, template_id: updated.template_id })
}
