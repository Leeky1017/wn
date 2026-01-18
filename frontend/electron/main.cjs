const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')
const util = require('util')

// Enable HiDPI / Retina rendering
app.commandLine.appendSwitch('high-dpi-support', '1')
app.commandLine.appendSwitch('force-device-scale-factor', '1')
// Ensure hardware acceleration
app.commandLine.appendSwitch('enable-accelerated-2d-canvas', 'true')
app.commandLine.appendSwitch('enable-gpu-rasterization', 'true')
// Disable GPU sandbox if needed on Linux
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('disable-gpu-sandbox')
}

const isDev = !app.isPackaged

let backendProc = null
let mainWindow = null
let backendErrorShown = false
let logStream = null
let logPath = null

function initLogging() {
  try {
    const logsDir = path.join(app.getPath('userData'), 'logs')
    fs.mkdirSync(logsDir, { recursive: true })
    logPath = path.join(logsDir, 'main.log')
    logStream = fs.createWriteStream(logPath, { flags: 'a' })
  } catch {
    // ignore
  }
}

function log(...args) {
  const msg = util.format(...args)
  try {
    console.log(msg)
  } catch {
    // ignore
  }
  try {
    if (logStream) logStream.write(`[${new Date().toISOString()}] ${msg}\n`)
  } catch {
    // ignore
  }
}

process.on('uncaughtException', (err) => {
  log('[main] uncaughtException:', err && err.stack ? err.stack : String(err))
})
process.on('unhandledRejection', (reason) => {
  log('[main] unhandledRejection:', reason && reason.stack ? reason.stack : String(reason))
})

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
  if (app.isPackaged) {
    // In packaged builds, backend is in resources/backend
    return path.join(process.resourcesPath, 'backend')
  }
  // frontend/electron -> repo/backend (dev)
  return path.resolve(__dirname, '..', '..', 'backend')
}

