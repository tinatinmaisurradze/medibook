import type {
  Paginated, DoctorDashboardData, DoctorPatientRecord, DoctorPatientSummary, ReviewsSummary, ReviewView } from '@/types'
import { http } from './http'

export const doctorPortalService = {
  dashboard: () => http.get<DoctorDashboardData>('/api/doctor/dashboard'),
  patients: (q = '', page = 1, pageSize = 10) => http.get<Paginated<DoctorPatientSummary>>(`/api/doctor/patients?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`),
  patient: (id: number) => http.get<DoctorPatientRecord>(`/api/doctor/patients/${id}`),
}

export const reviewService = {
  forDoctor: (doctorId: number) => http.get<ReviewsSummary>(`/api/doctors/${doctorId}/reviews`),
  create: (data: { appointmentId: number; rating: number; comment?: string }) => http.post<ReviewView>('/api/reviews', data),
  reply: (reviewId: number, reply: string) => http.post<ReviewView>(`/api/reviews/${reviewId}/reply`, { reply }),
}
