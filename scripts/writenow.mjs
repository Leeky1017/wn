import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts })
  if (res.error) throw res.error
  if (res.status !== 0) throw new Error(`Command failed: ${cmd} ${args.join(' ')}`)
}

function canRun(cmd, args = ['--version']) {
  const res = spawnSync(cmd, args, { stdio: 'ignore' })
  return res.status === 0
}

function pickPython() {
  const candidates = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python']
  for (const c of candidates) {
    if (c === 'py') {
      if (canRun('py', ['-3', '--version'])) return { cmd: 'py', args: ['-3'] }
      continue
    }
    if (canRun(c)) return { cmd: c, args: [] }
  }
  throw new Error('Python not found. Please install Python 3.')
}

function ensureBackendVenv() {
  const backendDir = path.join(repoRoot, 'backend')
  const venvDir = path.join(backendDir, '.venv')
  const venvPy =
    process.platform === 'win32'
      ? path.join(venvDir, 'Scripts', 'python.exe')
      : path.join(venvDir, 'bin', 'python')

  if (!fs.existsSync(venvPy)) {
    const py = pickPython()
    run(py.cmd, [...py.args, '-m', 'venv', '.venv'], { cwd: backendDir })
  }

  run(venvPy, ['-m', 'pip', 'install', '-r', 'requirements.txt'], { cwd: backendDir })
}

function ensurePnpm() {
  if (canRun('pnpm', ['--version'])) return
  if (canRun('corepack', ['--version'])) {
    run('corepack', ['enable'])
    run('corepack', ['prepare', 'pnpm@9.15.4', '--activate'])
    return
  }
  throw new Error('pnpm/corepack not found. Please install Node.js 18+ (with corepack).')
}

function ensureFrontendDeps() {
  const frontendDir = path.join(repoRoot, 'frontend')
  run('pnpm', ['install'], { cwd: frontendDir })
}

function checkElectron(frontendDir) {
  const res = spawnSync('pnpm', ['exec', 'electron', '--version'], { cwd: frontendDir, encoding: 'utf-8' })
  if (res.status === 0) return true

  const stderr = String(res.stderr || '')
  if (process.platform === 'linux') {
    if (stderr.includes('libasound.so.2')) {
      const osRelease = (() => {
        try {
          return fs.readFileSync('/etc/os-release', 'utf-8')
        } catch {
          return ''
        }
      })()
      const isUbuntu2404 = osRelease.includes('VERSION_ID="24.04"') || osRelease.includes('VERSION_CODENAME=noble')
      console.error(
        [
          '[WriteNow] Electron 缺少系统库：libasound.so.2',
          isUbuntu2404 ? 'Ubuntu 24.04+（noble）请安装：' : 'Ubuntu/Debian 请安装：',
          isUbuntu2404
            ? '  sudo apt-get update && sudo apt-get install -y libasound2t64'
            : '  sudo apt-get update && sudo apt-get install -y libasound2',
          '',
          '如果你看到 “libasound2 是虚拟包”，请改装：',
          '  sudo apt-get install -y libasound2t64',
        ].join('\n'),
      )
      return false
    }
    if (stderr.toLowerCase().includes('display') || stderr.includes('X11')) {
      console.error(
        [
          '[WriteNow] Electron 无法打开显示环境（可能缺少 DISPLAY / X11 / Wayland）。',
          '如果你在 WSL/服务器环境，请在有桌面环境的机器上运行，或先使用 Web 版开发模式。',
        ].join('\n'),
      )
      return false
    }
  }

  console.error('[WriteNow] Electron 运行失败：\n' + stderr.trim())
  return false
}

function startDesktop() {
  const frontendDir = path.join(repoRoot, 'frontend')
  run('pnpm', ['desktop:dev'], { cwd: frontendDir, env: { ...process.env } })
}

try {
  console.log('[WriteNow] ensuring backend deps…')
  ensureBackendVenv()

  console.log('[WriteNow] ensuring frontend deps…')
  ensurePnpm()
  ensureFrontendDeps()

  console.log('[WriteNow] starting desktop app…')
  const frontendDir = path.join(repoRoot, 'frontend')
  if (!checkElectron(frontendDir)) process.exit(1)
  startDesktop()
} catch (e) {
  console.error(String(e))
  process.exit(1)
}
