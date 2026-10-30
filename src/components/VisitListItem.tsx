import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import type { AppointmentView } from '@/types'
import { formatDate } from '@/utils/date'
import { formatPrice } from '@/utils/payment'
import { PaymentBadge, StatusBadge } from '@/components/ui/Badges'
import { tr } from '@/i18n'

export type Perspective = 'patient' | 'doctor' | 'admin'

/**
 * One visit in a list. The same component is used for the patient's history,
 * the doctor's visit list and the administrator's overview.
 */
export const VisitListItem = memo(function VisitListItem({ v, perspective }: { v: AppointmentView; perspective: Perspective }) {
  const title = perspective === 'patient' ? v.doctorName : perspective === 'doctor' ? v.patientName : `${v.patientName} → ${v.doctorName}`
  const href = perspective === 'patient' ? `/my-appointments/${v.id}` : perspective === 'doctor' ? `/doctor/visits/${v.id}` : null
  const excerpt = perspective === 'admin' ? null : v.diagnosis || v.reason
  const body = (
    <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-semibold">{title}</p>
          <StatusBadge status={v.status} />
          <PaymentBadge status={v.paymentStatus} />
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {formatDate(v.date)}, {v.time} · {SPECIALTY_LABELS[v.specialty]} · {v.clinicName}
          {v.room ? `, ${v.room}` : ''}
        </p>
        <p className="mt-0.5 text-sm">
          <span className="text-muted">{v.serviceName ?? tr("ვიზიტი")}</span> · <span className="font-medium">{formatPrice(v.price)}</span>
        </p>
        {excerpt && <p className="mt-1 line-clamp-1 break-words text-sm text-muted">{excerpt}</p>}
      </div>
      {href && <ChevronRight size={20} className="mt-1 shrink-0 text-muted" aria-hidden />}
    </div>
  )
  return href ? (
    <Link to={href} className="block transition-colors hover:bg-brand-tint focus-visible:bg-brand-tint">
      {body}
    </Link>
  ) : (
    body
  )
})
