import type { Doctor, MedicalProfile, ProfileResponse, User } from '@/types'
import type { DoctorProfilePayload, GeneralProfileForm, MedicalPayload } from '@/utils/validation'
import { http } from './http'

export const profileService = {
  get: () => http.get<ProfileResponse>('/api/profile'),
  updateGeneral: (data: GeneralProfileForm) => http.patch<User>('/api/profile', data),
  saveMedical: (data: MedicalPayload) => http.put<MedicalProfile>('/api/profile/medical', data),
  updateDoctor: (data: DoctorProfilePayload) => http.patch<Doctor>('/api/profile/doctor', data),
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    http.post<{ ok: true }>('/api/profile/password', data),
}
