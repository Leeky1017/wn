import { useMemo } from 'react'
import './previewPane.css'

export function PreviewPane(props: { html: string; warnings: string[]; filenameHint: string }) {
  const canDownload = Boolean(props.html)
  const warnings = useMemo(() => props.warnings ?? [], [props.warnings])

  function download() {
    const blob = new Blob([props.html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.filenameHint
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="wnPreviewPane">
      <div className="wnPreviewHeader">
        <div className="wnPreviewTitle">
          Preview <span className="wnPreviewSub">HTML</span>
        </div>
        <button className="wnBtn wnBtn--ghost" onClick={download} disabled={!canDownload} title="Download HTML">
          Download
        </button>
      </div>
      {warnings.length > 0 && (
        <div className="wnWarnings">
          {warnings.map((w) => (
            <span key={w} className="wnWarnChip">
              {w}
            </span>
          ))}
        </div>
      )}
      <div className="wnPreviewFrame">
        {props.html ? (
          <iframe
            title="preview"
            sandbox="allow-same-origin"
            referrerPolicy="no-referrer"
            srcDoc={props.html}
            className="wnIframe"
          />
        ) : (
          <div className="wnPreviewEmpty">Start typing to generate a platform preview</div>
        )}
      </div>
    </div>
  )
}
