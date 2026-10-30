import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { formatPrice } from '@/utils/payment'
import { tr } from '@/i18n'

/** A look-alike of the Apple Pay sheet. DEMO ONLY: nothing is sent to Apple or to a bank. */
export function ApplePaySheet({ open, amount, busy, onConfirm, onClose }: { open: boolean; amount: number; busy: boolean; onConfirm: () => void; onClose: () => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    confirmRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
    }
  }, [open])
  if (!open) return null
  return createPortal(
    <div
      className="dialog-backdrop fixed inset-0 z-[60] flex items-end justify-center bg-[#11283a]/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && !busy && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="applepay-title" className="dialog-pop w-full max-w-sm rounded-t-3xl bg-[#f2f2f7] p-6 text-ink shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 id="applepay-title" className="text-lg font-semibold">
             Apple Pay <span className="ml-1 rounded bg-[#fdf3d8] px-1.5 py-0.5 text-xs font-medium text-[#8a5a00]">{tr("დემო")}</span>
          </h2>
          <button type="button" onClick={onClose} disabled={busy} className="text-sm font-medium text-[#0a6ed1] disabled:opacity-50">{tr("გაუქმება")}</button>
        </div>
        <dl className="mt-5 divide-y divide-[#d1d1d6] rounded-xl bg-white text-sm">
          <div className="flex justify-between px-4 py-3">
            <dt className="text-muted">{tr("მიმღები")}</dt>
            <dd className="font-medium">MediBook</dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-muted">{tr("ბარათი")}</dt>
            <dd className="font-medium">Visa ••••4242</dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-muted">{tr("ჯამი")}</dt>
            <dd className="font-semibold">{formatPrice(amount)}</dd>
          </div>
        </dl>
        <button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-base font-semibold text-white transition-opacity disabled:opacity-70"
        >
          {busy && <Loader2 size={18} className="animate-spin" aria-hidden />}{tr("დადასტურება (დემო Face ID)")}</button>
        <p className="mt-3 text-center text-xs text-muted">{tr("სატესტო რეჟიმი: რეალური გადახდა არ სრულდება.")}</p>
      </div>
    </div>,
    document.body,
  )
}
