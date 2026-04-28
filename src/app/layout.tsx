/**
 * ROOT LAYOUT
 *
 * This is the outermost wrapper for every page in the app.
 * Next.js App Router automatically wraps all pages with this layout.
 *
 * Key jobs:
 * 1. Load one consistent Google Font across the app
 * 2. Set page metadata (SEO title, description)
 * 3. Apply the font CSS variables that globals.css uses
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-headline',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// Metadata is used by search engines and social media previews
export const metadata: Metadata = {
  title: {
    default: 'ResumeMatch — AI-Powered Resume Optimizer',
    template: '%s | ResumeMatch', // page title format: "Dashboard | ResumeMatch"
  },
  description:
    'Get your resume past ATS systems, match your skills to jobs, and land interviews with confidence.',
  keywords: ['resume', 'ATS', 'job matching', 'AI resume', 'resume optimization'],
  openGraph: {
    title: 'ResumeMatch — AI-Powered Resume Optimizer',
    description: 'Get your resume past ATS systems and land interviews with confidence.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
