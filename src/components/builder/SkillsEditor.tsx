'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { SkillEntry } from '@/lib/builder/types'

interface Props {
  skills:   SkillEntry[]
  onChange: (skills: SkillEntry[]) => void
}

export function SkillsEditor({ skills, onChange }: Props) {
  const setSkill = (i: number, patch: Partial<SkillEntry>) =>
    onChange(skills.map((s, idx) => idx === i ? { ...s, ...patch } : s))

  const add = () => onChange([...skills, { name: '', level: 75 }])

  const remove = (i: number) => onChange(skills.filter((_, idx) => idx !== i))

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
          Skills
        </h3>
        <button
          onClick={add}
          className="flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:opacity-80 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> Add skill
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill, i) => (
          <div key={i} className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-2.5 pr-1 py-1">
            <input
              type="text"
              value={skill.name}
              onChange={e => setSkill(i, { name: e.target.value })}
              placeholder="Skill"
              className="w-28 text-sm bg-transparent focus:outline-none text-[var(--color-text-primary)]"
            />
            {skills.length > 1 && (
              <button
                onClick={() => remove(i)}
                className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors p-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
