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
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-site',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// Metadata is used by search engines and social media previews
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://resumematch.live'),
  title: {
    default: 'ResumeMatch',
    template: '%s | ResumeMatch', // page title format: "Dashboard | ResumeMatch"
  },
  description:
    'Create ATS-ready resumes, compare them with job descriptions, and move toward smarter job applications.',
  keywords: ['resume', 'ATS', 'job matching', 'resume builder', 'job applications'],
  openGraph: {
    title: 'ResumeMatch',
    description: 'Create ATS-ready resumes, compare them with job descriptions, and move toward smarter job applications.',
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
    title: 'ResumeMatch',
    description: 'Create ATS-ready resumes, compare them with job descriptions, and move toward smarter job applications.',
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
    <html lang="en" className={cn("h-full", inter.variable, "font-sans", geist.variable)}>
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
