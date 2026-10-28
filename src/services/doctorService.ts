import type { Clinic, Doctor, Paginated, Slot, SpecialtyKey } from '@/types'
import { http } from './http'

export interface DoctorFilters {
  q?: string
  specialty?: SpecialtyKey | ''
  clinicId?: number | ''
  minRating?: number | ''
  sort?: 'rating' | 'experience' | 'name'
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
  slots: (id: number, date: string) => http.get<{ doctorId: number; date: string; slots: Slot[] }>(`/api/doctors/${id}/slots?date=${date}`),
  clinics: () => http.get<Clinic[]>('/api/clinics'),
}
