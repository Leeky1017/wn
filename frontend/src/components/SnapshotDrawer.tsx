import type { SnapshotInfo } from '../app/types'
import './snapshotDrawer.css'

export function SnapshotDrawer(props: {
  open: boolean
  path: string
  snapshots: SnapshotInfo[]
  onClose: () => void
  onRevert: (snapshotId: string) => void
}) {
  if (!props.open) return null

  return (
    <div
      className="wnSnapOverlay"
      role="dialog"
      aria-modal="true"
      aria-label="Timeline"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose()
      }}
    >
      <div className="wnSnapDrawer">
        <div className="wnSnapHeader">
          <div className="wnSnapTitle">Timeline</div>
          <button className="wnBtn wnBtn--ghost" onClick={props.onClose}>
            Close
          </button>
        </div>

        <div className="wnSnapPath">{props.path || '—'}</div>

        <div className="wnSnapList">
          {props.snapshots.length === 0 && <div className="wnSnapEmpty">No snapshots</div>}
          {props.snapshots.map((s) => (
            <div key={s.id} className="wnSnapItem">
              <div className="wnSnapMeta">
                <div className="wnSnapTime">{formatTime(s.created_at)}</div>
                <div className="wnSnapReason">
                  <span className="wnSnapActor">{s.actor}</span> · {s.reason}
                </div>
              </div>
              <div className="wnSnapActions">
                <button className="wnBtn wnBtn--tiny" onClick={() => props.onRevert(s.id)}>
                  Revert
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}
