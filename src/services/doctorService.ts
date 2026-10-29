import type { Clinic, Doctor, Paginated, SlotsResponse, SpecialtyKey } from '@/types'
import { http } from './http'

export interface DoctorFilters {
  q?: string
  specialty?: SpecialtyKey | ''
  clinicId?: number | ''
  region?: string
  municipality?: string
  network?: string
  minRating?: number | ''
  maxPrice?: number | ''
  availability?: 'today' | 'tomorrow' | 'week' | ''
  sort?: 'rating' | 'experience' | 'name' | 'soonest' | 'price'
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

export const doctorService = {
  list: (f: DoctorFilters) => http.get<Paginated<Doctor>>(`/api/doctors${qs({ ...f })}`),
  get: (id: number) => http.get<Doctor>(`/api/doctors/${id}`),
  slots: (id: number, date: string, clinicId?: number) => http.get<SlotsResponse>(`/api/doctors/${id}/slots${qs({ date, clinicId })}`),
  clinics: () => http.get<Clinic[]>('/api/clinics'),
}
