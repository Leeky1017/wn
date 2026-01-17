import clsx from 'clsx'
import type { FileInfo } from '../app/types'
import './fileTree.css'

export function FileTree(props: {
  files: FileInfo[]
  activePath: string
  onOpen: (path: string) => void
}) {
  return (
    <div className="wnTree">
      <div className="wnTreeList" role="list">
        {props.files.length === 0 && <div className="wnTreeEmpty">No files</div>}
        {props.files.map((f) => (
          <button
            key={f.path}
            className={clsx('wnTreeItem', f.path === props.activePath && 'wnTreeItem--active')}
            onClick={() => props.onOpen(f.path)}
            role="listitem"
          >
            <span className="wnTreeIcon" aria-hidden="true">
              <IconMarkdown />
            </span>
            <span className="wnTreeName">{f.path}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function IconMarkdown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 7V3.5L19.5 9H15Zm-9 8.2v-5h1.6l1.4 2.1l1.4-2.1H12v5h-1.3v-3l-1.4 2.1l-1.4-2.1v3H6.0Zm8.7 0l-2-2v-3h1.3v2.4l.7.7l.7-.7v-2.4H17v3l-2 2Z"
      />
    </svg>
  )
}
