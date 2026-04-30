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
  await searchParams
  return <AuthCompleteClient nextPath="/builder" />
}
