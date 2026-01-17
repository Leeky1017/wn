const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

const isDev = !app.isPackaged

let backendProc = null
let mainWindow = null

function resolveSkillsPath() {
  return path.join(app.getPath('userData'), 'skills.json')
}

function normalizeSkills(raw) {
  if (!Array.isArray(raw)) return null
  const out = []
  for (const v of raw) {
    if (!v || typeof v !== 'object') return null
    const o = v
    if (
      typeof o.id !== 'string' ||
      typeof o.name !== 'string' ||
      typeof o.description !== 'string' ||
      typeof o.tag !== 'string' ||
      typeof o.promptTemplate !== 'string'
    ) {
      return null
    }
    out.push({
      id: o.id,
      name: o.name,
      description: o.description,
      tag: o.tag,
      promptTemplate: o.promptTemplate,
    })
  }
  return out
}

function setupIpc() {
  ipcMain.handle('skills:read', async () => {
    const p = resolveSkillsPath()
    try {
      const raw = await fs.promises.readFile(p, 'utf8')
      const parsed = JSON.parse(raw)
      return normalizeSkills(parsed) ?? []
    } catch (e) {
      if (e && typeof e === 'object' && e.code === 'ENOENT') return null
      throw e
    }
  })

  ipcMain.handle('skills:write', async (_evt, skills) => {
    const normalized = normalizeSkills(skills)
    if (!normalized) throw new Error('Invalid skills payload')
    const p = resolveSkillsPath()
    await fs.promises.mkdir(path.dirname(p), { recursive: true })
    await fs.promises.writeFile(p, JSON.stringify(normalized, null, 2), 'utf8')
    return { ok: true }
  })

  ipcMain.handle('file:saveText', async (_evt, payload) => {
    const suggestedName = payload?.suggestedName || 'export.txt'
    const content = payload?.content ?? ''
    if (typeof suggestedName !== 'string' || typeof content !== 'string') throw new Error('Invalid saveText payload')

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export',
      defaultPath: path.join(app.getPath('documents'), suggestedName),
    })
    if (canceled || !filePath) return { canceled: true }
    await fs.promises.writeFile(filePath, content, 'utf8')
    return { canceled: false, filePath }
  })

  ipcMain.handle('file:saveBinary', async (_evt, payload) => {
    const suggestedName = payload?.suggestedName || 'export.bin'
    const bytes = payload?.bytes
    if (typeof suggestedName !== 'string') throw new Error('Invalid saveBinary payload')
    if (!(bytes instanceof Uint8Array) && !(bytes instanceof ArrayBuffer)) throw new Error('Invalid bytes payload')

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export',
      defaultPath: path.join(app.getPath('documents'), suggestedName),
    })
    if (canceled || !filePath) return { canceled: true }
    const buf = Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    await fs.promises.writeFile(filePath, buf)
    return { canceled: false, filePath }
  })
}

function resolveBackendDir() {
  // frontend/electron -> repo/backend (dev). In packaged builds, this should be adjusted.
  return path.resolve(__dirname, '..', '..', 'backend')
}

function resolvePython(backendDir) {
  const candidates = [
    path.join(backendDir, '.venv', 'bin', 'python'),
    path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
    'python3',
    'python',
  ]
  for (const p of candidates) {
    try {
      if (p === 'python' || p === 'python3') return p
      if (fs.existsSync(p)) return p
    } catch {
      // ignore
    }
  }
  return 'python3'
}

function startBackend() {
  const backendDir = resolveBackendDir()
  const python = resolvePython(backendDir)

  const port = Number(process.env.WN_BACKEND_PORT || 8000)
  const host = process.env.WN_BACKEND_HOST || '127.0.0.1'
  const reload = process.env.WN_BACKEND_RELOAD === '1'

  const dataDir = process.env.WN_DATA_DIR || path.join(app.getPath('userData'), 'data')
  const allowedOrigins =
    process.env.WN_ALLOWED_ORIGINS ||
    'http://localhost:5173,http://127.0.0.1:5173,null'

  const args = [
    '-m',
    'uvicorn',
    'app.main:app',
    '--host',
    host,
    '--port',
    String(port),
  ]
  if (reload) args.push('--reload')

  console.log('[backend] starting:', python, args.join(' '))
  backendProc = spawn(python, args, {
    cwd: backendDir,
    env: {
      ...process.env,
      WN_DATA_DIR: dataDir,
      WN_ALLOWED_ORIGINS: allowedOrigins,
    },
    stdio: 'pipe',
  })

  backendProc.stdout.on('data', (d) => process.stdout.write(String(d)))
  backendProc.stderr.on('data', (d) => process.stderr.write(String(d)))
  backendProc.on('exit', (code) => {
    console.log('[backend] exited:', code)
    backendProc = null
  })

  process.env.WN_API_BASE = process.env.WN_API_BASE || `http://${host}:${port}`
  process.env.WN_WS_BASE = process.env.WN_WS_BASE || `ws://${host}:${port}`
}

function stopBackend() {
  if (!backendProc) return
  try {
    backendProc.kill('SIGTERM')
  } catch {
    // ignore
  }
}

async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1040,
    minHeight: 700,
    backgroundColor: '#f9fafb',
    title: 'WriteNow',
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  win.once('ready-to-show', () => win.show())
  mainWindow = win

  const startUrl =
    process.env.ELECTRON_START_URL ||
    (isDev ? 'http://localhost:5173' : null)

  if (startUrl) {
    await win.loadURL(startUrl)
    return
  }

  const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
  await win.loadFile(indexPath)
}

function sendAction(action) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('writenow:action', action)
}

function createAppMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Draft', accelerator: 'CmdOrCtrl+N', click: () => sendAction('newFile') },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => sendAction('save') },
        { type: 'separator' },
        { role: process.platform === 'darwin' ? 'close' : 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Command Palette', accelerator: 'CmdOrCtrl+K', click: () => sendAction('commandPalette') },
        { type: 'separator' },
        ...(isDev
          ? [
              { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
              { label: 'Toggle DevTools', accelerator: 'Alt+CmdOrCtrl+I', click: () => mainWindow?.webContents.toggleDevTools() },
            ]
          : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'WriteNow Repository',
          click: async () => {
            await shell.openExternal('https://github.com/Leeky1017/wn')
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => stopBackend())

app.whenReady().then(async () => {
  try {
    setupIpc()
    startBackend()
    await createMainWindow()
    createAppMenu()
  } catch (e) {
    dialog.showErrorBox('WriteNow 启动失败', String(e))
    app.quit()
  }
})
