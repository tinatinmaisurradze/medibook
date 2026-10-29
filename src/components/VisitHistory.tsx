import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import type { AppointmentSearchResult, Clinic } from '@/types'
import type { VisitFilters } from '@/services/appointmentService'
import { toISODate, addDays } from '@/utils/date'
import { formatPrice } from '@/utils/payment'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { SelectField } from '@/components/ui/SelectField'
import { Tabs } from '@/components/ui/Tabs'
import { Pagination } from '@/components/ui/Pagination'
import { groupByCity } from '@/utils/geo'
import { VisitListItem, type Perspective } from '@/components/VisitListItem'

interface Props {
  fetcher: (f: VisitFilters) => Promise<AppointmentSearchResult>
  perspective: Perspective
  clinics: Clinic[]
  /** administrator: filter by doctor */
  doctors?: { id: number; fullName: string }[]
  showSpecialty?: boolean
  pageSize?: number
  initialStatus?: VisitFilters['status']
}

type StatusTab = '' | 'confirmed' | 'completed' | 'cancelled'

const dateInput =
  'h-12 w-full rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:border-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#0d7a83]/25'

/**
 * Search, filters and pages for a long visit history.
 * Everything is filtered on the server, so it stays fast with hundreds of visits.
 * Used by the patient, the doctor and the administrator.
 */
