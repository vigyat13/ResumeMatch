'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Download, Loader2, ChevronLeft, FileText, Code2,
  Edit3, Copy, Check, RefreshCw, ImagePlus, X, AlertCircle,
  SlidersHorizontal,
} from 'lucide-react'
import { renderTemplate } from '@/lib/builder/render'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { BuilderForm }  from './BuilderForm'
import { SkillsEditor } from './SkillsEditor'
import { LivePreview, previewPageHeightMm, previewSpacingCss } from './LivePreview'
import { AuthModal }    from './AuthModal'
import { DEFAULT_RESUME_DATA, pickSampleForTemplate } from '@/lib/builder/types'
import type { ResumeData } from '@/lib/builder/types'
import { createClient } from '@/lib/supabase/client'
import { parseLatex }    from '@/lib/builder/parseLatex'
import { buildResumeSystemOutput } from '@/lib/builder/systemOutput'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const DRAFT_KEY = 'resumematch-builder-draft'
type Tab = 'form' | 'direct' | 'latex'

interface UploadedImage { name: string; dataUrl: string }

interface Props {
  templateId:   string
  templateName: string
  templateHtml: string
  templateCss:  string
  initialData?: ResumeData
  startBlank?: boolean
}

export function BuilderEditor({ templateId, templateName, templateHtml, templateCss, initialData, startBlank = false }: Props) {
  const [data, setData]                 = useState<ResumeData>(initialData ?? DEFAULT_RESUME_DATA)
  const [tab, setTab]                   = useState<Tab>('form')
  const [showAuth, setShowAuth]         = useState(false)
  const [isLoggedIn, setIsLoggedIn]     = useState(false)
  const [copied, setCopied]             = useState(false)
  const [spacing, setSpacing]           = useState(0)
  const [contentScale, setContentScale] = useState(100)
  const [cropBottomMm, setCropBottomMm] = useState(0)
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false)
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit')
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'saving' | 'downloading' | 'ready'>('idle')

  // LaTeX editor state
  const [editedLatex, setEditedLatex]         = useState<string | null>(null)
  const [recompiling, setRecompiling]         = useState(false)
  const [recompileError, setRecompileError]   = useState<string | null>(null)
  const [uploadedImages, setUploadedImages]   = useState<UploadedImage[]>([])
  const monacoRef                             = useRef<Parameters<NonNullable<React.ComponentProps<typeof MonacoEditor>['onMount']>>[0] | null>(null)
  const imageInputRef                         = useRef<HTMLInputElement>(null)

  const supabase = useMemo(() => createClient(), [])
  const sampleData = useMemo(() => pickSampleForTemplate(templateName), [templateName])
  const previewData = useMemo(
    () => hasResumeContent(data) ? data : sampleData,
    [data, sampleData]
  )

  useEffect(() => {
    let shouldLoadDraft = true
    const imported = localStorage.getItem(importKey(templateId))
    if (imported) {
      try {
        const parsed = JSON.parse(imported) as ResumeData
        if (hasResumeContent(parsed)) {
          setData(parsed)
          localStorage.removeItem(importKey(templateId))
          shouldLoadDraft = false
        }
      } catch {}
    }

    if (startBlank) {
      localStorage.removeItem(DRAFT_KEY)
      setData(DEFAULT_RESUME_DATA)
      shouldLoadDraft = false
    }

    const saved = shouldLoadDraft ? localStorage.getItem(DRAFT_KEY) : null
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ResumeData
        if (hasResumeContent(parsed) && !isDemoResumeData(parsed)) {
          setTimeout(() => setData(parsed), 0)
        } else if (isDemoResumeData(parsed)) {
          localStorage.removeItem(DRAFT_KEY)
        }
      } catch {}
    }
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [initialData, startBlank, supabase.auth, templateId])

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(data)), 500)
    return () => clearTimeout(t)
  }, [data])

  const systemOutput = useMemo(() => buildResumeSystemOutput(previewData), [previewData])
  const latexCode    = systemOutput.latex
  const previewTuning = useMemo(
    () => ({ spacing, contentScale, cropBottomMm }),
    [contentScale, cropBottomMm, spacing]
  )

  // Active LaTeX shown in Monaco: edited version or freshly generated
  const activeLatex = editedLatex ?? latexCode

  function handleRecompile() {
    if (!editedLatex) return
    setRecompiling(true)
    setRecompileError(null)
    try {
      const parsed = parseLatex(editedLatex)
      if (Object.keys(parsed).length === 0) {
        setRecompileError('Could not parse LaTeX — make sure you\'re using ResumeMatch\'s format.')
        return
      }
      setData(prev => ({ ...prev, ...parsed }))
    } catch {
      setRecompileError('Parse error — check your LaTeX syntax.')
    } finally {
      setRecompiling(false)
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const name    = file.name.replace(/\s+/g, '_')
      setUploadedImages(prev => [...prev.filter(i => i.name !== name), { name, dataUrl }])
      // Insert \includegraphics at cursor
      const editor = monacoRef.current
      if (editor) {
        const pos     = editor.getPosition()
        const model   = editor.getModel()
        if (pos && model) {
          const cmd = `\n\\includegraphics[width=0.5\\linewidth]{${name}}\n`
          editor.executeEdits('image-insert', [{
            range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column },
            text:  cmd,
          }])
          setEditedLatex(model.getValue())
        }
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function removeImage(name: string) {
    setUploadedImages(prev => prev.filter(i => i.name !== name))
  }

  async function handleDownload() {
    if (!isLoggedIn) { setShowAuth(true); return }
    await saveAndDownload()
  }

  async function saveAndDownload() {
    setDownloadStatus('saving')
    try {
      await fetch('/api/v1/builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: data, templateId }),
      })
    } catch { /* non-fatal */ }
    finally {
      setDownloadStatus('downloading')
    }

    const renderedHtml = renderTemplate(templateHtml, data)
    const fileName = `${safeFileName(data.name || 'resume')}.pdf`
    const pageHeightMm = previewPageHeightMm(previewTuning)
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${fileName}</title>
<style>
*{box-sizing:border-box;-webkit-hyphens:none;hyphens:none}
html,body{margin:0;padding:0;background:#fff;width:210mm;min-height:${pageHeightMm}mm;color:#111}
a{color:inherit;text-decoration:none}
${templateCss}
${previewSpacingCss(previewTuning, 'body')}
@page{size:210mm ${pageHeightMm}mm;margin:0}
@media print{body{margin:0;background-image:none!important}.cv{box-shadow:none!important;border-radius:0!important}}
</style>
</head>
<body>${renderedHtml}</body>
</html>`

    printA4Document(html, () => {
      setDownloadStatus('ready')
      setTimeout(() => setDownloadStatus('idle'), 3500)
    })
  }

  async function onAuthSuccess() {
    setShowAuth(false)
    setIsLoggedIn(true)
    await saveAndDownload()
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(activeLatex)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadTex() {
    const blob = new Blob([activeLatex], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `${data.name.replace(/\s+/g, '_')}.tex` })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {showAuth && <AuthModal onSuccess={onAuthSuccess} onClose={() => setShowAuth(false)} />}
      {layoutPanelOpen && (
        <div className="print:hidden fixed inset-0 z-40 xl:hidden">
          <button
            aria-label="Close layout controls"
            className="absolute inset-0 bg-black/55"
            onClick={() => setLayoutPanelOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[min(88vw,340px)] border-l border-border bg-background shadow-2xl">
            <LayoutControls
              spacing={spacing}
              setSpacing={setSpacing}
              contentScale={contentScale}
              setContentScale={setContentScale}
              cropBottomMm={cropBottomMm}
              setCropBottomMm={setCropBottomMm}
              onClose={() => setLayoutPanelOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Single unified top bar ───────────────────────────── */}
      <header className="print:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex min-h-13 flex-wrap items-center px-3 py-2 gap-2 sm:px-4 sm:gap-3">

          {/* Logo */}
          <Link href="/builder" className="text-base sm:text-lg" style={{ fontFamily: 'var(--font-headline), sans-serif', fontWeight: 700, letterSpacing: '0.01em', flexShrink: 0 }}>
            <span>Resume</span><span style={{ color: 'var(--color-accent)' }}>Match</span>
          </Link>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
            <span>/</span>
            <Link href="/builder" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />Templates
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[120px]">{templateName}</span>
          </div>

          {/* Spacer */}
          <div className="hidden sm:block flex-1" />

          {/* Tab switcher */}
          <div className="order-3 flex w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-muted p-1 sm:order-none sm:w-auto">
            <TabBtn active={tab === 'form'}   onClick={() => { setTab('form'); setMobilePane('edit') }}
              icon={<FileText className="w-3.5 h-3.5" />} label="Form" />
            <TabBtn active={tab === 'direct'} onClick={() => setTab('direct')}
              icon={<Edit3 className="w-3.5 h-3.5" />}    label="Canvas" />
            <TabBtn active={tab === 'latex'}  onClick={() => setTab('latex')}
              icon={<Code2 className="w-3.5 h-3.5" />}    label="LaTeX" />
          </div>

          {/* LaTeX actions (visible only on LaTeX tab) */}
          {tab === 'latex' && (
            <div className="order-4 flex w-full items-center gap-1.5 overflow-x-auto sm:order-none sm:w-auto">
              <button onClick={() => { setEditedLatex(null); setRecompileError(null) }}
                title="Regenerate LaTeX from form data"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Sync Form
              </button>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={handleDownloadTex}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                <Download className="w-3.5 h-3.5" /> .tex
              </button>
            </div>
          )}

          <button
            onClick={() => setLayoutPanelOpen(true)}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted sm:ml-0 xl:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Layout
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownload}
            disabled={downloadStatus === 'saving' || downloadStatus === 'downloading'}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-primary text-primary-foreground rounded-lg
                       text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
          >
            {downloadStatus === 'saving' || downloadStatus === 'downloading'
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{downloadButtonLabel(downloadStatus)}</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </header>

      {/* ── Tab: Form ──────────────────────────────────────── */}
      {tab === 'form' && (
        <div className="print:hidden flex min-h-[calc(100dvh-104px)] flex-col lg:h-[calc(100vh-53px)] lg:flex-row">
          <div className="sticky top-[104px] z-10 grid grid-cols-2 gap-1 border-b border-border bg-background/95 p-2 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setMobilePane('edit')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mobilePane === 'edit' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMobilePane('preview')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mobilePane === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              Preview CV
            </button>
          </div>

          {/* Left panel — form */}
          <div className={`${mobilePane === 'edit' ? 'block' : 'hidden'} w-full flex-shrink-0 overflow-y-auto border-b border-border bg-card px-4 py-4 lg:block lg:max-h-none lg:w-[400px] lg:border-b-0 lg:border-r lg:px-5 lg:py-5`}>
            <BuilderForm data={data} onChange={setData} />
            <div className="mt-6 pt-6 border-t border-border">
              <SkillsEditor skills={data.skills} onChange={skills => setData(d => ({ ...d, skills }))} />
            </div>
          </div>
          {/* Right panel — live preview */}
          <div className={`${mobilePane === 'preview' ? 'flex' : 'hidden'} min-h-[calc(100dvh-157px)] flex-1 justify-center overflow-auto bg-muted/40 px-3 py-8 print:bg-white print:p-0 sm:px-8 sm:py-8 lg:flex lg:min-h-0`}>
            <div className="print-target max-w-full">
              <LivePreview templateHtml={templateHtml} templateCss={templateCss} data={previewData} tuning={previewTuning} />
            </div>
          </div>
          <aside className="hidden w-[280px] flex-shrink-0 overflow-y-auto border-l border-border bg-background xl:block">
            <LayoutControls
              spacing={spacing}
              setSpacing={setSpacing}
              contentScale={contentScale}
              setContentScale={setContentScale}
              cropBottomMm={cropBottomMm}
              setCropBottomMm={setCropBottomMm}
            />
          </aside>
        </div>
      )}

      {/* ── Tab: Canvas (direct edit) ───────────────────────── */}
      {tab === 'direct' && (
        <div className="flex min-h-[calc(100dvh-104px)] bg-muted/40 lg:min-h-[calc(100vh-53px)]">
          <div className="flex flex-1 flex-col items-center gap-4 overflow-auto px-4 py-5 sm:px-8 sm:py-6">
            <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg max-w-xl text-center">
              This canvas renders the canonical semantic HTML output. Direct edits here are local-only and do not rewrite the form state.
            </p>
            <div className="print-target">
              <DirectEditPreview renderedHtml={systemOutput.html} />
            </div>
          </div>
          <aside className="hidden w-[280px] flex-shrink-0 overflow-y-auto border-l border-border bg-background xl:block">
            <LayoutControls
              spacing={spacing}
              setSpacing={setSpacing}
              contentScale={contentScale}
              setContentScale={setContentScale}
              cropBottomMm={cropBottomMm}
              setCropBottomMm={setCropBottomMm}
            />
          </aside>
        </div>
      )}

      {/* ── Tab: LaTeX — Overleaf-style split ──────────────── */}
      {tab === 'latex' && (
        <div className="flex min-h-[calc(100dvh-104px)] lg:h-[calc(100vh-53px)]">
          <div className="flex min-w-0 flex-1 flex-col lg:flex-row">

          {/* Left: Monaco + image panel */}
          <div className="flex min-h-[48dvh] flex-1 flex-col border-b border-border lg:border-b-0 lg:border-r" style={{ minWidth: 0 }}>

            {/* Editor toolbar (dark, like Overleaf) */}
            <div className="flex-shrink-0 px-4 py-2 bg-[#1e1e1e] border-b border-[#2a2a2a] flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-xs text-gray-400 font-mono">resume.tex</span>
              {editedLatex !== null && (
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">modified</span>
              )}
              <div className="flex-1" />
              {/* Image upload */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-gray-300 border border-[#444] rounded hover:bg-[#2a2a2a] transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5" /> Add Image
              </button>
            </div>

            {/* Monaco editor — fully editable */}
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language="latex"
                value={activeLatex}
                theme="vs-dark"
                onMount={editor => { monacoRef.current = editor }}
                onChange={val => setEditedLatex(val ?? '')}
                options={{
                  fontSize: 13,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'line',
                  fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
                  padding: { top: 16 },
                  readOnly: false,
                }}
              />
            </div>

            {/* Uploaded images panel */}
            {uploadedImages.length > 0 && (
              <div className="flex-shrink-0 bg-[#1e1e1e] border-t border-[#2a2a2a] px-4 py-2">
                <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide">Uploaded images</p>
                <div className="flex flex-wrap gap-2">
                  {uploadedImages.map(img => (
                    <div key={img.name} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.dataUrl} alt={img.name}
                        className="h-12 w-12 object-cover rounded border border-[#444] cursor-pointer hover:border-blue-400 transition-colors"
                        title={img.name}
                        onClick={() => {
                          const editor = monacoRef.current
                          if (editor) {
                            const pos   = editor.getPosition()
                            const model = editor.getModel()
                            if (pos && model) {
                              const cmd = `\\includegraphics[width=0.5\\linewidth]{${img.name}}`
                              editor.executeEdits('image-insert', [{
                                range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column },
                                text:  cmd,
                              }])
                              setEditedLatex(model.getValue())
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => removeImage(img.name)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                      <p className="text-[9px] text-gray-600 mt-0.5 truncate max-w-[48px]">{img.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: preview + recompile */}
          <div className="flex min-h-[48dvh] flex-1 flex-col bg-muted/40" style={{ minWidth: 0 }}>

            {/* Preview toolbar */}
            <div className="flex-shrink-0 px-4 py-2 bg-card border-b border-border flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${recompileError ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="text-xs text-muted-foreground flex-1">
                {recompileError ? recompileError : 'Preview — click Recompile to apply LaTeX edits'}
              </span>
              <button
                onClick={handleRecompile}
                disabled={recompiling || editedLatex === null}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg
                           hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                {recompiling
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5" />}
                Recompile
              </button>
            </div>

            {/* Error banner */}
            {recompileError && (
              <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-b border-red-200 flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {recompileError}
              </div>
            )}

            {/* Preview — shows the canonical HTML rendered from parsed data */}
            <div className="flex flex-1 justify-center overflow-auto px-3 py-5 sm:px-6 sm:py-6">
              <div className="w-[21cm] max-w-full origin-top" style={{ transform: 'scale(0.72)', transformOrigin: 'top center' }}>
                <SystemHtmlPreview html={systemOutput.html} />
              </div>
            </div>
          </div>
          </div>
          <aside className="hidden w-[280px] flex-shrink-0 overflow-y-auto border-l border-border bg-background xl:block">
            <LayoutControls
              spacing={spacing}
              setSpacing={setSpacing}
              contentScale={contentScale}
              setContentScale={setContentScale}
              cropBottomMm={cropBottomMm}
              setCropBottomMm={setCropBottomMm}
            />
          </aside>
        </div>
      )}

      {/* Print target */}
      <div className="hidden print:block print-target">
        <LivePreview templateHtml={templateHtml} templateCss={templateCss} data={previewData} tuning={previewTuning} />
      </div>
    </>
  )
}

function spacingLabel(value: number): string {
  if (value <= -2) return 'Tight'
  if (value === -1) return 'Compact'
  if (value === 1) return 'Roomy'
  if (value >= 2) return 'Airy'
  return 'Normal'
}

function safeFileName(value: string): string {
  return value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'resume'
}

function importKey(templateId: string): string {
  return `resumematch-builder-import-${templateId}`
}

function downloadButtonLabel(status: 'idle' | 'saving' | 'downloading' | 'ready'): string {
  if (status === 'saving') return 'Saving...'
  if (status === 'downloading') return 'Downloading...'
  if (status === 'ready') return 'Ready to save'
  return 'Download PDF'
}

function hasResumeContent(data: ResumeData): boolean {
  return Boolean(
    data.name?.trim() ||
    data.email?.trim() ||
    data.summary?.trim() ||
    data.experience?.some(entry =>
      entry.company.trim() ||
      entry.role.trim() ||
      entry.period.trim() ||
      entry.bullets.some(bullet => bullet.trim())
    ) ||
    data.projects?.some(project =>
      project.name.trim() ||
      project.tech.trim() ||
      project.description.trim() ||
      project.bullets.some(bullet => bullet.trim())
    ) ||
    data.education?.some(education =>
      education.school.trim() ||
      education.degree.trim() ||
      education.cgpa?.trim() ||
      education.year.trim()
    ) ||
    data.skills?.some(skill => skill.name.trim())
  )
}

const DEMO_SAMPLE_NAMES = new Set([
  'pratik singh',
  'nishant yadav',
  'suryansh',
  'rishit',
  'krishna',
  'bruce wayne',
  'alex morgan',
  'jordan blake',
  'riley chen',
  'morgan lee',
  'casey reed',
  'taylor brooks',
])

const DEMO_HANDLE_PATTERN = /demo-(?:pratik|nishant|suryansh|rishit|krishna|bruce|alex|jordan|riley|morgan|casey|taylor)/i

function isDemoResumeData(data: ResumeData): boolean {
  const name = data.name?.trim().toLowerCase()
  if (name && DEMO_SAMPLE_NAMES.has(name)) return true

  const links = [
    data.github,
    data.linkedin,
    data.portfolio,
    ...(data.projects ?? []).map(project => project.link),
  ].filter(Boolean).join(' ')

  return DEMO_HANDLE_PATTERN.test(links)
}

function printA4Document(html: string, onPrintOpened: () => void) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.opacity = '0'
  iframe.setAttribute('aria-hidden', 'true')
  document.body.appendChild(iframe)

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 500)
  }

  iframe.onload = () => {
    const win = iframe.contentWindow
    if (!win) {
      cleanup()
      return
    }
    win.focus()
    win.onafterprint = cleanup
    win.print()
    onPrintOpened()
    setTimeout(cleanup, 60_000)
  }

  iframe.srcdoc = html
}

type NumberSetter = React.Dispatch<React.SetStateAction<number>>

function LayoutControls({
  spacing,
  setSpacing,
  contentScale,
  setContentScale,
  cropBottomMm,
  setCropBottomMm,
  onClose,
}: {
  spacing: number
  setSpacing: NumberSetter
  contentScale: number
  setContentScale: NumberSetter
  cropBottomMm: number
  setCropBottomMm: NumberSetter
  onClose?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-border px-5 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Layout</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Page controls</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Tune the A4 preview and exported PDF without changing resume content.
          </p>
        </div>
        {onClose && (
          <button
            aria-label="Close layout controls"
            onClick={onClose}
            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <LayoutStepper
          label="Whitespace"
          value={spacingLabel(spacing)}
          helper="Controls section gaps, bullet spacing, and resume density."
          decreaseLabel="Decrease whitespace"
          increaseLabel="Increase whitespace"
          onDecrease={() => setSpacing(v => Math.max(-2, v - 1))}
          onIncrease={() => setSpacing(v => Math.min(2, v + 1))}
          disableDecrease={spacing <= -2}
          disableIncrease={spacing >= 2}
        />
        <LayoutStepper
          label="Content size"
          value={`${contentScale}%`}
          helper="Scale text and resume blocks while keeping the page A4."
          decreaseLabel="Make content smaller"
          increaseLabel="Make content larger"
          onDecrease={() => setContentScale(v => Math.max(90, v - 5))}
          onIncrease={() => setContentScale(v => Math.min(120, v + 5))}
          disableDecrease={contentScale <= 90}
          disableIncrease={contentScale >= 120}
        />
        <LayoutStepper
          label="Bottom crop"
          value={`${cropBottomMm}mm`}
          helper="Cuts unused page height from the final preview/export."
          decreaseLabel="Show more bottom area"
          increaseLabel="Crop more bottom whitespace"
          onDecrease={() => setCropBottomMm(v => Math.max(0, v - 5))}
          onIncrease={() => setCropBottomMm(v => Math.min(120, v + 5))}
          disableDecrease={cropBottomMm <= 0}
          disableIncrease={cropBottomMm >= 120}
        />
      </div>

      <div className="border-t border-border px-5 py-4">
        <button
          onClick={() => {
            setSpacing(0)
            setContentScale(100)
            setCropBottomMm(0)
          }}
          className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Reset layout
        </button>
      </div>
    </div>
  )
}

function LayoutStepper({
  label,
  value,
  helper,
  onDecrease,
  onIncrease,
  disableDecrease,
  disableIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  label: string
  value: string
  helper: string
  onDecrease: () => void
  onIncrease: () => void
  disableDecrease: boolean
  disableIncrease: boolean
  decreaseLabel: string
  increaseLabel: string
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
        </div>
        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
          {value}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={onDecrease}
          disabled={disableDecrease}
          title={decreaseLabel}
          className="rounded-xl border border-border px-3 py-2 text-lg font-semibold leading-none transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
        >
          -
        </button>
        <button
          onClick={onIncrease}
          disabled={disableIncrease}
          title={increaseLabel}
          className="rounded-xl border border-border px-3 py-2 text-lg font-semibold leading-none transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
        >
          +
        </button>
      </div>
    </section>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      }`}>
      {icon} {label}
    </button>
  )
}

