import type { Doctor, SpecialtyKey } from '@/types'
import { SPECIALTY_LABELS } from '@/data/seed'

/** One-tap specialty filter with the number of doctors in each specialty */
export function SpecialtyPills({ value, onChange, doctors }: { value: SpecialtyKey | ''; onChange: (v: SpecialtyKey | '') => void; doctors: Doctor[] }) {
  const keys = Object.keys(SPECIALTY_LABELS) as SpecialtyKey[]
  const pill = (active: boolean) =>
    `inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
      active ? 'border-ink bg-ink text-white' : 'border-line bg-surface hover:border-accent'
    }`
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="სპეციალობა">
      <div className="flex gap-2 sm:flex-wrap">
        <button type="button" onClick={() => onChange('')} aria-pressed={value === ''} className={pill(value === '')}>
          ყველა
        </button>
        {keys.map((k) => (
          <button key={k} type="button" onClick={() => onChange(value === k ? '' : k)} aria-pressed={value === k} className={pill(value === k)}>
            {SPECIALTY_LABELS[k]}
            <span className={`text-xs ${value === k ? 'text-white/70' : 'text-muted'}`}>{doctors.filter((d) => d.specialty === k).length}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
