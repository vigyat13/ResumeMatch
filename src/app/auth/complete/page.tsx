import type { Metadata } from 'next'
import { AuthCompleteClient } from './AuthCompleteClient'

export const metadata: Metadata = {
  title: 'Authenticated',
  description: 'ResumeMatch authentication complete.',
}

interface PageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function AuthCompletePage({ searchParams }: PageProps) {
  const params = await searchParams
  const nextPath = sanitizeNextPath(params.next)

  return <AuthCompleteClient nextPath={nextPath} />
}

function sanitizeNextPath(value?: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}
