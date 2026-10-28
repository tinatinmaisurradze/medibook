import { Link } from 'react-router-dom'

export function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 font-display text-xl font-bold ${dark ? 'text-white' : 'text-ink'}`}>
      <span aria-hidden className="relative inline-block h-7 w-7 rounded-md bg-brand">
        <span className="absolute left-1/2 top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white" />
        <span className="absolute left-1/2 top-1/2 h-1 w-4 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white" />
      </span>
      MediBook
    </Link>
  )
}
