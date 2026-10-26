import type { AuthResponse, User } from '@/types'
import { http } from './http'

export const authService = {
  login: (email: string, password: string) => http.post<AuthResponse>('/api/auth/login', { email, password }),
  register: (data: { fullName: string; email: string; phone?: string; password: string }) =>
    http.post<AuthResponse>('/api/auth/register', data),
  me: () => http.get<User>('/api/auth/me'),
}
