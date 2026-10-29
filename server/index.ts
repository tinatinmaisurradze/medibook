/**
 * MediBook backend: a small Node server that runs the SAME API engine as the browser mock
 * (src/services/mockApi.ts: routes, validation, role and ownership checks), but with real security:
 *   - passwords are hashed with scrypt,
 *   - tokens are real HS256 JWTs signed with a secret (a forged or changed token is refused),
 *   - the data lives on the server (a JSON file), shared by every browser and device,
 *   - CORS only for the allowed origins, request size limit, rate limiting, security headers.
 *
 * Run:  npm run server      (see .env.example for the settings)
 * Use:  set VITE_API_URL=http://localhost:4000 in .env.local and start the front end.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import path from 'node:path'
import { ApiError, configureEngine, DB_STORAGE_KEY, handleRequest, type TokenPayload } from '@/services/mockApi'

const PORT = Number(process.env.PORT ?? 4000)
const PRODUCTION = process.env.NODE_ENV === 'production'
const DATA_FILE = path.resolve(process.env.DATA_FILE ?? 'server/data/db.json')
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((s) => s.trim()).filter(Boolean)
const TRUST_PROXY = process.env.TRUST_PROXY === 'true'
const MAX_BODY_BYTES = 200_000

/* ---------- secret ---------- */

let SECRET = process.env.JWT_SECRET ?? ''
if (!SECRET) {
  if (PRODUCTION) {
    console.error('JWT_SECRET is required when NODE_ENV=production')
    process.exit(1)
  }
  SECRET = crypto.randomBytes(32).toString('hex')
  console.warn('JWT_SECRET is not set: a random one is used, every session ends when the server restarts.')
}
if (PRODUCTION && SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long')
  process.exit(1)
}

/* ---------- persistence: the API engine stores its database through `localStorage`, here backed by a file ---------- */

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
const memory = new Map<string, string>()
if (fs.existsSync(DATA_FILE)) memory.set(DB_STORAGE_KEY, fs.readFileSync(DATA_FILE, 'utf8'))

function persist(value: string) {
  const tmp = `${DATA_FILE}.tmp`
  fs.writeFileSync(tmp, value)
  fs.renameSync(tmp, DATA_FILE) // atomic: a crash never leaves a half-written file
}

;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => {
    memory.set(k, v)
    if (k === DB_STORAGE_KEY) persist(v)
  },
  removeItem: (k: string) => {
    memory.delete(k)
  },
  clear: () => memory.clear(),
  key: () => null,
  length: 0,
} as Storage

/* ---------- real password hashing and token signing ---------- */

const hashPassword = (plain: string): string => {
  const salt = crypto.randomBytes(16)
  return `scrypt$${salt.toString('hex')}$${crypto.scryptSync(plain, salt, 32).toString('hex')}`
}

const verifyPassword = (plain: string, stored: string): boolean => {
  if (!stored.startsWith('scrypt$')) return false
  const [, saltHex, hashHex] = stored.split('$')
  const expected = Buffer.from(hashHex ?? '', 'hex')
  const actual = crypto.scryptSync(plain, Buffer.from(saltHex ?? '', 'hex'), 32)
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

const sign = (data: string) => crypto.createHmac('sha256', SECRET).update(data).digest()

const signToken = (payload: TokenPayload): string => {
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${head}.${body}.${sign(`${head}.${body}`).toString('base64url')}`
}

const verifyToken = (token: string): TokenPayload | null => {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [head, body, signature] = parts
  const given = Buffer.from(signature, 'base64url')
  const expected = sign(`${head}.${body}`)
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload
  return payload.exp > Date.now() ? payload : null
}

configureEngine({ latency: false, hashPassword, verifyPassword, signToken, verifyToken })

/** The seed data contains demo accounts with plain demo passwords: turn them into hashes before serving anything */
async function prepareDatabase() {
  await handleRequest('GET', '/api/clinics', null, null) // creates and saves the seed on first start
  const raw = memory.get(DB_STORAGE_KEY)
  if (!raw) return
  const db = JSON.parse(raw) as { users: { password: string }[] }
  let changed = false
  db.users.forEach((u) => {
    if (!u.password.startsWith('scrypt$')) {
      u.password = hashPassword(u.password)
      changed = true
    }
  })
  if (changed) {
    memory.set(DB_STORAGE_KEY, JSON.stringify(db))
    persist(JSON.stringify(db))
  }
}

/* ---------- rate limiting (per client address) ---------- */

const hits = new Map<string, { count: number; reset: number }>()
function limited(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now()
  const h = hits.get(key)
  if (!h || h.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs })
    return false
  }
  h.count += 1
  return h.count > max
}
setInterval(() => {
  const now = Date.now()
  hits.forEach((v, k) => v.reset < now && hits.delete(k))
}, 60_000).unref()

/* ---------- HTTP ---------- */

function send(res: ServerResponse, status: number, data: unknown, origin?: string) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...(origin && ALLOWED_ORIGINS.includes(origin)
      ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS', 'Access-Control-Max-Age': '600' }
      : {}),
  })
  res.end(body)
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_BODY_BYTES) {
        reject(new ApiError(413, 'TOO_LARGE', 'მოთხოვნა ძალიან დიდია'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      if (size === 0) return resolve(undefined)
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new ApiError(400, 'BAD_JSON', 'მოთხოვნის ფორმატი არასწორია'))
      }
    })
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  const started = Date.now()
  const origin = req.headers.origin
  const url = new URL(req.url ?? '/', 'http://localhost')
  const ip = (TRUST_PROXY ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown'
  let status = 200
  try {
    if (req.method === 'OPTIONS') {
      status = 204
      return send(res, 204, {}, origin)
    }
    if (url.pathname === '/health') return send(res, 200, { ok: true }, origin)
    if (!url.pathname.startsWith('/api/')) throw new ApiError(404, 'NOT_FOUND', 'მისამართი ვერ მოიძებნა')
    if (limited(`all:${ip}`, 300)) throw new ApiError(429, 'RATE_LIMITED', 'ძალიან ბევრი მოთხოვნა. სცადეთ ერთ წუთში')
    if (url.pathname.startsWith('/api/auth/') && limited(`auth:${ip}`, 30)) throw new ApiError(429, 'RATE_LIMITED', 'ძალიან ბევრი მცდელობა. სცადეთ ერთ წუთში')

    const auth = req.headers.authorization ?? ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null
    const body = req.method === 'GET' ? undefined : await readBody(req)
    const result = await handleRequest(req.method ?? 'GET', `${url.pathname}${url.search}`, body, token)
    send(res, status, result, origin)
  } catch (e) {
    if (e instanceof ApiError) {
      status = e.status
      send(res, e.status, { code: e.code, message: e.message }, origin)
    } else {
      status = 500
      console.error('Unexpected error:', e)
      send(res, 500, { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა. სცადეთ მოგვიანებით' }, origin)
    }
  } finally {
    console.log(`${req.method} ${url.pathname} ${status} ${Date.now() - started}ms`) // never log bodies or tokens
  }
})

prepareDatabase().then(() => {
  server.listen(PORT, () => console.log(`MediBook API: http://localhost:${PORT}  (data: ${DATA_FILE}, allowed origins: ${ALLOWED_ORIGINS.join(', ')})`))
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close(() => process.exit(0)))
