import { Star } from 'lucide-react'
import type { AppointmentStatus } from '@/types'

const STATUS: Record<AppointmentStatus, { label: string; cls: string }> = {
  confirmed: { label: 'დადასტურებული', cls: 'bg-brand text-ink' },
  completed: { label: 'დასრულებული', cls: 'bg-brand-tint text-accent' },
  cancelled: { label: 'გაუქმებული', cls: 'bg-danger-tint text-danger' },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS[status]
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
}

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold" aria-label={`რეიტინგი ${value} 5-დან${count !== undefined ? `, ${count} შეფასება` : ''}`}>
      <Star size={15} className="fill-star text-star" strokeWidth={1.5} aria-hidden />
      {value.toFixed(1)}
      {count !== undefined && count > 0 && <span className="font-normal text-muted">({count})</span>}
    </span>
  )
}

/** Five thin-outline stars, filled up to the rounded value (display only) */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} 5-დან`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} strokeWidth={1.5} className={n <= Math.round(value) ? 'fill-star text-star' : 'text-lav'} aria-hidden />
      ))}
    </span>
  )
}

export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-lav/50 font-display font-bold text-accent"
    >
      {name.trim().charAt(0)}
    </span>
  )
}
