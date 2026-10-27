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