function resolveBackendExe() {
  if (app.isPackaged) {
    const exeName = process.platform === 'win32' ? 'writenow-backend.exe' : 'writenow-backend'

    // electron-builder extraResources may either flatten the executable into
    // resources/backend-dist/<exe>, or keep the PyInstaller --onedir folder:
    // resources/backend-dist/writenow-backend/<exe>
    const candidates = [
      path.join(process.resourcesPath, 'backend-dist', exeName),
      path.join(process.resourcesPath, 'backend-dist', 'writenow-backend', exeName),
    ]

    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) return { type: 'exe', path: p }
      } catch {
        // ignore
      }
    }
    return { type: 'missing', path: null }
  }
  // Fallback to Python
  return { type: 'python', path: null }
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
  const port = Number(process.env.WN_BACKEND_PORT || 8000)
  const host = process.env.WN_BACKEND_HOST || '127.0.0.1'
  const reload = process.env.WN_BACKEND_RELOAD === '1'

  const dataDir = process.env.WN_DATA_DIR || path.join(app.getPath('userData'), 'data')
  const allowedOrigins =
    process.env.WN_ALLOWED_ORIGINS ||
    'http://localhost:5173,http://127.0.0.1:5173,null'

  const backendExe = resolveBackendExe()
  
  let cmd, args, cwd

  if (backendExe.type === 'exe') {
    // Use packaged backend executable
    cmd = backendExe.path
    args = ['--host', host, '--port', String(port)]
    cwd = path.dirname(backendExe.path)
    log('[backend] starting exe:', cmd, args.join(' '))
  } else if (backendExe.type === 'missing') {
    const msg =
      'Packaged backend executable not found.\n' +
      `Expected one of:\n- ${path.join(process.resourcesPath, 'backend-dist', process.platform === 'win32' ? 'writenow-backend.exe' : 'writenow-backend')}\n` +
      `- ${path.join(process.resourcesPath, 'backend-dist', 'writenow-backend', process.platform === 'win32' ? 'writenow-backend.exe' : 'writenow-backend')}\n\n` +
      'Please rebuild on Windows using scripts/build-windows.ps1 so backend-dist is bundled.'
    log('[backend] ' + msg)
    if (!backendErrorShown) {
      backendErrorShown = true
      try {
        dialog.showErrorBox('WriteNow Backend 缺失', msg)
      } catch {
        // ignore
      }
    }
    return
  } else {
    // Use Python
    const backendDir = resolveBackendDir()
    const python = resolvePython(backendDir)
    cmd = python
    args = ['-m', 'uvicorn', 'app.main:app', '--host', host, '--port', String(port)]
    if (reload) args.push('--reload')
    cwd = backendDir
    log('[backend] starting python:', cmd, args.join(' '))
  }

  backendProc = spawn(cmd, args, {
    cwd: cwd,
    env: {
      ...process.env,
      WN_DATA_DIR: dataDir,
      WN_ALLOWED_ORIGINS: allowedOrigins,
    },
    stdio: 'pipe',
  })

  backendProc.on('error', (err) => {
    backendProc = null
    const msg = err && err.message ? err.message : String(err)
    log('[backend] spawn error:', msg)
    if (app.isPackaged && !backendErrorShown) {
      backendErrorShown = true
      try {
        dialog.showErrorBox('WriteNow Backend 启动失败', msg)
      } catch {
        // ignore
      }
    }
  })

  backendProc.stdout.on('data', (d) => process.stdout.write(String(d)))
  backendProc.stderr.on('data', (d) => process.stderr.write(String(d)))
  backendProc.on('exit', (code) => {
    log('[backend] exited:', code)
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
    show: true,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
      // HiDPI / Rendering quality
      zoomFactor: 1.0,
      enablePreferredSizeMode: true,
    },
  })

  // Force high-quality rendering
  win.webContents.setZoomFactor(1.0)
  // Best-effort: on some Windows builds this promise may hang before first navigation.
  // Do not block app startup on it.
  void win.webContents
    .setVisualZoomLevelLimits(1, 1)
    .catch((e) => log('[main] setVisualZoomLevelLimits failed:', e && e.message ? e.message : String(e)))

  win.once('ready-to-show', () => win.show())
  mainWindow = win

  win.webContents.on('console-message', (_evt, level, message, line, sourceId) => {
    log('[renderer][console]', { level, message, sourceId, line })
  })
  win.webContents.on('render-process-gone', (_evt, details) => {
    log('[renderer] render-process-gone:', details)
    try {
      dialog.showErrorBox(
        'WriteNow 渲染进程崩溃',
        `reason=${details?.reason ?? 'unknown'} exitCode=${details?.exitCode ?? 'unknown'}\nlog=${logPath ?? '(no log file)'}`,
      )
    } catch {
      // ignore
    }
  })
  win.webContents.on('did-fail-load', (_evt, errorCode, errorDescription, validatedURL, isMainFrame) => {
    log('[renderer] did-fail-load:', { errorCode, errorDescription, validatedURL, isMainFrame })
    if (!isMainFrame) return
    try {
      dialog.showErrorBox(
        'WriteNow 页面加载失败',
        `${errorCode} ${errorDescription}\nurl=${validatedURL}\nlog=${logPath ?? '(no log file)'}`,
      )
    } catch {
      // ignore
    }
  })

  const startUrl =
    process.env.ELECTRON_START_URL ||
    (isDev ? 'http://localhost:5173' : null)

  if (startUrl) {
    await win.loadURL(startUrl)
    if (process.env.WN_OPEN_DEVTOOLS === '1') win.webContents.openDevTools({ mode: 'detach' })
    return
  }

  // In packaged app, dist is in the same asar as electron folder
  const indexPath = app.isPackaged
    ? path.join(__dirname, '..', 'dist', 'index.html')
    : path.join(__dirname, '..', 'dist', 'index.html')
  
  log('[main] loading index from:', indexPath)
  log('[main] isPackaged:', app.isPackaged)
  log('[main] __dirname:', __dirname)
  if (logPath) log('[main] log:', logPath)
  
  await win.loadFile(indexPath)
  if (process.env.WN_OPEN_DEVTOOLS === '1') win.webContents.openDevTools({ mode: 'detach' })
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
    initLogging()
    setupIpc()
    log('[main] starting, isPackaged=%s, platform=%s', app.isPackaged, process.platform)
    startBackend()
    await createMainWindow()
    createAppMenu()
  } catch (e) {
    dialog.showErrorBox('WriteNow 启动失败', String(e))
    app.quit()
  }
})
