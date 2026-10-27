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
  address: string
}

export type SpecialtyKey =
  | 'therapy'
  | 'cardiology'
  | 'pediatrics'
  | 'dermatology'
  | 'neurology'
  | 'orthopedics'
  | 'ophthalmology'

export interface Doctor {
  id: number
  fullName: string
  specialty: SpecialtyKey
  clinicId: number
  rating: number
  experienceYears: number
  bio: string
  room: string
  /** 0 = Sunday ... 6 = Saturday */
  workDays: number[]
  workHours: { start: string; end: string }
  slotMinutes: number
  active: boolean
  education?: string
  languages: string[]
  /** Computed by the API from reviews */
  reviewCount: number
  /** Only in the doctors list: the earliest free slots (up to 3) on the first day that has any */
  nextAvailable?: { date: string; times: string[] } | null
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled'

export interface Appointment {
  id: number
  doctorId: number
  patientId: number
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
  /** 1-5 stars. Free-text comments are intentionally not supported. */
  rating: number
  createdAt: string
}

/** A rating as shown to other people: anonymous, only the stars and the month */
export interface ReviewView {
  id: number
  doctorId: number
  appointmentId: number
  rating: number
  createdAt: string
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

export interface DaySlot {
  time: string
  status: 'free' | 'booked' | 'past'
  appointment: AppointmentView | null
  /** the patient shared an allergy list that is not empty */
  hasAllergyAlert: boolean
}

export interface PatientBrief {
  /** null = no medical profile, false = patient does not share it */
  shared: boolean | null
  allergies: string[]
  conditions: string[]
  medications: string[]
  visitsWithMe: number
  lastDiagnosis?: string
}

export interface DoctorDashboardData {
  today: string
  isWorkingDay: boolean
  nextWorkingDay: string | null
  workHours: { start: string; end: string }
  slotMinutes: number
  daySlots: DaySlot[]
  occupancy: { booked: number; total: number; free: number; percent: number; firstFree: string | null; endsAt: string | null }
  nextAppointment: (AppointmentView & { brief: PatientBrief }) | null
  /** Confirmed visits whose time has passed and still need a record */
  pendingRecords: AppointmentView[]
  weekLoad: { date: string; booked: number; total: number }[]
  stats: { next7Days: number; completedThisMonth: number; patients: number; rating: number; reviewCount: number; last5Average: number | null }
  recentRatings: ReviewView[]
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
