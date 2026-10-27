import type { Role } from '@/types'

/** Where each role lands after signing in */
export function defaultHome(role: Role): string {
  if (role === 'doctor') return '/doctor/dashboard'
  if (role === 'admin') return '/admin/stats'
  return '/doctors'
}

export function profilePath(role: Role): string {
  if (role === 'doctor') return '/doctor/profile'
  if (role === 'admin') return '/admin/profile'
  return '/profile'
}
