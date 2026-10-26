import type { AdminStats, AppointmentView, Doctor } from '@/types'
import { http } from './http'

export const appointmentService = {
  create: (data: { doctorId: number; date: string; time: string; reason?: string }) =>
    http.post<AppointmentView>('/api/appointments', data),
  mine: () => http.get<AppointmentView[]>('/api/appointments/me'),
  cancel: (id: number) => http.patch<AppointmentView>(`/api/appointments/${id}/cancel`),
  recordVisit: (id: number, data: { diagnosis: string; prescription: string }) =>
    http.patch<AppointmentView>(`/api/appointments/${id}/visit`, data),
}

export const adminService = {
  stats: () => http.get<AdminStats>('/api/admin/stats'),
  appointments: () => http.get<AppointmentView[]>('/api/admin/appointments'),
  doctors: () => http.get<Doctor[]>('/api/admin/doctors'),
  updateDoctor: (id: number, patch: Partial<Pick<Doctor, 'room' | 'workDays' | 'workHours' | 'active'>>) =>
    http.patch<Doctor>(`/api/admin/doctors/${id}`, patch),
}
