import type { Clinic } from '@/types'

/** regions in the order they appear in the data, without duplicates */
export const regionsOf = (clinics: Clinic[]) => Array.from(new Set(clinics.map((c) => c.region)))

/** municipalities / districts of one region (or of all regions) */
export const municipalitiesOf = (clinics: Clinic[], region = '') =>
  Array.from(new Set(clinics.filter((c) => !region || c.region === region).map((c) => c.municipality))).sort((a, b) => a.localeCompare(b, 'ka'))

export const networksOf = (clinics: Clinic[]) => Array.from(new Set(clinics.map((c) => c.network)))

export const citiesOf = (clinics: Clinic[]) => Array.from(new Set(clinics.map((c) => c.city)))

/** clinics grouped by city, for select lists with <optgroup> */
export function groupByCity(clinics: Clinic[]): { city: string; clinics: Clinic[] }[] {
  return citiesOf(clinics).map((city) => ({ city, clinics: clinics.filter((c) => c.city === city) }))
}
