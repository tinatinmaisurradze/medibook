import type { Role } from '@/types'

/** Where each role lands after signing in */
export function defaultHome(role: Role): string {
  if (role === 'doctor') return '/doctor/schedule'
  if (role === 'admin') return '/admin/stats'
  return '/doctors'
}
