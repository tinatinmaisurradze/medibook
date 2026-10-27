import { Star } from 'lucide-react'

const LABELS = ['', 'ცუდი', 'დამაკმაყოფილებელი', 'კარგი', 'ძალიან კარგი', 'შესანიშნავი']

/** Star rating picker, usable with the keyboard (buttons in a radio group) */
export function StarInput({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  return (
    <div>
      <div role="radiogroup" aria-label="შეფასება" className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ვარსკვლავი: ${LABELS[n]}`}
            onClick={() => onChange(n)}
            className="rounded p-1"
          >
            <Star size={28} className={n <= value ? 'fill-gold text-gold' : 'text-line hover:text-gold'} aria-hidden />
          </button>
        ))}
        {value > 0 && <span className="ml-2 text-sm text-muted">{LABELS[value]}</span>}
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
