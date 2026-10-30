import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import type { AppointmentSearchResult, Clinic } from '@/types'
import type { VisitFilters } from '@/services/appointmentService'
import { addDays, toISODate } from '@/utils/date'
import { groupByCity } from '@/utils/geo'
import { formatPrice } from '@/utils/payment'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { SelectField } from '@/components/ui/SelectField'
import { Pagination } from '@/components/ui/Pagination'
import { VisitListItem, type Perspective } from '@/components/VisitListItem'
import { tr } from '@/i18n'

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
type Period = '' | '30' | '182' | '365' | 'custom'

const PERIOD_LABEL: Record<Exclude<Period, ''>, string> = { '30': tr("ბოლო 30 დღე"), '182': tr("ბოლო 6 თვე"), '365': tr("ბოლო წელი"), custom: tr("კონკრეტული პერიოდი") }
const PAYMENT_LABEL: Record<string, string> = { paid: tr("გადახდილი"), pending: tr("ელოდება გადახდას"), at_clinic: tr("გადახდა რეგისტრატურაში"), refund_pending: tr("თანხა უბრუნდება") }

const dateInput =
  'h-12 w-full rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:border-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#0d7a83]/25'

/**
 * Search, filters and pages for a long visit history. Everything is filtered on the server,
 * so it stays fast with hundreds of visits. Used by the patient, the doctor and the administrator.
 *
 * Layout: search, then the status tabs, then four equal filters, then the result list with its sort order.
 */
