/**
 * RESEND EMAIL CLIENT
 *
 * Why Resend?
 *  • Developer-first transactional email API (like Stripe for emails)
 *  • Free tier: 3,000 emails/month, 100/day — fine for early users
 *  • React Email templates supported natively
 *  • No SMTP configuration headaches
 *
 * Architecture pattern:
 * Email sending is a "side effect" — failures here should NOT break
 * the parent operation. We use try/catch and log errors silently.
 * The user signed up successfully even if the welcome email fails.
 */

import { Resend } from 'resend'

// Singleton — create once, reuse for the lifetime of the server process
let resendClient: Resend | null = null

export function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY!)
  }
  return resendClient
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@resumematch.app'
