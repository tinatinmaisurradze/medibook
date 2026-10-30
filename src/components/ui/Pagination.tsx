import { ChevronLeft, ChevronRight } from 'lucide-react'
import { tr } from '@/i18n'

/** Previous / next with the current position. Hidden when there is only one page. */
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null
  const btn = 'inline-flex h-10 items-center gap-1 rounded-lg border border-line bg-surface px-3 text-sm font-medium transition-colors hover:border-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink'
  return (
    <nav aria-label={tr("გვერდები")} className="mt-5 flex items-center justify-between gap-3">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} aria-hidden />{' '}{tr("წინა")}</button>
      <span className="text-sm text-muted" aria-live="polite">{tr("გვერდი {0} / {1}", [page, totalPages])}</span>
      <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>{tr("შემდეგი")}{' '}<ChevronRight size={16} aria-hidden />
      </button>
    </nav>
  )
}
