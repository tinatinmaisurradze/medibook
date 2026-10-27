import type { DoctorDashboardData, DoctorPatientRecord, DoctorPatientSummary, ReviewsSummary, ReviewView } from '@/types'
import { http } from './http'

export const doctorPortalService = {
  dashboard: () => http.get<DoctorDashboardData>('/api/doctor/dashboard'),
  patients: () => http.get<DoctorPatientSummary[]>('/api/doctor/patients'),
  patient: (id: number) => http.get<DoctorPatientRecord>(`/api/doctor/patients/${id}`),
}

export const reviewService = {
  forDoctor: (doctorId: number) => http.get<ReviewsSummary>(`/api/doctors/${doctorId}/reviews`),
  create: (data: { appointmentId: number; rating: number; comment?: string }) => http.post<ReviewView>('/api/reviews', data),
  reply: (reviewId: number, reply: string) => http.post<ReviewView>(`/api/reviews/${reviewId}/reply`, { reply }),
}
