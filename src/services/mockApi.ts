/**
 * In-browser mock backend.
 * It exposes the endpoints documented in the Tech Spec, keeps data in localStorage
 * (seeded from data/seed.ts) and issues JWT-shaped tokens.
 *
 * It enforces the same rules a real server must enforce:
 *  - every input is validated here again (never trust the browser),
 *  - every route checks the role AND that the record belongs to the caller,
 *  - passwords and other people's private data are never returned,
 *  - repeated failed logins are throttled.
 * Swapping it for a real server only requires replacing services/http.ts.
 */
import type { z, ZodTypeAny } from 'zod'
import { createSeedDb, type Db } from '@/data/seed'
import type {
  AdminStats,
  Appointment,
  AppointmentDetail,
  AppointmentView,
  AuthResponse,
  Doctor,
  DoctorDashboardData,
  DoctorPatientRecord,
  DoctorPatientSummary,
  Paginated,
  ProfileResponse,
  Review,
  ReviewsSummary,
  ReviewView,
  Slot,
  SpecialtyKey,
  User,
} from '@/types'
import { addDays, minutesToTime, msUntil, parseISODate, timeToMinutes, toISODate } from '@/utils/date'
import {
  bookingPayloadSchema,
  doctorProfileSchema,
  generalProfileSchema,
  medicalSchema,
  passwordChangeSchema,
  registerFields,
  replySchema,
  reviewSchema,
  visitSchema,
} from '@/utils/validation'

const DB_KEY = 'medibook_db_v2'
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8
const PAGE_SIZE = 6
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_MS = 5 * 60 * 1000

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
    if (raw) {
      const parsed = JSON.parse(raw) as Db
      if (Array.isArray(parsed.reviews) && parsed.medical && parsed.seq?.review) return parsed
    }
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

type DbUser = Db['users'][number]

/** never send the password out */
const publicUser = ({ password: _password, ...u }: DbUser): User => u

function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data)
  if (!result.success) throw new ApiError(422, 'VALIDATION', result.error.issues[0]?.message ?? 'მონაცემები არასწორია')
  return result.data
}

function requireAuth(db: Db, token: string | null, roles?: User['role'][]): DbUser {
  const payload = readToken(token)
  if (!payload) throw new ApiError(401, 'UNAUTHORIZED', 'სესია ამოიწურა. გთხოვთ, თავიდან შეხვიდეთ')
  const user = db.users.find((u) => u.id === payload.sub)
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'მომხმარებელი ვერ მოიძებნა')
  if (roles && !roles.includes(user.role)) throw new ApiError(403, 'FORBIDDEN', 'ამ მოქმედებაზე წვდომა არ გაქვთ')
  return user
}

const byDateTimeDesc = (a: { date: string; time: string }, b: { date: string; time: string }) =>
  `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)
const byDateTimeAsc = (a: { date: string; time: string }, b: { date: string; time: string }) => byDateTimeDesc(b, a)

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

/** Administrators manage schedules, they must not see medical content */
function toAdminView(db: Db, a: Appointment): AppointmentView {
  return { ...toView(db, a), reason: undefined, diagnosis: undefined, prescription: undefined }
}

function doctorWithStats(db: Db, doctor: Doctor): Doctor {
  const rs = db.reviews.filter((r) => r.doctorId === doctor.id)
  const rating = rs.length ? Math.round((rs.reduce((sum, r) => sum + r.rating, 0) / rs.length) * 10) / 10 : doctor.rating
  return { ...doctor, rating, reviewCount: rs.length }
}

/** "ნინო გელაშვილი" -> "ნინო გ." (reviews do not expose full patient names) */
function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts.length < 2 ? parts[0] : `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

function reviewView(db: Db, r: Review): ReviewView {
  const patient = db.users.find((u) => u.id === r.patientId)
  return {
    id: r.id,
    doctorId: r.doctorId,
    appointmentId: r.appointmentId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    patientName: patient ? shortName(patient.fullName) : 'პაციენტი',
    doctorReply: r.doctorReply,
    doctorReplyAt: r.doctorReplyAt,
  }
}

