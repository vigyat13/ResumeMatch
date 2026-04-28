import type { ResumeData } from './types'
import { generateLatexFromJson, toStructuredResumeJson } from './systemOutput'

export function generateLatex(data: ResumeData): string {
  return generateLatexFromJson(toStructuredResumeJson(data))
}
