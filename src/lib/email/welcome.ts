/**
 * WELCOME EMAIL
 *
 * Sent immediately after signup as a personal note from Vigyat (the creator).
 *
 * Why a personal email vs a corporate one?
 *  • Higher open rates (people open emails from people, not brands)
 *  • Builds trust early — they hear from a real human
 *  • Sets the tone for support — they can reply directly to you
 *
 * Email-sending best practices applied:
 *  1. Send within seconds of signup
 *  2. Plain HTML — renders on every client (Gmail, Outlook, Apple Mail)
 *  3. One clear CTA
 *  4. Reply-To set to a real address so users can hit "Reply" naturally
 *  5. Don't break signup if email fails (fire-and-forget)
 */

import { getResend, FROM_EMAIL } from './client'

interface WelcomeEmailParams {
  to:        string
  firstName: string
}

export async function sendWelcomeEmail({ to, firstName }: WelcomeEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    await getResend().emails.send({
      from:    `Vigyat from ResumeMatch <${FROM_EMAIL}>`,
      to,
      replyTo: 'singhvigyat15@gmail.com',
      subject: 'Welcome to ResumeMatch beta',
      html: renderWelcomeHtml({ firstName, appUrl }),
    })
  } catch (err) {
    // Don't throw — email failures shouldn't break signup
    console.error('[Welcome Email] Failed to send:', err)
  }
}

function renderWelcomeHtml({ firstName, appUrl }: { firstName: string; appUrl: string }) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Welcome to ResumeMatch</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

            <!-- Body — no flashy header. Personal letter style -->
            <tr>
              <td style="padding:48px 40px 32px;">
                <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#0f172a;">
                  Hi ${firstName},
                </p>

                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
                  I&apos;m Vigyat, the creator of ResumeMatch.
                </p>

                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
                  Thank you for joining the beta. I&apos;m genuinely grateful to have you here this early. ResumeMatch is being built to help people create better resumes, understand how ATS systems read them, and move from resume editing to real job applications with less confusion.
                </p>

                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
                  Right now, the resume builder is live, and more features are being rolled out step by step, including resume audits and job matching. The bigger goal is to move beyond just editing resumes: in this new era, ResumeMatch should help agents understand your profile, find relevant roles, prepare your applications, and eventually handle more of the applying process on your behalf while you stay in control.
                </p>

                <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#334155;">
                  Because this is beta access, you may see rough edges. If something feels confusing, broken, or not useful, I&apos;d really appreciate your feedback. It will directly shape what I improve next.
                </p>

                <!-- CTA button -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                  <tr>
                    <td style="background:#10b981;border-radius:10px;">
                      <a href="${appUrl}/builder"
                         style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                        Start building →
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">
                  If you want to share feedback, just reply to this email. It goes straight to me.
                </p>

                <p style="margin:24px 0 4px;font-size:15px;line-height:1.7;color:#334155;">
                  Talk soon,
                </p>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#0f172a;font-weight:600;">
                  Vigyat
                </p>
                <p style="margin:2px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">
                  Creator, ResumeMatch
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">
                  You&apos;re getting this because you signed up for beta access at
                  <a href="${appUrl}" style="color:#10b981;text-decoration:none;">ResumeMatch</a>.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim()
}
