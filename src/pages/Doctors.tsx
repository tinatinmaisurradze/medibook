import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import type { SpecialtyKey } from '@/types'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { doctorService, type DoctorFilters } from '@/services/doctorService'
import { DoctorCard } from '@/components/DoctorCard'
import { DoctorCardSkeleton, EmptyState, ErrorState } from '@/components/ui/States'
import { Button } from '@/components/ui/Button'

const selectCls =
  'w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30'

export default function Doctors() {
  const [params, setParams] = useSearchParams()
  const [qInput, setQInput] = useState(params.get('q') ?? '')
  const q = useDebounce(qInput)

  const specialty = (params.get('specialty') ?? '') as SpecialtyKey | ''
  const clinicId = Number(params.get('clinicId')) || ''
  const minRating = Number(params.get('minRating')) || ''
  const sort = (params.get('sort') ?? 'rating') as NonNullable<DoctorFilters['sort']>
  const page = Number(params.get('page')) || 1

  // keep the URL in sync with the debounced search box
  useEffect(() => {
    if ((params.get('q') ?? '') === q) return
    const next = new URLSearchParams(params)
    q ? next.set('q', q) : next.delete('q')
    next.delete('page')
    setParams(next, { replace: true })
  }, [q, params, setParams])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const clinics = useAsync(() => doctorService.clinics(), [])
  const result = useAsync(
    () => doctorService.list({ q: params.get('q') ?? '', specialty, clinicId, minRating, sort, page }),
    [params.toString()],
  )

  const hasFilters = !!(specialty || clinicId || minRating || params.get('q'))

  return (
    <div>
      <h1 className="text-3xl font-bold">ექიმები</h1>
      <p className="mt-1 text-muted">გაფილტრეთ სპეციალობით, კლინიკით ან რეიტინგით და აირჩიეთ ექიმი.</p>

      <div className="mt-6 grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-card sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <label htmlFor="f-q" className="sr-only">
            ექიმის სახელი
          </label>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="f-q"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="ექიმის სახელი"
            className={`${selectCls} pl-9`}
          />
        </div>
        <div>
          <label htmlFor="f-specialty" className="sr-only">
            სპეციალობა
          </label>
          <select id="f-specialty" className={selectCls} value={specialty} onChange={(e) => setParam('specialty', e.target.value)}>
            <option value="">ყველა სპეციალობა</option>
            {Object.entries(SPECIALTY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-clinic" className="sr-only">
            კლინიკა
          </label>
          <select id="f-clinic" className={selectCls} value={clinicId} onChange={(e) => setParam('clinicId', e.target.value)}>
            <option value="">ყველა კლინიკა</option>
            {clinics.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-rating" className="sr-only">
            მინიმალური რეიტინგი
          </label>
          <select id="f-rating" className={selectCls} value={minRating} onChange={(e) => setParam('minRating', e.target.value)}>
            <option value="">ნებისმიერი რეიტინგი</option>
            <option value="4.5">4.5 და მეტი</option>
            <option value="4.7">4.7 და მეტი</option>
            <option value="4.9">4.9 და მეტი</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-sort" className="sr-only">
            დახარისხება
          </label>
          <select id="f-sort" className={selectCls} value={sort} onChange={(e) => setParam('sort', e.target.value)}>
            <option value="rating">რეიტინგის მიხედვით</option>
            <option value="experience">გამოცდილების მიხედვით</option>
            <option value="name">სახელის მიხედვით</option>
          </select>
        </div>
      </div>

      <div className="mt-6" aria-live="polite">
        {result.loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        )}

        {result.error && <ErrorState message={result.error} onRetry={result.reload} />}

        {result.data && result.data.data.length === 0 && (
          <EmptyState
            title="ექიმი ვერ მოიძებნა"
            text="შეცვალეთ ფილტრები ან სცადეთ სხვა სპეციალობა."
            action={
              hasFilters && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQInput('')
                    setParams({})
                  }}
                >
                  ფილტრების გასუფთავება
                </Button>
              )
            }
          />
        )}

        {result.data && result.data.data.length > 0 && (
          <>
            <p className="mb-3 text-sm text-muted">ნაპოვნია {result.data.total} ექიმი</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.data.data.map((d) => (
                <DoctorCard key={d.id} doctor={d} clinic={clinics.data?.find((c) => c.id === d.clinicId)} />
              ))}
            </div>

            {result.data.totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-3" aria-label="გვერდები">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>
                  წინა
                </Button>
                <span className="text-sm text-muted">
                  გვერდი {result.data.page} / {result.data.totalPages}
                </span>
                <Button variant="secondary" size="sm" disabled={page >= result.data.totalPages} onClick={() => setParam('page', String(page + 1))}>
                  შემდეგი
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}
