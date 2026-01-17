import type {
  ExportRequest,
  ExportResponse,
  FileInfo,
  FileReadResponse,
  FileWriteRequest,
  PlatformInfo,
  SnapshotListResponse,
} from './types'

const API_BASE =
  window.writenow?.apiBase ||
  ((import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:8000')
const WS_BASE =
  window.writenow?.wsBase ||
  ((import.meta.env.VITE_WS_BASE as string | undefined) ??
    API_BASE.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:'))

function apiUrl(path: string) {
  return `${API_BASE.replace(/\/$/, '')}${path}`
}

export function wsUrl(path: string) {
  return `${WS_BASE.replace(/\/$/, '')}${path}`
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const resp = await fetch(input, init)
  const text = await resp.text()
  if (!resp.ok) {
    throw new Error(text || `HTTP ${resp.status}`)
  }
  return (text ? JSON.parse(text) : {}) as T
}

export async function listFiles(): Promise<FileInfo[]> {
  return fetchJson<FileInfo[]>(apiUrl('/api/files'))
}

export async function readFile(path: string): Promise<FileReadResponse> {
  return fetchJson<FileReadResponse>(apiUrl(`/api/file?path=${encodeURIComponent(path)}`))
}

export async function writeFile(path: string, payload: FileWriteRequest): Promise<{ path: string; snapshot_id: string }> {
  return fetchJson(apiUrl(`/api/file?path=${encodeURIComponent(path)}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function createFile(payload: { path: string; template?: string }): Promise<{ ok: boolean }> {
  return fetchJson(apiUrl('/api/file/new'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function listSnapshots(path: string): Promise<SnapshotListResponse> {
  return fetchJson(apiUrl(`/api/snapshots?path=${encodeURIComponent(path)}`))
}

export async function revertSnapshot(payload: { path: string; snapshot_id: string }): Promise<{ path: string; snapshot_id: string }> {
  return fetchJson(apiUrl('/api/snapshots/revert'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function listPlatforms(): Promise<PlatformInfo[]> {
  return fetchJson<PlatformInfo[]>(apiUrl('/api/platforms'))
}

export async function exportHtml(payload: ExportRequest): Promise<ExportResponse> {
  return fetchJson<ExportResponse>(apiUrl('/api/export'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export type StoryMapNode = { title: string; detail: string; depth: number }

export async function generateStoryMap(payload: { content: string; lang: 'en' | 'zh' }): Promise<{ nodes: StoryMapNode[] }> {
  return fetchJson<{ nodes: StoryMapNode[] }>(apiUrl('/api/story-map'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
