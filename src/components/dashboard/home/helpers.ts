export function formatDate(date: string | null) {
  if (!date) return 'Recently'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function scoreCopy(score: number) {
  if (score >= 85) return 'Strong resume signal'
  if (score >= 70) return 'Good, still improvable'
  if (score >= 50) return 'Needs focused cleanup'
  return 'Needs a stronger rewrite'
}

export function getNextAction(resumeCount: number, hasAudit: boolean) {
  if (resumeCount === 0) {
    return {
      title: 'Create your first resume',
      description: 'Start with the builder if you want a clean A4 CV, or upload an existing resume from the resumes page.',
      href: '/builder',
      cta: 'Start building',
    }
  }

  if (!hasAudit) {
    return {
      title: 'Run your first audit',
      description: 'You have a resume uploaded. The next step is checking structure, keywords, and ATS readability.',
      href: '/dashboard/resumes',
      cta: 'Open resumes',
    }
  }

  return {
    title: 'Find jobs',
    description: 'Search live listings by prompt and location, then open roles that fit your resume direction.',
    href: '/dashboard/jobs',
    cta: 'Search jobs',
  }
}

export const STATUS_MAP: Record<string, { label: string; className: string }> = {
  processed: { label: 'Ready', className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' },
  completed: { label: 'Ready', className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' },
  pending: { label: 'Queued', className: 'border-amber-400/20 bg-amber-400/10 text-amber-300' },
  processing: { label: 'Parsing', className: 'border-sky-400/20 bg-sky-400/10 text-sky-300' },
  error: { label: 'Error', className: 'border-red-400/20 bg-red-400/10 text-red-300' },
  failed: { label: 'Failed', className: 'border-red-400/20 bg-red-400/10 text-red-300' },
}