export function VisitHistory({ fetcher, perspective, clinics, doctors, showSpecialty = false, pageSize = 10, initialStatus = '' }: Props) {
  const [qInput, setQInput] = useState('')
  const q = useDebounce(qInput, 300)
  const [status, setStatus] = useState<StatusTab>(initialStatus as StatusTab)
  const [period, setPeriod] = useState<Period>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [clinicId, setClinicId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [payment, setPayment] = useState('')
  const [sort, setSort] = useState<'date_desc' | 'date_asc'>('date_desc')
  const [page, setPage] = useState(1)

  const range = useMemo(() => {
    if (period === 'custom') return { from, to }
    if (period) return { from: toISODate(addDays(new Date(), -Number(period))), to: toISODate(new Date()) }
    return { from: '', to: '' }
  }, [period, from, to])

  const filters = useMemo<VisitFilters>(
    () => ({ q: q.trim(), status, from: range.from, to: range.to, clinicId: clinicId ? Number(clinicId) : '', doctorId: doctorId ? Number(doctorId) : '', specialty, payment, sort, page, pageSize }),
    [q, status, range, clinicId, doctorId, specialty, payment, sort, page, pageSize],
  )
  const result = useAsync(() => fetcher(filters), [JSON.stringify(filters)])

  // any change of a filter starts again from the first page
  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPage(1)
  }
  const clinicName = clinics.find((c) => String(c.id) === clinicId)?.name
  const doctorName = doctors?.find((d) => String(d.id) === doctorId)?.fullName
  const chips: { key: string; label: string; clear: () => void }[] = [
    ...(period ? [{ key: 'period', label: period === 'custom' ? `${from || '…'} – ${to || '…'}` : PERIOD_LABEL[period], clear: () => change(setPeriod)('') }] : []),
    ...(clinicName ? [{ key: 'clinic', label: clinicName, clear: () => change(setClinicId)('') }] : []),
    ...(doctorName ? [{ key: 'doctor', label: doctorName, clear: () => change(setDoctorId)('') }] : []),
    ...(specialty ? [{ key: 'spec', label: SPECIALTY_LABELS[specialty as keyof typeof SPECIALTY_LABELS] ?? specialty, clear: () => change(setSpecialty)('') }] : []),
    ...(payment ? [{ key: 'pay', label: PAYMENT_LABEL[payment] ?? payment, clear: () => change(setPayment)('') }] : []),
  ]
  const active = !!(qInput || status || chips.length)
  const reset = () => {
    setQInput('')
    setStatus('')
    setPeriod('')
    setFrom('')
    setTo('')
    setClinicId('')
    setDoctorId('')
    setSpecialty('')
    setPayment('')
    setPage(1)
  }

  const counts = result.data?.counts
  const sum = counts ? counts.confirmed + counts.completed + counts.cancelled : null
  const tabs: { id: StatusTab; label: string; count: number | null }[] = [
    { id: '', label: tr("ყველა"), count: sum },
    { id: 'confirmed', label: tr("დაგეგმილი"), count: counts?.confirmed ?? null },
    { id: 'completed', label: tr("დასრულებული"), count: counts?.completed ?? null },
    { id: 'cancelled', label: tr("გაუქმებული"), count: counts?.cancelled ?? null },
  ]

  return (
    <section aria-label={tr("ვიზიტების ძებნა და ფილტრები")} className="space-y-4">
      <div className="relative">
        <label htmlFor="visit-q" className="sr-only">{tr("ძებნა ვიზიტებში")}</label>
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand" aria-hidden />
        <input
          id="visit-q"
          value={qInput}
          onChange={(e) => {
            setQInput(e.target.value)
            setPage(1)
          }}
          placeholder={perspective === 'patient' ? tr("ძებნა: ექიმი, დიაგნოზი, მიზეზი, კლინიკა") : perspective === 'doctor' ? tr("ძებნა: პაციენტი, დიაგნოზი, მიზეზი") : tr("ძებნა: პაციენტი, ექიმი, კლინიკა")}
          className="h-12 w-full rounded-lg border border-line bg-surface pl-11 pr-10 text-sm font-medium text-ink placeholder:font-normal placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#0d7a83]/25"
        />
        {qInput && (
          <button type="button" aria-label={tr("ძებნის გასუფთავება")} onClick={() => change(setQInput)('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-brand-tint hover:text-ink">
            <X size={16} aria-hidden />
          </button>
        )}
      </div>

      <div role="tablist" aria-label={tr("სტატუსის მიხედვით")} className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-canvas p-1 sm:grid-cols-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={status === t.id}
            onClick={() => change(setStatus)(t.id)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${status === t.id ? 'bg-brand text-white shadow-sm' : 'text-ink hover:bg-surface'}`}
          >
            {t.label}
            {t.count !== null && <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${status === t.id ? 'bg-white/20 text-white' : 'bg-line/60 text-muted'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField label={tr("პერიოდი")} value={period} onChange={(e) => change(setPeriod)(e.target.value as Period)}>
          <option value="">{tr("ნებისმიერი დრო")}</option>
          {(Object.keys(PERIOD_LABEL) as Exclude<Period, ''>[]).map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABEL[p]}
            </option>
          ))}
        </SelectField>
        <SelectField label={tr("კლინიკა")} value={clinicId} onChange={(e) => change(setClinicId)(e.target.value)}>
          <option value="">{tr("ყველა კლინიკა")}</option>
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
        {doctors ? (
          <SelectField label={tr("ექიმი")} value={doctorId} onChange={(e) => change(setDoctorId)(e.target.value)}>
            <option value="">{tr("ყველა ექიმი")}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </SelectField>
        ) : (
          showSpecialty && (
            <SelectField label={tr("სპეციალობა")} value={specialty} onChange={(e) => change(setSpecialty)(e.target.value)}>
              <option value="">{tr("ყველა სპეციალობა")}</option>
              {Object.entries(SPECIALTY_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </SelectField>
          )
        )}
        <SelectField label={tr("გადახდა")} value={payment} onChange={(e) => change(setPayment)(e.target.value)}>
          <option value="">{tr("ნებისმიერი")}</option>
          {Object.entries(PAYMENT_LABEL).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </SelectField>

        {period === 'custom' && (
          <>
            <div>
              <label htmlFor="visit-from" className="mb-1.5 block text-sm font-medium">{tr("თარიღიდან")}</label>
              <input id="visit-from" type="date" className={dateInput} value={from} max={to || undefined} onChange={(e) => change(setFrom)(e.target.value)} />
            </div>
            <div>
              <label htmlFor="visit-to" className="mb-1.5 block text-sm font-medium">{tr("თარიღამდე")}</label>
              <input id="visit-to" type="date" className={dateInput} value={to} min={from || undefined} onChange={(e) => change(setTo)(e.target.value)} />
            </div>
          </>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label={tr("არჩეული ფილტრები")}>
          {chips.map((c) => (
            <button key={c.key} type="button" onClick={c.clear} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-tint px-3 text-sm font-medium text-brand-dark transition-colors hover:bg-brand hover:text-white">
              {c.label}
              <X size={14} aria-label={tr("ფილტრის მოხსნა")} />
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite">
        {result.loading && !result.data && <div className="skeleton h-40 rounded-lg" aria-hidden />}
        {result.error && <ErrorState message={result.error} onRetry={result.reload} />}
        {result.data && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">{tr("ნაპოვნია {0} ვიზიტი", [result.data.total])}{result.data.paidTotal > 0 && perspective !== 'doctor' && (
                  <>{' '}{tr("· სულ გადახდილი:")}{' '}<span className="font-medium text-ink">{formatPrice(result.data.paidTotal)}</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-3">
                {active && (
                  <button type="button" onClick={reset} className="text-sm font-medium text-brand-dark underline">{tr("ყველა ფილტრის გასუფთავება")}</button>
                )}
                <SelectField label={tr("დალაგება")} hideLabel className="w-44" value={sort} onChange={(e) => change(setSort)(e.target.value as 'date_desc' | 'date_asc')}>
                  <option value="date_desc">{tr("ჯერ ახალი")}</option>
                  <option value="date_asc">{tr("ჯერ ძველი")}</option>
                </SelectField>
              </div>
            </div>
            {result.data.data.length === 0 ? (
              <EmptyState
                title={tr("ვიზიტი ვერ მოიძებნა")}
                text={active ? tr("სცადეთ სხვა ფილტრები") : undefined}
                action={
                  active ? (
                    <button type="button" onClick={reset} className="font-medium text-brand-dark underline">{tr("ფილტრების გასუფთავება")}</button>
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
