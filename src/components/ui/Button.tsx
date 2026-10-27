import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  size?: 'md' | 'sm'
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark disabled:bg-[#0d7a83]/50',
  secondary: 'border border-line bg-surface text-ink hover:border-brand hover:text-brand-dark disabled:opacity-50',
  danger: 'border border-danger text-danger hover:bg-danger-tint disabled:opacity-50',
  ghost: 'text-ink hover:bg-brand-tint disabled:opacity-50',
}

export function Button({ variant = 'primary', loading, size = 'md', className = '', children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${
        size === 'md' ? 'min-h-11 px-5 text-sm' : 'min-h-9 px-3 text-sm'
      } ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
