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

      <div className="space-y-3">
        {skills.map((skill, i) => (
          <div key={i} className="flex items-center gap-3">
            {/* Skill name */}
            <input
              type="text"
              value={skill.name}
              onChange={e => setSkill(i, { name: e.target.value })}
              placeholder="e.g. TypeScript"
              className="w-36 flex-shrink-0 px-2.5 py-1.5 text-sm border border-[var(--color-border)]
                         rounded-lg bg-[var(--color-surface)] focus:outline-none
                         focus:ring-2 focus:ring-[var(--color-accent)]/40 transition"
            />

            {/* Proficiency slider */}
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={skill.level}
                onChange={e => setSkill(i, { level: Number(e.target.value) })}
                className="flex-1 h-1.5 rounded-full accent-[var(--color-accent)] cursor-pointer"
              />
              {/* Visual bar */}
              <div className="w-24 h-2 rounded-full bg-[var(--color-surface-hover)] overflow-hidden flex-shrink-0">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-150"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
              <span className="text-xs text-[var(--color-text-muted)] w-8 text-right flex-shrink-0">
                {skill.level}%
              </span>
            </div>

            {skills.length > 1 && (
              <button
                onClick={() => remove(i)}
                className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
