'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { TailorWizard } from './TailorWizard'

export function TailorButton() {
  const [show, setShow] = useState(false)

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition-colors shadow-sm"
      >
        <Wand2 className="w-4 h-4" />
        AI Tailor Resume
      </button>

      <TailorWizard isOpen={show} onClose={() => setShow(false)} />
    </>
  )
}
