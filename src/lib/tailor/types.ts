import type { ResumeData } from '@/lib/builder/types'

export interface JobPosting {
  title: string
  company: string
  location: string
  description: string
  requirements: string[]
  responsibilities: string[]
  preferredQualifications: string[]
  salary: string
  employmentType: string
  url: string
  source: string
}

export interface TailoredResume {
  original: ResumeData
  tailored: ResumeData
  changes: TailorChange[]
  matchScore: number
  missingSkills: string[]
  addedSkills: string[]
  modifiedSections: string[]
}

export interface TailorChange {
  section: string
  type: 'added' | 'removed' | 'modified' | 'reordered'
  description: string
}

export interface CoverLetter {
  subject: string
  body: string
  recipientName: string
  recipientCompany: string
}

export interface TailorResult {
  tailored: TailoredResume
  coverLetter: CoverLetter
  suggestions: string[]
}

export interface JobSource {
  urlPattern: RegExp
  name: string
  scrapeSupported: boolean
}
