const SUPPORTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/tiff',
  'image/bmp',
])

export function isImageType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.has(mimeType)
}

export function isLikelyScanned(text: string): boolean {
  const cleaned = text.replace(/\s+/g, '').trim()
  const hasMinimalText = cleaned.length < 100
  const hasGarbageChars = (text.match(/[^\x20-\x7E\n\r\t]/g) || []).length > text.length * 0.3
  const hasRepeatingNoise = (text.match(/(.)\1{4,}/g) || []).length > 3
  return hasMinimalText || hasGarbageChars || hasRepeatingNoise
}

export async function ocrImage(
  _buffer: Buffer,
  _mimeType: string,
  options?: { signal?: AbortSignal }
): Promise<string> {
  const Tesseract = await loadTesseract()
  if (!Tesseract) {
    throw new Error('OCR engine not available in this environment')
  }

  const worker = await Tesseract.createWorker('eng', undefined, {
    logger: undefined,
  })

  try {
    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        worker.terminate().catch(() => {})
      })
    }

    const { data } = await worker.recognize(_buffer)
    return data.text || ''
  } finally {
    await worker.terminate().catch(() => {})
  }
}

type TesseractWorker = {
  recognize: (input: Buffer) => Promise<{ data: { text?: string } }>
  terminate: () => Promise<void>
}

type TesseractModule = {
  createWorker: (
    lang?: string,
    oem?: unknown,
    options?: { logger?: unknown }
  ) => Promise<TesseractWorker>
}

let _tesseractModule: TesseractModule | null = null

async function loadTesseract(): Promise<TesseractModule | null> {
  if (_tesseractModule) return _tesseractModule
  try {
    const importer = new Function('specifier', 'return import(specifier)') as (
      specifier: string
    ) => Promise<unknown>
    _tesseractModule = (await importer('tesseract.js')) as TesseractModule
    return _tesseractModule
  } catch {
    return null
  }
}
