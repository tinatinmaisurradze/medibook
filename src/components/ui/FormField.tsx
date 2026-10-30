import { tr } from '@/i18n'
import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface BaseProps {
  label: string
  error?: string
  hint?: string
}

const control =
  'w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#0d7a83]/30'

export const TextField = forwardRef<HTMLInputElement, BaseProps & InputHTMLAttributes<HTMLInputElement>>(
  ({ label, error, hint, id, ...rest }, ref) => {
    const autoId = useId()
    const fieldId = id ?? rest.name ?? autoId
    return (
      <div>
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={`${control} h-12 ${error ? 'border-danger' : 'border-line'}`}
          {...rest}
        />
        {error ? (
          <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-danger">
            {tr(error)}
          </p>
        ) : hint ? (
          <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    )
  },
)
TextField.displayName = 'TextField'

export const TextArea = forwardRef<HTMLTextAreaElement, BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ label, error, hint, id, ...rest }, ref) => {
    const autoId = useId()
    const fieldId = id ?? rest.name ?? autoId
    return (
      <div>
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium">
          {label}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          rows={4}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={`${control} ${error ? 'border-danger' : 'border-line'}`}
          {...rest}
        />
        {error ? (
          <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-danger">
            {tr(error)}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-sm text-muted">{hint}</p>
        ) : null}
      </div>
    )
  },
)
TextArea.displayName = 'TextArea'
