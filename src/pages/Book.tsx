import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Banknote, CalendarDays, Clock, CreditCard, MapPin } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAsync } from '@/hooks/useAsync'
import { doctorService } from '@/services/doctorService'
import { appointmentService } from '@/services/appointmentService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { bookingSchema, type BookingForm } from '@/utils/validation'
import { formatDate } from '@/utils/date'
import { formatPrice } from '@/utils/payment'
import type { PaymentMethod } from '@/types'
import { TextArea } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Badges'
import { EmptyState } from '@/components/ui/States'
import { tr } from '@/i18n'

/** a large, clearly selectable choice (visit type, way of paying) */
function Choice({ checked, onSelect, title, text, aside, icon }: { checked: boolean; onSelect: () => void; title: string; text?: string; aside?: string; icon?: React.ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${checked ? 'border-brand bg-brand-tint' : 'border-line bg-surface hover:border-brand'}`}>
      <input type="radio" checked={checked} onChange={onSelect} className="h-4 w-4 accent-[#0d7a83]" />
      {icon && <span className="text-brand-dark" aria-hidden>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {text && <span className="block text-sm text-muted">{text}</span>}
      </span>
      {aside && <span className="font-semibold">{aside}</span>}
    </label>
  )
}

export default function Book() {
  const { doctorId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const date = params.get('date')
  const time = params.get('time')
  const clinicId = Number(params.get('clinicId')) || 0
  const [serverError, setServerError] = useState<string | null>(null)
  const [serviceId, setServiceId] = useState<number | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('online')

  const doctor = useAsync(() => doctorService.get(Number(doctorId)), [doctorId])
  const clinics = useAsync(() => doctorService.clinics(), [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingForm>({ resolver: zodResolver(bookingSchema), mode: 'onChange' })
  const reasonLength = (watch('reason') ?? '').length

  if (!date || !time || !clinicId) return <Navigate to={`/doctors/${doctorId}`} replace />

  if (doctor.loading) return <div className="skeleton mx-auto h-72 max-w-xl" aria-hidden />
  if (!doctor.data) {
    return <EmptyState title={tr("ექიმი ვერ მოიძებნა")} action={<Link to="/doctors" className="font-medium text-brand-dark underline">{tr("ექიმების სია")}</Link>} />
  }

  const d = doctor.data
  const clinic = clinics.data?.find((c) => c.id === clinicId)
  const location = d.locations.find((l) => l.clinicId === clinicId)
  const services = d.services.filter((s) => s.clinicId === clinicId)
  const selected = services.find((s) => s.id === serviceId) ?? services[0]
  const price = selected?.price ?? 0

  if (!location) {
    return <EmptyState title={tr("ექიმი ამ კლინიკაში არ იღებს")} action={<Link to={`/doctors/${d.id}`} className="font-medium text-brand-dark underline">{tr("აირჩიეთ სხვა დრო")}</Link>} />
  }

  const onSubmit = async (data: BookingForm) => {
    setServerError(null)
    try {
      const appt = await appointmentService.create({
        doctorId: d.id,
        clinicId,
        serviceId: selected?.id,
        paymentMethod: price > 0 ? method : undefined,
        date,
        time,
        reason: data.reason?.trim() || undefined,
      })
      if (price > 0 && method === 'online') {
        notify(tr("ვიზიტი დაჯავშნილია. გააგრძელეთ გადახდა"))
        navigate(`/checkout/${appt.id}`, { replace: true })
      } else {
        notify(tr("ვიზიტი დაჯავშნილია"))
        navigate('/my-appointments', { replace: true })
      }
    } catch (e) {
      setServerError(errorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold">{tr("ვიზიტის დადასტურება")}</h1>

      <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center gap-4">
          <Avatar name={d.fullName} />
          <div>
            <p className="text-lg font-semibold">{d.fullName}</p>
            <p className="text-sm text-brand-dark">{SPECIALTY_LABELS[d.specialty]}</p>
          </div>
        </div>
        <ul className="mt-4 grid gap-2 text-sm">
          <li className="flex items-center gap-2">
            <CalendarDays size={16} className="text-muted" aria-hidden /> {formatDate(date)}
          </li>
          <li className="flex items-center gap-2">
            <Clock size={16} className="text-muted" aria-hidden />{' '}{tr("{0}, {1} წუთი", [time, location.slotMinutes])}</li>
          <li className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
            <span>
              {clinic?.name}, {location.room}
              <span className="block text-muted">{clinic?.address}</span>
            </span>
          </li>
        </ul>
        <Link to={`/doctors/${d.id}`} className="mt-4 inline-block text-sm font-medium text-brand-dark underline">{tr("დროის ან კლინიკის შეცვლა")}</Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-6">
        {serverError && (
          <div role="alert" className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
            {serverError}{' '}
            <Link to={`/doctors/${d.id}`} className="font-medium underline">{tr("აირჩიეთ სხვა დრო")}</Link>
          </div>
        )}

        {services.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-lg font-semibold">{tr("ვიზიტის ტიპი")}</legend>
            <div className="space-y-2">
              {services.map((s) => (
                <Choice key={s.id} checked={selected?.id === s.id} onSelect={() => setServiceId(s.id)} title={s.name} aside={formatPrice(s.price)} />
              ))}
            </div>
          </fieldset>
        )}

        <TextArea
          label={tr("ვიზიტის მიზეზი (არასავალდებულო)")}
          placeholder={tr("მაგ: წნევის მატება, ყოველწლიური გასინჯვა")}
          hint={`${reasonLength} / 300`}
          error={errors.reason?.message}
          {...register('reason')}
        />

        {price > 0 && (
          <fieldset>
            <legend className="mb-2 text-lg font-semibold">{tr("გადახდა")}</legend>
            <div className="space-y-2">
              <Choice checked={method === 'online'} onSelect={() => setMethod('online')} icon={<CreditCard size={20} />} title={tr("გადახდა ონლაინ")} text={tr("ბარათით ან Apple Pay-ით")} />
              <Choice checked={method === 'cashier'} onSelect={() => setMethod('cashier')} icon={<Banknote size={20} />} title={tr("გადახდა რეგისტრატურაში")} text={tr("ვიზიტის დღეს, კლინიკაში")} />
            </div>
          </fieldset>
        )}

        <div className="rounded-lg bg-canvas p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted">{tr("სულ გადასახდელი")}</span>
            <span className="text-2xl font-bold">{formatPrice(price)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" loading={isSubmitting} className="sm:flex-1">
            {price > 0 && method === 'online' ? tr("დაჯავშნა და გადახდა, {0}", [formatPrice(price)]) : tr("ვიზიტის დადასტურება")}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>{tr("გაუქმება")}</Button>
        </div>
        <p className="text-sm text-muted">{tr("ვიზიტის გაუქმება შესაძლებელია დაწყებამდე მინიმუმ 2 საათით ადრე. ონლაინ გადახდილი თანხა გაუქმებისას უბრუნდება.")}</p>
      </form>
    </div>
  )
}
