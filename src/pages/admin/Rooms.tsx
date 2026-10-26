import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { adminService } from '@/services/appointmentService'
import { doctorService } from '@/services/doctorService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import type { Clinic, Doctor } from '@/types'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/States'

function RoomRow({ doctor, clinic, onSaved }: { doctor: Doctor; clinic?: Clinic; onSaved: () => void }) {
  const { notify } = useToast()
  const [room, setRoom] = useState(doctor.room)
  const [saving, setSaving] = useState(false)
  const empty = room.trim().length === 0

  const save = async () => {
    setSaving(true)
    try {
      await adminService.updateDoctor(doctor.id, { room })
      notify('კაბინეტი განახლდა')
      onSaved()
    } catch (e) {
      notify(errorMessage(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="border-t border-line">
      <td className="px-4 py-3 font-medium">{doctor.fullName}</td>
      <td className="px-4 py-3 text-muted">{clinic?.name}</td>
      <td className="px-4 py-3">
        <label className="sr-only" htmlFor={`room-${doctor.id}`}>
          კაბინეტი: {doctor.fullName}
        </label>
        <input
          id={`room-${doctor.id}`}
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className={`w-full max-w-[200px] rounded border px-2 py-1.5 ${empty ? 'border-danger' : 'border-line'}`}
        />
        {empty && <p className="mt-1 text-xs text-danger">კაბინეტი სავალდებულოა</p>}
      </td>
      <td className="px-4 py-3">
        <Button size="sm" disabled={empty || room === doctor.room} loading={saving} onClick={save}>
          შენახვა
        </Button>
      </td>
    </tr>
  )
}

export default function Rooms() {
  const doctors = useAsync(() => adminService.doctors(), [])
  const clinics = useAsync(() => doctorService.clinics(), [])

  return (
    <div>
      <h1 className="text-3xl font-bold">კაბინეტების განაწილება</h1>
      <p className="mt-1 text-muted">მიუთითეთ, რომელ კაბინეტში იღებს ყოველი ექიმი.</p>
      <div className="mt-6">
        {doctors.loading && <div className="skeleton h-64 w-full" />}
        {doctors.error && <ErrorState message={doctors.error} onRetry={doctors.reload} />}
        {doctors.data && (
          <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-canvas text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">ექიმი</th>
                  <th className="px-4 py-3 font-medium">კლინიკა</th>
                  <th className="px-4 py-3 font-medium">კაბინეტი</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {doctors.data.map((d) => (
                  <RoomRow key={`${d.id}-${d.room}`} doctor={d} clinic={clinics.data?.find((c) => c.id === d.clinicId)} onSaved={doctors.reload} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
