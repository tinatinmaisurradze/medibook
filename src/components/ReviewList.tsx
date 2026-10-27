import { BadgeCheck } from 'lucide-react'
import { Stars } from './ui/Badges'
import type { ReviewView, ReviewsSummary } from '@/types'

const MONTHS = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი']
const monthYear = (iso: string) => {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Big average, stars and a thin distribution graph. No text opinions anywhere. */
export function RatingSummary({ summary }: { summary: ReviewsSummary }) {
  const max = Math.max(1, ...Object.values(summary.distribution))
  return (
    <div className="grid items-center gap-8 sm:grid-cols-[180px_1fr]">
      <div className="text-center sm:text-left">
        <p className="font-display text-6xl font-bold leading-none tracking-tight">{summary.count ? summary.average.toFixed(1) : '–'}</p>
        <div className="mt-3 flex justify-center sm:justify-start">
          <Stars value={summary.average} size={22} />
        </div>
        <p className="mt-2 text-sm text-muted">{summary.count ? `${summary.count} შეფასება` : 'შეფასებები ჯერ არ არის'}</p>
      </div>
      <ul className="space-y-2" aria-label="შეფასებების განაწილება">
        {([5, 4, 3, 2, 1] as const).map((n) => (
          <li key={n} className="grid grid-cols-[14px_1fr_24px] items-center gap-3 text-sm">
            <span className="font-medium">{n}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-lav/30">
              <span className="block h-full rounded-full bg-star" style={{ width: `${(summary.distribution[n] / max) * 100}%` }} />
            </span>
            <span className="text-right text-muted">{summary.distribution[n]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Small anonymous tiles: stars, month and a "verified visit" mark */
export function RatingTiles({ reviews }: { reviews: ReviewView[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-lg border border-line bg-surface px-4 py-3">
          <Stars value={r.rating} size={15} />
          <p className="mt-2 text-xs text-muted">{monthYear(r.createdAt)}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-accent">
            <BadgeCheck size={13} aria-hidden />
            დადასტურებული ვიზიტი
          </p>
        </li>
      ))}
    </ul>
  )
}
