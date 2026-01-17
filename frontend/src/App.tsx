import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { createFile, exportHtml, generateStoryMap, listFiles, listPlatforms, readFile, writeFile, wsUrl } from './app/api'
import type { AgentState, AgentWsEvent } from './app/agentTypes'
import { loadSkills, saveSkills, type Skill } from './app/skills'
import type { FileInfo } from './app/types'
import { useDebouncedValue } from './app/useDebouncedValue'
import { ActivityBar, type ActivityKey } from './components/ActivityBar'
import { DiffModal } from './components/DiffModal'
import { Composer } from './components/AIPane/Composer'
import { SkillsPanel } from './components/AIPane/SkillsPanel'
import { SkillPalette } from './components/SkillPalette'
import { LibraryPane } from './components/Sidebar/LibraryPane'
import { StoryMap, type StoryMapNode } from './components/Sidebar/StoryMap'
import { EditorCanvas, type EditorApi } from './components/Workspace/EditorCanvas'
import { ExportModal } from './components/Workspace/ExportModal'
import { FormatToolbar, type EditorFormat } from './components/Workspace/FormatToolbar'
import { PreviewPane } from './components/Workspace/PreviewPane'
import { StatusBar } from './components/Workspace/StatusBar'
import { TabBar } from './components/Workspace/TabBar'
import { I18nProvider } from './i18n/context'
import { useI18n } from './i18n/state'

