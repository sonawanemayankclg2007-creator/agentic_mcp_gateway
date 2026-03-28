/**
 * Starts FastAPI (uvicorn) from the repo's backend/ folder.
 * Prefers backend/.venv when present; override with env PYTHON=/path/to/python
 */
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..', '..')
const backendRoot = path.join(repoRoot, 'backend')

const venvCandidates = [
  process.env.PYTHON && path.normalize(process.env.PYTHON),
  path.join(backendRoot, '.venv', 'Scripts', 'python.exe'),
  path.join(backendRoot, '.venv', 'bin', 'python'),
].filter(Boolean)

let python = 'python'
for (const candidate of venvCandidates) {
  if (candidate && fs.existsSync(candidate)) {
    python = candidate
    break
  }
}

const venvDir = path.join(backendRoot, '.venv')
if (python === 'python' && !process.env.PYTHON && !fs.existsSync(venvDir)) {
  console.error(
    '[start-backend] No backend/.venv found. From the repo root:\n' +
      '  cd backend && python -m venv .venv && .venv\\Scripts\\pip install -r requirements.txt\n' +
      '  (macOS/Linux: use .venv/bin/pip instead)\n',
  )
}

const args = ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000']

const child = spawn(python, args, {
  cwd: backendRoot,
  stdio: 'inherit',
  windowsHide: true,
  shell: false,
})

child.on('exit', (code, signal) => {
  if (signal) process.exit(1)
  process.exit(code === null ? 1 : code)
})
