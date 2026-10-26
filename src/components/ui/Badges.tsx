import { Star } from 'lucide-react'
import type { AppointmentStatus } from '@/types'

const STATUS: Record<AppointmentStatus, { label: string; cls: string }> = {
  confirmed: { label: 'დადასტურებული', cls: 'bg-brand-tint text-brand-dark' },
  completed: { label: 'დასრულებული', cls: 'bg-ok-tint text-ok' },
  cancelled: { label: 'გაუქმებული', cls: 'bg-danger-tint text-danger' },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS[status]
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
}

export function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium" aria-label={`რეიტინგი ${value} 5-დან`}>
      <Star size={14} className="fill-gold text-gold" aria-hidden />
      {value.toFixed(1)}
    </span>
  )
}

export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-display font-bold text-brand-dark"
    >
      {name.trim().charAt(0)}
    </span>
  )
}
