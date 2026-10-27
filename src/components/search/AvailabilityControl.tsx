const OPTIONS = [
  { id: '', label: 'ყველა' },
  { id: 'today', label: 'დღეს' },
  { id: 'tomorrow', label: 'ხვალ' },
  { id: 'week', label: '7 დღეში' },
] as const

export type Availability = (typeof OPTIONS)[number]['id']

/** Segmented control: only doctors who have a free slot in the chosen period */
export function AvailabilityControl({ value, onChange }: { value: Availability; onChange: (v: Availability) => void }) {
  return (
    <div>
      <span id="avail-label" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        თავისუფალი დრო
      </span>
      <div role="radiogroup" aria-labelledby="avail-label" className="grid h-12 grid-cols-4 rounded-lg border border-line bg-canvas p-1">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-md px-2 text-sm font-medium transition-colors ${value === o.id ? 'bg-ink text-white shadow-sm' : 'text-ink hover:bg-surface'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
