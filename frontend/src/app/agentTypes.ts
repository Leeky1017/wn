export type AgentState =
  | { kind: 'idle' }
  | { kind: 'streaming'; draft: string; log: string[]; instruction: string }
  | {
      kind: 'ready'
      diff: string
      patched: string
      summary: string
      instruction: string
      log: string[]
    }
  | { kind: 'error'; message: string }

export type AgentWsEvent =
  | { type: 'log'; message: string }
  | { type: 'delta'; text: string }
  | { type: 'result'; diff?: string; patched_content?: string; summary?: string; path?: string }
  | { type: 'error'; message?: string }
