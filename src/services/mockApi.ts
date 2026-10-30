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
import { createSeedDb, defaultServices, priceFactor, SPECIALTY_LABELS, type Db, type DbDoctor } from '@/data/seed'
import type {
  AdminStats,
  Appointment,
  AppointmentDetail,
  AppointmentView,
  AuthResponse,
  Doctor,
  DoctorDashboardData,
  DoctorLocation,
  DoctorPatientRecord,
  DoctorPatientSummary,
  Paginated,
  SlotGroup,
  SlotsResponse,
  ProfileResponse,
  Review,
  ReviewsSummary,
  ReviewView,
  SpecialtyKey,
  User,
} from '@/types'
import { addDays, minutesToTime, msUntil, parseISODate, timeToMinutes, toISODate } from '@/utils/date'
import en from '@/i18n/en'
import { cardBrand, digitsOnly, isValidCvc, isValidExpiry, luhn, TEST_CARDS } from '@/utils/payment'
import {
  bookingPayloadSchema,
  doctorProfileSchema,
  generalProfileSchema,
  locationsSchema,
  medicalSchema,
  passwordChangeSchema,
  paymentSchema,
  registerFields,
  replySchema,
  reviewSchema,
  servicesSchema,
  visitSchema,
} from '@/utils/validation'

const DB_KEY = 'medibook_db_v5'
/** localStorage key of the database; other tabs get a `storage` event when it changes */
export const DB_STORAGE_KEY = DB_KEY
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
      if (Array.isArray(parsed.reviews) && parsed.medical && Array.isArray(parsed.services) && parsed.seq?.service && parsed.clinics?.[0]?.region) return parsed
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

/* ---------- engine settings: what differs between the browser mock and a real server ---------- */

export interface TokenPayload {
  sub: number
  role: User['role']
  exp: number
}

export interface EngineConfig {
  /** artificial network delay, so loading states are visible in the browser mock */
  latency: boolean
  hashPassword: (plain: string) => string
  verifyPassword: (plain: string, stored: string) => boolean
  signToken: (payload: TokenPayload) => string
  verifyToken: (token: string) => TokenPayload | null
}

const b64 = (o: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, '')
const unb64 = (s: string) => JSON.parse(decodeURIComponent(escape(atob(s))))

