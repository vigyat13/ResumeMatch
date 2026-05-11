/**
 * ENHANCED RESUME PARSER
 *
 * Multi-strategy pipeline:
 *   1. Extract raw text (PDF/DOCX/Image → text)
 *   2. Detect if scanned → OCR if needed
 *   3. AI-powered section classification + structured data extraction
 *   4. Regex-based section detection as fallback
 *   5. Skill extraction
 *   6. Confidence scoring per field
 */

import mammoth from 'mammoth'
import { extractSkills } from './skills'
import { ocrImage, isImageType, isLikelyScanned } from './ocr'
import { aiParseFromRawWithFallback } from './aiParser'
import { detectSections, classifyHeaderInfo } from './sectionDetector'
import { SectionType } from './types'
import type { AIParseResult, ParserOptions, ParseProgress, ParseStage } from './types'
import type { ResumeData } from '@/lib/builder/types'

export type { AIParseResult, ParseProgress, ParseStage }

export type ParseResult = {
  text: string
  skills: string[]
  parsed: AIParseResult | null
  error?: string
}

export async function parseResume(
  buffer: Buffer,
  fileType: 'pdf' | 'docx' | 'image',
  options?: ParserOptions,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParseResult> {
  const opts: Required<ParserOptions> = {
    useAI: options?.useAI ?? true,
    useOCR: options?.useOCR ?? true,
    groqApiKey: options?.groqApiKey ?? '',
    minTextLength: options?.minTextLength ?? 40,
  }

  try {
    emitProgress(onProgress, 'decoding', 5, 'Reading file...')

    let rawText: string

    if (fileType === 'pdf') {
      rawText = await parsePdf(buffer)
    } else if (fileType === 'docx') {
      rawText = await parseDocx(buffer)
    } else if (fileType === 'image') {
      rawText = await parseImage(buffer, fileType, opts, onProgress)
    } else {
      return { text: '', skills: [], parsed: null, error: `Unsupported file type: ${fileType}` }
    }

    const text = normalizeResumeText(rawText)

    emitProgress(onProgress, 'extracting_text', 35, `Extracted ${formatCharCount(text.length)} of text`)

    const skills = text.length >= opts.minTextLength ? extractSkills(text) : []

    if (text.length < opts.minTextLength) {
      const warnings = ['Could not extract enough text. This file may be scanned or image-based.']

      if (fileType === 'pdf' && opts.useOCR) {
        emitProgress(onProgress, 'ocr_scanning', 20, 'PDF appears scanned, running OCR...')
        try {
          const ocrText = await ocrImage(buffer, 'application/pdf', { signal: AbortSignal.timeout(30000) })
          if (ocrText.length > text.length) {
            const normalizedOcr = normalizeResumeText(ocrText)
            const ocrSkills = normalizedOcr.length >= opts.minTextLength ? extractSkills(normalizedOcr) : []

            const aiResult = opts.useAI
              ? await aiParseFromRawWithFallback(normalizedOcr, { signal: AbortSignal.timeout(30000) })
              : null

            return { text: normalizedOcr, skills: ocrSkills, parsed: aiResult }
          }
        } catch {
          warnings.push('OCR attempted but failed. Try uploading a text-based PDF.')
        }
      }

      return { text, skills, parsed: null, error: warnings.join(' ') }
    }

    emitProgress(onProgress, 'detecting_sections', 50, 'Detecting sections...')

    const detected = detectSections(text)
    const headerInfo = classifyHeaderInfo(text)

    let parsed: AIParseResult | null = null

    if (opts.useAI) {
      emitProgress(onProgress, 'ai_analysis', 60, 'AI analyzing resume structure...')
      try {
        parsed = await aiParseFromRawWithFallback(text, { signal: AbortSignal.timeout(45000) })
        parsed.detectedFormat = fileType === 'pdf' ? 'pdf_text' : fileType === 'docx' ? 'docx' : 'plain_text'

        if (headerInfo.email && !parsed.resumeData.email) parsed.resumeData.email = headerInfo.email
        if (headerInfo.phone && !parsed.resumeData.phone) parsed.resumeData.phone = headerInfo.phone
        if (headerInfo.linkedin && !parsed.resumeData.linkedin) parsed.resumeData.linkedin = headerInfo.linkedin
        if (headerInfo.github && !parsed.resumeData.github) parsed.resumeData.github = headerInfo.github
        if (headerInfo.location && !parsed.resumeData.location) parsed.resumeData.location = headerInfo.location
      } catch (err) {
        const message = err instanceof Error ? err.message : 'AI parsing failed'
        parsed = {
          resumeData: buildFallbackResumeData(text, headerInfo, skills),
          sections: detected.map(s => ({ ...s, confidence: s.confidence * 0.5 })),
          confidence: { overall: 0, perSection: {} as Record<SectionType, number> },
          detectedFormat: 'plain_text',
          warnings: [message],
        }
      }
    }

    emitProgress(onProgress, 'extracting_skills', 80, `Identified ${skills.length} skills`)

    if (parsed && detectSkillGap(parsed.resumeData, skills)) {
      mergeMissingSkills(parsed.resumeData, skills)
    }

    emitProgress(onProgress, 'building_resume', 95, 'Building structured resume...')

    emitProgress(onProgress, 'complete', 100, 'Parse complete')

    return { text, skills, parsed }
  } catch (err) {
    console.error('[Parser] Fatal error:', err)
    return {
      text: '',
      skills: [],
      parsed: null,
      error: err instanceof Error ? err.message : 'Parsing failed unexpectedly.',
    }
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = require('pdf-parse') as {
    PDFParse: new (options: { data: Buffer | Uint8Array }) => {
      getText: () => Promise<{ text?: string }>
      destroy: () => Promise<void>
    }
  }

  const parser = new PDFParse({ data: buffer })
  try {
    const data = await parser.getText()
    return data.text ?? ''
  } finally {
    await parser.destroy()
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value ?? ''
}

async function parseImage(
  buffer: Buffer,
  _fileType: string,
  opts: Required<ParserOptions>,
  onProgress?: (p: ParseProgress) => void
): Promise<string> {
  if (!opts.useOCR) {
    throw new Error('OCR is disabled. Cannot parse image-based files.')
  }

  emitProgress(onProgress, 'ocr_scanning', 15, 'Running OCR on image...')
  return await ocrImage(buffer, 'image/png', { signal: AbortSignal.timeout(30000) })
}

function normalizeResumeText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function buildFallbackResumeData(
  text: string,
  headerInfo: Record<string, string>,
  skills: string[]
): ResumeData {
  return {
    name: '',
    title: '',
    email: headerInfo.email ?? '',
    phone: headerInfo.phone ?? '',
    location: headerInfo.location ?? '',
    github: headerInfo.github ?? '',
    linkedin: headerInfo.linkedin ?? '',
    portfolio: '',
    summary: text.slice(0, 500),
    experience: [],
    education: [],
    skills: skills.map(s => ({ name: s, level: 80 })),
    projects: [],
    publications: [],
    honors: [],
  }
}

function detectSkillGap(data: ResumeData, extractedSkills: string[]): boolean {
  const dataSkillNames = new Set(data.skills.map(s => s.name.toLowerCase()))
  for (const skill of extractedSkills) {
    if (!dataSkillNames.has(skill.toLowerCase())) return true
  }
  return false
}

function mergeMissingSkills(data: ResumeData, extractedSkills: string[]): void {
  const existing = new Set(data.skills.map(s => s.name.toLowerCase()))
  for (const skill of extractedSkills) {
    if (!existing.has(skill.toLowerCase())) {
      data.skills.push({ name: skill, level: 60 })
    }
  }
}

function emitProgress(onProgress?: (p: ParseProgress) => void, stage?: ParseStage, percent?: number, message?: string) {
  if (onProgress && stage && percent !== undefined && message) {
    onProgress({ stage, percent, message })
  }
}

function formatCharCount(n: number): string {
  if (n < 1000) return `${n} characters`
  return `${(n / 1000).toFixed(1)}K characters`
}
