/**
 * ROOT LAYOUT
 *
 * This is the outermost wrapper for every page in the app.
 * Next.js App Router automatically wraps all pages with this layout.
 *
 * Key jobs:
 * 1. Load Google Fonts (Inter for headings, Poppins for body)
 * 2. Set page metadata (SEO title, description)
 * 3. Apply the font CSS variables that globals.css uses
 */

import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'

// Inter = geometric, modern — used for headlines and UI elements
// next/font automatically optimizes font loading (no layout shift)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-headline', // matches our CSS variable in globals.css
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// Poppins = warm, approachable — used for body text and descriptions
const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600'],
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
    // Apply both font variables so CSS can reference --font-headline and --font-body
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