/** Browser mock: plain passwords and a token whose signature is NOT cryptographic. Never use this on a real server. */
const mockEngine: EngineConfig = {
  latency: true,
  hashPassword: (plain) => plain,
  verifyPassword: (plain, stored) => plain === stored,
  signToken: (payload) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.mock-signature`,
  verifyToken: (token) => {
    try {
      const payload = unb64(token.split('.')[1]) as TokenPayload
      return payload.exp > Date.now() ? payload : null
    } catch {
      return null
    }
  },
}
let engine: EngineConfig = mockEngine

/** The real server (server/index.ts) replaces password hashing and token signing here */
export function configureEngine(config: Partial<EngineConfig>) {
  engine = { ...engine, ...config }
}

/* ---------- tokens ---------- */

export function createToken(user: User): string {
  return engine.signToken({ sub: user.id, role: user.role, exp: Date.now() + TOKEN_TTL_MS })
}

export function readToken(token: string | null): TokenPayload | null {
  if (!token) return null
  try {
    return engine.verifyToken(token)
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
  const clinic = db.clinics.find((c) => c.id === a.clinicId) ?? db.clinics[0]
  const location = doctor.locations.find((l) => l.clinicId === a.clinicId)
  const patient = db.users.find((u) => u.id === a.patientId)
  return {
    ...a,
    doctorName: doctor.fullName,
    specialty: doctor.specialty,
    clinicName: clinic.name,
    room: location?.room ?? '',
    patientName: patient?.fullName ?? 'უცნობი პაციენტი',
  }
}

/** Administrators manage schedules, they must not see medical content */
function toAdminView(db: Db, a: Appointment): AppointmentView {
  return { ...toView(db, a), reason: undefined, diagnosis: undefined, prescription: undefined }
}

function doctorWithStats(db: Db, doctor: DbDoctor): Doctor {
  const rs = db.reviews.filter((r) => r.doctorId === doctor.id)
  const rating = rs.length ? Math.round((rs.reduce((sum, r) => sum + r.rating, 0) / rs.length) * 10) / 10 : doctor.rating
  const services = db.services.filter((s) => s.doctorId === doctor.id)
  const first = doctor.locations[0]
  return {
    ...doctor,
    rating,
    reviewCount: rs.length,
    services,
    priceFrom: services.length ? Math.min(...services.map((s) => s.price)) : null,
    // summary values for screens that need one line only; the real schedule is in `locations`
    clinicId: first?.clinicId ?? 0,
    room: first?.room ?? '',
    workDays: Array.from(new Set(doctor.locations.flatMap((l) => l.days))).sort(),
    workHours: first ? { start: first.start, end: first.end } : { start: '09:00', end: '18:00' },
    slotMinutes: first?.slotMinutes ?? 30,
  }
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

/** Free and taken times for one day, grouped by the clinic where the doctor receives patients that day */
function buildSlots(db: Db, doctor: DbDoctor, date: string, clinicId?: number): SlotGroup[] {
  const d = parseISODate(date)
  if (Number.isNaN(d.getTime())) return []
  // a time is taken when the doctor has any visit at it, at any clinic
  const taken = new Set(db.appointments.filter((a) => a.doctorId === doctor.id && a.date === date && a.status !== 'cancelled').map((a) => a.time))
  return doctor.locations
    .filter((l) => l.days.includes(d.getDay()) && (!clinicId || l.clinicId === clinicId))
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((l) => {
      const clinic = db.clinics.find((c) => c.id === l.clinicId)!
      const slots: { time: string; available: boolean }[] = []
      for (let t = timeToMinutes(l.start); t + l.slotMinutes <= timeToMinutes(l.end); t += l.slotMinutes) {
        const time = minutesToTime(t)
        slots.push({ time, available: !taken.has(time) && msUntil(date, time) > 0 })
      }
      return { clinicId: l.clinicId, clinicName: clinic.name, address: clinic.address, room: l.room, slotMinutes: l.slotMinutes, slots }
    })
}

/** the earliest free times (up to 3) at one clinic, on the first day within `days` that has any */
function nextAvailability(db: Db, doctor: DbDoctor, days = 30): Doctor['nextAvailable'] {
  for (let i = 0; i < days; i++) {
    const date = toISODate(addDays(new Date(), i))
    for (const g of buildSlots(db, doctor, date)) {
      const free = g.slots.filter((s) => s.available)
      if (free.length) return { date, clinicId: g.clinicId, clinicName: g.clinicName, times: free.slice(0, 3).map((s) => s.time) }
    }
  }
  return null
}

const hasFreeSlotOn = (db: Db, doctor: DbDoctor, date: string) => buildSlots(db, doctor, date).some((g) => g.slots.some((s) => s.available))

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
    password: engine.hashPassword(input.password),
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

  const found = db.users.find((u) => u.email === email)
  const user = found && engine.verifyPassword(password, found.password) ? found : undefined
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
  if (!engine.verifyPassword(input.currentPassword, user.password)) throw new ApiError(422, 'WRONG_PASSWORD', 'მიმდინარე პაროლი არასწორია')
  user.password = engine.hashPassword(input.newPassword)
  saveDb(db)
  return { ok: true }
})

/* ----- public catalogue ----- */

route('GET', '/api/clinics', ({ db }) => db.clinics)

route('GET', '/api/doctors', ({ db, query }) => {
  const specialty = query.get('specialty') as SpecialtyKey | null
  const clinicId = Number(query.get('clinicId')) || null
  const minRating = Number(query.get('minRating')) || 0
  const maxPrice = Number(query.get('maxPrice')) || 0
  const availability = query.get('availability')
  const region = query.get('region') ?? ''
  const municipality = query.get('municipality') ?? ''
  const network = query.get('network') ?? ''
  const q = (query.get('q') ?? '').trim().toLowerCase()
  const sort = query.get('sort') ?? 'rating'
  const page = Math.max(1, Number(query.get('page')) || 1)
  const pageSize = Math.min(50, Number(query.get('pageSize')) || PAGE_SIZE)

  let list = db.doctors.filter((d) => d.active).map((d) => ({ ...doctorWithStats(db, d), nextAvailable: nextAvailability(db, d) }))
  if (specialty) list = list.filter((d) => d.specialty === specialty)
  if (clinicId) list = list.filter((d) => d.locations.some((l) => l.clinicId === clinicId))
  if (region) list = list.filter((d) => d.region === region)
  if (municipality || network) {
    // a doctor matches when at least one of the clinics where the doctor works matches
    const clinicById = new Map(db.clinics.map((c) => [c.id, c]))
    list = list.filter((d) =>
      d.locations.some((l) => {
        const c = clinicById.get(l.clinicId)
        return !!c && (!municipality || c.municipality === municipality) && (!network || c.network === network)
      }),
    )
  }
  if (minRating) list = list.filter((d) => d.rating >= minRating)
  if (maxPrice) list = list.filter((d) => d.priceFrom !== null && d.priceFrom <= maxPrice)
  if (q) list = list.filter((d) => [d.fullName, en[d.fullName], SPECIALTY_LABELS[d.specialty], en[SPECIALTY_LABELS[d.specialty]]].some((x) => (x ?? '').toLowerCase().includes(q)))
  if (availability === 'today' || availability === 'tomorrow' || availability === 'week' || availability === 'month') {
    const todayIso = toISODate(new Date())
    const tomorrowIso = toISODate(addDays(new Date(), 1))
    list = list.filter((d) => {
      const doctor = db.doctors.find((x) => x.id === d.id)!
      if (availability === 'today') return hasFreeSlotOn(db, doctor, todayIso)
      if (availability === 'tomorrow') return hasFreeSlotOn(db, doctor, tomorrowIso)
      return nextAvailability(db, doctor, availability === 'month' ? 30 : 7) !== null
    })
  }
  const soonest = (d: (typeof list)[number]) => (d.nextAvailable ? `${d.nextAvailable.date}${d.nextAvailable.times[0]}` : '9999')
  list = [...list].sort((a, b) =>
    sort === 'experience'
      ? b.experienceYears - a.experienceYears
      : sort === 'name'
        ? a.fullName.localeCompare(b.fullName, 'ka')
        : sort === 'soonest'
          ? soonest(a).localeCompare(soonest(b))
          : sort === 'price'
            ? (a.priceFrom ?? 1e9) - (b.priceFrom ?? 1e9)
            : b.rating - a.rating,
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
  const clinicId = Number(query.get('clinicId')) || undefined
  return { doctorId: doctor.id, date, groups: buildSlots(db, doctor, date, clinicId) } satisfies SlotsResponse
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

  const group = buildSlots(db, doctor, input.date, input.clinicId)[0]
  if (!group) throw new ApiError(422, 'INVALID_SLOT', 'ექიმი ამ დღეს ამ კლინიკაში არ იღებს')
  const slot = group.slots.find((s) => s.time === input.time)
  if (!slot) throw new ApiError(422, 'INVALID_SLOT', 'ექიმი ამ დროს არ მუშაობს')
  if (!slot.available) throw new ApiError(409, 'SLOT_TAKEN', 'ეს დრო უკვე დაკავებულია')

  const overlap = db.appointments.some((a) => a.patientId === user.id && a.date === input.date && a.time === input.time && a.status !== 'cancelled')
  if (overlap) throw new ApiError(409, 'PATIENT_BUSY', 'ამ დროს სხვა ექიმთან უკვე გაქვთ ვიზიტი')

  // the visit type must belong to this doctor at this clinic; the price is fixed at the moment of booking
  const offered = db.services.filter((s) => s.doctorId === doctor.id && s.clinicId === input.clinicId)
  const service = input.serviceId ? offered.find((s) => s.id === input.serviceId) : offered[0]
  if (input.serviceId && !service) throw new ApiError(422, 'INVALID_SERVICE', 'ეს მომსახურება ამ კლინიკაში არ არსებობს')
  const price = service?.price ?? 0
  const method = input.paymentMethod ?? 'cashier'

  const appt: Appointment = {
    id: db.seq.appointment++,
    doctorId: doctor.id,
    patientId: user.id,
    clinicId: input.clinicId,
    serviceId: service?.id,
    serviceName: service?.name,
    price,
    paymentMethod: method,
    paymentStatus: price <= 0 ? 'none' : method === 'online' ? 'pending' : 'at_clinic',
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

/** demo checkout: never a real payment; the card number is validated and then forgotten (only brand and last 4 digits stay) */
const paymentAttempts = new Map<number, number>()

route('POST', '/api/appointments/:id/pay', ({ db, token, params, body }) => {
  const user = requireAuth(db, token, ['patient'])
  const appt = db.appointments.find((a) => a.id === Number(params[0]) && a.patientId === user.id)
  if (!appt) throw new ApiError(404, 'NOT_FOUND', 'ვიზიტი ვერ მოიძებნა')
  if (appt.status === 'cancelled') throw new ApiError(409, 'NOT_PAYABLE', 'გაუქმებული ვიზიტის გადახდა შეუძლებელია')
  if (appt.paymentStatus === 'paid') throw new ApiError(409, 'ALREADY_PAID', 'ეს ვიზიტი უკვე გადახდილია')
  if (appt.price <= 0) throw new ApiError(409, 'NOTHING_TO_PAY', 'ამ ვიზიტზე გადასახდელი თანხა არ არის')

  const input = parse(paymentSchema, body)
  const attempts = paymentAttempts.get(appt.id) ?? 0
  if (attempts >= 5) throw new ApiError(429, 'TOO_MANY_ATTEMPTS', 'ძალიან ბევრი წარუმატებელი მცდელობა. სცადეთ მოგვიანებით ან გადაიხადეთ რეგისტრატურაში')

  let brand = 'Apple Pay'
  let last4 = '4242'
  if (input.method === 'card') {
    const number = digitsOnly(input.cardNumber ?? '')
    if (!luhn(number)) throw new ApiError(422, 'INVALID_CARD', 'ბარათის ნომერი არასწორია')
    if (!isValidExpiry(input.expiry ?? '')) throw new ApiError(422, 'INVALID_EXPIRY', 'ბარათის ვადა არასწორია ან ამოწურულია')
    if (!isValidCvc(input.cvc ?? '')) throw new ApiError(422, 'INVALID_CVC', 'CVC არასწორია')
    if (number === TEST_CARDS.declined || number === TEST_CARDS.insufficient) {
      paymentAttempts.set(appt.id, attempts + 1)
      throw new ApiError(402, number === TEST_CARDS.declined ? 'CARD_DECLINED' : 'INSUFFICIENT_FUNDS', number === TEST_CARDS.declined ? 'ბანკმა ტრანზაქცია უარყო (სატესტო ბარათი)' : 'ბარათზე თანხა არასაკმარისია (სატესტო ბარათი)')
    }
    brand = cardBrand(number)
    last4 = number.slice(-4)
  }

  paymentAttempts.delete(appt.id)
  appt.paymentStatus = 'paid'
  appt.paymentMethod = 'online'
  appt.paidAt = new Date().toISOString()
  appt.cardBrand = brand
  appt.cardLast4 = last4
  appt.receiptNo = `MB-${appt.date.slice(0, 4)}-${String(appt.id).padStart(6, '0')}`
  saveDb(db)
  return toView(db, appt)
})

route('PATCH', '/api/appointments/:id/payment-method', ({ db, token, params, body }) => {
  const user = requireAuth(db, token, ['patient'])
  const appt = db.appointments.find((a) => a.id === Number(params[0]) && a.patientId === user.id)
  if (!appt) throw new ApiError(404, 'NOT_FOUND', 'ვიზიტი ვერ მოიძებნა')
  if (appt.status !== 'confirmed') throw new ApiError(409, 'NOT_PAYABLE', 'გადახდის ცვლილება ამ ვიზიტზე შეუძლებელია')
  if (appt.paymentStatus === 'paid') throw new ApiError(409, 'ALREADY_PAID', 'ეს ვიზიტი უკვე გადახდილია')
  const method = body.method
  if (method !== 'online' && method !== 'cashier') throw new ApiError(422, 'VALIDATION', 'აირჩიეთ გადახდის წესი')
  appt.paymentMethod = method
  appt.paymentStatus = appt.price <= 0 ? 'none' : method === 'online' ? 'pending' : 'at_clinic'
  saveDb(db)
  return toView(db, appt)
})

route('GET', '/api/appointments/me', ({ db, token }) => {
  const user = requireAuth(db, token, ['patient', 'doctor'])
  const mine = db.appointments.filter((a) => (user.role === 'patient' ? a.patientId === user.id : a.doctorId === user.doctorId))
  return mine.map((a) => toView(db, a)).sort(byDateTimeDesc)
})

/** Filters and pages visits. Admin results are built from the stripped admin view, so medical text can neither be seen nor searched. */
function searchAppointments(db: Db, base: Appointment[], query: URLSearchParams, adminView: boolean) {
  const q = (query.get('q') ?? '').trim().toLowerCase()
  const status = query.get('status') ?? ''
  const from = query.get('from') ?? ''
  const to = query.get('to') ?? ''
  const clinicId = Number(query.get('clinicId')) || 0
  const doctorId = Number(query.get('doctorId')) || 0
  const specialty = query.get('specialty') ?? ''
  const payment = query.get('payment') ?? ''
  const sort = query.get('sort') ?? 'date_desc'
  const page = Math.max(1, Number(query.get('page')) || 1)
  const pageSize = Math.min(50, Number(query.get('pageSize')) || 10)

  let views = base.map((a) => (adminView ? toAdminView(db, a) : toView(db, a)))
  if (q) {
    views = views.filter((v) =>
      [v.doctorName, v.patientName, v.reason, v.diagnosis, v.prescription, v.serviceName, v.clinicName]
        .flatMap((x) => (x ? [x, en[x] ?? ''] : []))
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }
  if (from) views = views.filter((v) => v.date >= from)
  if (to) views = views.filter((v) => v.date <= to)
  if (clinicId) views = views.filter((v) => v.clinicId === clinicId)
  if (doctorId) views = views.filter((v) => v.doctorId === doctorId)
  if (specialty) views = views.filter((v) => v.specialty === specialty)
  if (payment) views = views.filter((v) => v.paymentStatus === payment)

  // the numbers next to the status tabs ignore the status filter itself
  const counts = {
    confirmed: views.filter((v) => v.status === 'confirmed').length,
    completed: views.filter((v) => v.status === 'completed').length,
    cancelled: views.filter((v) => v.status === 'cancelled').length,
  }
  if (status) views = views.filter((v) => v.status === status)
  views.sort(sort === 'date_asc' ? byDateTimeAsc : byDateTimeDesc)

  const total = views.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const paidTotal = views.filter((v) => v.paymentStatus === 'paid').reduce((sum, v) => sum + v.price, 0)
  return { data: views.slice((page - 1) * pageSize, page * pageSize), page, totalPages, total, counts, paidTotal }
}

route('GET', '/api/appointments/search', ({ db, token, query }) => {
  const user = requireAuth(db, token, ['patient', 'doctor'])
  const mine = db.appointments.filter((a) => (user.role === 'patient' ? a.patientId === user.id : a.doctorId === user.doctorId))
  return searchAppointments(db, mine, query, false)
})

route('GET', '/api/appointments/:id', ({ db, token, params }) => {
  const user = requireAuth(db, token, ['patient', 'doctor'])
  const appt = db.appointments.find((a) => a.id === Number(params[0]))
  const allowed = appt && (user.role === 'patient' ? appt.patientId === user.id : appt.doctorId === user.doctorId)
  // same answer for "missing" and "not yours", so ids of other people's visits are not revealed
  if (!appt || !allowed) throw new ApiError(404, 'NOT_FOUND', 'ვიზიტი ვერ მოიძებნა')

  const doctor = db.doctors.find((d) => d.id === appt.doctorId)!
  const clinic = db.clinics.find((c) => c.id === appt.clinicId) ?? db.clinics[0]
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
  appt.paymentStatus = appt.paymentStatus === 'paid' ? 'refund_pending' : 'none'
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

/* ----- schedules and prices ----- */

/** Replaces the doctor's places of work. The same rules apply to the doctor and to the administrator. */
function saveLocations(db: Db, doctor: DbDoctor, body: unknown): Doctor {
  const input = parse(locationsSchema, body)
  input.locations.forEach((l) => {
    if (!db.clinics.some((c) => c.id === l.clinicId)) throw new ApiError(422, 'VALIDATION', 'კლინიკა ვერ მოიძებნა')
  })
  // a doctor works in ONE city: several clinics or branches of that city are fine, two cities are not
  const cities = new Set(input.locations.map((l) => db.clinics.find((c) => c.id === l.clinicId)!.city))
  if (cities.size > 1) throw new ApiError(422, 'MIXED_CITIES', 'ექიმი მუშაობს ერთ ქალაქში: შეგიძლიათ აირჩიოთ ამ ქალაქის რამდენიმე კლინიკა, მაგრამ არა სხვადასხვა ქალაქის')
  // one doctor cannot be in two places at once: hours of different places must not overlap on the same day
  for (let day = 0; day < 7; day++) {
    const ranges = input.locations.filter((l) => l.days.includes(day)).map((l) => [l.start, l.end]).sort((a, b) => a[0].localeCompare(b[0]))
    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i][0] < ranges[i - 1][1]) throw new ApiError(422, 'SCHEDULE_OVERLAP', 'ერთსა და იმავე დღეს სხვადასხვა კლინიკის საათები არ უნდა იკვეთებოდეს')
    }
  }
  const next: DoctorLocation[] = input.locations.map((l) => ({ id: db.seq.location++, ...l }))
  // visits that are already booked must still fit into the new schedule
  const orphan = db.appointments.filter(
    (a) =>
      a.doctorId === doctor.id &&
      a.status === 'confirmed' &&
      msUntil(a.date, a.time) > 0 &&
      !next.some(
        (l) =>
          l.clinicId === a.clinicId &&
          l.days.includes(parseISODate(a.date).getDay()) &&
          timeToMinutes(a.time) >= timeToMinutes(l.start) &&
          timeToMinutes(a.time) + l.slotMinutes <= timeToMinutes(l.end) &&
          (timeToMinutes(a.time) - timeToMinutes(l.start)) % l.slotMinutes === 0,
      ),
  )
  if (orphan.length) throw new ApiError(409, 'HAS_APPOINTMENTS', `ცვლილება შეუძლებელია: ${orphan.length} დაგეგმილი ვიზიტი ახალ გრაფიკში აღარ ჯდება. ჯერ გააუქმეთ ან გადაიტანეთ ისინი`)

  const place = db.clinics.find((c) => c.id === next[0].clinicId)!
  doctor.city = place.city
  doctor.region = place.region
  doctor.locations = next
  // visit types follow the clinics: remove those of clinics that are gone, create defaults for new ones
  const clinicIds = new Set(next.map((l) => l.clinicId))
  db.services = db.services.filter((s) => s.doctorId !== doctor.id || clinicIds.has(s.clinicId))
  clinicIds.forEach((clinicId) => {
    if (!db.services.some((s) => s.doctorId === doctor.id && s.clinicId === clinicId)) {
      const duration = next.find((l) => l.clinicId === clinicId)!.slotMinutes
      db.services.push(...defaultServices(doctor.specialty, doctor.id, clinicId, duration, db.seq.service, priceFactor(db.clinics.find((c) => c.id === clinicId)!)))
      db.seq.service += 3
    }
  })
  saveDb(db)
  return doctorWithStats(db, doctor)
}

function saveServices(db: Db, doctor: DbDoctor, body: unknown): Doctor {
  const input = parse(servicesSchema, body)
  const clinicIds = new Set(doctor.locations.map((l) => l.clinicId))
  if (input.services.some((s) => !clinicIds.has(s.clinicId))) throw new ApiError(422, 'VALIDATION', 'მომსახურება უნდა მიეკუთვნებოდეს კლინიკას, სადაც ექიმი იღებს')
  clinicIds.forEach((id) => {
    if (!input.services.some((s) => s.clinicId === id)) throw new ApiError(422, 'VALIDATION', 'ყველა კლინიკას სჭირდება მინიმუმ ერთი მომსახურება')
  })
  const old = db.services.filter((s) => s.doctorId === doctor.id)
  const fresh = input.services.map((s) => ({
    id: old.find((o) => o.clinicId === s.clinicId && o.name === s.name)?.id ?? db.seq.service++,
    doctorId: doctor.id,
    ...s,
  }))
  db.services = db.services.filter((s) => s.doctorId !== doctor.id).concat(fresh)
  saveDb(db)
  return doctorWithStats(db, doctor)
}

route('PUT', '/api/profile/doctor/locations', ({ db, token, body }) => {
  const user = requireAuth(db, token, ['doctor'])
  const doctor = db.doctors.find((d) => d.id === user.doctorId)
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმის პროფილი ვერ მოიძებნა')
  return saveLocations(db, doctor, body)
})

route('PUT', '/api/profile/doctor/services', ({ db, token, body }) => {
  const user = requireAuth(db, token, ['doctor'])
  const doctor = db.doctors.find((d) => d.id === user.doctorId)
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმის პროფილი ვერ მოიძებნა')
  return saveServices(db, doctor, body)
})

route('PUT', '/api/admin/doctors/:id/locations', ({ db, token, params, body }) => {
  requireAuth(db, token, ['admin'])
  const doctor = db.doctors.find((d) => d.id === Number(params[0]))
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმი ვერ მოიძებნა')
  return saveLocations(db, doctor, body)
})

route('PUT', '/api/admin/doctors/:id/services', ({ db, token, params, body }) => {
  requireAuth(db, token, ['admin'])
  const doctor = db.doctors.find((d) => d.id === Number(params[0]))
  if (!doctor) throw new ApiError(404, 'NOT_FOUND', 'ექიმი ვერ მოიძებნა')
  return saveServices(db, doctor, body)
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

route('GET', '/api/doctor/patients', ({ db, token, query }) => {
  const user = requireAuth(db, token, ['doctor'])
  const mine = db.appointments.filter((a) => a.doctorId === user.doctorId && a.status !== 'cancelled')
  const ids = Array.from(new Set(mine.map((a) => a.patientId)))
  const today = toISODate(new Date())
  const q = (query.get('q') ?? '').trim().toLowerCase()
  const page = Math.max(1, Number(query.get('page')) || 1)
  const pageSize = Math.min(50, Number(query.get('pageSize')) || 10)

  let list = ids
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
  if (q) list = list.filter((p) => [p.fullName, p.email, p.phone ?? ''].join(' ').toLowerCase().includes(q))
  const total = list.length
  return { data: list.slice((page - 1) * pageSize, page * pageSize), page, totalPages: Math.max(1, Math.ceil(total / pageSize)), total } satisfies Paginated<DoctorPatientSummary>
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
  if (typeof body.active === 'boolean') doctor.active = body.active
  saveDb(db)
  return doctorWithStats(db, doctor)
})

route('GET', '/api/admin/visits', ({ db, token, query }) => {
  requireAuth(db, token, ['admin'])
  return searchAppointments(db, db.appointments, query, true)
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
  const sum = (list: Appointment[]) => list.reduce((total, a) => total + a.price, 0)
  return {
    totalAppointments: all.length,
    confirmed: all.filter((a) => a.status === 'confirmed').length,
    completed: all.filter((a) => a.status === 'completed').length,
    cancelled,
    cancellationRate: all.length ? Math.round((cancelled / all.length) * 100) : 0,
    byDoctor,
    revenue: {
      paid: sum(all.filter((a) => a.paymentStatus === 'paid')),
      pending: sum(all.filter((a) => a.paymentStatus === 'pending')),
      atClinic: sum(all.filter((a) => a.paymentStatus === 'at_clinic')),
      refundPending: sum(all.filter((a) => a.paymentStatus === 'refund_pending')),
      byClinic: db.clinics.map((c) => ({ clinicId: c.id, clinicName: c.name, paid: sum(all.filter((a) => a.clinicId === c.id && a.paymentStatus === 'paid')) })),
    },
  } satisfies AdminStats
})

/* ---------- entry point used by services/http.ts ---------- */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function handleRequest<T>(method: string, url: string, body: unknown, token: string | null): Promise<T> {
  if (engine.latency) await sleep(250 + Math.random() * 250) // network latency, makes loading states visible
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
