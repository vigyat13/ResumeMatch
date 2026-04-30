import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://resumematch.live'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/builder', '/privacy', '/terms'],
        disallow: ['/dashboard', '/admin', '/api', '/login', '/signup', '/auth'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
