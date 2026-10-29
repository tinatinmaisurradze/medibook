import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Clinic, DoctorService } from '@/types'
import type { ServicesPayload } from '@/utils/validation'
import { Button } from '@/components/ui/Button'

interface Row {
  key: number
  clinicId: number
  name: string
  price: string
  durationMin: number
}

interface Props {
  clinics: Clinic[]
  value: DoctorService[]
  /** the clinics where the doctor works: prices are set per clinic */
  clinicIds: number[]
  saving: boolean
  error?: string | null
  onSave: (data: ServicesPayload) => void
}

const field =
  'h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:border-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#0d7a83]/25'
let keySeq = 1

/** Visit types and prices, per clinic. Used by the doctor (own prices) and by the administrator. */
export function ServicesEditor({ clinics, value, clinicIds, saving, error, onSave }: Props) {
  const initial = useMemo<Row[]>(() => value.map((s) => ({ key: keySeq++, clinicId: s.clinicId, name: s.name, price: String(s.price), durationMin: s.durationMin })), [value])
  const [rows, setRows] = useState<Row[]>(initial)
  const patch = (key: number, p: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)))

  const bad = (r: Row) => r.name.trim().length < 2 || r.price === '' || Number.isNaN(Number(r.price)) || Number(r.price) < 0 || Number(r.price) > 2000
  const missingClinic = clinicIds.some((id) => !rows.some((r) => r.clinicId === id))
  const invalid = rows.some(bad) || missingClinic
  const dirty = JSON.stringify(rows.map(({ key: _k, ...r }) => r)) !== JSON.stringify(initial.map(({ key: _k, ...r }) => r))

  return (
    <div>
      {clinicIds.map((cid) => {
        const clinic = clinics.find((c) => c.id === cid)
        const mine = rows.filter((r) => r.clinicId === cid)
        return (
          <fieldset key={cid} className="mb-4 rounded-xl border border-line bg-surface p-4 shadow-card">
            <legend className="px-2 text-sm font-semibold text-brand-dark">{clinic?.name}</legend>
            <div className="space-y-3">
              {mine.map((r) => (
                <div key={r.key} className="grid grid-cols-[1fr_6.5rem_auto] items-end gap-2 sm:grid-cols-[1fr_8rem_auto]">
                  <div>
                    <label htmlFor={`sn-${r.key}`} className="mb-1 block text-xs font-medium text-muted">
                      მომსახურება
                    </label>
                    <input id={`sn-${r.key}`} className={field} value={r.name} maxLength={80} onChange={(e) => patch(r.key, { name: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor={`sp-${r.key}`} className="mb-1 block text-xs font-medium text-muted">
                      ფასი, ₾
                    </label>
                    <input id={`sp-${r.key}`} inputMode="decimal" className={`${field} ${bad(r) ? 'border-danger' : ''}`} value={r.price} onChange={(e) => patch(r.key, { price: e.target.value.replace(',', '.') })} />
                  </div>
                  <button
                    type="button"
                    aria-label={`წაშლა: ${r.name}`}
                    disabled={mine.length <= 1}
                    onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))}
                    className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger-tint disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRows((r) => [...r, { key: keySeq++, clinicId: cid, name: '', price: '', durationMin: 30 }])}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-dark hover:underline"
            >
              <Plus size={16} aria-hidden /> მომსახურების დამატება
            </button>
          </fieldset>
        )
      })}
      {error && <p role="alert" className="mb-3 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}
      <Button
        type="button"
        loading={saving}
        disabled={!dirty || invalid}
        onClick={() => onSave({ services: rows.map((r) => ({ clinicId: r.clinicId, name: r.name.trim(), price: Number(r.price), durationMin: r.durationMin })) })}
      >
        ფასების შენახვა
      </Button>
    </div>
  )
}
