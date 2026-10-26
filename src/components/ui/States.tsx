import { CircleAlert, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
      <SearchX className="mx-auto mb-3 text-muted" size={32} aria-hidden />
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-danger/40 bg-danger-tint px-6 py-8 text-center">
      <CircleAlert className="mx-auto mb-2 text-danger" size={28} aria-hidden />
      <p className="text-sm text-danger">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          თავიდან ცდა
        </Button>
      )}
    </div>
  )
}

export function DoctorCardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-card" aria-hidden>
      <div className="flex gap-4">
        <div className="skeleton h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-1/3" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
      <div className="skeleton mt-5 h-9 w-full" />
    </div>
  )
}

export function PageSpinner({ label = 'იტვირთება...' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted" role="status">
      {label}
    </div>
  )
}
