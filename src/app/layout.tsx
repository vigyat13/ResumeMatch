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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://resumematch.live'),
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
    url: '/',
    siteName: 'ResumeMatch',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'ResumeMatch — AI-powered resume builder and job matching',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeMatch — AI-Powered Resume Optimizer',
    description: 'Build ATS-ready resumes, match roles, and move toward agent-assisted applications.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml' }],
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
