import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, TriangleAlert } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description?: ReactNode
  /** red button: the destructive action */
  confirmLabel: string
  /** light gray button: leave everything as it is */
  cancelLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Centered confirmation dialog. The page behind is dimmed and blurred and cannot be scrolled.
 * The safe answer gets the focus first; Escape, a click outside and the gray button all keep things as they are.
 */
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel, busy = false, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && !busy) {
      e.stopPropagation()
      onCancel()
    }
    if (e.key === 'Tab') {
      // keep the focus inside the dialog: it only has two buttons
      const first = cancelRef.current
      const last = confirmRef.current
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
  }

  return createPortal(
    <div
      className="dialog-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-[#11283a]/70 p-4 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel()
      }}
      onKeyDown={onKeyDown}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-text" className="dialog-pop w-full max-w-md rounded-2xl bg-surface p-6 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-tint text-danger" aria-hidden>
          <TriangleAlert size={28} />
        </span>
        <h2 id="confirm-title" className="mt-4 text-2xl font-bold">
          {title}
        </h2>
        {description && (
          <div id="confirm-text" className="mt-2 text-muted">
            {description}
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-[#e8edef] px-5 text-sm font-semibold text-ink transition-colors hover:bg-[#dbe2e5] disabled:opacity-60 sm:flex-none"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-danger px-5 text-sm font-semibold text-white transition-colors hover:bg-[#962826] disabled:opacity-70 sm:flex-none"
          >
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
