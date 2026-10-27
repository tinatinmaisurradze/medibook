import { Link } from 'react-router-dom'
import { Building2, Clock } from 'lucide-react'
import type { Clinic, Doctor } from '@/types'
import { SPECIALTY_LABELS } from '@/data/seed'
import { Avatar, Rating } from './ui/Badges'

export function DoctorCard({ doctor, clinic }: { doctor: Doctor; clinic?: Clinic }) {
  return (
    <article className="flex flex-col rounded-lg border border-line bg-surface p-5 shadow-card">
      <div className="flex gap-4">
        <Avatar name={doctor.fullName} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{doctor.fullName}</h3>
          <p className="text-sm text-brand-dark">{SPECIALTY_LABELS[doctor.specialty]}</p>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted">
            <Rating value={doctor.rating} count={doctor.reviewCount} />
            <span className="inline-flex items-center gap-1">
              <Clock size={14} aria-hidden />
              {doctor.experienceYears} წლის გამოცდილება
            </span>
          </div>
        </div>
      </div>
      {clinic && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Building2 size={16} aria-hidden />
          {clinic.name}, {doctor.room}
        </p>
      )}
      <Link
        to={`/doctors/${doctor.id}`}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
      >
        დროის არჩევა
      </Link>
    </article>
  )
}
