import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Building2, MapPin } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAsync } from '@/hooks/useAsync'
import { doctorService } from '@/services/doctorService'
import { useAuth } from '@/context/AuthContext'
import { Avatar, Rating } from '@/components/ui/Badges'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { addDays, dayOfMonth, formatDate, monthName, parseISODate, toISODate, weekdayShort } from '@/utils/date'
import { Button } from '@/components/ui/Button'
import { reviewService } from '@/services/doctorPortalService'
import { RatingSummary, ReviewItem } from '@/components/ReviewList'
import { DAY_SHORT, WEEK_ORDER } from '@/utils/weekdays'
import { formatPrice } from '@/utils/payment'

export default function DoctorDetail() {
  const { id } = useParams()
  const doctorId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const location = useLocation()

  const doctor = useAsync(() => doctorService.get(doctorId), [doctorId])
  const clinics = useAsync(() => doctorService.clinics(), [])

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => toISODate(addDays(new Date(), i))), [])
  const [date, setDate] = useState(days[0])
  const slots = useAsync(() => doctorService.slots(doctorId, date), [doctorId, date])
  const reviews = useAsync(() => reviewService.forDoctor(doctorId), [doctorId])
  const [showAll, setShowAll] = useState(false)

  // coming back from the login page with #slots: bring the time picker into view
  useEffect(() => {
    if (location.hash === '#slots' && doctor.data) document.getElementById('slots')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash, doctor.data])

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

  const choose = (clinicId: number, time: string) => {
    const target = `/book/${d.id}?date=${date}&time=${time}&clinicId=${clinicId}`
    if (user && user.role !== 'patient') return
    navigate(target)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-w-0">
        <div className="flex items-start gap-5">
          <Avatar name={d.fullName} size={80} />
          <div>
            <h1 className="text-3xl font-bold">{d.fullName}</h1>
            <p className="text-brand-dark">{SPECIALTY_LABELS[d.specialty]}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
              <Rating value={d.rating} count={d.reviewCount} />
              <span>{d.experienceYears} წლის გამოცდილება</span>
              {d.priceFrom !== null && <span className="font-medium text-ink">ვიზიტი {formatPrice(d.priceFrom)}-დან</span>}
            </div>
          </div>
        </div>

        {(!user || user.role === 'patient') && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {user ? (
              <a href="#slots" className="inline-flex min-h-11 items-center rounded-md bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-dark">
                ვიზიტის დაჯავშნა
              </a>
            ) : (
              <>
                <Link
                  to="/login"
                  state={{ from: `/doctors/${d.id}#slots` }}
                  className="inline-flex min-h-11 items-center rounded-md bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                >
                  ვიზიტის დაჯავშნა
                </Link>
                <span className="text-sm text-muted">ჯავშნისთვის საჭიროა შესვლა</span>
              </>
            )}
          </div>
        )}

        <p className="mt-6 max-w-prose">{d.bio}</p>
        {(d.education || d.languages.length > 0) && (
          <ul className="mt-4 space-y-1 text-sm text-muted">
            {d.education && <li>განათლება: {d.education}</li>}
            {d.languages.length > 0 && <li>ენები: {d.languages.join(', ')}</li>}
          </ul>
        )}

        <section className="mt-8" aria-labelledby="where-title">
          <h2 id="where-title" className="text-2xl font-bold">
            სად იღებს
          </h2>
          <ul className="mt-4 space-y-3">
            {d.locations.map((l) => {
              const c = clinics.data?.find((x) => x.id === l.clinicId)
              const prices = d.services.filter((sv) => sv.clinicId === l.clinicId)
              return (
                <li key={l.id} className="rounded-xl border border-line bg-surface p-4 shadow-card">
                  <p className="flex items-center gap-2 font-semibold">
                    <Building2 size={18} className="text-brand" aria-hidden /> {c?.name ?? '...'}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {c?.address}, {l.room}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="მიღების დღეები">
                    {WEEK_ORDER.map((day) => (
                      <span key={day} className={`inline-flex h-8 min-w-[2.75rem] items-center justify-center rounded-md px-2 text-xs font-medium ${l.days.includes(day) ? 'bg-brand text-white' : 'bg-canvas text-muted'}`}>
                        {DAY_SHORT[day]}
                      </span>
                    ))}
                    <span className="ml-1 text-sm font-medium">
                      {l.start} – {l.end}
                    </span>
                  </div>
                  {prices.length > 0 && (
                    <dl className="mt-3 divide-y divide-line text-sm">
                      {prices.map((sv) => (
                        <div key={sv.id} className="flex items-center justify-between gap-3 py-1.5">
                          <dt className="text-muted">{sv.name}</dt>
                          <dd className="font-semibold">{formatPrice(sv.price)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="reviews-title">
          <h2 id="reviews-title" className="text-2xl font-bold">
            პაციენტების შეფასებები
          </h2>
          {reviews.loading && <div className="skeleton mt-4 h-32 w-full" aria-hidden />}
          {reviews.error && (
            <div className="mt-4">
              <ErrorState message={reviews.error} onRetry={reviews.reload} />
            </div>
          )}
          {reviews.data && reviews.data.count === 0 && <p className="mt-3 rounded-md bg-canvas p-4 text-sm text-muted">ამ ექიმს ჯერ შეფასებები არ აქვს.</p>}
          {reviews.data && reviews.data.count > 0 && (
            <>
              <div className="mt-4 rounded-lg border border-line bg-surface p-5">
                <RatingSummary summary={reviews.data} />
              </div>
              <div className="mt-4 space-y-3">
                {(showAll ? reviews.data.reviews : reviews.data.reviews.slice(0, 3)).map((r) => (
                  <ReviewItem key={r.id} review={r} />
                ))}
              </div>
              {reviews.data.reviews.length > 3 && (
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'ნაკლების ჩვენება' : `ყველა შეფასება (${reviews.data.reviews.length})`}
                </Button>
              )}
            </>
          )}
        </section>
      </section>

      <section id="slots" aria-labelledby="slots-title" className="h-fit min-w-0 scroll-mt-24 rounded-lg border border-line bg-surface p-5 shadow-card">
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
          {slots.data && slots.data.groups.length === 0 && <p className="rounded-md bg-canvas p-4 text-sm text-muted">ამ დღეს ექიმი არ იღებს. აირჩიეთ სხვა თარიღი.</p>}
          {slots.data && slots.data.groups.length > 0 && slots.data.groups.every((g) => g.slots.every((s) => !s.available)) && (
            <p className="rounded-md bg-canvas p-4 text-sm text-muted">ამ დღეს თავისუფალი დრო აღარ არის. სცადეთ სხვა თარიღი.</p>
          )}
          {slots.data &&
            slots.data.groups.some((g) => g.slots.some((s) => s.available)) &&
            slots.data.groups.map((g) => (
              <div key={g.clinicId} className="mb-4 last:mb-0">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <MapPin size={15} className="text-brand" aria-hidden /> {g.clinicName}
                </p>
                <p className="mb-2 text-xs text-muted">
                  {g.address}, {g.room} · ვიზიტი {g.slotMinutes} წთ
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {g.slots.map((s) => (
                    <button
                      key={`${g.clinicId}-${s.time}`}
                      type="button"
                      disabled={!s.available}
                      onClick={() => choose(g.clinicId, s.time)}
                      title={g.clinicName}
                      className={`min-h-10 rounded-md border text-sm font-medium transition-colors ${
                        s.available ? 'border-[#0d7a83]/50 text-brand-dark hover:bg-brand hover:text-white' : 'cursor-not-allowed border-line bg-canvas text-muted line-through'
                      }`}
                      aria-label={s.available ? `${s.time} თავისუფალია` : `${s.time} დაკავებულია`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
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
