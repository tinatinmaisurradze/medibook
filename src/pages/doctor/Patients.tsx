import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { doctorPortalService } from '@/services/doctorPortalService'
import { formatDate } from '@/utils/date'
import { EmptyState, ErrorState } from '@/components/ui/States'

export default function DoctorPatients() {
  const list = useAsync(() => doctorPortalService.patients(), [])
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (list.data ?? []).filter((p) => !term || p.fullName.toLowerCase().includes(term) || p.email.toLowerCase().includes(term))
  }, [list.data, q])

  return (
    <div>
      <h1 className="text-3xl font-bold">პაციენტები</h1>
      <p className="mt-1 text-muted">პაციენტები, რომლებთანაც ვიზიტი გაქვთ ან დაგეგმილია.</p>

      <div className="relative mt-6 max-w-md">
        <label htmlFor="patient-search" className="sr-only">
          პაციენტის ძებნა
        </label>
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id="patient-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="სახელი ან ელ-ფოსტა"
          className="w-full rounded-md border border-line bg-surface py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <div className="mt-6" aria-live="polite">
        {list.loading && <div className="skeleton h-56 w-full" aria-hidden />}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
        {list.data && filtered.length === 0 && <EmptyState title="პაციენტი ვერ მოიძებნა" text={q ? 'სცადეთ სხვა სახელი.' : 'ჯერ პაციენტები არ გყავთ.'} />}

        {filtered.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-canvas text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">პაციენტი</th>
                  <th className="px-4 py-3 font-medium">ტელეფონი</th>
                  <th className="px-4 py-3 font-medium">ვიზიტები</th>
                  <th className="px-4 py-3 font-medium">ბოლო ვიზიტი</th>
                  <th className="px-4 py-3 font-medium">შემდეგი ვიზიტი</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.patientId} className="border-t border-line">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.fullName}</p>
                      <p className="text-xs text-muted">{p.email}</p>
                    </td>
                    <td className="px-4 py-3">{p.phone ?? '—'}</td>
                    <td className="px-4 py-3">{p.visitCount}</td>
                    <td className="px-4 py-3">{p.lastVisit ? formatDate(p.lastVisit) : '—'}</td>
                    <td className="px-4 py-3">{p.nextVisit ? formatDate(p.nextVisit) : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/doctor/patients/${p.patientId}`} className="whitespace-nowrap font-medium text-brand-dark underline">
                        პაციენტის ბარათი
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
