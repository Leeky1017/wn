export type FileInfo = {
  path: string
  size_bytes: number
  updated_at: string
}

export type FileReadResponse = {
  path: string
  content: string
}

export type FileWriteRequest = {
  content: string
  reason: string
  actor: 'user' | 'ai'
}

export type SnapshotInfo = {
  id: string
  path: string
  created_at: string
  reason: string
  actor: string
  size_bytes: number
}

export type SnapshotListResponse = {
  path: string
  snapshots: SnapshotInfo[]
}

export type PlatformInfo = {
  id: string
  name: string
}

export type ExportRequest = {
  platform: string
  content: string
  title?: string
}

export type ExportResponse = {
  platform: string
  html: string
  warnings: string[]
}