function StudioApp() {
  const { dict, lang } = useI18n()

  const [activity, setActivity] = useState<ActivityKey>('library')
  const [files, setFiles] = useState<FileInfo[]>([])
  const [platforms, setPlatforms] = useState<{ id: string; name: string }[]>([])
  const [platform, setPlatform] = useState<string>('wechat')

  const [activePath, setActivePath] = useState<string>('')
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [content, setContent] = useState<string>('')
  const [dirty, setDirty] = useState(false)

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [editorFormat, setEditorFormat] = useState<EditorFormat>('markdown')
  const [previewHtml, setPreviewHtml] = useState<string>('')

  const [composer, setComposer] = useState<string>('')
  const [skills, setSkills] = useState<Skill[]>(() => seedSkills('zh'))

  const [storyMapNodes, setStoryMapNodes] = useState<StoryMapNode[]>(() => seedStoryMapNodes('zh'))
  const [storyMapLoading, setStoryMapLoading] = useState(false)

  const [exportOpen, setExportOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteValue, setPaletteValue] = useState('')

  const [diffOpen, setDiffOpen] = useState(false)
  const [agent, setAgent] = useState<AgentState>({ kind: 'idle' })
  const [wsConnected, setWsConnected] = useState(false)

  const editorRef = useRef<EditorApi | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const saveRef = useRef<(reason: string, actor: 'user' | 'ai') => Promise<void>>(async () => {})
  const newFileRef = useRef<() => void>(() => {})
  const openPaletteRef = useRef<() => void>(() => {})

  const debouncedContent = useDebouncedValue(content, 320)

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
    void (async () => {
      const stored = await loadSkills()
      setSkills(stored ?? seedSkills(lang))
    })()
    setStoryMapNodes(seedStoryMapNodes(lang))
  }, [lang])

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
      ws.onerror = () => ws.close()
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
              setAgent((prev) => (prev.kind === 'streaming' ? { ...prev, draft: prev.draft + msg.text } : prev))
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
    openPaletteRef.current = () => setPaletteOpen(true)
    const off = window.writenow?.onAction?.((action) => {
      switch (action) {
        case 'save':
          void saveRef.current('save', 'user')
          return
        case 'newFile':
          newFileRef.current()
          return
        case 'commandPalette':
          openPaletteRef.current()
          return
        default:
          return
      }
    })
    return () => off?.()
  }, [])

  useEffect(() => {
    if (!debouncedContent) {
      setPreviewHtml('')
      return
    }
    void (async () => {
      const title = guessTitle(debouncedContent) ?? activePath
      const res = await exportHtml({ platform: platform as never, content: debouncedContent, title })
      setPreviewHtml(res.html)
    })()
  }, [activePath, debouncedContent, platform])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveRef.current('save', 'user')
        return
      }
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (e.key === 'Escape') {
        setDiffOpen(false)
        setExportOpen(false)
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function refreshFiles() {
    const fs = await listFiles()
    setFiles(fs)
  }

  async function openFile(path: string) {
    if (dirty && activePath && activePath !== path) {
      await save('autosave', 'user')
    }
    const res = await readFile(path)
    setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]))
    setActivePath(path)
    setContent(res.content)
    setDirty(false)
  }

  async function save(reason: string, actor: 'user' | 'ai') {
    if (!activePath) return
    await writeFile(activePath, { content, reason, actor })
    setDirty(false)
    await refreshFiles()
  }

  saveRef.current = save
  newFileRef.current = () => void onNewFile()

  async function onNewFile() {
    const name = window.prompt('New file name (ends with .md)', 'untitled.md')
    if (!name) return
    await createFile({ path: name, template: `# ${name.replace(/\\.md$/i, '')}\\n\\n` })
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

  function startAgent(instruction: string) {
    if (!activePath) return
    const v = instruction.trim()
    if (!v) return

    let selection = editorRef.current?.getSelection() ?? { from: 0, to: 0 }
    if (selection.from === selection.to) {
      const cursor = selection.from
      const prevBreak = content.lastIndexOf('\\n\\n', Math.max(0, cursor - 1))
      const nextBreak = content.indexOf('\\n\\n', cursor)
      const from = prevBreak === -1 ? 0 : prevBreak + 2
      const to = nextBreak === -1 ? content.length : nextBreak
      selection = { from, to }
    }

    setAgent({ kind: 'streaming', draft: '', instruction: v, log: [] })
    setDiffOpen(true)
    wsRef.current?.send(
      JSON.stringify({
        type: 'edit',
        request: { path: activePath, content, selection, instruction: v },
      }),
    )
  }

  async function applyAgentEdit() {
    if (agent.kind !== 'ready') return
    setContent(agent.patched)
    setDirty(false)
    setDiffOpen(false)
    await writeFile(activePath, { content: agent.patched, reason: `ai:${agent.instruction}`, actor: 'ai' })
    await refreshFiles()
  }

  async function regenerateStoryMap() {
    setStoryMapLoading(true)
    try {
      const res = await generateStoryMap({ content, lang })
      setStoryMapNodes(res.nodes)
    } finally {
      setStoryMapLoading(false)
    }
  }

  const counts = useMemo(() => computeCounts(content, lang), [content, lang])
  const statusLeft = `${counts.countLabel} · ${counts.readLabel}`
  const statusRight = activePath ? `${dict.format}` : ''

  return (
    <div className="studio-container">
      <ActivityBar active={activity} onSelect={setActivity} />

      <aside className="sidebar" aria-label="Sidebar">
        {activity === 'library' && <LibraryPane files={files} activePath={activePath} onOpen={(p) => void openFile(p)} />}
        {activity === 'map' && <StoryMap nodes={storyMapNodes} onRegenerate={() => void regenerateStoryMap()} loading={storyMapLoading} />}
        {activity === 'search' && (
          <>
            <div className="sidebar-header">Search</div>
            <div className="nav-item" aria-disabled="true">
              (Coming soon)
            </div>
          </>
        )}
        {activity === 'settings' && (
          <>
            <div className="sidebar-header">Settings</div>
            <button className="nav-item" onClick={() => void onNewFile()} type="button">
              + New Draft
            </button>
            <div className="nav-item" aria-disabled="true">
              Agent: {wsConnected ? 'On' : 'Off'}
            </div>
          </>
        )}
      </aside>

      <main className="workspace">
        <TabBar tabs={openTabs} activePath={activePath} onSelect={(p) => void openFile(p)} onClose={(p) => void closeTab(p)} />

        <div className="workspace-header">
          <div className="format-selector">
            <span>{dict.fmtMode}</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{dict.fmtCurr}</span>
          </div>

          <div className="view-switcher" role="tablist" aria-label="View switcher">
            <button className={clsx('view-btn', viewMode === 'edit' && 'active')} onClick={() => setViewMode('edit')} type="button">
              {dict.edit}
            </button>
            <button
              className={clsx('view-btn', viewMode === 'preview' && 'active')}
              onClick={() => setViewMode('preview')}
              type="button"
            >
              {dict.preview}
            </button>
          </div>

          <button className="btn-primary-studio publish-btn" onClick={() => setExportOpen(true)} type="button">
            {dict.export}
          </button>
        </div>

        <div className="canvas-container" id="canvas">
          {viewMode === 'edit' ? (
            <div className="paper-wrapper" id="editView">
              <FormatToolbar
                format={editorFormat}
                setFormat={setEditorFormat}
                onBold={() =>
                  editorRef.current?.surroundSelection(editorFormat === 'markdown' ? '**' : '<b>', editorFormat === 'markdown' ? '**' : '</b>')
                }
                onItalic={() =>
                  editorRef.current?.surroundSelection(editorFormat === 'markdown' ? '*' : '<i>', editorFormat === 'markdown' ? '*' : '</i>')
                }
                onUnderline={() => editorRef.current?.surroundSelection('<u>', '</u>')}
              />
              <EditorCanvas
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
          ) : (
            <PreviewPane html={previewHtml} />
          )}
        </div>

        <StatusBar left={statusLeft} right={statusRight} />
      </main>

      <aside className="ai-pane" aria-label="AI Companion">
        <div className="ai-pane-header">
          <span>AI Companion</span>
          <span style={{ fontSize: 10, color: wsConnected ? 'var(--accent)' : 'var(--text-inc)' }}>{wsConnected ? 'ON' : 'OFF'}</span>
        </div>

        <div className="composer-section">
          <Composer
            value={composer}
            onChange={setComposer}
            onRun={() => startAgent(composer)}
            disabled={!activePath || !composer.trim()}
          />

          <SkillsPanel
            skills={skills}
            onUseSkill={(skill) => {
              setComposer(skill.promptTemplate)
              startAgent(skill.promptTemplate)
            }}
            onNewSkill={() => {
              const name = window.prompt('Skill name', '')
              if (!name) return
              const tag = window.prompt('Tag', '') ?? ''
              const description = window.prompt('Description', '') ?? ''
              const promptTemplate = window.prompt('Prompt template', '')
              if (!promptTemplate) return
              const id =
                typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `skill-${Date.now()}-${Math.random()}`
              const next: Skill = {
                id,
                name,
                description,
                tag,
                promptTemplate,
              }
              const nextSkills = [next, ...skills]
              setSkills(nextSkills)
              void saveSkills(nextSkills)
            }}
          />

          {agent.kind === 'streaming' && (
            <div style={{ marginTop: 24, fontSize: 12 }}>
              <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 12, color: 'var(--text-muted)' }}>
                {dict.aiStatus}
              </div>
            </div>
          )}
        </div>
      </aside>

      <DiffModal
        open={diffOpen}
        agent={agent}
        onClose={() => {
          setDiffOpen(false)
          if (agent.kind === 'streaming') setAgent({ kind: 'idle' })
        }}
        onApply={() => void applyAgentEdit()}
      />

      <SkillPalette
        open={paletteOpen}
        value={paletteValue}
        setValue={setPaletteValue}
        skills={skills}
        onClose={() => setPaletteOpen(false)}
        onRunInstruction={(instruction) => {
          setPaletteOpen(false)
          setPaletteValue('')
          setComposer(instruction)
          startAgent(instruction)
        }}
        onRunSkill={(skill) => {
          setPaletteOpen(false)
          setPaletteValue('')
          setComposer(skill.promptTemplate)
          startAgent(skill.promptTemplate)
        }}
      />

      <ExportModal
        open={exportOpen}
        title={guessTitle(content) ?? ''}
        activePath={activePath}
        content={content}
        platforms={platforms}
        platform={platform}
        setPlatform={setPlatform}
        onClose={() => setExportOpen(false)}
      />
    </div>
  )
}

