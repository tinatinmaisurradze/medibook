import { useAsync } from '@/hooks/useAsync'
import { adminService } from '@/services/appointmentService'
import { StatusBadge } from '@/components/ui/Badges'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { formatDate } from '@/utils/date'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { appointmentService } from '@/services/appointmentService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { useState } from 'react'
import { tr } from '@/i18n'

export default function Cancellations() {
  const { notify } = useToast()
  const list = useAsync(() => adminService.appointments(), [])
  const [busy, setBusy] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const confirmTarget = (list.data ?? []).find((x) => x.id === confirmId)

  const cancelled = (list.data ?? []).filter((a) => a.status === 'cancelled')
  const upcoming = (list.data ?? []).filter((a) => a.status === 'confirmed').reverse()

  const cancel = async (id: number) => {
    setBusy(id)
    try {
      await appointmentService.cancel(id)
      notify(tr("ვიზიტი გაუქმდა, დრო თავისუფალია"))
      list.reload()
    } catch (e) {
      notify(errorMessage(e), 'error')
    } finally {
      setBusy(null)
      setConfirmId(null)
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold">{tr("გაუქმებული ვიზიტები")}</h1>
        <p className="mt-1 text-muted">{tr("გაუქმებული ვიზიტის დრო ავტომატურად თავისუფლდება ახალი ჯავშნისთვის.")}</p>
        <div className="mt-5" aria-live="polite">
          {list.loading && <div className="skeleton h-40 w-full" />}
          {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
          {list.data && cancelled.length === 0 && <EmptyState title={tr("გაუქმებული ვიზიტები არ არის")} />}
          {cancelled.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-canvas text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">{tr("თარიღი")}</th>
                    <th className="px-4 py-3 font-medium">{tr("პაციენტი")}</th>
                    <th className="px-4 py-3 font-medium">{tr("ექიმი")}</th>
                    <th className="px-4 py-3 font-medium">{tr("სტატუსი")}</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelled.map((a) => (
                    <tr key={a.id} className="border-t border-line">
                      <td className="px-4 py-3">{formatDate(a.date)}, {a.time}</td>
                      <td className="px-4 py-3">{a.patientName}</td>
                      <td className="px-4 py-3">{a.doctorName}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">{tr("მომავალი ვიზიტები")}</h2>
        <p className="mt-1 text-muted">{tr("ადმინისტრატორს ვიზიტის გაუქმება დაწყებამდე ნებისმიერ დროს შეუძლია.")}</p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
          <table className="w-full min-w-[620px] text-left text-sm">
            <tbody>
              {upcoming.length === 0 && (
                <tr><td className="px-4 py-6 text-muted">{tr("მომავალი ვიზიტები არ არის")}</td></tr>
              )}
              {upcoming.map((a) => (
                <tr key={a.id} className="border-t border-line first:border-t-0">
                  <td className="px-4 py-3">{formatDate(a.date)}, {a.time}</td>
                  <td className="px-4 py-3">{a.patientName}</td>
                  <td className="px-4 py-3">{a.doctorName}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="danger" loading={busy === a.id} onClick={() => setConfirmId(a.id)}>{tr("გაუქმება")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={confirmTarget !== undefined}
        title={tr("ვიზიტის გაუქმება")}
        description={
          confirmTarget && (
            <>
              <p className="font-medium text-ink">
                {confirmTarget.patientName} · {confirmTarget.doctorName}
              </p>
              <p>
                {formatDate(confirmTarget.date)}, {confirmTarget.time}
              </p>
              <p className="mt-1">{tr("ვიზიტი გაუქმდება და დრო თავისუფალი გახდება ახალი ჯავშნისთვის.")}</p>
            </>
          )
        }
        confirmLabel={tr("ვიზიტის გაუქმება")}
        cancelLabel={tr("არა, ვიზიტი დარჩეს")}
        busy={busy !== null}
        onConfirm={() => confirmId !== null && cancel(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
