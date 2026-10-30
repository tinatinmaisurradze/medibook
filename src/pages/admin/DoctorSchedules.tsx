import { useState } from 'react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAsync } from '@/hooks/useAsync'
import { adminService } from '@/services/appointmentService'
import { doctorService } from '@/services/doctorService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import type { Clinic, Doctor } from '@/types'
import { daysLabel } from '@/utils/weekdays'
import type { LocationsPayload, ServicesPayload } from '@/utils/validation'
import { formatPrice } from '@/utils/payment'
import { Avatar } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { ErrorState } from '@/components/ui/States'
import { LocationsEditor } from '@/components/LocationsEditor'
import { ServicesEditor } from '@/components/ServicesEditor'
import { tr } from '@/i18n'

type Part = 'schedule' | 'prices'

function DoctorRow({ doctor, clinics, onChanged }: { doctor: Doctor; clinics: Clinic[]; onChanged: () => void }) {
  const { notify } = useToast()
  const [open, setOpen] = useState(false)
  const [part, setPart] = useState<Part>('schedule')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clinicName = (id: number) => clinics.find((c) => c.id === id)?.name ?? '...'

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setSaving(true)
    setError(null)
    try {
      await fn()
      notify(done)
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={doctor.fullName} size={48} />
          <div className="min-w-0">
            <h2 className="font-semibold">
              {doctor.fullName} {!doctor.active && <span className="ml-1 rounded-full bg-danger-tint px-2 py-0.5 text-xs font-medium text-danger">{tr("გამორთულია")}</span>}
            </h2>
            <p className="text-sm text-brand-dark">
              {SPECIALTY_LABELS[doctor.specialty]} · {doctor.city}
            </p>
            <ul className="mt-1 space-y-0.5 text-sm text-muted">
              {doctor.locations.map((l) => (
                <li key={l.id}>
                  {clinicName(l.clinicId)}: {daysLabel(l.days)}, {l.start}–{l.end}
                </li>
              ))}
            </ul>
            {doctor.priceFrom !== null && <p className="mt-1 text-sm">{tr("ფასი {0}-დან", [formatPrice(doctor.priceFrom)])}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? tr("დახურვა") : tr("გრაფიკი და ფასები")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => run(() => adminService.setActive(doctor.id, !doctor.active), doctor.active ? tr("ექიმი გამოირთო") : tr("ექიმი ჩაირთო"))}>
            {doctor.active ? tr("გამორთვა") : tr("ჩართვა")}
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-5 border-t border-line pt-5">
          <Tabs<Part>
            label={tr("გრაფიკი ან ფასები")}
            value={part}
            onChange={(p) => {
              setPart(p)
              setError(null)
            }}
            tabs={[
              { id: 'schedule', label: tr("გრაფიკი") },
              { id: 'prices', label: tr("ფასები") },
            ]}
          />
          <div className="mt-5">
            {part === 'schedule' ? (
              <LocationsEditor
                key={JSON.stringify(doctor.locations)}
                clinics={clinics}
                value={doctor.locations}
                saving={saving}
                error={error}
                onSave={(data: LocationsPayload) => run(() => adminService.saveLocations(doctor.id, data), tr("გრაფიკი განახლდა"))}
              />
            ) : (
              <ServicesEditor
                key={JSON.stringify(doctor.services)}
                clinics={clinics}
                clinicIds={Array.from(new Set(doctor.locations.map((l) => l.clinicId)))}
                value={doctor.services}
                saving={saving}
                error={error}
                onSave={(data: ServicesPayload) => run(() => adminService.saveServices(doctor.id, data), tr("ფასები განახლდა"))}
              />
            )}
          </div>
        </div>
      )}
    </article>
  )
}

export default function DoctorSchedules() {
  const doctors = useAsync(() => adminService.doctors(), [])
  const clinics = useAsync(() => doctorService.clinics(), [])
  return (
    <div>
      <h1 className="text-3xl font-bold">{tr("ექიმების გრაფიკი და ფასები")}</h1>
      <p className="mb-6 mt-1 text-muted">{tr("ექიმი შეიძლება მუშაობდეს ერთი ქალაქის რამდენიმე კლინიკაში. თითოეულ კლინიკას აქვს საკუთარი დღეები, საათები, კაბინეტი და ფასები.")}</p>
      {doctors.loading && <div className="skeleton h-48 w-full" aria-hidden />}
      {doctors.error && <ErrorState message={doctors.error} onRetry={doctors.reload} />}
      <div className="space-y-4">
        {doctors.data && clinics.data && doctors.data.map((d) => <DoctorRow key={d.id} doctor={d} clinics={clinics.data!} onChanged={doctors.reload} />)}
      </div>
    </div>
  )
}