function App() {
  return (
    <I18nProvider>
      <StudioApp />
    </I18nProvider>
  )
}

function guessTitle(markdown: string): string | null {
  const m = markdown.match(/^#\\s+(.+)\\s*$/m)
  return m?.[1]?.trim() ?? null
}

function computeCounts(content: string, lang: 'en' | 'zh') {
  const trimmed = content.trim()
  if (!trimmed) return { countLabel: lang === 'zh' ? '0 字' : '0 words', readLabel: lang === 'zh' ? '0 分钟阅读' : '0m read' }

  const words = trimmed.split(/\\s+/).filter(Boolean).length
  const chars = trimmed.replace(/\\s+/g, '').length

  if (lang === 'zh') {
    const minutes = Math.max(1, Math.ceil(chars / 400))
    return { countLabel: `${chars} 字`, readLabel: `${minutes} 分钟阅读` }
  }

  const minutes = Math.max(1, Math.ceil(words / 200))
  return { countLabel: `${words} words`, readLabel: `${minutes}m read` }
}

function seedStoryMapNodes(lang: 'en' | 'zh'): StoryMapNode[] {
  if (lang === 'en') {
    return [
      { title: 'Core Problem', detail: 'Traditional editors are bottlenecks.', depth: 1 },
      { title: 'Solution', detail: 'Integrated AI environment.', depth: 1 },
      { title: 'Value', detail: 'Precision and consistency.', depth: 1 },
    ]
  }
  return [
    { title: '核心问题', detail: '传统编辑器无法满足多平台分发需求。', depth: 1 },
    { title: '解决方案', detail: '集成 AI 的高精密创作环境。', depth: 1 },
    { title: '价值主张', detail: '精准度、语气一致性与快速适配。', depth: 1 },
  ]
}

function seedSkills(lang: 'en' | 'zh'): Skill[] {
  if (lang === 'en') {
    return [
      {
        id: 'seed-wechat-layout',
        name: 'WeChat Layout',
        description: 'Auto-format titles and spacing for WeChat UI.',
        tag: 'Style',
        promptTemplate: 'Optimize the selected text for WeChat formatting and readability.',
      },
      {
        id: 'seed-title-master',
        name: 'Title Master',
        description: 'Generate 5 high-CTR headlines based on content.',
        tag: 'Creative',
        promptTemplate: 'Generate 5 high-CTR headline options for the selected text.',
      },
      {
        id: 'seed-cross-check',
        name: 'Cross-Check',
        description: 'Verify quotes and facts in selection.',
        tag: 'Quality',
        promptTemplate: 'Cross-check the claims in the selection and fix any factual issues.',
      },
    ]
  }

  return [
    {
      id: 'seed-wechat-layout',
      name: '微信公众号排版',
      description: '自动适配公众号大号字、行间距与引用样式。',
      tag: '样式',
      promptTemplate: '请把选中文本改写成更适合微信公众号阅读的排版与语气：更清晰的段落、适度的小标题、保持内容不跑题。',
    },
    {
      id: 'seed-title-master',
      name: '爆款标题生成',
      description: '基于内容生成 5 个高点击率标题建议。',
      tag: '创意',
      promptTemplate: '基于选中文本生成 5 个高点击率标题，风格分别为：理性、情绪、反差、数字化、对话式。',
    },
    {
      id: 'seed-cross-check',
      name: '实时事实核查',
      description: '验证选中段落中的数据、引用与特定事实。',
      tag: '质量',
      promptTemplate: '请检查选中文本中的事实与数字表述，发现可疑处就改写为更稳妥、可验证的表达。',
    },
  ]
}

export default App
