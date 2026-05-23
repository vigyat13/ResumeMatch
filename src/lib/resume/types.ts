export enum SectionType {
  Header = 'header',
  Summary = 'summary',
  Experience = 'experience',
  Education = 'education',
  Skills = 'skills',
  Projects = 'projects',
  Certifications = 'certifications',
  Publications = 'publications',
  Honors = 'honors',
  Languages = 'languages',
  Volunteer = 'volunteer',
  References = 'references',
  Unknown = 'unknown',
}

export interface ParsedSection {
  type: SectionType
  rawText: string
  confidence: number
  metadata?: Record<string, string>
}

export interface AIParseResult {
  resumeData: import('@/lib/builder/types').ResumeData
  sections: ParsedSection[]
  confidence: {
    overall: number
    perSection: Record<SectionType, number>
  }
  detectedFormat: 'pdf_text' | 'pdf_scanned' | 'docx' | 'image' | 'plain_text' | 'linkedin'
  warnings: string[]
}

export interface ParserOptions {
  useAI?: boolean
  useOCR?: boolean
  groqApiKey?: string
  minTextLength?: number
}

export type ParseSource = 'pdf' | 'docx' | 'image' | 'text'

export type ParseStage =
  | 'decoding'
  | 'ocr_scanning'
  | 'extracting_text'
  | 'detecting_sections'
  | 'ai_analysis'
  | 'extracting_skills'
  | 'building_resume'
  | 'complete'
  | 'error'

export interface ParseProgress {
  stage: ParseStage
  percent: number
  message: string
}
