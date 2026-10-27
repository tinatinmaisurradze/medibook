import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAsync } from '@/hooks/useAsync'
import { profileService } from '@/services/profileService'
import { reviewService } from '@/services/doctorPortalService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { replySchema, type ReplyForm } from '@/utils/validation'
import { RatingSummary, ReviewItem } from '@/components/ReviewList'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/FormField'
import { EmptyState, ErrorState } from '@/components/ui/States'
import type { ReviewView } from '@/types'

function ReplyEditor({ review, onDone }: { review: ReviewView; onDone: () => void }) {
  const { notify } = useToast()
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReplyForm>({ resolver: zodResolver(replySchema), mode: 'onTouched', defaultValues: { reply: review.doctorReply ?? '' } })

  const onSubmit = async (data: ReplyForm) => {
    try {
      await reviewService.reply(review.id, data.reply)
      notify('პასუხი გამოქვეყნდა')
      setOpen(false)
      onDone()
    } catch (e) {
      notify(errorMessage(e), 'error')
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        {review.doctorReply ? 'პასუხის შეცვლა' : 'პასუხის დაწერა'}
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-3 space-y-3">
      <TextArea label="თქვენი პასუხი (ხედავს ყველა)" rows={3} hint={`${(watch('reply') ?? '').length} / 500`} error={errors.reply?.message} {...register('reply')} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={isSubmitting}>
          გამოქვეყნება
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          გაუქმება
        </Button>
      </div>
    </form>
  )
}

export default function DoctorReviews() {
  const data = useAsync(async () => {
    const profile = await profileService.get()
    if (!profile.doctor) throw new Error('doctor profile missing')
    return reviewService.forDoctor(profile.doctor.id)
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold">შეფასებები</h1>
      <p className="mt-1 text-muted">პაციენტების შეფასებები. პაციენტის სრული სახელი არ ჩანს, პასუხს კი ყველა ხედავს.</p>

      {data.loading && <div className="mt-6 skeleton h-64 w-full" aria-hidden />}
      {data.error && (
        <div className="mt-6">
          <ErrorState message={data.error} onRetry={data.reload} />
        </div>
      )}

      {data.data && (
        <div className="mt-6 space-y-6">
          <section className="rounded-lg border border-line bg-surface p-6 shadow-card">
            <RatingSummary summary={data.data} />
          </section>

          {data.data.reviews.length === 0 ? (
            <EmptyState title="შეფასებები ჯერ არ არის" text="პაციენტები დასრულებული ვიზიტის შემდეგ შეძლებენ შეფასებას." />
          ) : (
            <div className="space-y-3">
              {data.data.reviews.map((r) => (
                <ReviewItem key={r.id} review={r}>
                  <ReplyEditor review={r} onDone={data.reload} />
                </ReviewItem>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
