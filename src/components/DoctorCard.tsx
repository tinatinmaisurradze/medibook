import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Clock } from 'lucide-react'
import type { Clinic, Doctor } from '@/types'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAuth } from '@/context/AuthContext'
import { addDays, formatDate, toISODate } from '@/utils/date'
import { formatPrice } from '@/utils/payment'
import { daysLabel } from '@/utils/weekdays'
import { Avatar, Rating } from './ui/Badges'

/** "დღეს", "ხვალ" or the date */
function relativeDay(date: string): string {
  const today = toISODate(new Date())
  if (date === today) return 'დღეს'
  if (date === toISODate(addDays(new Date(), 1))) return 'ხვალ'
  return formatDate(date)
}

export const DoctorCard = memo(function DoctorCard({ doctor, clinics = [] }: { doctor: Doctor; clinics?: Clinic[] }) {
  const { user } = useAuth()
  const canBook = !user || user.role === 'patient'
  const next = doctor.nextAvailable
  const chip = 'inline-flex h-9 items-center rounded-lg border border-[#0d7a83]/50 px-3 text-sm font-medium text-brand-dark transition-colors'
  return (
    <article className="flex h-full flex-col rounded-lg border border-line bg-surface p-5 shadow-card">
      <div className="flex gap-4">
        <Avatar name={doctor.fullName} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{doctor.fullName}</h3>
          <p className="text-sm text-brand-dark">
            {SPECIALTY_LABELS[doctor.specialty]} · {doctor.city}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <Rating value={doctor.rating} count={doctor.reviewCount} />
            <span className="inline-flex items-center gap-1">
              <Clock size={14} aria-hidden />
              {doctor.experienceYears} წლის გამოცდილება
            </span>
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm">
        {doctor.locations.slice(0, 3).map((l) => (
          <li key={l.id} className="flex items-start gap-2">
            <Building2 size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
            <span>
              <span className="font-medium">{clinics.find((c) => c.id === l.clinicId)?.name ?? '...'}</span>
              <span className="block text-xs text-muted">
                {daysLabel(l.days)}, {l.start}–{l.end}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {doctor.priceFrom !== null && (
        <p className="mt-3 text-sm">
          <span className="text-muted">ვიზიტი</span> <span className="font-semibold">{formatPrice(doctor.priceFrom)}-დან</span>
        </p>
      )}

      {next ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            უახლოესი თავისუფალი დრო: {relativeDay(next.date)} · {next.clinicName}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {next.times.map((t) =>
              canBook ? (
                <Link key={t} to={`/book/${doctor.id}?date=${next.date}&time=${t}&clinicId=${next.clinicId}`} className={`${chip} hover:bg-brand hover:text-white`} aria-label={`დაჯავშნა ${relativeDay(next.date)}, ${t}`}>
                  {t}
                </Link>
              ) : (
                <span key={t} className={`${chip} border-line text-muted`}>
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">უახლოეს 14 დღეში თავისუფალი დრო არ არის</p>
      )}

      {/* the button always sits at the bottom of the card, so buttons line up across a row of cards */}
      <div className="mt-auto pt-5">
        <Link
          to={`/doctors/${doctor.id}`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          დროის არჩევა
        </Link>
      </div>
    </article>
  )
})
