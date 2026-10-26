import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Building2, CalendarClock, DoorOpen } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAsync } from '@/hooks/useAsync'
import { doctorService } from '@/services/doctorService'
import { useAuth } from '@/context/AuthContext'
import { Avatar, Rating } from '@/components/ui/Badges'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { addDays, dayOfMonth, formatDate, monthName, parseISODate, toISODate, weekdayShort } from '@/utils/date'
import { Button } from '@/components/ui/Button'

export default function DoctorDetail() {
  const { id } = useParams()
  const doctorId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const doctor = useAsync(() => doctorService.get(doctorId), [doctorId])
  const clinics = useAsync(() => doctorService.clinics(), [])

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => toISODate(addDays(new Date(), i))), [])
  const [date, setDate] = useState(days[0])
  const slots = useAsync(() => doctorService.slots(doctorId, date), [doctorId, date])

  if (doctor.loading) {
    return (
      <div className="space-y-4" aria-hidden>
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }
  if (doctor.error || !doctor.data) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState title="ექიმი ვერ მოიძებნა" text={doctor.error ?? undefined} action={<Link to="/doctors" className="font-medium text-brand-dark underline">ექიმების სიაზე დაბრუნება</Link>} />
      </div>
    )
  }

  const d = doctor.data
  const clinic = clinics.data?.find((c) => c.id === d.clinicId)
  const workingDay = d.workDays.includes(parseISODate(date).getDay())

  const choose = (time: string) => {
    const target = `/book/${d.id}?date=${date}&time=${time}`
    if (user && user.role !== 'patient') return
    navigate(target)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <section>
        <div className="flex items-start gap-5">
          <Avatar name={d.fullName} size={80} />
          <div>
            <h1 className="text-3xl font-bold">{d.fullName}</h1>
            <p className="text-brand-dark">{SPECIALTY_LABELS[d.specialty]}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
              <Rating value={d.rating} />
              <span>{d.experienceYears} წლის გამოცდილება</span>
            </div>
          </div>
        </div>

        <p className="mt-6 max-w-prose">{d.bio}</p>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div className="rounded-md border border-line bg-surface p-4">
            <dt className="flex items-center gap-2 text-muted">
              <Building2 size={16} aria-hidden /> კლინიკა
            </dt>
            <dd className="mt-1 font-medium">{clinic?.name ?? '...'}</dd>
            <dd className="text-muted">{clinic?.address}</dd>
          </div>
          <div className="rounded-md border border-line bg-surface p-4">
            <dt className="flex items-center gap-2 text-muted">
              <DoorOpen size={16} aria-hidden /> კაბინეტი
            </dt>
            <dd className="mt-1 font-medium">{d.room}</dd>
          </div>
          <div className="rounded-md border border-line bg-surface p-4">
            <dt className="flex items-center gap-2 text-muted">
              <CalendarClock size={16} aria-hidden /> მიღების დრო
            </dt>
            <dd className="mt-1 font-medium">
              {d.workHours.start} – {d.workHours.end}
            </dd>
            <dd className="text-muted">ვიზიტი {d.slotMinutes} წთ</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="slots-title" className="h-fit rounded-lg border border-line bg-surface p-5 shadow-card">
        <h2 id="slots-title" className="text-xl font-bold">
          ვიზიტის დრო
        </h2>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="თარიღის არჩევა">
          {days.map((iso) => {
            const active = iso === date
            const off = !d.workDays.includes(parseISODate(iso).getDay())
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setDate(iso)}
                aria-pressed={active}
                className={`flex w-14 shrink-0 flex-col items-center rounded-md border px-1 py-2 text-sm transition-colors ${
                  active ? 'border-brand bg-brand text-white' : off ? 'border-line bg-canvas text-muted' : 'border-line hover:border-brand'
                }`}
              >
                <span className="text-xs">{weekdayShort(iso)}</span>
                <span className="text-lg font-semibold">{dayOfMonth(iso)}</span>
                <span className="text-[11px]">{monthName(iso).slice(0, 3)}</span>
              </button>
            )
          })}
        </div>

        <p className="mt-4 text-sm font-medium">{formatDate(date)}</p>

        <div className="mt-3 min-h-32" aria-live="polite">
          {slots.loading && (
            <div className="grid grid-cols-3 gap-2" aria-hidden>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="skeleton h-10" />
              ))}
            </div>
          )}
          {slots.error && <ErrorState message={slots.error} onRetry={slots.reload} />}
          {slots.data && !workingDay && <p className="rounded-md bg-canvas p-4 text-sm text-muted">ამ დღეს ექიმი არ იღებს. აირჩიეთ სხვა თარიღი.</p>}
          {slots.data && workingDay && slots.data.slots.every((s) => !s.available) && (
            <p className="rounded-md bg-canvas p-4 text-sm text-muted">ამ დღეს თავისუფალი დრო აღარ არის. სცადეთ სხვა თარიღი.</p>
          )}
          {slots.data && workingDay && slots.data.slots.some((s) => s.available) && (
            <div className="grid grid-cols-3 gap-2">
              {slots.data.slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => choose(s.time)}
                  className={`min-h-10 rounded-md border text-sm font-medium transition-colors ${
                    s.available ? 'border-brand/50 text-brand-dark hover:bg-brand hover:text-white' : 'cursor-not-allowed border-line bg-canvas text-muted line-through'
                  }`}
                  aria-label={s.available ? `${s.time} თავისუფალია` : `${s.time} დაკავებულია`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>

        {user && user.role !== 'patient' && (
          <p className="mt-4 rounded-md bg-canvas p-3 text-sm text-muted">ჯავშანი მხოლოდ პაციენტის ანგარიშითაა შესაძლებელი.</p>
        )}
        {!user && (
          <div className="mt-4 text-sm text-muted">
            დაჯავშნისთვის დაგჭირდებათ <Link to="/login" className="font-medium text-brand-dark underline">შესვლა</Link>. დროის არჩევის შემდეგ ავტომატურად დაბრუნდებით.
          </div>
        )}
        <Button variant="ghost" size="sm" className="mt-3" onClick={slots.reload}>
          დროების განახლება
        </Button>
      </section>
    </div>
  )
}