function DirectEditPreview({ renderedHtml }: { renderedHtml: string }) {
  const ref    = useRef<HTMLDivElement>(null)
  const inited = useRef(false)

  useEffect(() => {
    if (ref.current && !inited.current) {
      ref.current.innerHTML = renderedHtml
      inited.current = true
    }
  }, [renderedHtml])

  return (
    <>
      <SystemHtmlStyles />
      <style>{`
        .preview-sheet[contenteditable]:focus-within { outline: 2px solid hsl(var(--primary)); outline-offset: 4px; border-radius: 8px; }
        @media print {
          body > *:not(.print-target) { display: none !important; }
          .print-target { display: block !important; position: fixed; inset: 0; z-index: 9999; }
          .preview-sheet { box-shadow: none !important; outline: none !important; }
        }
      `}</style>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="preview-sheet bg-white shadow-xl rounded-lg"
        style={{ minHeight: '29.7cm', width: '21cm', maxWidth: '100%', padding: '1cm', cursor: 'text' }}
        spellCheck={false}
      />
    </>
  )
}

function SystemHtmlPreview({ html }: { html: string }) {
  return (
    <>
      <SystemHtmlStyles />
      <div
        className="preview-sheet bg-white shadow-xl rounded-lg"
        style={{ minHeight: '29.7cm', width: '21cm', maxWidth: '100%', padding: '1cm' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  )
}

function SystemHtmlStyles() {
  return (
    <style>{`
      .preview-sheet img { display:block; width:88px; height:88px; object-fit:cover; margin:0 0 16px auto; border:1px solid #111; }
      .preview-sheet h1 { margin:0; font-size:28px; line-height:1.2; font-weight:700; }
      .preview-sheet h2 { margin:18px 0 8px; font-size:14px; line-height:1.3; font-weight:700; text-transform:uppercase; border-bottom:1px solid #111; padding-bottom:4px; }
      .preview-sheet p { margin:0 0 8px; font-size:12px; line-height:1.5; color:#111; white-space:pre-wrap; overflow-wrap:anywhere; }
      .preview-sheet ul { margin:0 0 10px 18px; padding:0; }
      .preview-sheet li { margin:0 0 4px; font-size:12px; line-height:1.5; color:#111; white-space:pre-wrap; overflow-wrap:anywhere; }
    `}</style>
  )
}
