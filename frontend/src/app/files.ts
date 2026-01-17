function downloadBlob(suggestedName: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = suggestedName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function saveTextFile(payload: { suggestedName: string; content: string }) {
  const save = window.writenow?.files?.saveText
  if (save) return save(payload)

  downloadBlob(payload.suggestedName, new Blob([payload.content], { type: 'text/plain;charset=utf-8' }))
  return { canceled: false }
}

export async function saveBinaryFile(payload: { suggestedName: string; bytes: Uint8Array | ArrayBuffer; mime?: string }) {
  const save = window.writenow?.files?.saveBinary
  if (save) return save({ suggestedName: payload.suggestedName, bytes: payload.bytes })

  const bytes = payload.bytes instanceof Uint8Array ? payload.bytes : new Uint8Array(payload.bytes)
  downloadBlob(payload.suggestedName, new Blob([bytes as unknown as BlobPart], { type: payload.mime ?? 'application/octet-stream' }))
  return { canceled: false }
}
