import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Pill, ShieldQuestion } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { doctorPortalService } from '@/services/doctorPortalService'
import { useAuth } from '@/context/AuthContext'
import { formatDate, msUntil, timeToMinutes, toISODate, weekdayShort, dayOfMonth, relativeDay } from '@/utils/date'
import { Stars } from '@/components/ui/Badges'
import { ErrorState } from '@/components/ui/States'
import type { DaySlot, DoctorDashboardData } from '@/types'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'დილა მშვიდობისა' : h < 18 ? 'დღე მშვიდობისა' : 'საღამო მშვიდობისა'
}
const firstName = (full: string) => full.trim().split(/\s+/)[0]

function useNowMinutes() {
  const read = () => new Date().getHours() * 60 + new Date().getMinutes()
  const [now, setNow] = useState(read)
  useEffect(() => {
    const t = setInterval(() => setNow(read()), 30000)
    return () => clearInterval(t)
  }, [])
  return now
}

/** One tiny block per slot: dark = booked, chartreuse = still free, lavender = passed */
function SlotStrip({ slots }: { slots: DaySlot[] }) {
  return (
    <div className="flex gap-1" role="img" aria-label="დღის სლოტები: დაჯავშნილი, თავისუფალი და გასული">
      {slots.map((s) => (
        <span
          key={s.time}
          title={`${s.time}: ${s.status === 'booked' ? 'დაჯავშნილია' : s.status === 'free' ? 'თავისუფალია' : 'გასულია'}`}
          className={`h-3 flex-1 rounded-full ${s.status === 'booked' ? 'bg-ink' : s.status === 'free' ? 'bg-brand' : 'bg-lav/60'}`}
        />
      ))}
    </div>
  )
}

type RulerRow = { kind: 'slot'; slot: DaySlot } | { kind: 'gap'; from: string; to: string; count: number }

/** consecutive passed, empty slots are folded into one quiet line so the useful rows stay in view */
function foldPast(slots: DaySlot[], slotMinutes: number): RulerRow[] {
  const rows: RulerRow[] = []
  slots.forEach((slot) => {
    if (slot.status !== 'past') return rows.push({ kind: 'slot', slot })
    const last = rows[rows.length - 1]
    const end = `${String(Math.floor((timeToMinutes(slot.time) + slotMinutes) / 60)).padStart(2, '0')}:${String((timeToMinutes(slot.time) + slotMinutes) % 60).padStart(2, '0')}`
    if (last && last.kind === 'gap') {
      last.to = end
      last.count += 1
    } else rows.push({ kind: 'gap', from: slot.time, to: end, count: 1 })
  })
  return rows
}

function NowMarker({ label }: { label: string }) {
  return (
    <div className="my-3 flex items-center gap-2" aria-label={`ახლა ${label}`}>
      <span className="w-14 shrink-0 text-right text-xs font-bold text-signal">{label}</span>
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-signal ring-4 ring-signal/20" aria-hidden />
      <span className="h-px flex-1 bg-signal" aria-hidden />
    </div>
  )
}

