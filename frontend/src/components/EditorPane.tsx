import { useMemo, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView } from '@codemirror/view'

export type EditorApi = {
  getSelection: () => { from: number; to: number }
  focus: () => void
}

const theme = EditorView.theme(
  {
    '&': {
      fontFamily: 'var(--font-ui)',
      fontSize: '14px',
      lineHeight: '1.7',
      backgroundColor: 'transparent',
      color: 'var(--editor-text)',
      height: '100%',
    },
    '.cm-scroller': { fontFamily: 'var(--font-ui)' },
    '.cm-content': {
      padding: '16px 18px 70px',
      caretColor: 'var(--editor-text)',
      color: 'var(--editor-text)',
    },
    '.cm-line': { padding: '0 2px' },
    '.cm-selectionBackground': { backgroundColor: 'var(--editor-selection) !important' },
    '&.cm-focused .cm-cursor': { borderLeftColor: 'rgba(255,255,255,.92)' },
    '&.cm-focused': { outline: 'none' },
    '.cm-gutters': { display: 'none' },
    '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,.03)' },
  },
  { dark: true },
)

export function EditorPane(props: {
  value: string
  onChange: (v: string) => void
  onReady?: (api: EditorApi) => void
}) {
  const viewRef = useRef<EditorView | null>(null)
  const extensions = useMemo(() => [markdown({ codeLanguages: languages }), EditorView.lineWrapping, theme], [])

  return (
    <div className="wnPaper">
      <CodeMirror
        value={props.value}
        onChange={props.onChange}
        onCreateEditor={(view) => {
          viewRef.current = view
          props.onReady?.({
            getSelection: () => {
              const sel = view.state.selection.main
              return { from: sel.from, to: sel.to }
            },
            focus: () => view.focus(),
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
