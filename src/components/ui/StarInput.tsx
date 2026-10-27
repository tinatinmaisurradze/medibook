import { Star } from 'lucide-react'
import { useState } from 'react'

/** Star rating picker for the keyboard and touch (a radio group of five stars) */
export function StarInput({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div>
      <div role="radiogroup" aria-label="შეფასება" className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ვარსკვლავი 5-დან`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            className="rounded-md p-1.5 transition-transform hover:scale-110"
          >
            <Star size={34} strokeWidth={1.4} className={n <= shown ? 'fill-star text-star' : 'text-lav'} aria-hidden />
          </button>
        ))}
        {value > 0 && <span className="ml-3 font-display text-2xl font-bold">{value}/5</span>}
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
