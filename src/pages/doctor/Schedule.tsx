import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAsync } from '@/hooks/useAsync'
import { appointmentService } from '@/services/appointmentService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import type { AppointmentView } from '@/types'
import { addDays, formatDate, toISODate } from '@/utils/date'
import { visitSchema, type VisitForm } from '@/utils/validation'
import { StatusBadge } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/FormField'
import { EmptyState, ErrorState } from '@/components/ui/States'

function VisitEditor({ appt, onDone }: { appt: AppointmentView; onDone: () => void }) {
  const { notify } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VisitForm>({
    resolver: zodResolver(visitSchema),
    mode: 'onTouched',
    defaultValues: { diagnosis: appt.diagnosis ?? '', prescription: appt.prescription ?? '' },
  })

  const onSubmit = async (data: VisitForm) => {
    try {
      await appointmentService.recordVisit(appt.id, data)
      notify('ჩანაწერი შენახულია')
      onDone()
    } catch (e) {
      notify(errorMessage(e), 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-3 rounded-md bg-canvas p-4">
      <TextArea label="დიაგნოზი" rows={2} error={errors.diagnosis?.message} {...register('diagnosis')} />
      <TextArea label="დანიშნულება" rows={3} error={errors.prescription?.message} {...register('prescription')} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={isSubmitting}>
          შენახვა და ვიზიტის დასრულება
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          გაუქმება
        </Button>
      </div>
    </form>
  )
}

export default function DoctorSchedule() {
  const list = useAsync(() => appointmentService.mine(), [])
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
                      <Button size="sm" variant="secondary" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                        ჩანაწერის დამატება
                      </Button>
                    </div>
                  </div>
                  {openId === a.id && (
                    <VisitEditor
                      appt={a}
                      onDone={() => {
                        setOpenId(null)
                        list.reload()
                      }}
                    />
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}

        {history.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold">ვიზიტების ისტორია</h2>
            <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-canvas text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">თარიღი</th>
                    <th className="px-4 py-3 font-medium">პაციენტი</th>
                    <th className="px-4 py-3 font-medium">სტატუსი</th>
                    <th className="px-4 py-3 font-medium">დიაგნოზი</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((a) => (
                    <tr key={a.id} className="border-t border-line">
                      <td className="px-4 py-3">
                        {formatDate(a.date)}, {a.time}
                      </td>
                      <td className="px-4 py-3">{a.patientName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3">{a.diagnosis ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
