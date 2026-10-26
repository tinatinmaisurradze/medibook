export type Role = 'patient' | 'doctor' | 'admin'

export interface User {
  id: number
  fullName: string
  email: string
  phone?: string
  role: Role
  /** Only for users with role "doctor" */
  doctorId?: number
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
