import { useEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'
import type { Skill } from '../app/skills'
import './skillPalette.css'

export function SkillPalette(props: {
  open: boolean
  value: string
  setValue: (v: string) => void
  skills: Skill[]
  onClose: () => void
  onRunInstruction: (instruction: string) => void
  onRunSkill: (skill: Skill) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const filtered = useMemo(() => {
    const q = props.value.trim().toLowerCase()
    if (!q) return props.skills
    return props.skills.filter((s) => `${s.name} ${s.tag} ${s.description}`.toLowerCase().includes(q))
  }, [props.skills, props.value])

  useEffect(() => {
    if (!props.open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(t)
  }, [props.open])

  if (!props.open) return null

  return (
    <div
      className="wnPaletteOverlay2"
      role="dialog"
      aria-modal="true"
      aria-label="Skill Palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose()
      }}
    >
      <div className="wnPaletteCard2">
        <div className="wnPaletteHeader2">
          <div className="wnPaletteTitle2">Command</div>
          <div className="wnPaletteKbd2">
            <kbd>Esc</kbd> Close
          </div>
        </div>

        <div className="wnPaletteInputWrap2">
          <input
            ref={inputRef}
            className="wnPaletteInput2"
            value={props.value}
            placeholder="Type a command, or search Skills…"
            onChange={(e) => props.setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') props.onClose()
              if (e.key === 'Enter') {
                const v = props.value.trim()
                if (!v) return
                props.onRunInstruction(v)
              }
            }}
          />
          <div className="wnPaletteHint2">Enter runs on selection · click a Skill to run</div>
        </div>

        <div className="wnPaletteList2" role="listbox" aria-label="Skills">
          {filtered.map((s) => (
            <button
              key={s.id}
              className={clsx('wnPaletteItem2', props.value === s.name && 'wnPaletteItem2--active')}
              onClick={() => props.onRunSkill(s)}
              type="button"
              role="option"
            >
              <div className="wnPaletteItemTitle2">
                {s.name} <span className="wnPaletteTag2">{s.tag}</span>
              </div>
              <div className="wnPaletteItemSub2">{s.description}</div>
            </button>
          ))}

          {filtered.length === 0 && <div className="wnPaletteEmpty2">No matches</div>}
        </div>
      </div>
    </div>
  )
}

