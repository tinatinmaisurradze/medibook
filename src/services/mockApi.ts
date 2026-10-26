/**
 * In-browser mock backend.
 * It exposes the same endpoints that are documented in the Tech Spec (section 9),
 * keeps data in localStorage (seeded from data/seed.ts) and issues JWT-shaped tokens.
 * Swapping it for a real server only requires replacing services/http.ts.
 */
import { createSeedDb, type Db } from '@/data/seed'
import type {
  AdminStats,
  Appointment,
  AppointmentView,
  AuthResponse,
  Doctor,
  Paginated,
  Slot,
  SpecialtyKey,
  User,
} from '@/types'
import { minutesToTime, msUntil, parseISODate, timeToMinutes, toISODate } from '@/utils/date'

const DB_KEY = 'medibook_db_v1'
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8
const PAGE_SIZE = 6

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

/* ---------- storage ---------- */

function loadDb(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch {
    /* corrupted storage: fall through to seed */
  }
  const seeded = createSeedDb()
  saveDb(seeded)
  return seeded
}

function saveDb(db: Db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    /* storage may be unavailable (private mode): data lives only until reload */
  }
}

export function resetMockDb() {
  localStorage.removeItem(DB_KEY)
}

/* ---------- JWT-shaped tokens (demo only, signature is not cryptographic) ---------- */

const b64 = (o: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, '')
const unb64 = (s: string) => JSON.parse(decodeURIComponent(escape(atob(s))))

interface TokenPayload {
  sub: number
  role: User['role']
  exp: number
}

