import { spawn } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const frontendDir = fileURLToPath(new URL('..', import.meta.url))

function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts })
  return child
}

function pickPkgManager() {
  const ua = process.env.npm_config_user_agent || ''
  if (ua.includes('pnpm/')) return 'pnpm'
  if (ua.includes('npm/')) return 'npm'
  if (process.env.npm_execpath?.includes('pnpm')) return 'pnpm'
  return 'pnpm'
}

async function wait(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function waitHttp(url, timeoutMs = 20_000) {
  const start = Date.now()
  // lazy import for node<18 compatibility (though we are on node20)
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok) return
    } catch {
      // ignore
    }
    await wait(250)
  }
  throw new Error(`Timeout waiting for ${url}`)
}

const pkg = pickPkgManager()
const vite = run(pkg, ['run', 'dev', '--', '--port', '5173', '--strictPort'], { cwd: frontendDir })

await waitHttp('http://localhost:5173')

const env = {
  ...process.env,
  ELECTRON_START_URL: 'http://localhost:5173',
  WN_BACKEND_RELOAD: '1',
}

const electron =
  pkg === 'pnpm'
    ? run('pnpm', ['exec', 'electron', '.'], { cwd: frontendDir, env })
    : run('npm', ['run', 'desktop'], { cwd: frontendDir, env })

const cleanup = () => {
  try {
    vite.kill('SIGTERM')
  } catch {
    // ignore
  }
  try {
    electron.kill('SIGTERM')
  } catch {
    // ignore
  }
}

process.on('SIGINT', () => {
  cleanup()
  process.exit(0)
})
process.on('SIGTERM', () => {
  cleanup()
  process.exit(0)
})

electron.on('exit', (code) => {
  cleanup()
  process.exit(code ?? 0)
})
