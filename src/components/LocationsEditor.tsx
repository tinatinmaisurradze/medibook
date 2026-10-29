import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Clinic, DoctorLocation } from '@/types'
import { DAY_SHORT, WEEK_ORDER } from '@/utils/weekdays'
import { citiesOf } from '@/utils/geo'
import type { LocationsPayload } from '@/utils/validation'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/SelectField'

interface Row {
  key: number
  clinicId: number
  room: string
  days: number[]
  start: string
  end: string
  slotMinutes: number
}

interface Props {
  clinics: Clinic[]
  value: DoctorLocation[]
  saving: boolean
  error?: string | null
  onSave: (data: LocationsPayload) => void
}

const field =
  'h-12 w-full rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:border-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#0d7a83]/25'

let keySeq = 1

/** Where a doctor works: clinic, room, days of the week and hours. Used by the doctor (own schedule) and by the administrator. */
export function LocationsEditor({ clinics, value, saving, error, onSave }: Props) {
  const initial = useMemo<Row[]>(() => value.map((l) => ({ key: keySeq++, clinicId: l.clinicId, room: l.room, days: l.days, start: l.start, end: l.end, slotMinutes: l.slotMinutes })), [value])
  const [rows, setRows] = useState<Row[]>(initial)
  // a doctor works in ONE city; inside the city any number of clinics or branches is fine
  const cities = citiesOf(clinics)
  const [city, setCity] = useState(clinics.find((c) => c.id === value[0]?.clinicId)?.city ?? cities[0] ?? '')
  const inCity = clinics.filter((c) => c.city === city)
  const changeCity = (next: string) => {
    setCity(next)
    const first = clinics.find((c) => c.city === next)
    if (first) setRows((r) => r.map((x) => ({ ...x, clinicId: first.id })))
  }

  const patch = (key: number, p: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)))
  const toggleDay = (row: Row, day: number) => patch(row.key, { days: row.days.includes(day) ? row.days.filter((d) => d !== day) : [...row.days, day] })
  const add = () => setRows((r) => [...r, { key: keySeq++, clinicId: inCity[0]?.id ?? clinics[0]?.id ?? 1, room: '', days: [], start: '10:00', end: '16:00', slotMinutes: 30 }])

  // the same rules as on the server, so mistakes are shown before saving
  const problems = useMemo(() => {
    const out: Record<number, string> = {}
    rows.forEach((r) => {
      if (!r.room.trim()) out[r.key] = 'მიუთითეთ კაბინეტი'
      else if (r.days.length === 0) out[r.key] = 'აირჩიეთ მინიმუმ ერთი დღე'
      else if (r.start >= r.end) out[r.key] = 'დასასრული დასაწყისზე გვიან უნდა იყოს'
    })
    let overlap = false
    for (let day = 0; day < 7 && !overlap; day++) {
      const ranges = rows.filter((r) => r.days.includes(day)).map((r) => [r.start, r.end]).sort((a, b) => a[0].localeCompare(b[0]))
      for (let i = 1; i < ranges.length; i++) if (ranges[i][0] < ranges[i - 1][1]) overlap = true
    }
    return { rows: out, overlap }
  }, [rows])

  const invalid = rows.length === 0 || Object.keys(problems.rows).length > 0 || problems.overlap
  const dirty = JSON.stringify(rows.map(({ key: _k, ...r }) => r)) !== JSON.stringify(initial.map(({ key: _k, ...r }) => r))

  return (
    <div>
      <div className="mb-4 max-w-sm">
        <SelectField label="ქალაქი" value={city} onChange={(e) => changeCity(e.target.value)}>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
        <p className="mt-1.5 text-xs text-muted">ექიმი მუშაობს ერთ ქალაქში. ამ ქალაქის რამდენიმე კლინიკა ან ფილიალი შეგიძლიათ დაამატოთ.</p>
      </div>
      <div className="space-y-4">
        {rows.map((r, i) => (
          <fieldset key={r.key} className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <legend className="px-2 text-sm font-semibold text-brand-dark">ლოკაცია {i + 1}</legend>
            <div className="grid items-end gap-3 sm:grid-cols-2">
              <SelectField label="კლინიკა" value={r.clinicId} onChange={(e) => patch(r.key, { clinicId: Number(e.target.value) })}>
                {inCity.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
              <div>
                <label htmlFor={`room-${r.key}`} className="mb-1.5 block text-sm font-medium">
                  კაბინეტი
                </label>
                <input id={`room-${r.key}`} className={field} value={r.room} maxLength={40} onChange={(e) => patch(r.key, { room: e.target.value })} placeholder="მაგ: კაბინეტი 204" />
              </div>
            </div>

            <p className="mb-1.5 mt-4 text-sm font-medium" id={`days-${r.key}`}>
              მუშაობის დღეები
            </p>
            <div role="group" aria-labelledby={`days-${r.key}`} className="flex flex-wrap gap-2">
              {WEEK_ORDER.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={r.days.includes(d)}
                  onClick={() => toggleDay(r, d)}
                  className={`h-10 min-w-[3.25rem] rounded-lg border px-3 text-sm font-medium transition-colors ${r.days.includes(d) ? 'border-brand bg-brand text-white' : 'border-line bg-surface hover:border-brand'}`}
                >
                  {DAY_SHORT[d]}
                </button>
              ))}
            </div>

            <div className="mt-4 grid items-end gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor={`start-${r.key}`} className="mb-1.5 block text-sm font-medium">
                  დაწყება
                </label>
                <input id={`start-${r.key}`} type="time" className={field} value={r.start} onChange={(e) => patch(r.key, { start: e.target.value })} />
              </div>
              <div>
                <label htmlFor={`end-${r.key}`} className="mb-1.5 block text-sm font-medium">
                  დასრულება
                </label>
                <input id={`end-${r.key}`} type="time" className={field} value={r.end} onChange={(e) => patch(r.key, { end: e.target.value })} />
              </div>
              <SelectField label="ხანგრძლივობა" value={r.slotMinutes} onChange={(e) => patch(r.key, { slotMinutes: Number(e.target.value) })}>
                {[10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} წუთი
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p role="alert" className="text-sm text-danger">
                {problems.rows[r.key]}
              </p>
              {rows.length > 1 && (
                <button type="button" onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))} className="inline-flex items-center gap-1.5 text-sm font-medium text-danger hover:underline">
                  <Trash2 size={16} aria-hidden /> წაშლა
                </button>
              )}
            </div>
          </fieldset>
        ))}
      </div>

      {problems.overlap && <p role="alert" className="mt-3 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">ერთსა და იმავე დღეს სხვადასხვა კლინიკის საათები არ უნდა იკვეთებოდეს.</p>}
      {error && <p role="alert" className="mt-3 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={add} disabled={rows.length >= 6}>
          <Plus size={16} aria-hidden /> კიდევ ერთი ლოკაცია
        </Button>
        <Button
          type="button"
          loading={saving}
          disabled={!dirty || invalid}
          onClick={() => onSave({ locations: rows.map((r) => ({ clinicId: r.clinicId, room: r.room.trim(), days: r.days, start: r.start, end: r.end, slotMinutes: r.slotMinutes })) })}
        >
          გრაფიკის შენახვა
        </Button>
      </div>
    </div>
  )
}