export function createToken(user: User): string {
  const payload: TokenPayload = { sub: user.id, role: user.role, exp: Date.now() + TOKEN_TTL_MS }
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.mock-signature`
}

export function readToken(token: string | null): TokenPayload | null {
  if (!token) return null
  try {
    const payload = unb64(token.split('.')[1]) as TokenPayload
    return payload.exp > Date.now() ? payload : null
  } catch {
    return null
  }
}

/* ---------- helpers ---------- */

const publicUser = ({ password: _p, ...u }: Db['users'][number]): User => u

function requireAuth(db: Db, token: string | null, roles?: User['role'][]) {
  const payload = readToken(token)
  if (!payload) throw new ApiError(401, 'UNAUTHORIZED', 'სესია ამოიწურა. გთხოვთ, თავიდან შეხვიდეთ')
  const user = db.users.find((u) => u.id === payload.sub)
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'მომხმარებელი ვერ მოიძებნა')
  if (roles && !roles.includes(user.role)) throw new ApiError(403, 'FORBIDDEN', 'ამ მოქმედებაზე წვდომა არ გაქვთ')
  return user
}

function toView(db: Db, a: Appointment): AppointmentView {
  const doctor = db.doctors.find((d) => d.id === a.doctorId)!
  const clinic = db.clinics.find((c) => c.id === doctor.clinicId)!
  const patient = db.users.find((u) => u.id === a.patientId)
  return {
    ...a,
    doctorName: doctor.fullName,
    specialty: doctor.specialty,
    clinicName: clinic.name,
    room: doctor.room,
    patientName: patient?.fullName ?? 'უცნობი პაციენტი',
  }
}

function buildSlots(db: Db, doctor: Doctor, date: string): Slot[] {
  const d = parseISODate(date)
  if (!doctor.workDays.includes(d.getDay())) return []
  const start = timeToMinutes(doctor.workHours.start)
  const end = timeToMinutes(doctor.workHours.end)
  const taken = new Set(
    db.appointments
      .filter((a) => a.doctorId === doctor.id && a.date === date && a.status !== 'cancelled')
      .map((a) => a.time),
  )
  const slots: Slot[] = []
  for (let t = start; t + doctor.slotMinutes <= end; t += doctor.slotMinutes) {
    const time = minutesToTime(t)
    const inPast = msUntil(date, time) <= 0
    slots.push({ time, available: !taken.has(time) && !inPast })
  }
  return slots
}

/* ---------- router ---------- */

type Handler = (ctx: { db: Db; token: string | null; body: any; params: string[]; query: URLSearchParams }) => unknown

interface Route {
  method: string
  pattern: RegExp
  handler: Handler
}

const routes: Route[] = []
const route = (method: string, path: string, handler: Handler) =>
  routes.push({ method, pattern: new RegExp(`^${path.replace(/:\w+/g, '(\\d+)')}$`), handler })

route('POST', '/api/auth/register', ({ db, body }) => {
  const email = String(body.email ?? '').trim().toLowerCase()
  if (db.users.some((u) => u.email === email)) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'ეს ელ-ფოსტა უკვე გამოყენებულია')
  }
  const user = {
    id: db.seq.user++,
    fullName: String(body.fullName).trim(),
    email,
    phone: body.phone ? String(body.phone) : undefined,
    role: 'patient' as const,
    password: String(body.password),
  }
  db.users.push(user)
  saveDb(db)
  const pub = publicUser(user)
  return { token: createToken(pub), user: pub } satisfies AuthResponse
})

route('POST', '/api/auth/login', ({ db, body }) => {
  const email = String(body.email ?? '').trim().toLowerCase()
  const user = db.users.find((u) => u.email === email && u.password === body.password)
  if (!user) throw new ApiError(401, 'INVALID_CREDENTIALS', 'ელ-ფოსტა ან პაროლი არასწორია')
  const pub = publicUser(user)
  return { token: createToken(pub), user: pub } satisfies AuthResponse
})

route('GET', '/api/auth/me', ({ db, token }) => publicUser(requireAuth(db, token)))

route('GET', '/api/clinics', ({ db }) => db.clinics)

route('GET', '/api/doctors', ({ db, query }) => {
  const specialty = query.get('specialty') as SpecialtyKey | null
  const clinicId = Number(query.get('clinicId')) || null
  const minRating = Number(query.get('minRating')) || 0
  const q = (query.get('q') ?? '').trim().toLowerCase()
  const sort = query.get('sort') ?? 'rating'
  const page = Math.max(1, Number(query.get('page')) || 1)
  const pageSize = Number(query.get('pageSize')) || PAGE_SIZE

  let list = db.doctors.filter((d) => d.active)
  if (specialty) list = list.filter((d) => d.specialty === specialty)
  if (clinicId) list = list.filter((d) => d.clinicId === clinicId)
  if (minRating) list = list.filter((d) => d.rating >= minRating)
  if (q) list = list.filter((d) => d.fullName.toLowerCase().includes(q))
  list = [...list].sort((a, b) =>
    sort === 'experience' ? b.experienceYears - a.experienceYears : sort === 'name' ? a.fullName.localeCompare(b.fullName, 'ka') : b.rating - a.rating,
  )
  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return { data: list.slice((page - 1) * pageSize, page * pageSize), page, totalPages, total } satisfies Paginated<Doctor>
})

route('GET', '/api/doctors/:id', ({ db, params }) => {
  const doctor = db.doctors.find((d) => d.id === Number(params[0]) && d.active)
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმი ვერ მოიძებნა')
  return doctor
})

route('GET', '/api/doctors/:id/slots', ({ db, params, query }) => {
  const doctor = db.doctors.find((d) => d.id === Number(params[0]) && d.active)
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმი ვერ მოიძებნა')
  const date = query.get('date') ?? toISODate(new Date())
  return { doctorId: doctor.id, date, slots: buildSlots(db, doctor, date) }
})

route('POST', '/api/appointments', ({ db, token, body }) => {
  const user = requireAuth(db, token, ['patient'])
  const doctor = db.doctors.find((d) => d.id === Number(body.doctorId) && d.active)
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმი ვერ მოიძებნა')
  if (body.reason && String(body.reason).length > 300) throw new ApiError(422, 'VALIDATION', 'ტექსტი ძალიან გრძელია')

  const slot = buildSlots(db, doctor, body.date).find((s) => s.time === body.time)
  if (!slot) throw new ApiError(422, 'INVALID_SLOT', 'ექიმი ამ დროს არ მუშაობს')
  if (!slot.available) throw new ApiError(409, 'SLOT_TAKEN', 'ეს დრო უკვე დაკავებულია')

  const overlap = db.appointments.some(
    (a) => a.patientId === user.id && a.date === body.date && a.time === body.time && a.status !== 'cancelled',
  )
  if (overlap) throw new ApiError(409, 'PATIENT_BUSY', 'ამ დროს სხვა ექიმთან უკვე გაქვთ ვიზიტი')

  const appt: Appointment = {
    id: db.seq.appointment++,
    doctorId: doctor.id,
    patientId: user.id,
    date: body.date,
    time: body.time,
    reason: body.reason ? String(body.reason).trim() : undefined,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }
  db.appointments.push(appt)
  saveDb(db)
  return toView(db, appt)
})

route('GET', '/api/appointments/me', ({ db, token }) => {
  const user = requireAuth(db, token, ['patient', 'doctor'])
  const mine = db.appointments.filter((a) => (user.role === 'patient' ? a.patientId === user.id : a.doctorId === user.doctorId))
  return mine.map((a) => toView(db, a)).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
})

route('PATCH', '/api/appointments/:id/cancel', ({ db, token, params }) => {
  const user = requireAuth(db, token, ['patient', 'admin'])
  const appt = db.appointments.find((a) => a.id === Number(params[0]))
  if (!appt || (user.role === 'patient' && appt.patientId !== user.id)) throw new ApiError(404, 'NOT_FOUND', 'ვიზიტი ვერ მოიძებნა')
  if (appt.status !== 'confirmed') throw new ApiError(409, 'NOT_CANCELLABLE', 'ამ ვიზიტის გაუქმება შეუძლებელია')
  if (user.role === 'patient' && msUntil(appt.date, appt.time) < 2 * 3600 * 1000) {
    throw new ApiError(409, 'TOO_LATE', 'ვიზიტის გაუქმება შესაძლებელია დაწყებამდე მინიმუმ 2 საათით ადრე')
  }
  appt.status = 'cancelled'
  saveDb(db)
  return toView(db, appt)
})

route('PATCH', '/api/appointments/:id/visit', ({ db, token, params, body }) => {
  const user = requireAuth(db, token, ['doctor'])
  const appt = db.appointments.find((a) => a.id === Number(params[0]) && a.doctorId === user.doctorId)
  if (!appt) throw new ApiError(404, 'NOT_FOUND', 'ვიზიტი ვერ მოიძებნა')
  if (appt.status === 'cancelled') throw new ApiError(409, 'NOT_EDITABLE', 'გაუქმებულ ვიზიტს ჩანაწერს ვერ დაამატებთ')
  appt.diagnosis = String(body.diagnosis ?? '').trim()
  appt.prescription = String(body.prescription ?? '').trim()
  appt.status = 'completed'
  saveDb(db)
  return toView(db, appt)
})

route('GET', '/api/admin/appointments', ({ db, token }) => {
  requireAuth(db, token, ['admin'])
  return db.appointments.map((a) => toView(db, a)).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
})

route('GET', '/api/admin/doctors', ({ db, token }) => {
  requireAuth(db, token, ['admin'])
  return db.doctors
})

route('PATCH', '/api/admin/doctors/:id', ({ db, token, params, body }) => {
  requireAuth(db, token, ['admin'])
  const doctor = db.doctors.find((d) => d.id === Number(params[0]))
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმი ვერ მოიძებნა')
  if (typeof body.room === 'string' && body.room.trim()) doctor.room = body.room.trim()
  if (body.workHours) doctor.workHours = body.workHours
  if (Array.isArray(body.workDays)) doctor.workDays = body.workDays
  if (typeof body.active === 'boolean') doctor.active = body.active
  saveDb(db)
  return doctor
})

route('GET', '/api/admin/stats', ({ db, token }) => {
  requireAuth(db, token, ['admin'])
  const all = db.appointments
  const cancelled = all.filter((a) => a.status === 'cancelled').length
  const byDoctor = db.doctors
    .map((d) => ({
      doctorId: d.id,
      doctorName: d.fullName,
      count: all.filter((a) => a.doctorId === d.id && a.status !== 'cancelled').length,
    }))
    .sort((a, b) => b.count - a.count)
  return {
    totalAppointments: all.length,
    confirmed: all.filter((a) => a.status === 'confirmed').length,
    completed: all.filter((a) => a.status === 'completed').length,
    cancelled,
    cancellationRate: all.length ? Math.round((cancelled / all.length) * 100) : 0,
    byDoctor,
  } satisfies AdminStats
})

/* ---------- entry point used by services/http.ts ---------- */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function handleRequest<T>(method: string, url: string, body: unknown, token: string | null): Promise<T> {
  await sleep(250 + Math.random() * 250) // network latency, makes loading states visible
  const parsed = new URL(url, 'http://mock.local')
  for (const r of routes) {
    if (r.method !== method) continue
    const match = r.pattern.exec(parsed.pathname)
    if (!match) continue
    const db = loadDb()
    const result = r.handler({ db, token, body: body ?? {}, params: match.slice(1), query: parsed.searchParams })
    return JSON.parse(JSON.stringify(result)) as T
  }
  throw new ApiError(404, 'NOT_FOUND', 'მისამართი ვერ მოიძებნა')
}
