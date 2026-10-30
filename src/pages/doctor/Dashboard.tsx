import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarClock, ClipboardList, Star, Users } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { doctorPortalService } from '@/services/doctorPortalService'
import { formatDate, msUntil, weekdayShort, dayOfMonth } from '@/utils/date'
import { Stars } from '@/components/ui/Badges'
import { ErrorState } from '@/components/ui/States'
import type { AppointmentView } from '@/types'
import { tr } from '@/i18n'

function countdown(a: AppointmentView): string {
  const ms = msUntil(a.date, a.time)
  const min = Math.round(ms / 60000)
  if (min < 60) return tr("{0} წუთში", [Math.max(min, 1)])
  if (min < 24 * 60) return tr("{0} საათსა და {1} წუთში", [Math.floor(min / 60), min % 60])
  return formatDate(a.date)
}

function StatCard({ label, value, icon, note }: { label: string; value: string | number; icon: React.ReactNode; note?: string }) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-line bg-surface p-5 shadow-card">
      <span className="rounded-md bg-brand-tint p-2.5 text-brand-dark" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="text-3xl font-bold leading-none">{value}</p>
        <p className="mt-1.5 text-sm text-muted">{label}</p>
        {note && <p className="text-xs text-muted">{note}</p>}
      </div>
    </div>
  )
}

export default function DoctorDashboard() {
  const data = useAsync(() => doctorPortalService.dashboard(), [])

  return (
    <div>
      <h1 className="text-3xl font-bold">{tr("მთავარი")}</h1>
      <p className="mt-1 text-muted">{tr("თქვენი დღე ერთი შეხედვით.")}</p>

      {data.loading && (
        <div className="mt-6 space-y-4" aria-hidden>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
          <div className="skeleton h-40 w-full" />
        </div>
      )}
      {data.error && (
        <div className="mt-6">
          <ErrorState message={data.error} onRetry={data.reload} />
        </div>
      )}

      {data.data && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <StatCard label={tr("ვიზიტი დღეს")} value={data.data.stats.today} icon={<CalendarClock size={22} />} />
            <StatCard label={tr("ვიზიტი 7 დღეში")} value={data.data.stats.next7Days} icon={<ClipboardList size={22} />} />
            <StatCard label={tr("დასრულებული ამ თვეში")} value={data.data.stats.completedThisMonth} icon={<ClipboardList size={22} />} />
            <StatCard label={tr("პაციენტი")} value={data.data.stats.patients} icon={<Users size={22} />} />
            <StatCard
              label={tr("რეიტინგი")}
              value={data.data.stats.reviewCount ? data.data.stats.rating.toFixed(1) : '—'}
              icon={<Star size={22} />}
              note={tr("{0} შეფასება", [data.data.stats.reviewCount])}
            />
          </div>

          {data.data.nextAppointment && (
            <section className="rounded-lg bg-ink p-6 text-white" aria-labelledby="next-title">
              <h2 id="next-title" className="text-sm font-medium text-white/70">{tr("შემდეგი ვიზიტი")}</h2>
              <p className="mt-1 font-display text-2xl font-bold">
                {data.data.nextAppointment.time} · {data.data.nextAppointment.patientName}
              </p>
              <p className="mt-1 text-white/80">
                {countdown(data.data.nextAppointment)} · {formatDate(data.data.nextAppointment.date)}
                {data.data.nextAppointment.reason ? ` · ${data.data.nextAppointment.reason}` : ''}
              </p>
              <Link
                to={`/doctor/visits/${data.data.nextAppointment.id}`}
                className="mt-4 inline-flex min-h-10 items-center rounded-md bg-white px-4 text-sm font-medium text-ink hover:bg-brand-tint"
              >{tr("ჩანაწერის გახსნა")}</Link>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-line bg-surface p-5 shadow-card" aria-labelledby="today-title">
              <h2 id="today-title" className="text-lg font-bold">{tr("დღევანდელი განრიგი")}</h2>
              {data.data.todayAppointments.length === 0 ? (
                <p className="mt-3 text-sm text-muted">{tr("დღეს დაგეგმილი ვიზიტები არ არის.")}</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {data.data.todayAppointments.map((a) => (
                    <li key={a.id}>
                      <Link to={`/doctor/visits/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-brand-dark">
                        <span>
                          <span className="font-medium">{a.time}</span> · {a.patientName}
                        </span>
                        <span className="text-sm text-muted">{a.reason ?? ''}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-line bg-surface p-5 shadow-card" aria-labelledby="pending-title">
              <h2 id="pending-title" className="flex items-center gap-2 text-lg font-bold">
                <AlertTriangle size={18} className="text-gold" aria-hidden />{tr("ჩანაწერის მოლოდინში")}</h2>
              {data.data.pendingRecords.length === 0 ? (
                <p className="mt-3 text-sm text-muted">{tr("ყველა ჩატარებული ვიზიტის ჩანაწერი დამატებულია.")}</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {data.data.pendingRecords.map((a) => (
                    <li key={a.id}>
                      <Link to={`/doctor/visits/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-brand-dark">
                        <span>
                          {formatDate(a.date)}, {a.time} · {a.patientName}
                        </span>
                        <span className="text-sm font-medium text-brand-dark underline">{tr("ჩანაწერის დამატება")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-line bg-surface p-5 shadow-card" aria-labelledby="week-title">
              <h2 id="week-title" className="text-lg font-bold">{tr("დატვირთვა 7 დღეში")}</h2>
              <ul className="mt-4 flex items-end justify-between gap-2" style={{ height: 140 }}>
                {data.data.weekLoad.map((d) => {
                  const max = Math.max(1, ...data.data!.weekLoad.map((x) => x.count))
                  return (
                    <li key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
                      <span className="text-xs font-medium">{d.count}</span>
                      <span className="w-full rounded-t bg-brand" style={{ height: `${Math.max((d.count / max) * 80, d.count ? 6 : 2)}%`, opacity: d.count ? 1 : 0.25 }} />
                      <span className="text-xs text-muted">
                        {weekdayShort(d.date)} {dayOfMonth(d.date)}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <Link to="/doctor/calendar" className="mt-4 inline-block text-sm font-medium text-brand-dark underline">{tr("კალენდრის გახსნა")}</Link>
            </section>

            <section className="rounded-lg border border-line bg-surface p-5 shadow-card" aria-labelledby="rev-title">
              <h2 id="rev-title" className="text-lg font-bold">{tr("ბოლო შეფასებები")}</h2>
              {data.data.latestReviews.length === 0 ? (
                <p className="mt-3 text-sm text-muted">{tr("შეფასებები ჯერ არ არის.")}</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {data.data.latestReviews.map((r) => (
                    <li key={r.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} size={14} />
                        <span className="font-medium">{r.patientName}</span>
                      </div>
                      {r.comment && <p className="mt-1 line-clamp-2 break-words text-muted">{r.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/doctor/reviews" className="mt-4 inline-block text-sm font-medium text-brand-dark underline">{tr("ყველა შეფასება")}</Link>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
