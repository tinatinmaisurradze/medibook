export type Role = 'patient' | 'doctor' | 'admin'

export interface User {
  id: number
  fullName: string
  email: string
  phone?: string
  role: Role
  /** Only for users with role "doctor" */
  doctorId?: number
  /** YYYY-MM-DD */
  dateOfBirth?: string
  city?: string
}

export interface Clinic {
  id: number
  name: string
  /** clinic network, for example "ევექსი" */
  network: string
  address: string
  /** region (რეგიონი), city (ქალაქი) and municipality / district (მუნიციპალიტეტი) */
  region: string
  city: string
  municipality: string
}

export type SpecialtyKey =
  | 'therapy'
  | 'cardiology'
  | 'pediatrics'
  | 'dermatology'
  | 'neurology'
  | 'orthopedics'
  | 'ophthalmology'

/** One place where a doctor receives patients, with its own weekly schedule */
export interface DoctorLocation {
  id: number
  clinicId: number
  room: string
  /** 0 = Sunday ... 6 = Saturday */
  days: number[]
  start: string
  end: string
  slotMinutes: number
}

/** A kind of visit with its price (for example "first consultation") at one clinic */
export interface DoctorService {
  id: number
  doctorId: number
  clinicId: number
  name: string
  /** price in GEL */
  price: number
  durationMin: number
}

export interface Doctor {
  id: number
  fullName: string
  specialty: SpecialtyKey
  rating: number
  experienceYears: number
  bio: string
  active: boolean
  education?: string
  languages: string[]
  /** Computed by the API from reviews */
  reviewCount: number
  /** City where the doctor works. A doctor works in one city only (several clinics of that city are fine) */
  city: string
  region: string
  /** Every place the doctor works at, with days and hours */
  locations: DoctorLocation[]
  /** Visit types and prices (filled in by the API) */
  services: DoctorService[]
  /** Lowest price among the services (filled in by the API) */
  priceFrom: number | null
  /** The earliest free slots (up to 3) at one clinic, on the first day that has any (doctors list only) */
  nextAvailable?: { date: string; clinicId: number; clinicName: string; times: string[] } | null
  /* Summary values derived from `locations` for screens that need only one line */
  clinicId: number
  room: string
  workDays: number[]
  workHours: { start: string; end: string }
  slotMinutes: number
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled'

/** none = nothing to pay, pending = online payment chosen but not done, at_clinic = pay at the cashier, paid, refund_pending = paid and then cancelled */
export type PaymentStatus = 'none' | 'pending' | 'at_clinic' | 'paid' | 'refund_pending'
export type PaymentMethod = 'online' | 'cashier'

export interface Appointment {
  id: number
  doctorId: number
  patientId: number
  clinicId: number
  serviceId?: number
  serviceName?: string
  /** price in GEL at the moment of booking */
  price: number
  paymentMethod?: PaymentMethod
  paymentStatus: PaymentStatus
  paidAt?: string
  /** only the brand and the last 4 digits are ever stored */
  cardBrand?: string
  cardLast4?: string
  receiptNo?: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  reason?: string
  status: AppointmentStatus
  diagnosis?: string
  prescription?: string
  createdAt: string
}

export interface Slot {
  time: string
  available: boolean
}

/** Free and taken times of one doctor at one clinic on one day */
export interface SlotGroup {
  clinicId: number
  clinicName: string
  address: string
  room: string
  slotMinutes: number
  slots: Slot[]
}

export interface SlotsResponse {
  doctorId: number
  date: string
  groups: SlotGroup[]
}

export interface Paginated<T> {
  data: T[]
  page: number
  totalPages: number
  total: number
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiErrorBody {
  error: string
  message: string
}

/** Appointment enriched by the API with display data (joined on the "server") */
export interface AppointmentView extends Appointment {
  doctorName: string
  specialty: SpecialtyKey
  clinicName: string
  room: string
  patientName: string
}

export interface AdminStats {
  totalAppointments: number
  confirmed: number
  completed: number
  cancelled: number
  cancellationRate: number
  byDoctor: { doctorId: number; doctorName: string; count: number }[]
  /** demo money in GEL */
  revenue?: {
    paid: number
    pending: number
    atClinic: number
    refundPending: number
    byClinic: { clinicId: number; clinicName: string; paid: number }[]
  }
}

/** Result of the visit search: a page of visits, the number of visits per status and the paid total */
export interface AppointmentSearchResult extends Paginated<AppointmentView> {
  counts: { confirmed: number; completed: number; cancelled: number }
  paidTotal: number
}

/** Full visit record ("ანკეტა") returned by GET /api/appointments/:id */
export interface AppointmentDetail extends AppointmentView {
  patientEmail: string
  patientPhone?: string
  clinicAddress: string
  doctorExperienceYears: number
  /** Doctor view only: other visits of the same patient with this doctor */
  history: AppointmentView[]
  review: ReviewView | null
}

export type BloodType = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-'

/** Patient-entered medical history */
export interface MedicalProfile {
  bloodType: BloodType | ''
  heightCm?: number
  weightKg?: number
  allergies: string[]
  chronicConditions: string[]
  medications: string[]
  surgeries: string[]
  familyHistory: string
  /** When false, doctors cannot see this profile */
  sharedWithDoctors: boolean
  updatedAt?: string
}

export interface Review {
  id: number
  doctorId: number
  patientId: number
  appointmentId: number
  rating: number
  comment?: string
  createdAt: string
  doctorReply?: string
  doctorReplyAt?: string
}

/** Review as shown to other people: the patient name is shortened ("ნინო გ.") */
export interface ReviewView {
  id: number
  doctorId: number
  appointmentId: number
  rating: number
  comment?: string
  createdAt: string
  patientName: string
  doctorReply?: string
  doctorReplyAt?: string
}

export interface ReviewsSummary {
  average: number
  count: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  reviews: ReviewView[]
}

export interface ProfileResponse {
  user: User
  medicalProfile: MedicalProfile | null
  doctor: Doctor | null
}

export interface DoctorDashboardData {
  today: string
  todayAppointments: AppointmentView[]
  nextAppointment: AppointmentView | null
  stats: {
    today: number
    next7Days: number
    completedThisMonth: number
    patients: number
    rating: number
    reviewCount: number
  }
  /** Confirmed visits whose time has passed and still need a record */
  pendingRecords: AppointmentView[]
  weekLoad: { date: string; count: number }[]
  latestReviews: ReviewView[]
}

export interface DoctorPatientSummary {
  patientId: number
  fullName: string
  email: string
  phone?: string
  visitCount: number
  lastVisit: string | null
  nextVisit: string | null
}

export interface DoctorPatientRecord {
  patient: { id: number; fullName: string; email: string; phone?: string; dateOfBirth?: string; city?: string }
  /** null = patient has not filled it in; "hidden" = patient does not share it */
  medicalProfile: MedicalProfile | null | 'hidden'
  visits: AppointmentView[]
}
