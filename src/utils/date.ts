import { getLang, tr } from '@/i18n'
const MONTHS = [tr("იანვარი"), tr("თებერვალი"), tr("მარტი"), tr("აპრილი"), tr("მაისი"), tr("ივნისი"), tr("ივლისი"), tr("აგვისტო"), tr("სექტემბერი"), tr("ოქტომბერი"), tr("ნოემბერი"), tr("დეკემბერი")]
const WEEKDAYS = [tr("კვირა"), tr("ორშაბათი"), tr("სამშაბათი"), tr("ოთხშაბათი"), tr("ხუთშაბათი"), tr("პარასკევი"), tr("შაბათი")]
const WEEKDAYS_SHORT = [tr("კვი"), tr("ორშ"), tr("სამ"), tr("ოთხ"), tr("ხუთ"), tr("პარ"), tr("შაბ")]

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

export function formatDate(iso: string): string {
  const d = parseISODate(iso)
  // Georgian: "29 ოქტომბერი, ხუთშაბათი"; English: "Thursday, 29 October"
  return getLang() === 'en' ? `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}` : `${d.getDate()} ${MONTHS[d.getMonth()]}, ${WEEKDAYS[d.getDay()]}`
}

export function weekdayShort(iso: string): string {
  return WEEKDAYS_SHORT[parseISODate(iso).getDay()]
}

export function dayOfMonth(iso: string): number {
  return parseISODate(iso).getDate()
}

export function monthName(iso: string): string {
  return MONTHS[parseISODate(iso).getMonth()]
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

/** Milliseconds from now until the appointment starts (negative when in the past) */
export function msUntil(date: string, time: string): number {
  const [h, m] = time.split(':').map(Number)
  const d = parseISODate(date)
  d.setHours(h, m, 0, 0)
  return d.getTime() - Date.now()
}
