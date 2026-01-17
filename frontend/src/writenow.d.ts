export {}

type Skill = {
  id: string
  name: string
  description: string
  tag: string
  promptTemplate: string
}

declare global {
  interface Window {
    writenow?: {
      apiBase?: string
      wsBase?: string
      platform?: string
      skills?: {
        read?: () => Promise<Skill[] | null>
        write?: (skills: Skill[]) => Promise<{ ok: true } | void>
      }
      files?: {
        saveText?: (payload: { suggestedName: string; content: string }) => Promise<{ canceled: boolean; filePath?: string }>
        saveBinary?: (payload: { suggestedName: string; bytes: Uint8Array | ArrayBuffer }) => Promise<{ canceled: boolean; filePath?: string }>
      }
      onAction?: (handler: (action: string) => void) => () => void
    }
  }
}
