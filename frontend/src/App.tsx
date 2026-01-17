import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import clsx from 'clsx'
import {
  createFile,
  exportHtml,
  listFiles,
  listPlatforms,
  listSnapshots,
  readFile,
  revertSnapshot,
  writeFile,
  wsUrl,
} from './app/api'
import type { AgentState, AgentWsEvent } from './app/agentTypes'
import type { FileInfo, PlatformInfo, SnapshotInfo } from './app/types'
import { useDebouncedValue } from './app/useDebouncedValue'
import { CommandPalette } from './components/CommandPalette'
import { DiffModal } from './components/DiffModal'
import { EditorPane, type EditorApi } from './components/EditorPane'
import { FileTree } from './components/FileTree'
import { PreviewPane } from './components/PreviewPane'
import { SnapshotDrawer } from './components/SnapshotDrawer'
import './styles/app.css'

function App() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([])
  const [activePath, setActivePath] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [dirty, setDirty] = useState(false)
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(() => loadWidth('wn.sidebarWidth', 270, 220, 520))
  const [previewWidth, setPreviewWidth] = useState(() => loadWidth('wn.previewWidth', 420, 320, 900))

  const [platform, setPlatform] = useState<string>('wechat')
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([])

  const [snapshotsOpen, setSnapshotsOpen] = useState(false)
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([])

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteValue, setPaletteValue] = useState('')

  const [diffOpen, setDiffOpen] = useState(false)
  const [agent, setAgent] = useState<AgentState>({ kind: 'idle' })
  const [wsConnected, setWsConnected] = useState(false)

  const editorRef = useRef<EditorApi | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const lastOpenedPathRef = useRef<string>('')
  const saveRef = useRef<(reason: string, actor: 'user' | 'ai') => Promise<void>>(async () => {})

  const debouncedContent = useDebouncedValue(content, 320)
  const wordCount = useMemo(() => {
    const trimmed = content.trim()
    if (!trimmed) return { chars: 0, words: 0 }
    const words = trimmed.split(/\s+/).filter(Boolean).length
    const chars = trimmed.replace(/\s+/g, '').length
    return { chars, words }
  }, [content])

  useEffect(() => {
    void (async () => {
      const [fs, ps] = await Promise.all([listFiles(), listPlatforms()])
      setFiles(fs)
      setPlatforms(ps)
      if (ps.length > 0) setPlatform(ps[0].id)
      const initial = fs[0]?.path
      if (initial) await openFile(initial)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    let retry = 0

    const connect = () => {
      if (cancelled) return
      const ws = new WebSocket(wsUrl('/ws/agent'))
      wsRef.current = ws

      ws.onopen = () => {
        retry = 0
        setWsConnected(true)
      }
      ws.onclose = () => {
        setWsConnected(false)
        if (cancelled) return
        retry = Math.min(retry + 1, 6)
        const delay = 500 * Math.pow(1.6, retry)
        window.setTimeout(connect, delay)
      }
      ws.onerror = () => {
        ws.close()
      }
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data) as AgentWsEvent
          switch (msg.type) {
            case 'log': {
              setAgent((prev) => {
                if (prev.kind === 'streaming' || prev.kind === 'ready') return { ...prev, log: [...prev.log, msg.message] }
                if (prev.kind === 'idle') return { kind: 'streaming', draft: '', instruction: '', log: [msg.message] }
                return prev
              })
              return
            }
            case 'delta': {
              setAgent((prev) => {
                if (prev.kind !== 'streaming') return prev
                return { ...prev, draft: prev.draft + msg.text }
              })
              return
            }
            case 'result': {
              setAgent((prev) => {
                const log = prev.kind === 'streaming' ? prev.log : []
                const instruction = prev.kind === 'streaming' ? prev.instruction : ''
                return {
                  kind: 'ready',
                  diff: msg.diff ?? '',
                  patched: msg.patched_content ?? '',
                  summary: msg.summary ?? 'Done',
                  instruction,
                  log,
                }
              })
              return
            }
            case 'error': {
              setAgent({ kind: 'error', message: msg.message ?? 'Agent error' })
              return
            }
            default:
              return
          }
        } catch {
          // ignore
        }
      }
    }

    connect()
    return () => {
      cancelled = true
      wsRef.current?.close()
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveRef.current('save', 'user')
        return
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false)
        setDiffOpen(false)
        setSnapshotsOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!activePath) return
    void refreshSnapshots(activePath)
  }, [activePath])

  useEffect(() => {
    if (!debouncedContent) {
      setPreviewHtml('')
      setPreviewWarnings([])
      return
    }
    void (async () => {
      const title = guessTitle(debouncedContent) ?? activePath
      const res = await exportHtml({ platform, content: debouncedContent, title })
      setPreviewHtml(res.html)
      setPreviewWarnings(res.warnings ?? [])
    })()
  }, [activePath, debouncedContent, platform])

  async function refreshFiles() {
    const fs = await listFiles()
    setFiles(fs)
  }

  async function refreshSnapshots(path: string) {
    const s = await listSnapshots(path)
    setSnapshots(s.snapshots)
  }

  async function openFile(path: string) {
    if (dirty && activePath && activePath !== path) {
      await save('autosave', 'user')
    }
    const res = await readFile(path)
    setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]))
    lastOpenedPathRef.current = path
    setActivePath(path)
    setContent(res.content)
    setDirty(false)
  }

  async function save(reason: string, actor: 'user' | 'ai') {
    if (!activePath) return
    await writeFile(activePath, { content, reason, actor })
    setDirty(false)
    await refreshFiles()
    await refreshSnapshots(activePath)
  }

  saveRef.current = save

  async function onNewFile() {
    const name = window.prompt('New file name (ends with .md)', 'untitled.md')
    if (!name) return
    await createFile({ path: name, template: `# ${name.replace(/\.md$/i, '')}\n\n` })
    await refreshFiles()
    await openFile(name)
  }

  async function closeTab(pathToClose: string) {
    const idx = openTabs.indexOf(pathToClose)
    const nextPath = activePath === pathToClose ? (openTabs[idx + 1] ?? openTabs[idx - 1] ?? '') : ''

    if (dirty && activePath === pathToClose) {
      await save('autosave', 'user')
    }

    setOpenTabs((prev) => prev.filter((p) => p !== pathToClose))

    if (activePath !== pathToClose) return
    if (nextPath) {
      await openFile(nextPath)
      return
    }
    setActivePath('')
    setContent('')
    setDirty(false)
  }

  function startAgentEdit(instruction: string) {
    if (!activePath) return
    let selection = editorRef.current?.getSelection() ?? { from: 0, to: 0 }
    if (selection.from === selection.to) {
      const cursor = selection.from
      const prevBreak = content.lastIndexOf('\n\n', Math.max(0, cursor - 1))
      const nextBreak = content.indexOf('\n\n', cursor)
      const from = prevBreak === -1 ? 0 : prevBreak + 2
      const to = nextBreak === -1 ? content.length : nextBreak
      selection = { from, to }
    }
    const payload = {
      type: 'edit',
      request: {
        path: activePath,
        content,
        selection,
        instruction,
      },
    }
    setAgent({ kind: 'streaming', draft: '', instruction, log: [] })
    setDiffOpen(true)
    wsRef.current?.send(JSON.stringify(payload))
  }

  async function applyAgentEdit() {
    if (agent.kind !== 'ready') return
    setContent(agent.patched)
    setDirty(false)
    setDiffOpen(false)
    await writeFile(activePath, { content: agent.patched, reason: `ai:${agent.instruction}`, actor: 'ai' })
    await refreshFiles()
    await refreshSnapshots(activePath)
  }

  async function onRevert(snapshotId: string) {
    if (!activePath) return
    await revertSnapshot({ path: activePath, snapshot_id: snapshotId })
    await openFile(activePath)
    await refreshSnapshots(activePath)
    setSnapshotsOpen(false)
  }

  const statusLabel = useMemo(() => {
    if (!activePath) return 'No file'
    if (!dirty) return 'Saved'
    return 'Unsaved'
  }, [activePath, dirty])

  function beginResize(kind: 'sidebar' | 'preview', e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()

    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)

    const startX = e.clientX
    const startSidebar = sidebarWidth
    const startPreview = previewWidth
    let latestSidebar = startSidebar
    let latestPreview = startPreview

    const prevCursor = document.body.style.cursor
    const prevUserSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev: PointerEvent) => {
      if (kind === 'sidebar') {
        const next = clamp(startSidebar + (ev.clientX - startX), 220, 520)
        latestSidebar = next
        setSidebarWidth(next)
      } else {
        const next = clamp(startPreview - (ev.clientX - startX), 320, 900)
        latestPreview = next
        setPreviewWidth(next)
      }
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.cursor = prevCursor
      document.body.style.userSelect = prevUserSelect

      if (kind === 'sidebar') localStorage.setItem('wn.sidebarWidth', String(latestSidebar))
      else localStorage.setItem('wn.previewWidth', String(latestPreview))
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div className="wnShell">
      <header className="wnTopbar">
        <div className="wnBrand">
          <div className="wnBrandText">
            <div className="wnBrandName">WriteNow</div>
            <div className="wnBrandSub">Writer IDE • Agent</div>
          </div>
        </div>

        <div className="wnTopActions">
          <button
            className="wnBtn wnBtn--ghost"
            onClick={() => {
              setPaletteOpen(true)
              editorRef.current?.focus()
            }}
            title="Command Palette (Ctrl/Cmd+K)"
          >
            Cmd
          </button>

          <div className="wnSelect">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className={clsx('wnBtn', dirty ? 'wnBtn--primary' : 'wnBtn--ghost')}
            onClick={() => void save('save', 'user')}
            disabled={!activePath}
            title="Save (Ctrl/Cmd+S)"
          >
            Save
          </button>
        </div>
      </header>

      <div className="wnBody">
        <aside className="wnActivity" aria-label="Activity Bar">
          <button
            className={clsx('wnActBtn', sidebarOpen && 'wnActBtn--active')}
            onClick={() => setSidebarOpen((v) => !v)}
            title="Explorer"
            aria-label="Explorer"
          >
            <IconExplorer />
          </button>
          <button className="wnActBtn" onClick={() => setSnapshotsOpen(true)} title="Timeline" aria-label="Timeline">
            <IconClock />
          </button>
          <button
            className={clsx('wnActBtn', previewOpen && 'wnActBtn--active')}
            onClick={() => setPreviewOpen((v) => !v)}
            title="Preview"
            aria-label="Preview"
          >
            <IconPreview />
          </button>
          <div className="wnActSpacer" />
          <button
            className="wnActBtn"
            onClick={() => {
              setPaletteOpen(true)
              editorRef.current?.focus()
            }}
            title="Command Palette (Ctrl/Cmd+K)"
            aria-label="Command Palette"
          >
            <IconCmd />
          </button>
        </aside>

        {sidebarOpen && (
        <aside className="wnSidebar" style={{ width: sidebarWidth }}>
          <div className="wnSidebarHeader">
            <div className="wnSidebarTitle">Explorer</div>
            <div className="wnSidebarActions" aria-label="Explorer Actions">
              <button className="wnIconBtn" onClick={() => void refreshFiles()} title="Refresh">
                <IconRefresh />
              </button>
              <button className="wnIconBtn" onClick={() => void onNewFile()} title="New File">
                <IconNewFile />
              </button>
            </div>
          </div>
          <FileTree files={files} activePath={activePath} onOpen={(p) => void openFile(p)} />
          <div className="wnSidebarHint">
            <kbd>Ctrl</kbd>+<kbd>K</kbd> edit selection · <kbd>Ctrl</kbd>+<kbd>S</kbd> save
          </div>
        </aside>
        )}

        {sidebarOpen && (
          <div
            className="wnResizeHandle"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            onPointerDown={(e) => beginResize('sidebar', e)}
            onDoubleClick={() => {
              const next = 270
              setSidebarWidth(next)
              localStorage.setItem('wn.sidebarWidth', String(next))
            }}
          />
        )}

        <main className="wnMain">
          <div className="wnEditorFrame">
            <div className="wnTabsBar" role="tablist" aria-label="Open Editors">
              <div className="wnTabs">
                {openTabs.length === 0 && <div className="wnTabsEmpty">No file</div>}
                {openTabs.map((p) => (
                  <div key={p} className={clsx('wnTab', p === activePath && 'wnTab--active')} role="tab">
                    <button
                      className="wnTabBtn"
                      onClick={() => void openFile(p)}
                      title={p}
                      aria-current={p === activePath ? 'page' : undefined}
                    >
                      <span className="wnTabName">{basename(p)}</span>
                      {dirty && p === activePath && <span className="wnTabDirty" aria-label="Unsaved">●</span>}
                    </button>
                    <button className="wnTabClose" onClick={() => void closeTab(p)} aria-label="Close">
                      <IconClose />
                    </button>
                  </div>
                ))}
              </div>
              <div className="wnTabsRight">
                <span className={clsx('wnConn', wsConnected ? 'wnConn--ok' : 'wnConn--off')}>
                  {wsConnected ? 'Agent' : 'Agent Off'}
                </span>
                <span className={clsx('wnConn', dirty ? 'wnConn--warn' : 'wnConn--dim')}>{statusLabel}</span>
              </div>
            </div>
            <EditorPane
              key={activePath || 'empty'}
              value={content}
              onChange={(v) => {
                setContent(v)
                setDirty(true)
              }}
              onReady={(api) => {
                editorRef.current = api
              }}
            />
          </div>
        </main>

        {previewOpen && (
          <div
            className="wnResizeHandle"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize preview"
            onPointerDown={(e) => beginResize('preview', e)}
            onDoubleClick={() => {
              const next = 420
              setPreviewWidth(next)
              localStorage.setItem('wn.previewWidth', String(next))
            }}
          />
        )}

        {previewOpen && (
          <aside className="wnPreview" style={{ width: previewWidth }}>
            <PreviewPane
              html={previewHtml}
              warnings={previewWarnings}
              filenameHint={activePath ? `${activePath.replace(/\.md$/i, '')}-${platform}.html` : `export-${platform}.html`}
            />
          </aside>
        )}
      </div>

      <footer className="wnStatus">
        <div className="wnStatusLeft">
          <span className={clsx('wnStatusDot', wsConnected ? 'wnStatusDot--ok' : 'wnStatusDot--off')} aria-hidden="true" />
          <span className="wnStatusText">
            {wordCount.chars} chars · {wordCount.words} words · {dirty ? 'Unsaved' : 'Saved'}
          </span>
        </div>
        <div className="wnStatusRight">
          <span className="wnStatusMeta">API: {new URL(wsUrl('/ws/agent')).host}</span>
        </div>
      </footer>

      <CommandPalette
        open={paletteOpen}
        value={paletteValue}
        setValue={setPaletteValue}
        onClose={() => setPaletteOpen(false)}
        onSubmit={(instruction) => {
          setPaletteOpen(false)
          setPaletteValue('')
          startAgentEdit(instruction)
        }}
      />

      <DiffModal
        open={diffOpen}
        agent={agent}
        onClose={() => {
          setDiffOpen(false)
          if (agent.kind === 'streaming') setAgent({ kind: 'idle' })
        }}
        onApply={() => void applyAgentEdit()}
      />

      <SnapshotDrawer
        open={snapshotsOpen}
        path={activePath}
        snapshots={snapshots}
        onClose={() => setSnapshotsOpen(false)}
        onRevert={(id) => void onRevert(id)}
      />
    </div>
  )
}

