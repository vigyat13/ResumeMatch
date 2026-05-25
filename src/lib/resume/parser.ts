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
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { DOMMatrix, DOMPoint, DOMRect } from '@napi-rs/canvas'
import { extractSkills } from './skills'
import type { ResumeData } from '@/lib/builder/types'
import { parseResumeToBuilderData } from './structuredParser'

const pdfWorkerSrc = pathToFileURL(
  path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
).href

const pdfGlobal = globalThis as Record<string, unknown>
pdfGlobal.DOMMatrix ??= DOMMatrix
pdfGlobal.DOMPoint ??= DOMPoint
pdfGlobal.DOMRect ??= DOMRect

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
  // pdf-parse v2 exports a PDFParse class, not the old v1 function API.
  // Dynamic import keeps Next route collection stable and avoids bundling it
  // into a browser/edge-like execution path.
  const { PDFParse } = await import('pdf-parse') as {
    PDFParse: {
      setWorker: (workerSrc: string) => string
      new (options: { data: Buffer | Uint8Array }): {
        getText: () => Promise<{ text?: string }>
        destroy: () => Promise<void>
      }
    }
  }

  PDFParse.setWorker(pdfWorkerSrc)

  const parser = new PDFParse({ data: buffer })
  try {
    const data = await parser.getText()
    return appendPdfLinks(data.text ?? '', await extractPdfLinks(buffer))
  } finally {
    await parser.destroy()
  }
}

async function extractPdfLinks(buffer: Buffer): Promise<string[]> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs') as {
      getDocument: (options: { data: Uint8Array; disableWorker: boolean }) => {
        promise: Promise<{
          numPages: number
          getPage: (pageNumber: number) => Promise<{
            getAnnotations: (options: { intent: 'display' }) => Promise<Array<{
              subtype?: string
              url?: string
              unsafeUrl?: string
            }>>
          }>
          destroy: () => Promise<void>
        }>
      }
    }
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), disableWorker: true }).promise
    const urls: string[] = []

    try {
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
        const page = await doc.getPage(pageNumber)
        const annotations = await page.getAnnotations({ intent: 'display' })
        for (const annotation of annotations) {
          if (annotation.subtype !== 'Link') continue
          const url = clean(annotation.url ?? annotation.unsafeUrl ?? '')
          if (url) urls.push(url)
        }
      }
    } finally {
      await doc.destroy()
    }

    return unique(urls)
  } catch (error) {
    console.warn('[Parser] Could not extract PDF link annotations:', error)
    return []
  }
}

function appendPdfLinks(text: string, urls: string[]): string {
  if (!urls.length) return text

  const lines = urls.map(url => {
    if (/linkedin\.com/i.test(url)) return `LinkedIn URL: ${url}`
    if (/github\.com\/[^/]+$/i.test(url)) return `GitHub URL: ${url}`
    if (/github\.com/i.test(url)) return `Project GitHub URL: ${url}`
    if (/udemy\.com\/certificate/i.test(url)) return `Certification URL: ${url}`
    if (/unstop\.com\/certificate/i.test(url)) return `Hackathon Certificate URL: ${url}`
    return `Project Live URL: ${url}`
  })

  return `${text.trim()}\n\nEXTRACTED PDF LINKS\n${lines.join('\n')}`
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

function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function unique(values: string[]): string[] {
  return [...new Map(values.map(value => [value.toLowerCase(), value])).values()]
}
