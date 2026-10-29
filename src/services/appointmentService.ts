import type { AdminStats, AppointmentDetail, AppointmentSearchResult, AppointmentView, Doctor, PaymentMethod } from '@/types'
import type { LocationsPayload, PaymentPayload, ServicesPayload } from '@/utils/validation'
import { http } from './http'

export interface BookingInput {
  doctorId: number
  clinicId: number
  serviceId?: number
  paymentMethod?: PaymentMethod
  date: string
  time: string
  reason?: string
}

/** Filters of the visit history (patient, doctor and administrator use the same ones) */
export interface VisitFilters {
  q?: string
  status?: 'confirmed' | 'completed' | 'cancelled' | ''
  from?: string
  to?: string
  clinicId?: number | ''
  doctorId?: number | ''
  specialty?: string
  payment?: string
  sort?: 'date_desc' | 'date_asc'
  page?: number
  pageSize?: number
}

function qs(params: Record<string, string | number | undefined | ''>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const appointmentService = {
  create: (data: BookingInput) => http.post<AppointmentView>('/api/appointments', data),
  mine: () => http.get<AppointmentView[]>('/api/appointments/me'),
  search: (f: VisitFilters) => http.get<AppointmentSearchResult>(`/api/appointments/search${qs({ ...f })}`),
  get: (id: number) => http.get<AppointmentDetail>(`/api/appointments/${id}`),
  cancel: (id: number) => http.patch<AppointmentView>(`/api/appointments/${id}/cancel`),
  recordVisit: (id: number, data: { diagnosis: string; prescription: string }) => http.patch<AppointmentView>(`/api/appointments/${id}/visit`, data),
  /** demo checkout: no real payment is made */
  pay: (id: number, data: PaymentPayload) => http.post<AppointmentView>(`/api/appointments/${id}/pay`, data),
  setPaymentMethod: (id: number, method: PaymentMethod) => http.patch<AppointmentView>(`/api/appointments/${id}/payment-method`, { method }),
}

export const adminService = {
  stats: () => http.get<AdminStats>('/api/admin/stats'),
  appointments: () => http.get<AppointmentView[]>('/api/admin/appointments'),
  visits: (f: VisitFilters) => http.get<AppointmentSearchResult>(`/api/admin/visits${qs({ ...f })}`),
  doctors: () => http.get<Doctor[]>('/api/admin/doctors'),
  setActive: (id: number, active: boolean) => http.patch<Doctor>(`/api/admin/doctors/${id}`, { active }),
  saveLocations: (id: number, data: LocationsPayload) => http.put<Doctor>(`/api/admin/doctors/${id}/locations`, data),
  saveServices: (id: number, data: ServicesPayload) => http.put<Doctor>(`/api/admin/doctors/${id}/services`, data),
}

/** the doctor edits own places of work, days, hours and prices */
export const scheduleService = {
  saveLocations: (data: LocationsPayload) => http.put<Doctor>('/api/profile/doctor/locations', data),
  saveServices: (data: ServicesPayload) => http.put<Doctor>('/api/profile/doctor/services', data),
}
