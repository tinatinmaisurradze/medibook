import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { CalendarDays, Clock, DoorOpen } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAsync } from '@/hooks/useAsync'
import { doctorService } from '@/services/doctorService'
import { appointmentService } from '@/services/appointmentService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { bookingSchema, type BookingForm } from '@/utils/validation'
import { formatDate } from '@/utils/date'
import { TextArea } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Badges'
import { EmptyState } from '@/components/ui/States'

export default function Book() {
  const { doctorId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const date = params.get('date')
  const time = params.get('time')
  const [serverError, setServerError] = useState<string | null>(null)

  const doctor = useAsync(() => doctorService.get(Number(doctorId)), [doctorId])
  const clinics = useAsync(() => doctorService.clinics(), [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingForm>({ resolver: zodResolver(bookingSchema), mode: 'onChange' })
  const reasonLength = (watch('reason') ?? '').length

  if (!date || !time) return <Navigate to={`/doctors/${doctorId}`} replace />

  if (doctor.loading) return <div className="skeleton mx-auto h-72 max-w-xl" aria-hidden />
  if (!doctor.data) {
    return <EmptyState title="ექიმი ვერ მოიძებნა" action={<Link to="/doctors" className="font-medium text-accent underline">ექიმების სია</Link>} />
  }

  const d = doctor.data
  const clinic = clinics.data?.find((c) => c.id === d.clinicId)

  const onSubmit = async (data: BookingForm) => {
    setServerError(null)
    try {
      await appointmentService.create({ doctorId: d.id, date, time, reason: data.reason?.trim() || undefined })
      notify('ვიზიტი დაჯავშნილია')
      navigate('/my-appointments', { replace: true })
    } catch (e) {
      setServerError(errorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold">ვიზიტის დადასტურება</h1>

      <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center gap-4">
          <Avatar name={d.fullName} />
          <div>
            <p className="text-lg font-semibold">{d.fullName}</p>
            <p className="text-sm text-accent">{SPECIALTY_LABELS[d.specialty]}</p>
          </div>
        </div>
        <ul className="mt-4 grid gap-2 text-sm">
          <li className="flex items-center gap-2">
            <CalendarDays size={16} className="text-muted" aria-hidden /> {formatDate(date)}
          </li>
          <li className="flex items-center gap-2">
            <Clock size={16} className="text-muted" aria-hidden /> {time}, {d.slotMinutes} წუთი
          </li>
          <li className="flex items-center gap-2">
            <DoorOpen size={16} className="text-muted" aria-hidden /> {clinic?.name}, {d.room}
          </li>
        </ul>
        <Link to={`/doctors/${d.id}`} className="mt-4 inline-block text-sm font-medium text-accent underline">
          დროის შეცვლა
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {serverError && (
          <div role="alert" className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
            {serverError}{' '}
            <Link to={`/doctors/${d.id}`} className="font-medium underline">
              აირჩიეთ სხვა დრო
            </Link>
          </div>
        )}
        <TextArea
          label="ვიზიტის მიზეზი (არასავალდებულო)"
          placeholder="მაგ: წნევის მატება, ყოველწლიური გასინჯვა"
          hint={`${reasonLength} / 300`}
          error={errors.reason?.message}
          {...register('reason')}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" loading={isSubmitting} className="sm:flex-1">
            ვიზიტის დადასტურება
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            გაუქმება
          </Button>
        </div>
        <p className="text-sm text-muted">ვიზიტის გაუქმება შესაძლებელია დაწყებამდე მინიმუმ 2 საათით ადრე.</p>
      </form>
    </div>
  )
}
