const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('writenow', {
  apiBase: process.env.WN_API_BASE || 'http://127.0.0.1:8000',
  wsBase: process.env.WN_WS_BASE || 'ws://127.0.0.1:8000',
  platform: process.platform,
  skills: {
    read: () => ipcRenderer.invoke('skills:read'),
    write: (skills) => ipcRenderer.invoke('skills:write', skills),
  },
  files: {
    saveText: (payload) => ipcRenderer.invoke('file:saveText', payload),
    saveBinary: (payload) => ipcRenderer.invoke('file:saveBinary', payload),
  },
  onAction: (handler) => {
    const listener = (_evt, action) => handler(action)
    ipcRenderer.on('writenow:action', listener)
    return () => ipcRenderer.removeListener('writenow:action', listener)
  },
})
