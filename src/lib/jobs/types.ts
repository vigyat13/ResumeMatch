export interface NormalizedJob {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  salary: string | null
  url: string
  source: string
  postedAt: string | null // ISO date
  tags: string[]
  description: string // plain text
}

export interface SourceResult {
  source: string
  status: 'ok' | 'error' | 'skipped'
  count: number
  error?: string
}

export interface SearchParams {
  query: string
  location?: string
  recencyDays: number // 1, 2, 7, 30
}

export interface SearchResponse {
  jobs: NormalizedJob[]
  sources: SourceResult[]
  totalBeforeFilter: number
}
