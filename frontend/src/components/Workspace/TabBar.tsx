import clsx from 'clsx'

export function TabBar(props: {
  tabs: string[]
  activePath: string
  onSelect: (path: string) => void
  onClose: (path: string) => void
}) {
  return (
    <div className="tab-bar" role="tablist" aria-label="Open Documents">
      {props.tabs.map((p) => (
        <div
          key={p}
          className={clsx('tab', p === props.activePath && 'active')}
          role="tab"
          aria-selected={p === props.activePath}
          title={p}
        >
          <button
            onClick={() => props.onSelect(p)}
            type="button"
            style={{ border: 0, background: 'transparent', padding: 0, flex: 1, textAlign: 'left', cursor: 'pointer' }}
          >
            {basename(p)}
          </button>
          <button className="tab-close" onClick={() => props.onClose(p)} type="button" aria-label="Close tab">
            <IconClose />
          </button>
        </div>
      ))}
      {props.tabs.length === 0 && <div className="tab" style={{ opacity: 0.6 }}>No file</div>}
    </div>
  )
}

function basename(p: string) {
  return p.split('/').pop() || p
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.3 5.7L12 12l6.3 6.3l-1.4 1.4L10.6 13.4L4.3 19.7L2.9 18.3L9.2 12L2.9 5.7L4.3 4.3l6.3 6.3l6.3-6.3l1.4 1.4Z"
      />
    </svg>
  )
}