function summarize(db: Db, doctorId: number): ReviewsSummary {
  const rs = db.reviews.filter((r) => r.doctorId === doctorId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const distribution: ReviewsSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  rs.forEach((r) => {
    distribution[r.rating as 1 | 2 | 3 | 4 | 5] += 1
  })
  const average = rs.length ? Math.round((rs.reduce((sum, r) => sum + r.rating, 0) / rs.length) * 10) / 10 : 0
  return { average, count: rs.length, distribution, reviews: rs.map((r) => reviewView(db, r)) }
}

function buildSlots(db: Db, doctor: Doctor, date: string): Slot[] {
  const d = parseISODate(date)
  if (Number.isNaN(d.getTime()) || !doctor.workDays.includes(d.getDay())) return []
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

/** failed logins per e-mail: brute-force protection */
const failedLogins = new Map<string, { count: number; since: number }>()

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

/* ----- auth ----- */

route('POST', '/api/auth/register', ({ db, body }) => {
  const input = parse(registerFields, body)
  const email = input.email.toLowerCase()
  if (db.users.some((u) => u.email === email)) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'ეს ელ-ფოსტა უკვე გამოყენებულია')
  }
  const user: DbUser = {
    id: db.seq.user++,
    fullName: input.fullName,
    email,
    phone: input.phone || undefined,
    role: 'patient',
    password: input.password,
  }
  db.users.push(user)
  saveDb(db)
  const pub = publicUser(user)
  return { token: createToken(pub), user: pub } satisfies AuthResponse
})

route('POST', '/api/auth/login', ({ db, body }) => {
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')

  const entry = failedLogins.get(email)
  if (entry && Date.now() - entry.since > LOCKOUT_MS) failedLogins.delete(email)
  const current = failedLogins.get(email)
  if (current && current.count >= MAX_LOGIN_ATTEMPTS) {
    throw new ApiError(429, 'TOO_MANY_ATTEMPTS', 'ძალიან ბევრი წარუმატებელი მცდელობა. სცადეთ 5 წუთის შემდეგ')
  }

  const user = db.users.find((u) => u.email === email && u.password === password)
  if (!user) {
    failedLogins.set(email, { count: (current?.count ?? 0) + 1, since: current?.since ?? Date.now() })
    // same message for unknown e-mail and wrong password
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'ელ-ფოსტა ან პაროლი არასწორია')
  }
  failedLogins.delete(email)
  const pub = publicUser(user)
  return { token: createToken(pub), user: pub } satisfies AuthResponse
})

route('GET', '/api/auth/me', ({ db, token }) => publicUser(requireAuth(db, token)))

/* ----- profile ----- */

route('GET', '/api/profile', ({ db, token }) => {
  const user = requireAuth(db, token)
  const doctor = user.role === 'doctor' ? db.doctors.find((d) => d.id === user.doctorId) : undefined
  return {
    user: publicUser(user),
    medicalProfile: user.role === 'patient' ? (db.medical[user.id] ?? null) : null,
    doctor: doctor ? doctorWithStats(db, doctor) : null,
  } satisfies ProfileResponse
})

route('PATCH', '/api/profile', ({ db, token, body }) => {
  const user = requireAuth(db, token)
  const input = parse(generalProfileSchema, body)
  user.fullName = input.fullName
  user.phone = input.phone || undefined
  if (user.role === 'patient') {
    user.dateOfBirth = input.dateOfBirth || undefined
    user.city = input.city || undefined
  }
  if (user.role === 'doctor') {
    const doctor = db.doctors.find((d) => d.id === user.doctorId)
    if (doctor) doctor.fullName = input.fullName
  }
  saveDb(db)
  return publicUser(user)
})

route('PUT', '/api/profile/medical', ({ db, token, body }) => {
  const user = requireAuth(db, token, ['patient'])
  const input = parse(medicalSchema, body)
  db.medical[user.id] = { ...input, updatedAt: new Date().toISOString() }
  saveDb(db)
  return db.medical[user.id]
})

route('PATCH', '/api/profile/doctor', ({ db, token, body }) => {
  const user = requireAuth(db, token, ['doctor'])
  const doctor = db.doctors.find((d) => d.id === user.doctorId)
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმის პროფილი ვერ მოიძებნა')
  const input = parse(doctorProfileSchema, body)
  doctor.bio = input.bio
  doctor.education = input.education || undefined
  doctor.languages = Array.from(new Set(input.languages))
  saveDb(db)
  return doctorWithStats(db, doctor)
})