function DayRuler({ data, nowMinutes }: { data: DoctorDashboardData; nowMinutes: number }) {
  const slots = data.daySlots
  const rows = foldPast(slots, data.slotMinutes)
  const nowLabel = `${String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:${String(nowMinutes % 60).padStart(2, '0')}`
  const firstMinutes = slots.length ? timeToMinutes(slots[0].time) : 0
  const markerBefore = slots.findIndex((s) => timeToMinutes(s.time) + data.slotMinutes > nowMinutes)
  // the slot rows keep their index in `slots`; a folded gap ends where the first non-past slot begins
  let slotIndex = 0

  return (
    <ol className="space-y-2" aria-label="დღევანდელი განრიგი">
      {rows.map((row, i) => {
        if (row.kind === 'gap') {
          slotIndex += row.count
          return (
            <li key={`gap-${i}`} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3">
              <span className="text-right text-xs tabular-nums text-muted/70">{row.from}</span>
              <div className="flex min-h-9 items-center rounded-lg border border-dashed border-line px-3 text-xs text-muted">
                {row.from} – {row.to} · გასულია
              </div>
            </li>
          )
        }
        const s = row.slot
        const index = slotIndex++
        const appt = s.appointment
        const past = msUntil(data.today, s.time) <= 0
        const needsRecord = !!appt && appt.status === 'confirmed' && past
        return (
          <li key={s.time}>
            {index === markerBefore && nowMinutes >= firstMinutes && <NowMarker label={nowLabel} />}
            <div className="grid grid-cols-[56px_minmax(0,1fr)] items-stretch gap-3">
              <span className="pt-3 text-right text-sm font-semibold tabular-nums">{s.time}</span>
              {s.status === 'booked' && appt ? (
                <Link
                  to={`/doctor/visits/${appt.id}`}
                  className={`group flex min-w-0 flex-col items-start gap-2 rounded-xl p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 transition-transform hover:-translate-y-0.5 ${
                    appt.status === 'completed' ? 'bg-lav/35 text-ink' : 'bg-ink text-white'
                  }`}
                >
                  <span className="min-w-0 max-w-full">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                      <span className="truncate">{appt.patientName}</span>
                      {s.hasAllergyAlert && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-signal px-2 py-0.5 text-[11px] font-bold text-white">
                          <AlertTriangle size={11} aria-hidden /> ალერგია
                        </span>
                      )}
                    </span>
                    <span className={`block truncate text-sm ${appt.status === 'completed' ? 'text-muted' : 'text-white/70'}`}>{appt.reason ?? 'მიზეზი არ არის მითითებული'}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs font-semibold">
                    {appt.status === 'completed' ? (
                      <span className="rounded-full bg-surface/80 px-2.5 py-1 text-accent">დასრულებულია</span>
                    ) : needsRecord ? (
                      <span className="rounded-full bg-signal px-2.5 py-1 text-white">შეავსეთ ჩანაწერი</span>
                    ) : (
                      <span className="rounded-full bg-brand px-2.5 py-1 text-ink">დაგეგმილია</span>
                    )}
                    <ArrowUpRight size={16} className="opacity-60 transition-opacity group-hover:opacity-100" aria-hidden />
                  </span>
                </Link>
              ) : (
                <div className="flex min-h-[3.25rem] items-center rounded-xl border-2 border-dashed border-brand-dark/70 bg-brand/15 px-4 text-sm font-medium text-ink/70">თავისუფალია</div>
              )}
            </div>
          </li>
        )
      })}
      {markerBefore === -1 && slots.length > 0 && nowMinutes >= firstMinutes && (
        <li>
          <NowMarker label={nowLabel} />
        </li>
      )}
    </ol>
  )
}

