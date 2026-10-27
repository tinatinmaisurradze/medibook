import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  /** show the label above the control (default) or hide it visually */
  hideLabel?: boolean
}

/** Native select with a consistent 48px height and custom chevron (keeps mobile pickers and keyboard behaviour) */
export function SelectField({ label, hideLabel = false, className = '', children, id, ...rest }: Props) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className={className}>
      <label htmlFor={fieldId} className={hideLabel ? 'sr-only' : 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted'}>
        {label}
      </label>
      <div className="relative">
        <select
          id={fieldId}
          {...rest}
          className="h-12 w-full appearance-none rounded-lg border border-line bg-surface pl-4 pr-10 text-sm font-medium text-ink transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        >
          {children}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
      </div>
    </div>
  )
}
