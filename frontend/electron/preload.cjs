const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('writenow', {
  apiBase: process.env.WN_API_BASE || 'http://127.0.0.1:8000',
  wsBase: process.env.WN_WS_BASE || 'ws://127.0.0.1:8000',
  platform: process.platform,
})

