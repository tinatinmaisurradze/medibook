import type { Role } from '@/types'

/** Where each role lands after signing in */
export function defaultHome(role: Role): string {
  if (role === 'doctor') return '/doctor/dashboard'
  if (role === 'admin') return '/admin/stats'
  return '/'
}

export function profilePath(role: Role): string {
  if (role === 'doctor') return '/doctor/profile'
  if (role === 'admin') return '/admin/profile'
  return '/profile'
}

/**
 * Where to go after signing in.
 * A patient returns to the doctor or the booking step they came from; otherwise to the landing page.
 * Doctors and administrators return to their own workspace pages, otherwise to their start page.
 */
export function afterLoginPath(role: Role, from?: string | null): string {
  if (role === 'patient') return from && (from.startsWith('/book') || from.startsWith('/doctors/')) ? from : '/'
  const area = role === 'doctor' ? '/doctor' : '/admin'
  return from && from.startsWith(area) ? from : defaultHome(role)
}
