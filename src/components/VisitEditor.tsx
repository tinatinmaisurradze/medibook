import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentService } from '@/services/appointmentService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { visitSchema, type VisitForm } from '@/utils/validation'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/FormField'
import { tr } from '@/i18n'

interface Props {
  appointmentId: number
  initialDiagnosis?: string
  initialPrescription?: string
  onDone: () => void
}

/** Doctor's form for the diagnosis and prescription of a visit (used on the schedule and on the visit page) */
export function VisitEditor({ appointmentId, initialDiagnosis, initialPrescription, onDone }: Props) {
  const { notify } = useToast()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VisitForm>({
    resolver: zodResolver(visitSchema),
    mode: 'onTouched',
    defaultValues: { diagnosis: initialDiagnosis ?? '', prescription: initialPrescription ?? '' },
  })

  const onSubmit = async (data: VisitForm) => {
    try {
      await appointmentService.recordVisit(appointmentId, data)
      notify(tr("ჩანაწერი შენახულია"))
      onDone()
    } catch (e) {
      notify(errorMessage(e), 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3 rounded-md bg-canvas p-4">
      <TextArea label={tr("დიაგნოზი")} rows={3} hint={`${(watch('diagnosis') ?? '').length} / 2000`} error={errors.diagnosis?.message} {...register('diagnosis')} />
      <TextArea label={tr("დანიშნულება")} rows={4} hint={`${(watch('prescription') ?? '').length} / 2000`} error={errors.prescription?.message} {...register('prescription')} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={isSubmitting}>{tr("შენახვა და ვიზიტის დასრულება")}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>{tr("გაუქმება")}</Button>
      </div>
    </form>
  )
}
