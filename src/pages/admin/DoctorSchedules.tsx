import { useState } from 'react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAsync } from '@/hooks/useAsync'
import { adminService } from '@/services/appointmentService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import type { Doctor } from '@/types'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/States'

const DAY_LABELS = [
  { d: 1, l: 'ორშ' },
  { d: 2, l: 'სამ' },
  { d: 3, l: 'ოთხ' },
  { d: 4, l: 'ხუთ' },
  { d: 5, l: 'პარ' },
  { d: 6, l: 'შაბ' },
  { d: 0, l: 'კვი' },
]

function Row({ doctor, onSaved }: { doctor: Doctor; onSaved: () => void }) {
  const { notify } = useToast()
  const [days, setDays] = useState(doctor.workDays)
  const [start, setStart] = useState(doctor.workHours.start)
  const [end, setEnd] = useState(doctor.workHours.end)
  const [saving, setSaving] = useState(false)
  const dirty = days.join() !== doctor.workDays.join() || start !== doctor.workHours.start || end !== doctor.workHours.end
  const invalid = days.length === 0 || start >= end

  const save = async (patch: Parameters<typeof adminService.updateDoctor>[1]) => {
    setSaving(true)
    try {
      await adminService.updateDoctor(doctor.id, patch)
      notify('ცვლილება შენახულია')
      onSaved()
    } catch (e) {
      notify(errorMessage(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className={`border-t border-line ${doctor.active ? '' : 'bg-canvas text-muted'}`}>
      <td className="px-4 py-3">
        <p className="font-medium">{doctor.fullName}</p>
        <p className="text-xs text-muted">{SPECIALTY_LABELS[doctor.specialty]}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label={`${doctor.fullName}: სამუშაო დღეები`}>
          {DAY_LABELS.map(({ d, l }) => {
            const on = days.includes(d)
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => setDays((cur) => (on ? cur.filter((x) => x !== d) : [...cur, d].sort()))}
                className={`rounded px-2 py-1 text-xs font-medium ${on ? 'bg-brand text-white' : 'border border-line'}`}
              >
                {l}
              </button>
            )
          })}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <input type="time" aria-label="დასაწყისი" value={start} onChange={(e) => setStart(e.target.value)} className="rounded border border-line px-2 py-1" />
          <span>–</span>
          <input type="time" aria-label="დასასრული" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded border border-line px-2 py-1" />
        </div>
        {start >= end && <p className="mt-1 text-xs text-danger">დასასრული დასაწყისზე გვიან უნდა იყოს</p>}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={!dirty || invalid} loading={saving} onClick={() => save({ workDays: days, workHours: { start, end } })}>
            შენახვა
          </Button>
          <Button size="sm" variant={doctor.active ? 'danger' : 'secondary'} disabled={saving} onClick={() => save({ active: !doctor.active })}>
            {doctor.active ? 'დეაქტივაცია' : 'გააქტიურება'}
          </Button>
        </div>
      </td>
    </tr>
  )
}

export default function DoctorSchedules() {
  const list = useAsync(() => adminService.doctors(), [])
  return (
    <div>
      <h1 className="text-3xl font-bold">ექიმების გრაფიკი</h1>
      <p className="mt-1 text-muted">შეცვალეთ სამუშაო დღეები და საათები. გაუქმებულ დღეებზე ახალი ჯავშნები აღარ გაკეთდება.</p>

      <div className="mt-6" aria-live="polite">
        {list.loading && <div className="skeleton h-64 w-full" />}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
        {list.data && (
          <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-canvas text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">ექიმი</th>
                  <th className="px-4 py-3 font-medium">სამუშაო დღეები</th>
                  <th className="px-4 py-3 font-medium">საათები</th>
                  <th className="px-4 py-3 font-medium">მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((d) => (
                  <Row key={`${d.id}-${d.workDays.join()}-${d.workHours.start}-${d.workHours.end}-${d.active}`} doctor={d} onSaved={list.reload} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
