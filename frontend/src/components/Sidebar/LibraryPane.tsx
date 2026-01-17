import clsx from 'clsx'
import type { FileInfo } from '../../app/types'
import { useI18n } from '../../i18n/state'

export function LibraryPane(props: { files: FileInfo[]; activePath: string; onOpen: (path: string) => void }) {
  const { dict } = useI18n()
  const sorted = [...props.files].sort((a, b) => b.updated_at.localeCompare(a.updated_at))

  return (
    <>
      <div className="sidebar-header">{dict.sidebarHead}</div>
      {sorted.map((f) => (
        <button
          key={f.path}
          className={clsx('nav-item', f.path === props.activePath && 'active')}
          onClick={() => props.onOpen(f.path)}
          type="button"
          title={f.path}
        >
          {basename(f.path)}
        </button>
      ))}

      <div className="sidebar-header">{dict.sidebarSec}</div>
      <div className="nav-item" aria-disabled="true">
        AI Revolution 2026
      </div>
    </>
  )
}

function basename(p: string) {
  return p.split('/').pop() || p
}
