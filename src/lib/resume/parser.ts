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

export type ParseResult = {
  text:   string
  skills: string[]
  error?: string
}

/**
 * Parse a resume file (PDF or DOCX) from an ArrayBuffer.
 * Returns extracted text + matched skills.
 */
export async function parseResume(
  buffer:   Buffer,
  fileType: 'pdf' | 'docx'
): Promise<ParseResult> {
  try {
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
    return { text, skills }
  } catch (err) {
    console.error('[Parser] Failed to parse resume:', err)
    return { text: '', skills: [], error: 'Parsing failed.' }
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  // pdf-parse v2 exports a PDFParse class, not the old v1 function API.
  // Loading lazily keeps Next.js route collection stable in production.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
