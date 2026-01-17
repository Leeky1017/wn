const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

const isDev = !app.isPackaged

let backendProc = null

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
    backgroundColor: '#0b0b11',
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

  const startUrl =
    process.env.ELECTRON_START_URL ||
    (isDev ? 'http://localhost:5173' : null)

  if (startUrl) {
    await win.loadURL(startUrl)
    if (isDev) win.webContents.openDevTools({ mode: 'detach' })
    return
  }

  const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
  await win.loadFile(indexPath)
}

app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => stopBackend())

app.whenReady().then(async () => {
  try {
    startBackend()
    await createMainWindow()
  } catch (e) {
    dialog.showErrorBox('WriteNow 启动失败', String(e))
    app.quit()
  }
})
