import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { appointmentService } from '@/services/appointmentService'
import { doctorService } from '@/services/doctorService'
import { profileService } from '@/services/profileService'
import { formatDate, toISODate } from '@/utils/date'
import { MonthCalendar } from '@/components/MonthCalendar'
import { StatusBadge } from '@/components/ui/Badges'
import { ErrorState } from '@/components/ui/States'
import { tr } from '@/i18n'

export default function DoctorCalendar() {
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState(() => toISODate(new Date()))

  const data = useAsync(() => Promise.all([appointmentService.mine(), profileService.get()]), [])
  const doctorId = data.data?.[1].doctor?.id
  const slots = useAsync(() => (doctorId ? doctorService.slots(doctorId, selected) : Promise.resolve(null)), [doctorId, selected])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    data.data?.[0].filter((a) => a.status !== 'cancelled').forEach((a) => (c[a.date] = (c[a.date] ?? 0) + 1))
    return c
  }, [data.data])

  const dayItems = (data.data?.[0] ?? [])
    .filter((a) => a.date === selected && a.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time))

  const allSlots = slots.data?.groups.flatMap((g) => g.slots) ?? []
  const free = slots.data ? allSlots.filter((s) => s.available).length : undefined

  return (
    <div>
      <h1 className="text-3xl font-bold">{tr("კალენდარი")}</h1>
      <p className="mt-1 text-muted">{tr("აირჩიეთ დღე და ნახეთ ვიზიტები. ციფრი დღეზე ვიზიტების რაოდენობაა.")}</p>

      {data.error && (
        <div className="mt-6">
          <ErrorState message={data.error} onRetry={data.reload} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {data.loading ? (
          <div className="skeleton h-96 w-full" aria-hidden />
        ) : (
          <MonthCalendar month={month} onMonthChange={setMonth} counts={counts} selected={selected} onSelect={setSelected} workDays={data.data?.[1].doctor?.workDays} />
        )}

        <section className="h-fit rounded-lg border border-line bg-surface p-5 shadow-card" aria-labelledby="day-title" aria-live="polite">
          <h2 id="day-title" className="text-lg font-bold">
            {formatDate(selected)}
          </h2>
          {free !== undefined && (
            <p className="mt-1 text-sm text-muted">{slots.data && allSlots.length === 0 ? tr("ამ დღეს არ იღებთ") : tr("თავისუფალი დრო: {0}", [free])}</p>
          )}

          {dayItems.length === 0 ? (
            <p className="mt-4 rounded-md bg-canvas p-4 text-sm text-muted">{tr("ამ დღეს ვიზიტები არ არის.")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {dayItems.map((a) => (
                <li key={a.id}>
                  <Link to={`/doctor/visits/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-brand-dark">
                    <span>
                      <span className="font-medium">{a.time}</span> · {a.patientName}
                      {a.reason && <span className="block text-sm text-muted">{a.reason}</span>}
                    </span>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
