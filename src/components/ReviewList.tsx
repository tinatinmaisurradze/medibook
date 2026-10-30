import { memo } from 'react'
import type { ReactNode } from 'react'
import { Stars } from './ui/Badges'
import type { ReviewView, ReviewsSummary } from '@/types'
import { tr } from '@/i18n'

export const RatingSummary = memo(function RatingSummary({ summary }: { summary: ReviewsSummary }) {
  const max = Math.max(1, ...Object.values(summary.distribution))
  return (
    <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
      <div className="text-center sm:text-left">
        <p className="font-display text-5xl font-bold">{summary.count ? summary.average.toFixed(1) : '—'}</p>
        <div className="mt-1 flex justify-center sm:justify-start">
          <Stars value={summary.average} size={20} />
        </div>
        <p className="mt-1 text-sm text-muted">{tr("{0} შეფასება", [summary.count])}</p>
      </div>
      <ul className="space-y-1.5" aria-label={tr("შეფასებების განაწილება")}>
        {([5, 4, 3, 2, 1] as const).map((n) => (
          <li key={n} className="grid grid-cols-[20px_1fr_28px] items-center gap-2 text-sm">
            <span>{n}</span>
            <span className="h-2.5 rounded-full bg-canvas">
              <span className="block h-2.5 rounded-full bg-gold" style={{ width: `${(summary.distribution[n] / max) * 100}%` }} />
            </span>
            <span className="text-right text-muted">{summary.distribution[n]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
})

export const ReviewItem = memo(function ReviewItem({ review, children }: { review: ReviewView; children?: ReactNode }) {
  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Stars value={review.rating} />
          <span className="text-sm font-medium">{review.patientName}</span>
        </div>
        <time className="text-sm text-muted" dateTime={review.createdAt}>
          {new Date(review.createdAt).toLocaleDateString('ka-GE')}
        </time>
      </div>
      {review.comment ? <p className="mt-2 whitespace-pre-wrap break-words">{review.comment}</p> : <p className="mt-2 text-sm text-muted">{tr("კომენტარის გარეშე")}</p>}
      {review.doctorReply && (
        <div className="mt-3 rounded-md bg-brand-tint p-3 text-sm">
          <p className="font-medium text-brand-dark">{tr("ექიმის პასუხი")}</p>
          <p className="mt-1 whitespace-pre-wrap break-words">{review.doctorReply}</p>
        </div>
      )}
      {children}
    </article>
  )
})
