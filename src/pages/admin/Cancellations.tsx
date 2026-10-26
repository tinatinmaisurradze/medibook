import { useAsync } from '@/hooks/useAsync'
import { adminService } from '@/services/appointmentService'
import { StatusBadge } from '@/components/ui/Badges'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { formatDate } from '@/utils/date'
import { Button } from '@/components/ui/Button'
import { appointmentService } from '@/services/appointmentService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { useState } from 'react'

export default function Cancellations() {
  const { notify } = useToast()
  const list = useAsync(() => adminService.appointments(), [])
  const [busy, setBusy] = useState<number | null>(null)

  const cancelled = (list.data ?? []).filter((a) => a.status === 'cancelled')
  const upcoming = (list.data ?? []).filter((a) => a.status === 'confirmed').reverse()

  const cancel = async (id: number) => {
    setBusy(id)
    try {
      await appointmentService.cancel(id)
      notify('ვიზიტი გაუქმდა, დრო თავისუფალია')
      list.reload()
    } catch (e) {
      notify(errorMessage(e), 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold">გაუქმებული ვიზიტები</h1>
        <p className="mt-1 text-muted">გაუქმებული ვიზიტის დრო ავტომატურად თავისუფლდება ახალი ჯავშნისთვის.</p>
        <div className="mt-5" aria-live="polite">
          {list.loading && <div className="skeleton h-40 w-full" />}
          {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
          {list.data && cancelled.length === 0 && <EmptyState title="გაუქმებული ვიზიტები არ არის" />}
          {cancelled.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-canvas text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">თარიღი</th>
                    <th className="px-4 py-3 font-medium">პაციენტი</th>
                    <th className="px-4 py-3 font-medium">ექიმი</th>
                    <th className="px-4 py-3 font-medium">სტატუსი</th>
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
        <h2 className="text-2xl font-bold">მომავალი ვიზიტები</h2>
        <p className="mt-1 text-muted">ადმინისტრატორს ვიზიტის გაუქმება დაწყებამდე ნებისმიერ დროს შეუძლია.</p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
          <table className="w-full min-w-[620px] text-left text-sm">
            <tbody>
              {upcoming.length === 0 && (
                <tr><td className="px-4 py-6 text-muted">მომავალი ვიზიტები არ არის</td></tr>
              )}
              {upcoming.map((a) => (
                <tr key={a.id} className="border-t border-line first:border-t-0">
                  <td className="px-4 py-3">{formatDate(a.date)}, {a.time}</td>
                  <td className="px-4 py-3">{a.patientName}</td>
                  <td className="px-4 py-3">{a.doctorName}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="danger" loading={busy === a.id} onClick={() => cancel(a.id)}>გაუქმება</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
