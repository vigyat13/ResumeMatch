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
    const text = fileType === 'pdf'
      ? await parsePdf(buffer)
      : await parseDocx(buffer)

    const skills = extractSkills(text)
    return { text, skills }
  } catch (err) {
    console.error('[Parser] Failed to parse resume:', err)
    return { text: '', skills: [], error: 'Parsing failed.' }
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  // Load pdf-parse lazily. Its transitive PDF.js dependency touches canvas
  // globals at import time, which breaks Next.js production route collection.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>
  // pdf-parse reads the binary PDF and returns a data object.
  // data.text contains all page text concatenated with newlines.
  const data = await pdfParse(buffer)
  return data.text ?? ''
}

async function parseDocx(buffer: Buffer): Promise<string> {
  // mammoth.extractRawText strips all formatting — returns plain text only.
  // We don't need HTML here; plain text is what we index and search.
  const result = await mammoth.extractRawText({ buffer })
  return result.value ?? ''
}
