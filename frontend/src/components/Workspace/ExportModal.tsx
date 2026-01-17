import { useMemo, useState } from 'react'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { exportHtml } from '../../app/api'
import { saveBinaryFile, saveTextFile } from '../../app/files'

export function ExportModal(props: {
  open: boolean
  title: string
  activePath: string
  content: string
  platforms: { id: string; name: string }[]
  platform: string
  setPlatform: (platform: string) => void
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)

  const suggestedBase = useMemo(() => {
    if (props.title.trim()) return safeName(props.title.trim())
    if (props.activePath) return safeName(basename(props.activePath).replace(/\.[^/.]+$/, ''))
    return 'export'
  }, [props.activePath, props.title])

  if (!props.open) return null

  return (
    <div
      className="wnModalOverlay"
      role="dialog"
      aria-modal="true"
      aria-label="Export / Publish"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose()
      }}
    >
      <div className="wnModalCard">
        <div className="wnModalHeader">
          <div className="wnModalTitle">Export / Publish</div>
          <button className="wnModalClose" onClick={props.onClose} type="button" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="wnModalBody">
          <div className="wnModalSection">
            <div className="wnModalLabel">HTML platform</div>
            <select
              className="wnModalSelect"
              value={props.platform}
              onChange={(e) => props.setPlatform(e.target.value)}
              disabled={busy}
            >
              {props.platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="wnModalGrid">
            <button
              className="wnModalAction"
              onClick={() => void onExportMd({ suggestedBase, content: props.content, setBusy })}
              disabled={busy}
              type="button"
            >
              Markdown (.md)
            </button>
            <button
              className="wnModalAction"
              onClick={() => void onExportDocx({ suggestedBase, content: props.content, setBusy })}
              disabled={busy}
              type="button"
            >
              Word (.docx)
            </button>
            <button
              className="wnModalAction"
              onClick={() => void onExportHtml({ suggestedBase, content: props.content, platform: props.platform, setBusy })}
              disabled={busy}
              type="button"
            >
              Platform HTML (.html)
            </button>
          </div>
        </div>

        <div className="wnModalFooter">
          <div className="wnModalHint">{busy ? 'Exporting…' : 'Choose a format to export.'}</div>
        </div>
      </div>
    </div>
  )
}

async function onExportMd(opts: { suggestedBase: string; content: string; setBusy: (v: boolean) => void }) {
  opts.setBusy(true)
  try {
    await saveTextFile({ suggestedName: `${opts.suggestedBase}.md`, content: opts.content })
  } finally {
    opts.setBusy(false)
  }
}

async function onExportHtml(opts: {
  suggestedBase: string
  content: string
  platform: string
  setBusy: (v: boolean) => void
}) {
  opts.setBusy(true)
  try {
    const res = await exportHtml({ platform: opts.platform, content: opts.content })
    await saveTextFile({ suggestedName: `${opts.suggestedBase}-${opts.platform}.html`, content: res.html })
  } finally {
    opts.setBusy(false)
  }
}

async function onExportDocx(opts: { suggestedBase: string; content: string; setBusy: (v: boolean) => void }) {
  opts.setBusy(true)
  try {
    const doc = markdownToDocx(opts.content)
    const blob = await Packer.toBlob(doc)
    const buf = new Uint8Array(await blob.arrayBuffer())
    await saveBinaryFile({
      suggestedName: `${opts.suggestedBase}.docx`,
      bytes: buf,
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
  } finally {
    opts.setBusy(false)
  }
}

function markdownToDocx(content: string) {
  const blocks = content.split(/\n\s*\n/g).map((b) => b.trim()).filter(Boolean)
  const children: Paragraph[] = []

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trimEnd())
    for (const line of lines) {
      const m = line.match(/^(#{1,6})\s+(.+)$/)
      if (m) {
        const level = Math.min(3, m[1].length)
        const text = stripMarkdown(m[2].trim())
        children.push(
          new Paragraph({
            text,
            heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          }),
        )
        continue
      }
      const text = stripMarkdown(line).trim()
      if (!text) continue
      children.push(new Paragraph({ children: [new TextRun({ text })] }))
    }
    children.push(new Paragraph({}))
  }

  return new Document({ sections: [{ children }] })
}

function stripMarkdown(s: string) {
  return s
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

function safeName(s: string) {
  return s
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

function basename(p: string) {
  return p.split('/').pop() || p
}

