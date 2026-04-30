import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for ResumeMatch.',
}

const sections = [
  {
    title: 'Information We Collect',
    body: [
      'Account information such as your name, email address, and authentication provider details when you sign up or log in.',
      'Resume and job-search content that you upload, enter, generate, or save inside the product.',
      'Usage and technical data such as pages visited, device/browser information, approximate location, logs, and error reports.',
      'Communication data when you contact us for support or respond to product emails.',
    ],
  },
  {
    title: 'How We Use Information',
    body: [
      'To provide resume building, resume analysis, job matching, account access, downloads, and related product features.',
      'To send transactional emails such as welcome messages, account updates, and product-related notices.',
      'To improve reliability, security, user experience, templates, and AI-assisted recommendations.',
      'To detect abuse, prevent unauthorized access, and protect ResumeMatch and its users.',
    ],
  },
  {
    title: 'AI And Resume Processing',
    body: [
      'ResumeMatch may process resume text, job descriptions, and related content with AI services to generate suggestions, scores, summaries, rewrites, and matches.',
      'You should not upload information that you are not comfortable processing through the product, including highly sensitive personal data not needed for a resume.',
      'AI output can be imperfect. You are responsible for reviewing generated text before using it in applications.',
    ],
  },
  {
    title: 'Sharing And Service Providers',
    body: [
      'We use trusted providers for hosting, authentication, database, email delivery, analytics, storage, AI processing, and security monitoring.',
      'We do not sell your resume content or personal information.',
      'We may disclose information if required by law, to enforce our terms, or to protect users and the service.',
    ],
  },
  {
    title: 'Data Security',
    body: [
      'We use reasonable technical and organizational safeguards including HTTPS, authenticated access, access controls, and provider-level security features.',
      'No online service can guarantee complete security. Keep your account credentials safe and contact us if you believe your account has been compromised.',
    ],
  },
  {
    title: 'Your Choices',
    body: [
      'You can edit or delete resume content from your account where the product provides those controls.',
      'You can request account or data deletion by contacting us.',
      'You can unsubscribe from non-transactional emails where an unsubscribe option is provided.',
    ],
  },
]

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" subtitle="How ResumeMatch collects, uses, and protects product data." sections={sections} />
}

function LegalPage({
  title,
  subtitle,
  sections,
}: {
  title: string
  subtitle: string
  sections: Array<{ title: string; body: string[] }>
}) {
  return (
    <main className="min-h-screen bg-[var(--color-marketing-bg)] text-[var(--color-marketing-text)]">
      <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
        <Link href="/" className="inline-flex text-sm font-semibold text-[var(--color-marketing-accent)]">
          ResumeMatch
        </Link>
        <div className="mt-10 rounded-[2rem] border border-[rgba(245,240,232,0.1)] bg-[rgba(245,240,232,0.035)] p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[rgba(245,240,232,0.36)]">
            Last updated: April 30, 2026
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[rgba(245,240,232,0.56)]">{subtitle}</p>

          <div className="mt-10 space-y-8">
            {sections.map(section => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <ul className="mt-3 space-y-3 text-sm leading-7 text-[rgba(245,240,232,0.55)]">
                  {section.body.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[rgba(77,224,163,0.2)] bg-[rgba(77,224,163,0.06)] p-5 text-sm leading-7 text-[rgba(245,240,232,0.64)]">
            Questions or requests: contact <a className="font-semibold text-[var(--color-marketing-accent)]" href="mailto:hello@resumematch.live">hello@resumematch.live</a>.
          </div>
        </div>
      </div>
    </main>
  )
}