route('POST', '/api/profile/password', ({ db, token, body }) => {
  const user = requireAuth(db, token)
  const input = parse(passwordChangeSchema, body)
  if (user.password !== input.currentPassword) throw new ApiError(422, 'WRONG_PASSWORD', 'მიმდინარე პაროლი არასწორია')
  user.password = input.newPassword
  saveDb(db)
  return { ok: true }
})

/* ----- public catalogue ----- */

route('GET', '/api/clinics', ({ db }) => db.clinics)

route('GET', '/api/doctors', ({ db, query }) => {
  const specialty = query.get('specialty') as SpecialtyKey | null
  const clinicId = Number(query.get('clinicId')) || null
  const minRating = Number(query.get('minRating')) || 0
  const q = (query.get('q') ?? '').trim().toLowerCase()
  const sort = query.get('sort') ?? 'rating'
  const page = Math.max(1, Number(query.get('page')) || 1)
  const pageSize = Math.min(50, Number(query.get('pageSize')) || PAGE_SIZE)

  let list = db.doctors.filter((d) => d.active).map((d) => doctorWithStats(db, d))
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
  return doctorWithStats(db, doctor)
})

route('GET', '/api/doctors/:id/slots', ({ db, params, query }) => {
  const doctor = db.doctors.find((d) => d.id === Number(params[0]) && d.active)
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმი ვერ მოიძებნა')
  const date = query.get('date') ?? toISODate(new Date())
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(422, 'VALIDATION', 'თარიღის ფორმატი არასწორია')
  return { doctorId: doctor.id, date, slots: buildSlots(db, doctor, date) }
})

route('GET', '/api/doctors/:id/reviews', ({ db, params }) => {
  const doctor = db.doctors.find((d) => d.id === Number(params[0]) && d.active)
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმი ვერ მოიძებნა')
  return summarize(db, doctor.id)
})

/* ----- appointments ----- */

