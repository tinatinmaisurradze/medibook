import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import type { Clinic, Doctor } from '@/types'
import { SPECIALTY_LABELS } from '@/data/seed'
import { relativeDay } from '@/utils/date'
import { Avatar, Rating } from './ui/Badges'

/** Doctor card with the earliest free times: a patient can book from the list in one tap. */
export function DoctorCard({ doctor, clinic }: { doctor: Doctor; clinic?: Clinic }) {
  const next = doctor.nextAvailable
  return (
    <article className="flex h-full flex-col rounded-lg border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-[0_10px_32px_-12px_rgb(79_44_145/0.3)]">
      <div className="flex items-start gap-4">
        <Avatar name={doctor.fullName} size={56} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold leading-snug">
            <Link to={`/doctors/${doctor.id}`} className="hover:underline">
              {doctor.fullName}
            </Link>
          </h3>
          <p className="text-sm font-medium text-accent">{SPECIALTY_LABELS[doctor.specialty]}</p>
          <div className="mt-1.5 space-y-0.5 text-sm text-muted">
            <div>
              <Rating value={doctor.rating} count={doctor.reviewCount} />
            </div>
            <p>გამოცდილება: {doctor.experienceYears} წელი</p>
          </div>
        </div>
      </div>

      {clinic && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Building2 size={16} className="shrink-0" aria-hidden />
          <span className="truncate">
            {clinic.name} · {doctor.room}
          </span>
        </p>
      )}

      <div className="mt-auto pt-5">
        <div className="rounded-md bg-canvas p-3">
          {next ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                უახლოესი დრო · <span className="text-ink">{relativeDay(next.date)}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {next.times.map((t) => (
                  <Link
                    key={t}
                    to={`/book/${doctor.id}?date=${next.date}&time=${t}`}
                    aria-label={`დაჯავშნა: ${relativeDay(next.date)}, ${t}`}
                    className="inline-flex h-9 items-center rounded-md bg-brand px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-brand-dark"
                  >
                    {t}
                  </Link>
                ))}
                <Link
                  to={`/doctors/${doctor.id}`}
                  className="inline-flex h-9 items-center rounded-md border border-line bg-surface px-3 text-sm font-medium text-accent transition-colors hover:border-accent"
                >
                  სხვა დრო
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">14 დღეში თავისუფალი დრო არ არის.</p>
              <Link to={`/doctors/${doctor.id}`} className="mt-1 inline-block text-sm font-medium text-accent underline">
                ექიმის გვერდი
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
