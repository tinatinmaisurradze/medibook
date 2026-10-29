import { memo } from 'react'
import { Star } from 'lucide-react'
import type { AppointmentStatus, PaymentStatus } from '@/types'

const STATUS: Record<AppointmentStatus, { label: string; cls: string }> = {
  confirmed: { label: 'დადასტურებული', cls: 'bg-brand-tint text-brand-dark' },
  completed: { label: 'დასრულებული', cls: 'bg-ok-tint text-ok' },
  cancelled: { label: 'გაუქმებული', cls: 'bg-danger-tint text-danger' },
}

export const StatusBadge = memo(function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS[status]
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
})

export const Rating = memo(function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium" aria-label={`რეიტინგი ${value} 5-დან${count !== undefined ? `, ${count} შეფასება` : ''}`}>
      <Star size={14} className="fill-gold text-gold" aria-hidden />
      {value.toFixed(1)}
      {count !== undefined && count > 0 && <span className="font-normal text-muted">({count})</span>}
    </span>
  )
})

/** Five stars, filled up to the rounded value (display only) */
export const Stars = memo(function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} 5-დან`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? 'fill-gold text-gold' : 'text-line'} aria-hidden />
      ))}
    </span>
  )
})

export const Avatar = memo(function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-display font-bold text-brand-dark"
    >
      {name.trim().charAt(0)}
    </span>
  )
})

const PAYMENT: Record<Exclude<PaymentStatus, 'none'>, { label: string; cls: string }> = {
  pending: { label: 'ელოდება გადახდას', cls: 'bg-[#fdf3d8] text-[#8a5a00]' },
  at_clinic: { label: 'გადახდა რეგისტრატურაში', cls: 'bg-[#e8edef] text-ink' },
  paid: { label: 'გადახდილია', cls: 'bg-ok-tint text-ok' },
  refund_pending: { label: 'თანხა უბრუნდება', cls: 'bg-brand-tint text-brand-dark' },
}

export const PaymentBadge = memo(function PaymentBadge({ status }: { status: PaymentStatus }) {
  if (status === 'none') return null
  const p = PAYMENT[status]
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${p.cls}`}>{p.label}</span>
})
