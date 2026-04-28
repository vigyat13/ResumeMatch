'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Download, Loader2, ChevronLeft, FileText, Code2,
  Edit3, Copy, Check, Sparkles, RefreshCw, ImagePlus, X, AlertCircle,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { BuilderForm }  from './BuilderForm'
import { SkillsEditor } from './SkillsEditor'
import { LivePreview }  from './LivePreview'
import { AuthModal }    from './AuthModal'
import { DEFAULT_RESUME_DATA } from '@/lib/builder/types'
import type { ResumeData } from '@/lib/builder/types'
import { createClient } from '@/lib/supabase/client'
import { renderTemplate } from '@/lib/builder/render'
import { generateLatex } from '@/lib/builder/latex'
import { parseLatex }    from '@/lib/builder/parseLatex'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const DRAFT_KEY = 'resumematch-builder-draft'
type Tab = 'form' | 'direct' | 'latex'

interface UploadedImage { name: string; dataUrl: string }

interface Props {
  templateId:   string
  templateName: string
  templateHtml: string
  templateCss:  string
}

export function BuilderEditor({ templateId, templateName, templateHtml, templateCss }: Props) {
  const [data, setData]                 = useState<ResumeData>(DEFAULT_RESUME_DATA)
  const [tab, setTab]                   = useState<Tab>('form')
  const [showAuth, setShowAuth]         = useState(false)
  const [saving, setSaving]             = useState(false)
  const [isLoggedIn, setIsLoggedIn]     = useState(false)
  const [copied, setCopied]             = useState(false)

  // LaTeX editor state
  const [editedLatex, setEditedLatex]         = useState<string | null>(null)
  const [recompiling, setRecompiling]         = useState(false)
  const [recompileError, setRecompileError]   = useState<string | null>(null)
  const [uploadedImages, setUploadedImages]   = useState<UploadedImage[]>([])
  const monacoRef                             = useRef<Parameters<NonNullable<React.ComponentProps<typeof MonacoEditor>['onMount']>>[0] | null>(null)
  const imageInputRef                         = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) { try { setData(JSON.parse(saved)) } catch {} }
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(data)), 500)
    return () => clearTimeout(t)
  }, [data])

  const latexCode    = useMemo(() => generateLatex(data), [data])
  const renderedHtml = useMemo(() => renderTemplate(templateHtml, data), [templateHtml, data])

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
    await saveAndPrint()
  }

  async function saveAndPrint() {
    setSaving(true)
    try {
      await fetch('/api/v1/builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: data, templateId }),
      })
    } catch { /* non-fatal */ }
    finally { setSaving(false) }
    window.print()
  }

  async function onAuthSuccess() {
    setShowAuth(false)
    setIsLoggedIn(true)
    await saveAndPrint()
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

      {/* ── Single unified top bar ───────────────────────────── */}
      <header className="print:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-13 px-4 gap-3">

          {/* Logo */}
          <Link href="/builder" className="flex items-center gap-1.5 font-bold text-base flex-shrink-0">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-foreground">Resume</span>
            <span className="text-primary">Match</span>
          </Link>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
            <span>/</span>
            <Link href="/builder" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />Templates
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[120px]">{templateName}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Tab switcher */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1">
            <TabBtn active={tab === 'form'}   onClick={() => setTab('form')}
              icon={<FileText className="w-3.5 h-3.5" />} label="Form" />
            <TabBtn active={tab === 'direct'} onClick={() => setTab('direct')}
              icon={<Edit3 className="w-3.5 h-3.5" />}    label="Canvas" />
            <TabBtn active={tab === 'latex'}  onClick={() => setTab('latex')}
              icon={<Code2 className="w-3.5 h-3.5" />}    label="LaTeX" />
          </div>

          {/* LaTeX actions (visible only on LaTeX tab) */}
          {tab === 'latex' && (
            <div className="flex items-center gap-1.5">
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

          {/* Download PDF */}
          <button
            onClick={handleDownload}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg
                       text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Download PDF'}
          </button>
        </div>
      </header>

      {/* ── Tab: Form ──────────────────────────────────────── */}
      {tab === 'form' && (
        <div className="print:hidden flex h-[calc(100vh-53px)]">
          {/* Left panel — form */}
          <div className="w-[400px] flex-shrink-0 overflow-y-auto border-r border-border bg-card px-5 py-5">
            <BuilderForm data={data} onChange={setData} />
            <div className="mt-6 pt-6 border-t border-border">
              <SkillsEditor skills={data.skills} onChange={skills => setData(d => ({ ...d, skills }))} />
            </div>
          </div>
          {/* Right panel — live preview */}
          <div className="flex-1 overflow-auto bg-muted/40 px-8 py-8 flex justify-center print:p-0 print:bg-white">
            <div className="print-target">
              <LivePreview templateHtml={templateHtml} templateCss={templateCss} data={data} />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Canvas (direct edit) ───────────────────────── */}
      {tab === 'direct' && (
        <div className="flex flex-col items-center px-8 py-6 gap-4 min-h-[calc(100vh-53px)] bg-muted/40">
          <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg max-w-xl text-center">
            Click anywhere on the resume to edit text directly. Changes here are independent from the Form tab.
          </p>
          <div className="print-target">
            <DirectEditPreview renderedHtml={renderedHtml} templateCss={templateCss} />
          </div>
        </div>
      )}

      {/* ── Tab: LaTeX — Overleaf-style split ──────────────── */}
      {tab === 'latex' && (
        <div className="flex h-[calc(100vh-53px)]">

          {/* Left: Monaco + image panel */}
          <div className="flex-1 flex flex-col border-r border-border" style={{ minWidth: 0 }}>

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
          <div className="flex-1 flex flex-col bg-muted/40" style={{ minWidth: 0 }}>

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

            {/* Preview — shows HTML template rendered from parsed data */}
            <div className="flex-1 overflow-auto px-6 py-6 flex justify-center">
              <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '21cm' }}>
                <LivePreview
                  templateHtml={templateHtml}
                  templateCss={templateCss}
                  data={data}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print target */}
      <div className="hidden print:block print-target">
        <LivePreview templateHtml={templateHtml} templateCss={templateCss} data={data} />
      </div>
    </>
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

function DirectEditPreview({ renderedHtml, templateCss }: { renderedHtml: string; templateCss: string }) {
  const ref    = useRef<HTMLDivElement>(null)
  const inited = useRef(false)

  useEffect(() => {
    if (ref.current && !inited.current) {
      ref.current.innerHTML = renderedHtml
      inited.current = true
    }
  }, [renderedHtml])

  const scopedCss = templateCss
    .replace(/body\s*\{/g, '.preview-sheet {')
    .replace(/\.resume\s*\{/g, '.preview-sheet .resume {')

  return (
    <>
      <style>{scopedCss}</style>
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
