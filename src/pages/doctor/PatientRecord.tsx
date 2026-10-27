import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, EyeOff, HeartPulse, User } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { doctorPortalService } from '@/services/doctorPortalService'
import { formatDate, parseISODate } from '@/utils/date'
import { MedicalSummary } from '@/components/MedicalSummary'
import { StatusBadge } from '@/components/ui/Badges'
import { EmptyState, ErrorState } from '@/components/ui/States'

function ageFrom(iso?: string): string {
  if (!iso) return '—'
  const b = parseISODate(iso)
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age -= 1
  return `${age} წლის (${formatDate(iso).split(',')[0]} ${b.getFullYear()})`
}

export default function PatientRecord() {
  const { id } = useParams()
  const rec = useAsync(() => doctorPortalService.patient(Number(id)), [id])

  if (rec.loading) return <div className="skeleton h-96 w-full" aria-hidden />
  if (rec.error || !rec.data) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState title="პაციენტი ვერ მოიძებნა" text="ბარათი მხოლოდ იმ პაციენტებისთვის იხსნება, რომლებთანაც ვიზიტი გაქვთ." action={<Link to="/doctor/patients" className="font-medium text-brand-dark underline">პაციენტების სია</Link>} />
        {rec.error && (
          <div className="mt-4">
            <ErrorState message={rec.error} onRetry={rec.reload} />
          </div>
        )}
      </div>
    )
  }

  const { patient, medicalProfile, visits } = rec.data

  return (
    <div>
      <Link to="/doctor/patients" className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline">
        <ArrowLeft size={16} aria-hidden />
        პაციენტების სია
      </Link>
      <h1 className="mt-3 text-3xl font-bold">{patient.fullName}</h1>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <User size={20} className="text-brand" aria-hidden />
            ზოგადი ინფორმაცია
          </h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">ელ-ფოსტა</dt>
              <dd className="mt-0.5 break-words font-medium">{patient.email}</dd>
            </div>
            <div>
              <dt className="text-muted">ტელეფონი</dt>
              <dd className="mt-0.5 font-medium">{patient.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">ასაკი</dt>
              <dd className="mt-0.5 font-medium">{ageFrom(patient.dateOfBirth)}</dd>
            </div>
            <div>
              <dt className="text-muted">ქალაქი</dt>
              <dd className="mt-0.5 font-medium">{patient.city ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <HeartPulse size={20} className="text-brand" aria-hidden />
            სამედიცინო ისტორია
          </h2>
          <div className="mt-3">
            {medicalProfile === 'hidden' && (
              <p className="flex items-start gap-2 rounded-md bg-canvas p-3 text-sm text-muted">
                <EyeOff size={18} className="mt-0.5 shrink-0" aria-hidden />
                პაციენტმა სამედიცინო ისტორიის გაზიარება გამორთო.
              </p>
            )}
            {medicalProfile === null && <p className="rounded-md bg-canvas p-3 text-sm text-muted">პაციენტს სამედიცინო ისტორია ჯერ არ შეუვსია.</p>}
            {medicalProfile && medicalProfile !== 'hidden' && <MedicalSummary profile={medicalProfile} />}
          </div>
        </section>
      </div>

      <section className="mt-8" aria-labelledby="visits-title">
        <h2 id="visits-title" className="text-xl font-bold">
          ვიზიტები თქვენთან
        </h2>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
          {visits.map((v) => (
            <li key={v.id}>
              <Link to={`/doctor/visits/${v.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-brand-tint">
                <span className="min-w-0">
                  {formatDate(v.date)}, {v.time}
                  {v.diagnosis && <span className="block max-w-xl truncate text-sm text-muted">{v.diagnosis}</span>}
                </span>
                <StatusBadge status={v.status} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
