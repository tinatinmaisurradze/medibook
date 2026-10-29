// Builds server/index.ts with esbuild (already installed together with Vite) and starts it.
import { build } from 'esbuild'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outfile = path.join(root, 'server/.build/server.mjs')

await build({
  entryPoints: [path.join(root, 'server/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  alias: { '@': path.join(root, 'src') },
  logLevel: 'error',
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
})

// slots are computed in the clinic's time zone
const child = spawn(process.execPath, [outfile], { stdio: 'inherit', env: { TZ: 'Asia/Tbilisi', ...process.env } })
child.on('exit', (code) => process.exit(code ?? 0))
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => child.kill(s))
