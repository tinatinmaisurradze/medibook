import { useState } from 'react'
import { reviewService } from '@/services/doctorPortalService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { reviewSchema } from '@/utils/validation'
import { Button } from './ui/Button'
import { StarInput } from './ui/StarInput'

/** One tap rating. Stars only: the rating stays about the visit and cannot be used to write opinions. */
export function ReviewForm({ appointmentId, onDone }: { appointmentId: number; onDone: () => void }) {
  const { notify } = useToast()
  const [rating, setRating] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = reviewSchema.safeParse({ appointmentId, rating })
    if (!parsed.success) return setError('აირჩიეთ შეფასება 1-დან 5-მდე')
    setBusy(true)
    try {
      await reviewService.create(parsed.data)
      notify('გმადლობთ შეფასებისთვის')
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <StarInput value={rating} onChange={setRating} error={error ?? undefined} />
      <Button type="submit" loading={busy} disabled={rating === 0}>
        შეფასების გაგზავნა
      </Button>
    </form>
  )
}
