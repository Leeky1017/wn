import clsx from 'clsx'
import { useI18n } from '../../i18n/state'

export type EditorFormat = 'markdown' | 'rich'

export function FormatToolbar(props: {
  format: EditorFormat
  setFormat: (format: EditorFormat) => void
  onBold: () => void
  onItalic: () => void
  onUnderline: () => void
}) {
  const { dict } = useI18n()

  return (
    <div className="format-toolbar" aria-label="Format toolbar">
      <button className="toolbar-btn" onClick={props.onBold} type="button" style={{ fontWeight: 800 }}>
        B
      </button>
      <button className="toolbar-btn" onClick={props.onItalic} type="button" style={{ fontStyle: 'italic' }}>
        I
      </button>
      <button
        className="toolbar-btn"
        onClick={props.onUnderline}
        type="button"
        style={{ textDecoration: 'underline' }}
      >
        U
      </button>

      <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

      <button
        className={clsx('toolbar-btn', props.format === 'markdown' && 'active')}
        onClick={() => props.setFormat('markdown')}
        type="button"
      >
        Markdown
      </button>
      <button
        className={clsx('toolbar-btn', props.format === 'rich' && 'active')}
        onClick={() => props.setFormat('rich')}
        type="button"
      >
        Word (Rich)
      </button>

      <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-inc)' }}>{dict.fmtHint}</div>
    </div>
  )
}
