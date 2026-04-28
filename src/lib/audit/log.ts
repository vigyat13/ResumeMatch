/**
 * AUDIT LOGGING
 *
 * Why audit logs?
 *  • Security: detect suspicious activity (failed logins, mass downloads)
 *  • Compliance: GDPR/SOC2 require records of data access
 *  • Debugging: "what did this user do before the bug?"
 *  • Trust: users can see their own activity history
 *
 * Design choices:
 *  • Append-only (no updates, no deletes from app code)
 *  • Server-only writes (uses service_role to bypass RLS)
 *  • Fire-and-forget (logging failures must NEVER break the user action)
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

export type AuditEventType =
  | 'signup'
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'oauth_login'
  | 'password_reset'
  | 'profile_update'
  | 'resume_upload'
  | 'resume_delete'
  | 'resume_view'
  | 'subscription_change'
  | 'admin_action'
  | 'template_applied'
  | 'latex_export'
  | 'ats_audit_run'

interface LogEventParams {
  userId?:    string | null
  eventType:  AuditEventType
  resource?:  string
  request?:   NextRequest
  metadata?:  Record<string, unknown>
}

/**
 * Log a security/audit event. Fire-and-forget — never blocks or throws.
 */
export function logAuditEvent({
  userId,
  eventType,
  resource,
  request,
  metadata,
}: LogEventParams): void {
  // Don't await — we don't want logging failures to slow down requests
  void writeLog({ userId, eventType, resource, request, metadata })
}

async function writeLog({
  userId,
  eventType,
  resource,
  request,
  metadata,
}: LogEventParams) {
  try {
    const ip = request
      ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip')
        ?? 'unknown'
      : null

    const userAgent = request?.headers.get('user-agent') ?? null

    // Use admin client to bypass RLS — only the server should write audit logs
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      user_id:    userId ?? null,
      event_type: eventType,
      resource:   resource ?? null,
      ip_address: ip,
      user_agent: userAgent,
      metadata:   (metadata ?? {}) as Json,
    })
  } catch (err) {
    console.error('[Audit Log] Failed to write:', err)
  }
}
