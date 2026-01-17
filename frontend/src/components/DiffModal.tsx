import clsx from 'clsx'
import type { AgentState } from '../app/agentTypes'
import './diffModal.css'

export function DiffModal(props: { open: boolean; agent: AgentState; onClose: () => void; onApply: () => void }) {
  if (!props.open) return null

  const canApply = props.agent.kind === 'ready'

  return (
    <div
      className="wnDiffOverlay"
      role="dialog"
      aria-modal="true"
      aria-label="Diff Preview"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose()
      }}
    >
      <div className="wnDiffCard">
        <div className="wnDiffHeader">
          <div className="wnDiffTitle">
            Diff Preview <span className="wnDiffSub">{props.agent.kind === 'ready' ? props.agent.summary : 'Generating…'}</span>
          </div>
          <button className="wnBtn wnBtn--ghost" onClick={props.onClose}>
            Close
          </button>
        </div>

        <div className="wnDiffBody">
          {props.agent.kind === 'streaming' && (
            <div className="wnDiffStreaming">
              <div className="wnDiffStreamingMeta">
                <span className="wnPulse" aria-hidden="true" /> Generating <span className="wnDiffCmd">{props.agent.instruction}</span>
              </div>
              <pre className="wnDraft">{props.agent.draft || '…'}</pre>
            </div>
          )}

          {props.agent.kind === 'ready' && <UnifiedDiff diff={props.agent.diff} />}

          {props.agent.kind === 'error' && <div className="wnDiffError">Agent error: {props.agent.message}</div>}
        </div>

        <div className="wnDiffFooter">
          <div className="wnDiffFootLeft">
            {props.agent.kind === 'ready' && <span className="wnDiffCmd">ai:{props.agent.instruction}</span>}
          </div>
          <div className="wnDiffFootRight">
            <button className="wnBtn wnBtn--ghost" onClick={props.onClose}>
              Cancel
            </button>
            <button className={clsx('wnBtn', canApply ? 'wnBtn--primary' : 'wnBtn--disabled')} onClick={props.onApply} disabled={!canApply}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UnifiedDiff(props: { diff: string }) {
  const lines = props.diff.split('\n')
  return (
    <div className="wnUnified">
      <div className="wnUnifiedHeader">unified diff</div>
      <pre className="wnUnifiedPre">
        {lines.map((ln, idx) => {
          const klass =
            ln.startsWith('+++') || ln.startsWith('---')
              ? 'wnDiffMeta'
              : ln.startsWith('@@')
                ? 'wnDiffHunk'
                : ln.startsWith('+')
                  ? 'wnDiffAdd'
                  : ln.startsWith('-')
                    ? 'wnDiffDel'
                    : 'wnDiffCtx'
          return (
            <span key={idx} className={klass}>
              {ln}
              {'\n'}
            </span>
          )
        })}
      </pre>
    </div>
  )
}
