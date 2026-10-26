import { useAsync } from '@/hooks/useAsync'
import { adminService } from '@/services/appointmentService'
import { ErrorState } from '@/components/ui/States'

export default function AdminStats() {
  const stats = useAsync(() => adminService.stats(), [])

  const max = Math.max(1, ...(stats.data?.byDoctor.map((d) => d.count) ?? [1]))

  return (
    <div>
      <h1 className="text-3xl font-bold">სტატისტიკა</h1>

      {stats.loading && (
        <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      )}
      {stats.error && (
        <div className="mt-5">
          <ErrorState message={stats.error} onRetry={stats.reload} />
        </div>
      )}

      {stats.data && (
        <>
          <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            {[
              { label: 'ყველა ვიზიტი', value: stats.data.totalAppointments },
              { label: 'დადასტურებული', value: stats.data.confirmed },
              { label: 'დასრულებული', value: stats.data.completed },
              { label: 'გაუქმების მაჩვენებელი', value: `${stats.data.cancellationRate}%`, note: `${stats.data.cancelled} გაუქმებული ვიზიტი` },
            ].map((c) => (
              <div key={c.label} className="rounded-lg border border-line bg-surface p-5 shadow-card">
                <p className="text-3xl font-bold">{c.value}</p>
                <p className="text-sm text-muted">{c.label}</p>
                {c.note && <p className="mt-1 text-xs text-muted">{c.note}</p>}
              </div>
            ))}
          </div>

          <section className="mt-8 rounded-lg border border-line bg-surface p-5 shadow-card">
            <h2 className="text-xl font-bold">ექიმების დატვირთვა</h2>
            <p className="text-sm text-muted">აქტიური და დასრულებული ვიზიტები ექიმის მიხედვით</p>
            <ul className="mt-4 space-y-3">
              {stats.data.byDoctor.map((d) => (
                <li key={d.doctorId} className="grid grid-cols-[minmax(0,160px)_1fr_32px] items-center gap-3 text-sm">
                  <span className="truncate">{d.doctorName}</span>
                  <span className="h-3 rounded-full bg-canvas">
                    <span className="block h-3 rounded-full bg-brand" style={{ width: `${(d.count / max) * 100}%` }} />
                  </span>
                  <span className="text-right font-medium">{d.count}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
