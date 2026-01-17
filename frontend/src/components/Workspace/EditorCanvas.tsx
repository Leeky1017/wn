import { useMemo, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorSelection } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

export type EditorApi = {
  focus: () => void
  getSelection: () => { from: number; to: number }
  surroundSelection: (before: string, after: string) => void
}

const theme = EditorView.theme(
  {
    '&': {
      fontFamily: 'var(--font-serif)',
      fontSize: '18px',
      lineHeight: '1.75',
      backgroundColor: 'transparent',
      color: '#1a1a1a',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-serif)',
    },
    '.cm-content': {
      padding: 0,
      caretColor: '#1a1a1a',
    },
    '.cm-selectionBackground': { backgroundColor: 'rgba(37, 99, 235, 0.2) !important' },
    '&.cm-focused .cm-cursor': { borderLeftColor: '#111827' },
    '&.cm-focused': { outline: 'none' },
    '.cm-gutters': { display: 'none' },
  },
  { dark: false },
)

export function EditorCanvas(props: {
  value: string
  onChange: (v: string) => void
  onReady?: (api: EditorApi) => void
}) {
  const viewRef = useRef<EditorView | null>(null)
  const extensions = useMemo(() => [markdown({ codeLanguages: languages }), EditorView.lineWrapping, theme], [])

  return (
    <div className="paper" aria-label="Editor canvas">
      <CodeMirror
        value={props.value}
        onChange={props.onChange}
        onCreateEditor={(view) => {
          viewRef.current = view
          props.onReady?.({
            focus: () => view.focus(),
            getSelection: () => {
              const sel = view.state.selection.main
              return { from: sel.from, to: sel.to }
            },
            surroundSelection: (before: string, after: string) => {
              const v = viewRef.current
              if (!v) return
              const sel = v.state.selection.main
              const selected = v.state.sliceDoc(sel.from, sel.to)
              const nextText = `${before}${selected}${after}`
              const anchor = sel.from + before.length
              const head = anchor + selected.length
              v.dispatch({
                changes: { from: sel.from, to: sel.to, insert: nextText },
                selection: EditorSelection.range(anchor, head),
              })
              v.focus()
            },
          })
        }}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: true,
          autocompletion: false,
          bracketMatching: false,
          closeBrackets: false,
          crosshairCursor: false,
          highlightActiveLineGutter: false,
        }}
        extensions={extensions}
      />
    </div>
  )
}
