/**
 * RESUME PARSER
 *
 * Extracts plain text from PDF and DOCX files server-side.
 * This runs only in Node.js (API routes, Server Components) — never in the browser.
 *
 * Libraries:
 * - pdf-parse: Extracts text from PDF binary buffers. Handles multi-page PDFs.
 * - mammoth:   Converts DOCX to plain text. Handles tables, lists, headers.
 *
 * Why buffer-based instead of file path?
 * Files come through as FormData/Blobs in Next.js API routes.
 * Converting to Buffer keeps the file in memory — no temp file writes needed.
 */

import mammoth from 'mammoth'
import { extractSkills } from './skills'
import type { ResumeData } from '@/lib/builder/types'
import { parseResumeToBuilderData } from './structuredParser'

export type ParseResult = {
  text:   string
  skills: string[]
  parsed?: {
    resumeData: ResumeData
    sections: Array<{ type: string; confidence: number }>
    confidence: { overall: number }
    warnings: string[]
  }
  error?: string
}

/**
 * Parse a resume file (PDF or DOCX) from an ArrayBuffer.
 * Returns extracted text + matched skills.
 */
export async function parseResume(
  buffer:   Buffer,
  fileType: 'pdf' | 'docx' | 'image',
  options: { useAI?: boolean; useOCR?: boolean } = {}
): Promise<ParseResult> {
  try {
    if (fileType === 'image') {
      return {
        text: '',
        skills: [],
        error: options.useOCR
          ? 'Image OCR parsing is not available in this environment. Please upload a PDF or DOCX.'
          : 'Image parsing is not available. Please upload a PDF or DOCX.',
      }
    }

    const rawText = fileType === 'pdf'
      ? await parsePdf(buffer)
      : await parseDocx(buffer)
    const text = normalizeResumeText(rawText)

    if (text.length < 40) {
      return {
        text,
        skills: [],
        error: 'Could not extract enough text. This file may be scanned or image-based.',
      }
    }

    const skills = extractSkills(text)
    if (options.useAI) {
      const structured = await parseResumeToBuilderData(text, skills)
      return {
        text: structured.text,
        skills: structured.skills,
        parsed: {
          resumeData: structured.data,
          sections: [],
          confidence: { overall: structured.confidence },
          warnings: structured.warnings,
        },
      }
    }

    return { text, skills }
  } catch (err) {
    console.error('[Parser] Failed to parse resume:', err)
    const detail = err instanceof Error && err.message
      ? `Parsing failed: ${err.message.slice(0, 140)}`
      : 'Parsing failed.'
    return { text: '', skills: [], error: detail }
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  await ensurePdfDomPolyfills()

  // pdf-parse v2 exports a PDFParse class, not the old v1 function API.
  // Dynamic import keeps Next route collection stable and avoids bundling it
  // into a browser/edge-like execution path.
  const { PDFParse } = await import('pdf-parse') as {
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

async function ensurePdfDomPolyfills(): Promise<void> {
  const target = globalThis as Record<string, unknown>

  if (target.DOMMatrix && target.DOMPoint && target.DOMRect) return

  const { DOMMatrix, DOMPoint, DOMRect } = await import('@napi-rs/canvas')
  target.DOMMatrix ??= DOMMatrix
  target.DOMPoint ??= DOMPoint
  target.DOMRect ??= DOMRect
}

async function parseDocx(buffer: Buffer): Promise<string> {
  // mammoth.extractRawText strips all formatting — returns plain text only.
  // We don't need HTML here; plain text is what we index and search.
  const result = await mammoth.extractRawText({ buffer })
  return result.value ?? ''
}

function normalizeResumeText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
