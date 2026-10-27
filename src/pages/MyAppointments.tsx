import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAsync } from '@/hooks/useAsync'
import { appointmentService } from '@/services/appointmentService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import type { AppointmentView } from '@/types'
import { formatDate, msUntil } from '@/utils/date'
import { StatusBadge } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/States'

type Tab = 'upcoming' | 'history'

export default function MyAppointments() {
  const { notify } = useToast()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const list = useAsync(() => appointmentService.mine(), [])

  const isUpcoming = (a: AppointmentView) => a.status === 'confirmed' && msUntil(a.date, a.time) > -30 * 60 * 1000
  const items = (list.data ?? []).filter((a) => (tab === 'upcoming' ? isUpcoming(a) : !isUpcoming(a)))
  const sorted = tab === 'upcoming' ? [...items].reverse() : items

  const cancel = async (id: number) => {
    setBusyId(id)
    try {
      await appointmentService.cancel(id)
      notify('ვიზიტი გაუქმდა')
      setConfirmId(null)
      list.reload()
    } catch (e) {
      notify(errorMessage(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">ჩემი ვიზიტები</h1>

      <div className="mt-5 inline-flex rounded-md border border-line bg-surface p-1" role="tablist">
        {(['upcoming', 'history'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-ink text-white' : 'hover:bg-brand-tint'}`}
          >
            {t === 'upcoming' ? 'მომავალი' : 'ისტორია და რეცეპტები'}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4" aria-live="polite">
        {list.loading && (
          <>
            <div className="skeleton h-28 w-full" />
            <div className="skeleton h-28 w-full" />
          </>
        )}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}

        {list.data && sorted.length === 0 && (
          <EmptyState
            title={tab === 'upcoming' ? 'მომავალი ვიზიტები არ გაქვთ' : 'ისტორია ჯერ ცარიელია'}
            text={tab === 'upcoming' ? 'იპოვეთ ექიმი და დაჯავშნეთ პირველი ვიზიტი.' : 'დასრულებული და გაუქმებული ვიზიტები აქ გამოჩნდება.'}
            action={tab === 'upcoming' && <Link to="/doctors" className="inline-flex min-h-11 items-center rounded-md bg-brand px-5 text-sm font-medium text-ink hover:bg-brand-dark">ექიმის პოვნა</Link>}
          />
        )}

        {sorted.map((a) => {
          const tooLate = msUntil(a.date, a.time) < 2 * 3600 * 1000
          return (
            <article key={a.id} className="rounded-lg border border-line bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{a.doctorName}</h2>
                  <p className="text-sm text-accent">{SPECIALTY_LABELS[a.specialty]}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-3 text-sm">
                {formatDate(a.date)}, {a.time} · {a.clinicName}, {a.room}
              </p>
              {a.reason && <p className="mt-1 text-sm text-muted">მიზეზი: {a.reason}</p>}

              {a.status === 'completed' && (a.diagnosis || a.prescription) && (
                <div className="mt-4 rounded-md bg-canvas p-4 text-sm">
                  {a.diagnosis && (
                    <p className="line-clamp-2 break-words">
                      <span className="font-medium">დიაგნოზი:</span> {a.diagnosis}
                    </p>
                  )}
                  {a.prescription && (
                    <p className="mt-1 line-clamp-2 break-words">
                      <span className="font-medium">დანიშნულება:</span> {a.prescription}
                    </p>
                  )}
                </div>
              )}

              {a.status !== 'cancelled' && (
                <Link to={`/my-appointments/${a.id}`} className="mt-4 inline-flex items-center font-medium text-accent underline">
                  სრული ანკეტის ნახვა
                </Link>
              )}

              {a.status === 'confirmed' && (
                <div className="mt-4">
                  {confirmId === a.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm">ნამდვილად გსურთ გაუქმება?</span>
                      <Button variant="danger" size="sm" loading={busyId === a.id} onClick={() => cancel(a.id)}>
                        დიახ, გაუქმება
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                        არა
                      </Button>
                    </div>
                  ) : tooLate ? (
                    <p className="text-sm text-muted">გაუქმება შეუძლებელია: ვიზიტამდე 2 საათზე ნაკლებია.</p>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setConfirmId(a.id)}>
                      ვიზიტის გაუქმება
                    </Button>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
