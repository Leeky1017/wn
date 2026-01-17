import { useEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'
import './commandPalette.css'

export function CommandPalette(props: {
  open: boolean
  value: string
  setValue: (v: string) => void
  onClose: () => void
  onSubmit: (instruction: string) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const suggestions = useMemo(
    () => [
      { title: '口语化', value: '把这段改得更口语化、更自然。' },
      { title: '扩写', value: '把这段扩写到约 500 字，并补充 2 个具体例子。' },
      { title: '重组结构', value: '重组这段逻辑：先给结论，再给论据，最后给行动建议。' },
      { title: '压缩', value: '把这段压缩成 3 句更有力度的表达，保留关键信息。' },
      { title: '更克制', value: '把语气改得更克制、客观，像公众号/知乎的理性写法。' },
    ],
    [],
  )

  useEffect(() => {
    if (!props.open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(t)
  }, [props.open])

  if (!props.open) return null

  return (
    <div
      className="wnPaletteOverlay"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose()
      }}
    >
      <div className="wnPaletteCard">
        <div className="wnPaletteHeader">
          <div className="wnPaletteTitle">命令面板</div>
          <div className="wnPaletteKbd">
            <kbd>Esc</kbd> 关闭
          </div>
        </div>

        <div className="wnPaletteInputWrap">
          <input
            ref={inputRef}
            className="wnPaletteInput"
            value={props.value}
            placeholder="输入对选中内容的指令…"
            onChange={(e) => props.setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') props.onClose()
              if (e.key === 'Enter') {
                const v = props.value.trim()
                if (!v) return
                props.onSubmit(v)
              }
            }}
          />
          <div className="wnPaletteHint">Enter 运行 · 只会修改选中内容</div>
        </div>

        <div className="wnPaletteList" role="listbox" aria-label="Suggestions">
          {suggestions.map((s) => (
            <button
              key={s.title}
              className={clsx('wnPaletteItem', props.value === s.value && 'wnPaletteItem--active')}
              onClick={() => props.setValue(s.value)}
              type="button"
              role="option"
              aria-selected={props.value === s.value}
            >
              <div className="wnPaletteItemTitle">{s.title}</div>
              <div className="wnPaletteItemSub">{s.value}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
