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
import { SelectField } from '@/components/ui/SelectField'
import { groupByCity, municipalitiesOf, regionsOf } from '@/utils/geo'

const selectCls =
  'w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#0d7a83]/30'

export default function Doctors() {
  const [params, setParams] = useSearchParams()
  const [qInput, setQInput] = useState(params.get('q') ?? '')
  const q = useDebounce(qInput)

  const specialty = (params.get('specialty') ?? '') as SpecialtyKey | ''
  const clinicId = Number(params.get('clinicId')) || ''
  const minRating = Number(params.get('minRating')) || ''
  const region = params.get('region') ?? ''
  const municipality = params.get('municipality') ?? ''
  const maxPrice = Number(params.get('maxPrice')) || ''
  const availability = (params.get('availability') ?? '') as NonNullable<DoctorFilters['availability']>
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

  /** change several filters at once (the dependent ones are reset) */
  const setMany = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    next.delete('page')
    setParams(next)
  }

  const clinics = useAsync(() => doctorService.clinics(), [])
  const allClinics = clinics.data ?? []
  const clinicOptions = allClinics.filter((c) => (!region || c.region === region) && (!municipality || c.municipality === municipality))
  const result = useAsync(
    () => doctorService.list({ q: params.get('q') ?? '', specialty, clinicId, region, municipality, minRating, maxPrice, availability, sort, page }),
    [params.toString()],
  )

  const hasFilters = !!(specialty || clinicId || region || municipality || minRating || maxPrice || availability || params.get('q'))

  return (
    <div>
      <h1 className="text-3xl font-bold">ექიმები</h1>
      <p className="mt-1 text-muted">გაფილტრეთ სპეციალობით, კლინიკით ან რეიტინგით და აირჩიეთ ექიმი.</p>

      <div className="mt-6 grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <label htmlFor="f-q" className="sr-only">
            ექიმის სახელი
          </label>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input id="f-q" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="ექიმის სახელი" className={`${selectCls} h-12 pl-9`} />
        </div>
        <SelectField label="სპეციალობა" hideLabel value={specialty} onChange={(e) => setParam('specialty', e.target.value)}>
          <option value="">ყველა სპეციალობა</option>
          {Object.entries(SPECIALTY_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField label="თავისუფალი დრო" hideLabel value={availability} onChange={(e) => setParam('availability', e.target.value)}>
          <option value="">ნებისმიერ დროს</option>
          <option value="today">დღეს</option>
          <option value="tomorrow">ხვალ</option>
          <option value="week">7 დღეში</option>
        </SelectField>

        <SelectField label="რეგიონი" hideLabel value={region} onChange={(e) => setMany({ region: e.target.value, municipality: '', clinicId: '' })}>
          <option value="">ყველა რეგიონი</option>
          {regionsOf(allClinics).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </SelectField>
        <SelectField label="მუნიციპალიტეტი" hideLabel value={municipality} onChange={(e) => setMany({ municipality: e.target.value, clinicId: '' })}>
          <option value="">ყველა მუნიციპალიტეტი</option>
          {municipalitiesOf(allClinics, region).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </SelectField>
        <SelectField label="კლინიკა" hideLabel value={clinicId} onChange={(e) => setParam('clinicId', e.target.value)}>
          <option value="">ყველა კლინიკა</option>
          {groupByCity(clinicOptions).map((g) => (
            <optgroup key={g.city} label={g.city}>
              {g.clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <SelectField label="ფასი" hideLabel value={maxPrice} onChange={(e) => setParam('maxPrice', e.target.value)}>
          <option value="">ნებისმიერი ფასი</option>
          <option value="50">50 ₾-მდე</option>
          <option value="70">70 ₾-მდე</option>
          <option value="100">100 ₾-მდე</option>
        </SelectField>

        <SelectField label="მინიმალური რეიტინგი" hideLabel value={minRating} onChange={(e) => setParam('minRating', e.target.value)}>
          <option value="">ნებისმიერი რეიტინგი</option>
          <option value="4.5">4.5 და მეტი</option>
          <option value="4.7">4.7 და მეტი</option>
          <option value="4.9">4.9 და მეტი</option>
        </SelectField>
        <SelectField label="დახარისხება" hideLabel value={sort} onChange={(e) => setParam('sort', e.target.value)}>
          <option value="rating">რეიტინგის მიხედვით</option>
          <option value="soonest">უახლოესი თავისუფალი დრო</option>
          <option value="price">ფასის მიხედვით</option>
          <option value="experience">გამოცდილების მიხედვით</option>
          <option value="name">სახელის მიხედვით</option>
        </SelectField>
        <button
          type="button"
          disabled={!hasFilters}
          onClick={() => {
            setQInput('')
            setParams({})
          }}
          className="inline-flex h-12 items-center justify-center rounded-lg border border-line text-sm font-medium transition-colors hover:border-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink sm:col-span-2"
        >
          ფილტრების გასუფთავება
        </button>
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
                <DoctorCard key={d.id} doctor={d} clinics={clinics.data ?? []} />
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
