import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for ResumeMatch.',
}

const sections = [
  {
    title: 'Using ResumeMatch',
    body: [
      'ResumeMatch provides resume building, resume analysis, template editing, job matching, and AI-assisted career tools.',
      'You must provide accurate account information and keep your login credentials secure.',
      'You are responsible for the resume, profile, job description, and other content you upload or create.',
    ],
  },
  {
    title: 'Beta Product Notice',
    body: [
      'ResumeMatch is currently an early-stage product. Some features may change, be unavailable, or produce imperfect results.',
      'We may update, add, remove, limit, or discontinue features as the product evolves.',
      'You should review all AI-generated suggestions before using them in job applications or public documents.',
    ],
  },
  {
    title: 'Acceptable Use',
    body: [
      'Do not use ResumeMatch to upload unlawful, harmful, infringing, misleading, malicious, or abusive content.',
      'Do not attempt to reverse engineer, scrape, overload, bypass security, or access another user\'s account or data.',
      'Do not use automated systems to abuse the service or create accounts at scale without permission.',
    ],
  },
  {
    title: 'AI Output And Career Decisions',
    body: [
      'AI-generated content, scores, and recommendations are informational and may be incomplete or inaccurate.',
      'ResumeMatch does not guarantee interviews, job offers, application outcomes, ATS performance, or employer decisions.',
      'You remain responsible for verifying resume accuracy, application materials, and claims made to employers.',
    ],
  },
  {
    title: 'Accounts, Downloads, And Data',
    body: [
      'Some actions, such as saving or downloading, may require an account.',
      'We may suspend or terminate access if we detect abuse, security risk, violation of these terms, or unlawful activity.',
      'You can request support or account/data deletion by contacting us.',
    ],
  },
  {
    title: 'Liability',
    body: [
      'ResumeMatch is provided as-is and as-available to the fullest extent permitted by law.',
      'We are not liable for indirect, incidental, consequential, special, or punitive damages arising from use of the service.',
      'Nothing in these terms limits liability that cannot be limited under applicable law.',
    ],
  },
]

export default function TermsPage() {
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
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] sm:text-6xl">Terms of Service</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[rgba(245,240,232,0.56)]">
            The rules for using ResumeMatch and its resume, matching, and AI-assisted tools.
          </p>

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
            Questions about these terms: contact <a className="font-semibold text-[var(--color-marketing-accent)]" href="mailto:hello@resumematch.live">hello@resumematch.live</a>.
          </div>
        </div>
      </div>
    </main>
  )
}
