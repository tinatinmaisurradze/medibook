import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { appointmentService } from '@/services/appointmentService'
import { doctorService } from '@/services/doctorService'
import { VisitHistory } from '@/components/VisitHistory'
import type { AppointmentView } from '@/types'
import { addDays, formatDate, toISODate } from '@/utils/date'
import { StatusBadge } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { VisitEditor } from '@/components/VisitEditor'
import { EmptyState, ErrorState } from '@/components/ui/States'

export default function DoctorSchedule() {
  const list = useAsync(() => appointmentService.mine(), [])
  const clinics = useAsync(() => doctorService.clinics(), [])
  const [openId, setOpenId] = useState<number | null>(null)
  const today = toISODate(new Date())
  const weekEnd = toISODate(addDays(new Date(), 6))

  const { upcoming, history } = useMemo(() => {
    const all = list.data ?? []
    return {
      upcoming: all.filter((a) => a.status === 'confirmed').sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
      history: all.filter((a) => a.status !== 'confirmed'),
    }
  }, [list.data])

  const todayCount = upcoming.filter((a) => a.date === today).length
  const weekCount = upcoming.filter((a) => a.date >= today && a.date <= weekEnd).length

  // group upcoming by date
  const groups = upcoming.reduce<Record<string, AppointmentView[]>>((acc, a) => {
    ;(acc[a.date] ||= []).push(a)
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-3xl font-bold">ჩემი განრიგი</h1>

      <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-5 shadow-card">
          <div>
            <p className="text-3xl font-bold">{todayCount}</p>
            <p className="text-sm text-muted">ვიზიტი დღეს</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-5 shadow-card">
          <div>
            <p className="text-3xl font-bold">{weekCount}</p>
            <p className="text-sm text-muted">ვიზიტი 7 დღეში</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-5 shadow-card">
          <div>
            <p className="text-3xl font-bold">{history.filter((a) => a.status === 'completed').length}</p>
            <p className="text-sm text-muted">დასრულებული ვიზიტი</p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6" aria-live="polite">
        {list.loading && <div className="skeleton h-40 w-full" />}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}

        {list.data && upcoming.length === 0 && <EmptyState title="მომავალი ვიზიტები არ არის" text="ახალი ჯავშნები აქ გამოჩნდება." />}

        {Object.entries(groups).map(([date, appts]) => (
          <section key={date}>
            <h2 className="text-lg font-semibold">{date === today ? `დღეს, ${formatDate(date)}` : formatDate(date)}</h2>
            <div className="mt-3 space-y-3">
              {appts.map((a) => (
                <article key={a.id} className="rounded-lg border border-line bg-surface p-4 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {a.time} · {a.patientName}
                      </p>
                      {a.reason && <p className="text-sm text-muted">მიზეზი: {a.reason}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.status} />
                      <Link
                        to={`/doctor/visits/${a.id}`}
                        className="inline-flex min-h-9 items-center rounded-md border border-line px-3 text-sm font-medium hover:border-brand hover:text-brand-dark"
                      >
                        ანკეტა
                      </Link>
                      <Button size="sm" variant="secondary" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                        ჩანაწერის დამატება
                      </Button>
                    </div>
                  </div>
                  {openId === a.id && (
                    <div className="mt-4">
                      <VisitEditor
                        appointmentId={a.id}
                        initialDiagnosis={a.diagnosis}
                        initialPrescription={a.prescription}
                        onDone={() => {
                          setOpenId(null)
                          list.reload()
                        }}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}

        <section aria-labelledby="history-title">
          <h2 id="history-title" className="text-lg font-semibold">
            ვიზიტების ისტორია და ძებნა
          </h2>
          <p className="mb-4 text-sm text-muted">მოძებნეთ პაციენტით, დიაგნოზით, მიზეზით ან თარიღით.</p>
          <VisitHistory fetcher={appointmentService.search} perspective="doctor" clinics={clinics.data ?? []} />
        </section>
      </div>
    </div>
  )
}