function guessTitle(markdown: string): string | null {
  const m = markdown.match(/^#\s+(.+)\s*$/m)
  return m?.[1]?.trim() ?? null
}

function basename(p: string) {
  return p.split('/').pop() || p
}

function loadWidth(key: string, fallback: number, min: number, max: number) {
  try {
    const v = Number(localStorage.getItem(key))
    if (!Number.isFinite(v)) return fallback
    return clamp(v, min, max)
  } catch {
    return fallback
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function IconExplorer() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 6.2C4 5.54 4.54 5 5.2 5h4.2l1.4 1.6H18.8c.66 0 1.2.54 1.2 1.2v9.8c0 .66-.54 1.2-1.2 1.2H5.2c-.66 0-1.2-.54-1.2-1.2V6.2Zm2 .8v9.6h12V8.4h-7.8l-1.4-1.6H6Z"
      />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16a8 8 0 0 1 0-16Zm-1 3h2v6l4 2l-1 1.7l-5-2.7V7Z"
      />
    </svg>
  )
}

function IconPreview() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 6.5C3 5.12 4.12 4 5.5 4h13C19.88 4 21 5.12 21 6.5v11c0 1.38-1.12 2.5-2.5 2.5h-13C4.12 20 3 18.88 3 17.5v-11Zm2 .5v10.5c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5V7c0-.28-.22-.5-.5-.5h-13c-.28 0-.5.22-.5.5Zm3.5 1.5h7v2h-7v-2Zm0 4h10v2h-10v-2Z"
      />
    </svg>
  )
}

function IconCmd() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 4a3 3 0 0 0 0 6h1v4H7a3 3 0 1 0 3 3v-1h4v1a3 3 0 1 0 3-3h-1v-4h1a3 3 0 1 0-3-3v1h-4V7a3 3 0 0 0-3-3Zm0 2a1 1 0 0 1 1 1v1H7a1 1 0 0 1 0-2Zm9 0a1 1 0 0 1 1 1v1h-1V7a1 1 0 0 1 1-1ZM10 10h4v4h-4v-4Zm-3 6h1v1a1 1 0 1 1-1-1Zm10 0a1 1 0 1 1-1 1v-1h1Z"
      />
    </svg>
  )
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

function IconRefresh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.75 6h-2.1A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z"
      />
    </svg>
  )
}

function IconNewFile() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 7V3.5L19.5 9H15Zm-4 2h2v3h3v2h-3v3h-2v-3H8v-2h3v-3Z"
      />
    </svg>
  )
}

export default App
