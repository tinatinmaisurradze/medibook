import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { doctorPortalService } from '@/services/doctorPortalService'
import { formatDate } from '@/utils/date'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Pagination } from '@/components/ui/Pagination'

export default function DoctorPatients() {
  const [qInput, setQInput] = useState('')
  const q = useDebounce(qInput, 300)
  const [page, setPage] = useState(1)
  const list = useAsync(() => doctorPortalService.patients(q.trim(), page, 10), [q, page])
  const rows = list.data?.data ?? []

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
          value={qInput}
          onChange={(e) => {
            setQInput(e.target.value)
            setPage(1)
          }}
          placeholder="სახელი, ელ-ფოსტა ან ტელეფონი"
          className="h-12 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm font-medium focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#0d7a83]/25"
        />
      </div>

      <div className="mt-6" aria-live="polite">
        {list.loading && !list.data && <div className="skeleton h-56 w-full" aria-hidden />}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
        {list.data && rows.length === 0 && <EmptyState title="პაციენტი ვერ მოიძებნა" text={q ? 'სცადეთ სხვა სახელი.' : 'ჯერ პაციენტები არ გყავთ.'} />}

        {rows.length > 0 && (
          <>
            <p className="mb-2 text-sm text-muted">ნაპოვნია {list.data?.total} პაციენტი</p>
            <div className={`overflow-x-auto rounded-lg border border-line bg-surface shadow-card ${list.loading ? 'opacity-60' : ''}`}>
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
                  {rows.map((p) => (
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
            <Pagination page={list.data?.page ?? 1} totalPages={list.data?.totalPages ?? 1} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