route('POST', '/api/appointments', ({ db, token, body }) => {
  const user = requireAuth(db, token, ['patient'])
  const input = parse(bookingPayloadSchema, body)
  const doctor = db.doctors.find((d) => d.id === input.doctorId && d.active)
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმი ვერ მოიძებნა')

  const slot = buildSlots(db, doctor, input.date).find((s) => s.time === input.time)
  if (!slot) throw new ApiError(422, 'INVALID_SLOT', 'ექიმი ამ დროს არ მუშაობს')
  if (!slot.available) throw new ApiError(409, 'SLOT_TAKEN', 'ეს დრო უკვე დაკავებულია')

  const overlap = db.appointments.some(
    (a) => a.patientId === user.id && a.date === input.date && a.time === input.time && a.status !== 'cancelled',
  )
  if (overlap) throw new ApiError(409, 'PATIENT_BUSY', 'ამ დროს სხვა ექიმთან უკვე გაქვთ ვიზიტი')

  const appt: Appointment = {
    id: db.seq.appointment++,
    doctorId: doctor.id,
    patientId: user.id,
    date: input.date,
    time: input.time,
    reason: input.reason || undefined,
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
  return mine.map((a) => toView(db, a)).sort(byDateTimeDesc)
})

route('GET', '/api/appointments/:id', ({ db, token, params }) => {
  const user = requireAuth(db, token, ['patient', 'doctor'])
  const appt = db.appointments.find((a) => a.id === Number(params[0]))
  const allowed = appt && (user.role === 'patient' ? appt.patientId === user.id : appt.doctorId === user.doctorId)
  // same answer for "missing" and "not yours", so ids of other people's visits are not revealed
  if (!appt || !allowed) throw new ApiError(404, 'NOT_FOUND', 'ვიზიტი ვერ მოიძებნა')

  const doctor = db.doctors.find((d) => d.id === appt.doctorId)!
  const clinic = db.clinics.find((c) => c.id === doctor.clinicId)!
  const patient = db.users.find((u) => u.id === appt.patientId)
  const history =
    user.role === 'doctor'
      ? db.appointments
          .filter((a) => a.patientId === appt.patientId && a.doctorId === appt.doctorId && a.id !== appt.id && a.status !== 'cancelled')
          .map((a) => toView(db, a))
          .sort(byDateTimeDesc)
      : []
  const review = db.reviews.find((r) => r.appointmentId === appt.id)

  return {
    ...toView(db, appt),
    patientEmail: patient?.email ?? '',
    patientPhone: patient?.phone,
    clinicAddress: clinic.address,
    doctorExperienceYears: doctor.experienceYears,
    history,
    review: review ? reviewView(db, review) : null,
  } satisfies AppointmentDetail
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
  return user.role === 'admin' ? toAdminView(db, appt) : toView(db, appt)
})

route('PATCH', '/api/appointments/:id/visit', ({ db, token, params, body }) => {
  const user = requireAuth(db, token, ['doctor'])
  const appt = db.appointments.find((a) => a.id === Number(params[0]) && a.doctorId === user.doctorId)
  if (!appt) throw new ApiError(404, 'NOT_FOUND', 'ვიზიტი ვერ მოიძებნა')
  if (appt.status === 'cancelled') throw new ApiError(409, 'NOT_EDITABLE', 'გაუქმებულ ვიზიტს ჩანაწერს ვერ დაამატებთ')
  const input = parse(visitSchema, body)
  appt.diagnosis = input.diagnosis
  appt.prescription = input.prescription
  appt.status = 'completed'
  saveDb(db)
  return toView(db, appt)
})

/* ----- reviews ----- */

route('POST', '/api/reviews', ({ db, token, body }) => {
  const user = requireAuth(db, token, ['patient'])
  const input = parse(reviewSchema, body)
  const appt = db.appointments.find((a) => a.id === input.appointmentId && a.patientId === user.id)
  if (!appt) throw new ApiError(404, 'NOT_FOUND', 'ვიზიტი ვერ მოიძებნა')
  if (appt.status !== 'completed') throw new ApiError(409, 'NOT_REVIEWABLE', 'შეფასება შესაძლებელია დასრულებული ვიზიტის შემდეგ')
  if (db.reviews.some((r) => r.appointmentId === appt.id)) throw new ApiError(409, 'ALREADY_REVIEWED', 'ეს ვიზიტი უკვე შეფასებულია')

  const review: Review = {
    id: db.seq.review++,
    doctorId: appt.doctorId,
    patientId: user.id,
    appointmentId: appt.id,
    rating: input.rating,
    comment: input.comment || undefined,
    createdAt: new Date().toISOString(),
  }
  db.reviews.push(review)
  saveDb(db)
  return reviewView(db, review)
})

route('POST', '/api/reviews/:id/reply', ({ db, token, params, body }) => {
  const user = requireAuth(db, token, ['doctor'])
  const review = db.reviews.find((r) => r.id === Number(params[0]) && r.doctorId === user.doctorId)
  if (!review) throw new ApiError(404, 'NOT_FOUND', 'შეფასება ვერ მოიძებნა')
  const input = parse(replySchema, body)
  review.doctorReply = input.reply
  review.doctorReplyAt = new Date().toISOString()
  saveDb(db)
  return reviewView(db, review)
})

/* ----- doctor workspace ----- */

route('GET', '/api/doctor/dashboard', ({ db, token }) => {
  const user = requireAuth(db, token, ['doctor'])
  const doctor = db.doctors.find((d) => d.id === user.doctorId)
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმის პროფილი ვერ მოიძებნა')

  const mine = db.appointments.filter((a) => a.doctorId === doctor.id)
  const confirmed = mine.filter((a) => a.status === 'confirmed')
  const today = toISODate(new Date())

  const todayAppointments = confirmed.filter((a) => a.date === today).sort(byDateTimeAsc).map((a) => toView(db, a))
  const next = confirmed.filter((a) => msUntil(a.date, a.time) > 0).sort(byDateTimeAsc)[0]
  const pendingRecords = confirmed.filter((a) => msUntil(a.date, a.time) <= 0).sort(byDateTimeAsc).map((a) => toView(db, a))
  const weekLoad = Array.from({ length: 7 }, (_, i) => {
    const date = toISODate(addDays(new Date(), i))
    return { date, count: confirmed.filter((a) => a.date === date).length }
  })
  const summary = summarize(db, doctor.id)

  return {
    today,
    todayAppointments,
    nextAppointment: next ? toView(db, next) : null,
    stats: {
      today: todayAppointments.length,
      next7Days: weekLoad.reduce((sum, d) => sum + d.count, 0),
      completedThisMonth: mine.filter((a) => a.status === 'completed' && a.date.startsWith(today.slice(0, 7))).length,
      patients: new Set(mine.filter((a) => a.status !== 'cancelled').map((a) => a.patientId)).size,
      rating: doctorWithStats(db, doctor).rating,
      reviewCount: summary.count,
    },
    pendingRecords,
    weekLoad,
    latestReviews: summary.reviews.slice(0, 3),
  } satisfies DoctorDashboardData
})

route('GET', '/api/doctor/patients', ({ db, token }) => {
  const user = requireAuth(db, token, ['doctor'])
  const mine = db.appointments.filter((a) => a.doctorId === user.doctorId && a.status !== 'cancelled')
  const ids = Array.from(new Set(mine.map((a) => a.patientId)))
  const today = toISODate(new Date())

  return ids
    .map((patientId): DoctorPatientSummary | null => {
      const patient = db.users.find((u) => u.id === patientId)
      if (!patient) return null
      const visits = mine.filter((a) => a.patientId === patientId)
      const past = visits.filter((a) => a.date <= today && a.status === 'completed').sort(byDateTimeDesc)
      const future = visits.filter((a) => a.status === 'confirmed' && msUntil(a.date, a.time) > 0).sort(byDateTimeAsc)
      return {
        patientId,
        fullName: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        visitCount: visits.length,
        lastVisit: past[0]?.date ?? null,
        nextVisit: future[0]?.date ?? null,
      }
    })
    .filter((p): p is DoctorPatientSummary => p !== null)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ka'))
})

route('GET', '/api/doctor/patients/:id', ({ db, token, params }) => {
  const user = requireAuth(db, token, ['doctor'])
  const patientId = Number(params[0])
  const visits = db.appointments.filter((a) => a.doctorId === user.doctorId && a.patientId === patientId)
  // a doctor may open a record only for patients who have (had) a visit with them
  if (!visits.some((a) => a.status !== 'cancelled')) throw new ApiError(404, 'NOT_FOUND', 'პაციენტი ვერ მოიძებნა')
  const patient = db.users.find((u) => u.id === patientId)
  if (!patient) throw new ApiError(404, 'NOT_FOUND', 'პაციენტი ვერ მოიძებნა')

  const medical = db.medical[patientId] ?? null
  return {
    patient: { id: patient.id, fullName: patient.fullName, email: patient.email, phone: patient.phone, dateOfBirth: patient.dateOfBirth, city: patient.city },
    medicalProfile: medical && !medical.sharedWithDoctors ? 'hidden' : medical,
    visits: visits.map((a) => toView(db, a)).sort(byDateTimeDesc),
  } satisfies DoctorPatientRecord
})

/* ----- admin ----- */

route('GET', '/api/admin/appointments', ({ db, token }) => {
  requireAuth(db, token, ['admin'])
  return db.appointments.map((a) => toAdminView(db, a)).sort(byDateTimeDesc)
})

route('GET', '/api/admin/doctors', ({ db, token }) => {
  requireAuth(db, token, ['admin'])
  return db.doctors.map((d) => doctorWithStats(db, d))
})

route('PATCH', '/api/admin/doctors/:id', ({ db, token, params, body }) => {
  requireAuth(db, token, ['admin'])
  const doctor = db.doctors.find((d) => d.id === Number(params[0]))
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმი ვერ მოიძებნა')
  if (typeof body.room === 'string' && body.room.trim()) doctor.room = body.room.trim().slice(0, 40)
  if (body.workHours) doctor.workHours = body.workHours
  if (Array.isArray(body.workDays)) doctor.workDays = body.workDays
  if (typeof body.active === 'boolean') doctor.active = body.active
  saveDb(db)
  return doctorWithStats(db, doctor)
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