export function VisitHistory({ fetcher, perspective, clinics, doctors, showSpecialty = false, pageSize = 10, initialStatus = '' }: Props) {
  const [qInput, setQInput] = useState('')
  const q = useDebounce(qInput, 300)
  const [status, setStatus] = useState<StatusTab>(initialStatus as StatusTab)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [clinicId, setClinicId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [payment, setPayment] = useState('')
  const [sort, setSort] = useState<'date_desc' | 'date_asc'>('date_desc')
  const [page, setPage] = useState(1)

  const filters = useMemo<VisitFilters>(
    () => ({ q: q.trim(), status, from, to, clinicId: clinicId ? Number(clinicId) : '', doctorId: doctorId ? Number(doctorId) : '', specialty, payment, sort, page, pageSize }),
    [q, status, from, to, clinicId, doctorId, specialty, payment, sort, page, pageSize],
  )
  const result = useAsync(() => fetcher(filters), [JSON.stringify(filters)])

  // any change of a filter starts again from the first page
  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPage(1)
  }
  const active = !!(qInput || status || from || to || clinicId || doctorId || specialty || payment)
  const reset = () => {
    setQInput('')
    setStatus('')
    setFrom('')
    setTo('')
    setClinicId('')
    setDoctorId('')
    setSpecialty('')
    setPayment('')
    setPage(1)
  }
  const quick = (days: number) => {
    setFrom(toISODate(addDays(new Date(), -days)))
    setTo(toISODate(new Date()))
    setPage(1)
  }

  const counts = result.data?.counts
  const sum = counts ? counts.confirmed + counts.completed + counts.cancelled : 0
  const label = (name: string, n?: number) => (n === undefined ? name : `${name} (${n})`)

  return (
    <section aria-label="ვიზიტების ძებნა და ფილტრები">
      <div className="relative">
        <label htmlFor="visit-q" className="sr-only">
          ძებნა ვიზიტებში
        </label>
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand" aria-hidden />
        <input
          id="visit-q"
          value={qInput}
          onChange={(e) => {
            setQInput(e.target.value)
            setPage(1)
          }}
          placeholder={perspective === 'patient' ? 'ძებნა: ექიმი, დიაგნოზი, მიზეზი, კლინიკა...' : perspective === 'doctor' ? 'ძებნა: პაციენტი, დიაგნოზი, მიზეზი...' : 'ძებნა: პაციენტი, ექიმი, კლინიკა...'}
          className="h-12 w-full rounded-lg border border-line bg-surface pl-11 pr-10 text-sm font-medium text-ink placeholder:font-normal placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#0d7a83]/25"
        />
        {qInput && (
          <button type="button" aria-label="ძებნის გასუფთავება" onClick={() => change(setQInput)('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-brand-tint hover:text-ink">
            <X size={16} aria-hidden />
          </button>
        )}
      </div>

      <div className="mt-4">
        <Tabs<StatusTab>
          label="სტატუსის მიხედვით"
          value={status}
          onChange={change(setStatus)}
          tabs={[
            { id: '', label: label('ყველა', counts ? sum : undefined) },
            { id: 'confirmed', label: label('დაგეგმილი', counts?.confirmed) },
            { id: 'completed', label: label('დასრულებული', counts?.completed) },
            { id: 'cancelled', label: label('გაუქმებული', counts?.cancelled) },
          ]}
        />
      </div>

      <div className="mt-4 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="visit-from" className="mb-1.5 block text-sm font-medium">
            თარიღიდან
          </label>
          <input id="visit-from" type="date" className={dateInput} value={from} max={to || undefined} onChange={(e) => change(setFrom)(e.target.value)} />
        </div>
        <div>
          <label htmlFor="visit-to" className="mb-1.5 block text-sm font-medium">
            თარიღამდე
          </label>
          <input id="visit-to" type="date" className={dateInput} value={to} min={from || undefined} onChange={(e) => change(setTo)(e.target.value)} />
        </div>
        <SelectField label="კლინიკა" value={clinicId} onChange={(e) => change(setClinicId)(e.target.value)}>
          <option value="">ყველა კლინიკა</option>
          {groupByCity(clinics).map((g) => (
            <optgroup key={g.city} label={g.city}>
              {g.clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        {showSpecialty && (
          <SelectField label="სპეციალობა" value={specialty} onChange={(e) => change(setSpecialty)(e.target.value)}>
            <option value="">ყველა სპეციალობა</option>
            {Object.entries(SPECIALTY_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </SelectField>
        )}
        {doctors && (
          <SelectField label="ექიმი" value={doctorId} onChange={(e) => change(setDoctorId)(e.target.value)}>
            <option value="">ყველა ექიმი</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </SelectField>
        )}
        <SelectField label="გადახდა" value={payment} onChange={(e) => change(setPayment)(e.target.value)}>
          <option value="">ნებისმიერი</option>
          <option value="paid">გადახდილი</option>
          <option value="pending">ელოდება გადახდას</option>
          <option value="at_clinic">გადახდა რეგისტრატურაში</option>
          <option value="refund_pending">თანხა უბრუნდება</option>
        </SelectField>
        <SelectField label="დალაგება" value={sort} onChange={(e) => change(setSort)(e.target.value as 'date_desc' | 'date_asc')}>
          <option value="date_desc">ჯერ ახალი</option>
          <option value="date_asc">ჯერ ძველი</option>
        </SelectField>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">სწრაფი არჩევანი:</span>
        {[
          ['ბოლო 30 დღე', 30],
          ['ბოლო 6 თვე', 182],
          ['ბოლო წელი', 365],
        ].map(([name, days]) => (
          <button key={name} type="button" onClick={() => quick(days as number)} className="inline-flex h-8 items-center rounded-full bg-brand-tint px-3 text-sm font-medium text-brand-dark transition-colors hover:bg-brand hover:text-white">
            {name}
          </button>
        ))}
        {active && (
          <button type="button" onClick={reset} className="inline-flex h-8 items-center gap-1 rounded-full border border-line px-3 text-sm font-medium transition-colors hover:border-brand">
            <X size={14} aria-hidden /> გასუფთავება
          </button>
        )}
      </div>

      <div className="mt-5" aria-live="polite">
        {result.loading && !result.data && <div className="skeleton h-40 rounded-lg" aria-hidden />}
        {result.error && <ErrorState message={result.error} onRetry={result.reload} />}
        {result.data && (
          <>
            <p className="mb-2 text-sm text-muted">
              ნაპოვნია {result.data.total} ვიზიტი
              {result.data.paidTotal > 0 && perspective !== 'doctor' && <> · გადახდილი სულ: <span className="font-medium text-ink">{formatPrice(result.data.paidTotal)}</span></>}
            </p>
            {result.data.data.length === 0 ? (
              <EmptyState
                title="ვიზიტი ვერ მოიძებნა"
                text={active ? 'სცადეთ სხვა ფილტრები' : undefined}
                action={
                  active ? (
                    <button type="button" onClick={reset} className="font-medium text-brand-dark underline">
                      ფილტრების გასუფთავება
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <ul className={`divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface shadow-card ${result.loading ? 'opacity-60' : ''}`}>
                {result.data.data.map((v) => (
                  <li key={v.id}>
                    <VisitListItem v={v} perspective={perspective} />
                  </li>
                ))}
              </ul>
            )}
            <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </section>
  )
}
