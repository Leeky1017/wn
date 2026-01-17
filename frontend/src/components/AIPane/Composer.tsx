import { useI18n } from '../../i18n/state'

export function Composer(props: {
  value: string
  onChange: (v: string) => void
  onRun: () => void
  disabled?: boolean
}) {
  const { dict } = useI18n()

  return (
    <div className="composer-input-area">
      <textarea
        className="composer-textarea"
        value={props.value}
        placeholder={dict.composerPlaceholder}
        rows={3}
        onChange={(e) => props.onChange(e.target.value)}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-inc)' }}>{dict.composerHint}</span>
        <button className="btn-primary-studio" onClick={props.onRun} disabled={props.disabled} type="button">
          {dict.run}
        </button>
      </div>
    </div>
  )
}
