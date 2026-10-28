import { ChevronDown } from 'lucide-react'
import { forwardRef, useId, type SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  /** hide the label visually (it stays available for screen readers) */
  hideLabel?: boolean
}

/**
 * Native select (keeps the mobile picker and keyboard behaviour) with our own quiet chevron
 * instead of the browser's up/down arrows. Same 48px height everywhere.
 */
export const SelectField = forwardRef<HTMLSelectElement, Props>(({ label, hideLabel = false, className = '', children, id, ...rest }, ref) => {
  const autoId = useId()
  const fieldId = id ?? rest.name ?? autoId
  return (
    <div className={className}>
      <label htmlFor={fieldId} className={hideLabel ? 'sr-only' : 'mb-1.5 block text-sm font-medium'}>
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          {...rest}
          className="h-12 w-full appearance-none rounded-lg border border-line bg-surface pl-4 pr-10 text-sm font-medium text-ink transition-colors hover:border-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#0d7a83]/25"
        >
          {children}
        </select>
        <ChevronDown size={18} strokeWidth={1.75} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted opacity-60" aria-hidden />
      </div>
    </div>
  )
})
SelectField.displayName = 'SelectField'
