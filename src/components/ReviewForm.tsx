import { useState } from 'react'
import { reviewService } from '@/services/doctorPortalService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { reviewSchema } from '@/utils/validation'
import { Button } from './ui/Button'
import { TextArea } from './ui/FormField'
import { StarInput } from './ui/StarInput'

export function ReviewForm({ appointmentId, onDone }: { appointmentId: number; onDone: () => void }) {
  const { notify } = useToast()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ratingError, setRatingError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setRatingError(undefined)
    const parsed = reviewSchema.safeParse({ appointmentId, rating, comment: comment || undefined })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      if (issue.path[0] === 'rating') setRatingError('აირჩიეთ შეფასება 1-დან 5-მდე')
      else setError(issue.message)
      return
    }
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
      {error && (
        <div role="alert" className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      <StarInput value={rating} onChange={setRating} error={ratingError} />
      <TextArea label="კომენტარი (არასავალდებულო)" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} hint={`${comment.length} / 500`} />
      <Button type="submit" loading={busy}>
        შეფასების გაგზავნა
      </Button>
    </form>
  )
}