function NextPatient({ appt }: { appt: NonNullable<DoctorDashboardData['nextAppointment']> }) {
  const b = appt.brief
  const minutes = Math.max(1, Math.round(msUntil(appt.date, appt.time) / 60000))
  const sameDay = appt.date === toISODate(new Date())
  const when = sameDay ? (minutes < 60 ? `${minutes} წუთში` : `${Math.floor(minutes / 60)} სთ ${minutes % 60} წთ-ში`) : relativeDay(appt.date)
  return (
    <section className="rounded-2xl bg-lav/45 p-5" aria-labelledby="next-title">
      <p id="next-title" className="text-xs font-bold uppercase tracking-wide text-accent">
        შემდეგი პაციენტი
      </p>
      <p className="mt-2 font-display text-2xl font-bold leading-tight">{appt.patientName}</p>
      <p className="mt-1 text-sm">
        <span className="rounded-md bg-ink px-2 py-0.5 font-semibold text-white">{appt.time}</span> · {when}

      </p>
      {appt.reason && <p className="mt-2 text-sm text-ink/80">მიზეზი: {appt.reason}</p>}

      <div className="mt-4 space-y-3 rounded-xl bg-surface/80 p-3 text-sm">
        {b.shared === false && (
          <p className="flex items-start gap-2 text-muted">
            <ShieldQuestion size={16} className="mt-0.5 shrink-0" aria-hidden />
            პაციენტმა სამედიცინო ისტორია არ გაგიზიარათ.
          </p>
        )}
        {b.shared === null && <p className="text-muted">სამედიცინო ისტორია არ არის შევსებული.</p>}
        {b.shared && (
          <>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted">ალერგიები</p>
              {b.allergies.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {b.allergies.map((a) => (
                    <li key={a} className="inline-flex items-center gap-1 rounded-full bg-signal px-2.5 py-0.5 text-xs font-bold text-white">
                      <AlertTriangle size={11} aria-hidden />
                      {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">არ არის მითითებული</p>
              )}
            </div>
            {b.conditions.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted">ქრონიკული დაავადებები</p>
                <p>{b.conditions.join(', ')}</p>
              </div>
            )}
            {b.medications.length > 0 && (
              <p className="flex items-start gap-2">
                <Pill size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                {b.medications.join(', ')}
              </p>
            )}
          </>
        )}
        <p className="border-t border-line pt-2 text-muted">
          ვიზიტები ჩემთან: {b.visitsWithMe}
          {b.lastDiagnosis && <span className="block truncate">ბოლო დიაგნოზი: {b.lastDiagnosis}</span>}
        </p>
      </div>

      <Link to={`/doctor/visits/${appt.id}`} className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-ink transition-colors hover:bg-brand-dark">
        ანკეტის გახსნა
      </Link>
    </section>
  )
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const data = useAsync(() => doctorPortalService.dashboard(), [])
  const now = useNowMinutes()
  const d = data.data

  return (
    <div>
      <p className="text-sm font-medium text-accent">
        {greeting()}
        {user ? `, ${firstName(user.fullName)}` : ''}
      </p>
      <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{d ? formatDate(d.today) : 'დღევანდელი დღე'}</h1>

      {data.loading && <div className="mt-6 skeleton h-96 w-full" aria-hidden />}
      {data.error && (
        <div className="mt-6">
          <ErrorState message={data.error} onRetry={data.reload} />
        </div>
      )}

      {d && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-2xl border border-line bg-surface p-5 shadow-card" aria-labelledby="load-title">
              {d.isWorkingDay ? (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h2 id="load-title" className="text-xs font-bold uppercase tracking-wide text-muted">
                        დღის დატვირთვა
                      </h2>
                      <p className="font-display text-5xl font-bold leading-none">
                        {d.occupancy.percent}
                        <span className="text-2xl text-muted">%</span>
                      </p>
                    </div>
                    <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm max-sm:grid-cols-1">
                      <div>
                        <dt className="text-muted">ვიზიტი</dt>
                        <dd className="font-semibold">
                          {d.occupancy.booked} / {d.occupancy.total}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">პირველი თავისუფალი</dt>
                        <dd className="font-semibold">{d.occupancy.firstFree ?? '–'}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">დღე სრულდება</dt>
                        <dd className="font-semibold">{d.occupancy.endsAt ? `≈ ${d.occupancy.endsAt}` : '–'}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="mt-4">
                    <SlotStrip slots={d.daySlots} />
                    <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink" />დაჯავშნილი</span>
                      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand" />თავისუფალი</span>
                      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-lav" />გასული</span>
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <h2 id="load-title" className="font-display text-2xl font-bold">
                    დღეს არ იღებთ
                  </h2>
                  <p className="mt-1 text-muted">{d.nextWorkingDay ? `შემდეგი სამუშაო დღეა: ${relativeDay(d.nextWorkingDay)}.` : 'უახლოეს 2 კვირაში სამუშაო დღე არ არის.'}</p>
                </div>
              )}
            </section>

            {d.isWorkingDay && (
              <section aria-labelledby="ruler-title">
                <h2 id="ruler-title" className="mb-3 text-xl font-bold">
                  დღის განრიგი
                </h2>
                <DayRuler data={d} nowMinutes={now} />
              </section>
            )}
          </div>

          <div className="min-w-0 space-y-6">
            {d.nextAppointment ? (
              <NextPatient appt={d.nextAppointment} />
            ) : (
              <section className="rounded-2xl bg-lav/45 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-accent">შემდეგი პაციენტი</p>
                <p className="mt-2 text-sm text-muted">დაგეგმილი ვიზიტები არ არის.</p>
              </section>
            )}

            {d.pendingRecords.length > 0 && (
              <section className="rounded-2xl border-2 border-signal/60 bg-danger-tint/60 p-5" aria-labelledby="pending-title">
                <h2 id="pending-title" className="flex items-center gap-2 text-lg font-bold text-danger">
                  <AlertTriangle size={18} aria-hidden /> ჩანაწერის შევსება სჭირდება
                  <span className="rounded-full bg-signal px-2 text-xs text-white">{d.pendingRecords.length}</span>
                </h2>
                <ul className="mt-3 divide-y divide-signal/20">
                  {d.pendingRecords.map((a) => (
                    <li key={a.id}>
                      <Link to={`/doctor/visits/${a.id}`} className="flex items-center justify-between gap-2 py-2.5 text-sm hover:underline">
                        <span>
                          <span className="font-semibold">{a.patientName}</span>
                          <span className="block text-xs text-muted">
                            {relativeDay(a.date)}, {a.time}
                          </span>
                        </span>
                        <ArrowUpRight size={16} aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-2xl border border-line bg-surface p-5 shadow-card" aria-labelledby="week-title">
              <div className="flex items-baseline justify-between">
                <h2 id="week-title" className="text-lg font-bold">
                  კვირის რიტმი
                </h2>
                <span className="text-sm text-muted">{d.stats.next7Days} ვიზიტი</span>
              </div>
              <ul className="mt-4 flex items-end justify-between gap-2" aria-label="დატვირთვა 7 დღეში">
                {d.weekLoad.map((day, i) => {
                  const pct = day.total ? Math.round((day.booked / day.total) * 100) : 0
                  return (
                    <li key={day.date} className="flex flex-1 flex-col items-center gap-1.5" title={day.total ? `${day.booked} / ${day.total}` : 'არ იღებთ'}>
                      <span className="text-xs font-semibold tabular-nums">{day.total ? `${pct}%` : ''}</span>
                      <span className={`relative flex h-24 w-full max-w-[40px] items-end overflow-hidden rounded-full ${day.total ? 'bg-lav/40' : 'bg-line/60'} ${i === 0 ? 'ring-2 ring-ink ring-offset-2' : ''}`}>
                        <span className="w-full rounded-full bg-brand" style={{ height: `${Math.max(pct, day.booked ? 12 : 0)}%` }} />
                      </span>
                      <span className="text-xs text-muted">{weekdayShort(day.date)}</span>
                      <span className="text-xs font-semibold">{dayOfMonth(day.date)}</span>
                    </li>
                  )
                })}
              </ul>
              <Link to="/doctor/calendar" className="mt-4 inline-block text-sm font-medium text-accent underline">
                კალენდრის გახსნა
              </Link>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5 shadow-card" aria-labelledby="rating-title">
              <h2 id="rating-title" className="text-lg font-bold">
                პაციენტების შეფასება
              </h2>
              {d.stats.reviewCount === 0 ? (
                <p className="mt-2 text-sm text-muted">შეფასებები ჯერ არ არის.</p>
              ) : (
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-4xl font-bold leading-none">{d.stats.rating.toFixed(1)}</p>
                    <div className="mt-2">
                      <Stars value={d.stats.rating} size={18} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{d.stats.reviewCount} შეფასება</p>
                  </div>
                  {d.stats.last5Average !== null && (
                    <p className="text-right text-sm">
                      <span className="block text-muted">ბოლო 5</span>
                      <span className={`font-display text-2xl font-bold ${d.stats.last5Average < d.stats.rating ? 'text-danger' : 'text-ok'}`}>{d.stats.last5Average.toFixed(1)}</span>
                    </p>
                  )}
                </div>
              )}
              <Link to="/doctor/reviews" className="mt-4 inline-block text-sm font-medium text-accent underline">
                ყველა შეფასება
              </Link>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
