export interface LinkedinProfile {
  name: string
  title: string
  email: string
  phone: string
  location: string
  linkedin: string
  summary: string
  experience: LinkedinExperience[]
  education: LinkedinEducation[]
  skills: string[]
  certifications: LinkedinCertification[]
  languages: string[]
  publications: LinkedinPublication[]
  honors: string[]
  volunteer: LinkedinVolunteer[]
}

export interface LinkedinExperience {
  company: string
  role: string
  period: string
  duration: string
  location: string
  description: string[]
}

export interface LinkedinEducation {
  school: string
  degree: string
  field: string
  year: string
  activities: string[]
}

export interface LinkedinCertification {
  name: string
  issuer: string
  date: string
}

export interface LinkedinPublication {
  title: string
  publisher: string
  date: string
  url: string
}

export interface LinkedinVolunteer {
  organization: string
  role: string
  period: string
  cause: string
}

export interface LinkedinImportResult {
  profile: LinkedinProfile
  warnings: string[]
  confidence: number
}
