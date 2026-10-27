import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import type { SpecialtyKey } from '@/types'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { doctorService, type DoctorFilters } from '@/services/doctorService'
import { DoctorCard } from '@/components/DoctorCard'
import { DoctorCardSkeleton, EmptyState, ErrorState } from '@/components/ui/States'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/SelectField'
import { DoctorSearchBox } from '@/components/search/DoctorSearchBox'
import { SpecialtyPills } from '@/components/search/SpecialtyPills'
import { AvailabilityControl, type Availability } from '@/components/search/AvailabilityControl'

const AVAILABILITY_LABEL: Record<string, string> = { today: 'თავისუფალია დღეს', tomorrow: 'თავისუფალია ხვალ', week: 'თავისუფალია 7 დღეში' }

export default function Doctors() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [qInput, setQInput] = useState(params.get('q') ?? '')
  const q = useDebounce(qInput, 300)

  const specialty = (params.get('specialty') ?? '') as SpecialtyKey | ''
  const clinicId = Number(params.get('clinicId')) || ''
  const minRating = Number(params.get('minRating')) || ''
  const availability = (params.get('availability') ?? '') as Availability
  const sort = (params.get('sort') ?? 'soonest') as NonNullable<DoctorFilters['sort']>
  const page = Number(params.get('page')) || 1

  // keep the URL in sync with the (debounced) search box
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

  const everyone = useAsync(() => doctorService.list({ pageSize: 50 }), [])
  const clinics = useAsync(() => doctorService.clinics(), [])
  const result = useAsync(
    () => doctorService.list({ q: params.get('q') ?? '', specialty, clinicId, minRating, availability, sort, page }),
    [params.toString()],
  )

  const clearAll = () => {
    setQInput('')
    setParams({})
  }

  const chips: { key: string; label: string }[] = [
    ...(params.get('q') ? [{ key: 'q', label: `„${params.get('q')}“` }] : []),
    ...(specialty ? [{ key: 'specialty', label: SPECIALTY_LABELS[specialty] }] : []),
    ...(clinicId ? [{ key: 'clinicId', label: clinics.data?.find((c) => c.id === clinicId)?.name ?? 'კლინიკა' }] : []),
    ...(minRating ? [{ key: 'minRating', label: `რეიტინგი ${minRating}+` }] : []),
    ...(availability ? [{ key: 'availability', label: AVAILABILITY_LABEL[availability] }] : []),
  ]
  const removeChip = (key: string) => {
    if (key === 'q') setQInput('')
    setParam(key, '')
  }

  return (
    <div>
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lav/50 via-brand-tint to-surface px-5 py-8 sm:px-8 sm:py-10">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-brand/70 blur-2xl" />
        <div className="relative max-w-3xl">
          <h1 className="text-3xl font-bold sm:text-4xl">იპოვეთ ექიმი და დაჯავშნეთ დრო</h1>
          <p className="mt-2 max-w-xl text-muted">ჩაწერა რამდენიმე წუთში, ზარებისა და რიგების გარეშე. თავისუფალ დროს რეალურ დროში ხედავთ.</p>
          <div className="mt-6">
            <DoctorSearchBox
              value={qInput}
              onChange={setQInput}
              doctors={everyone.data?.data ?? []}
              onPickSpecialty={(k) => {
                setQInput('')
                const next = new URLSearchParams(params)
                next.set('specialty', k)
                next.delete('q')
                next.delete('page')
                setParams(next)
              }}
              onPickDoctor={(id) => navigate(`/doctors/${id}`)}
            />
          </div>
        </div>
      </section>

      <section className="mt-6" aria-label="ფილტრები">
        <SpecialtyPills value={specialty} onChange={(v) => setParam('specialty', v)} doctors={everyone.data?.data ?? []} />

        <div className="mt-4 grid gap-4 rounded-xl border border-line bg-surface p-4 shadow-card sm:grid-cols-2 lg:grid-cols-[minmax(300px,1.4fr)_repeat(3,minmax(0,1fr))]">
          <AvailabilityControl value={availability} onChange={(v) => setParam('availability', v)} />
          <SelectField label="კლინიკა" value={clinicId} onChange={(e) => setParam('clinicId', e.target.value)}>
            <option value="">ყველა კლინიკა</option>
            {clinics.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="რეიტინგი" value={minRating} onChange={(e) => setParam('minRating', e.target.value)}>
            <option value="">ნებისმიერი</option>
            <option value="4.5">4.5 და მეტი</option>
            <option value="4.7">4.7 და მეტი</option>
            <option value="4.9">4.9 და მეტი</option>
          </SelectField>
          <SelectField label="დალაგება" value={sort} onChange={(e) => setParam('sort', e.target.value)}>
            <option value="soonest">უახლოესი დროით</option>
            <option value="rating">რეიტინგით</option>
            <option value="experience">გამოცდილებით</option>
            <option value="name">სახელით</option>
          </SelectField>
        </div>

        <p className="mt-3 text-sm text-muted">
          არ იცით, ვის მიმართოთ?{' '}
          <button type="button" onClick={() => setParam('specialty', 'therapy')} className="font-medium text-accent underline">
            თერაპევტი
          </button>{' '}
          დაგეხმარებათ სწორი მიმართულების არჩევაში.
        </p>
      </section>

      <div className="mt-8" aria-live="polite">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {result.data && <p className="mr-2 text-sm font-medium">{result.data.total === 0 ? 'შედეგი არ არის' : `ნაპოვნია ${result.data.total} ექიმი`}</p>}
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => removeChip(c.key)}
              aria-label={`ფილტრის მოხსნა: ${c.label}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-tint pl-3 pr-2 text-sm font-medium text-accent hover:bg-lav/50"
            >
              {c.label}
              <X size={14} aria-hidden />
            </button>
          ))}
          {chips.length > 1 && (
            <button type="button" onClick={clearAll} className="text-sm font-medium text-muted underline hover:text-ink">
              ყველას გასუფთავება
            </button>
          )}
        </div>

        {result.loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        )}

        {result.error && <ErrorState message={result.error} onRetry={result.reload} />}

        {result.data && result.data.data.length === 0 && (
          <EmptyState
            title="ექიმი ვერ მოიძებნა"
            text="სცადეთ სხვა სპეციალობა, ან მოხსენით რომელიმე ფილტრი. თავისუფალი დრო შეიძლება ამ კვირაში ბევრ ექიმთან გვქონდეს."
            action={
              chips.length > 0 && (
                <Button variant="secondary" onClick={clearAll}>
                  ფილტრების გასუფთავება
                </Button>
              )
            }
          />
        )}

        {result.data && result.data.data.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
