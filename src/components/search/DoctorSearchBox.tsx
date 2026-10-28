import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Search, Stethoscope, UserRound, X } from 'lucide-react'
import type { Doctor, SpecialtyKey } from '@/types'
import { SPECIALTY_LABELS } from '@/data/seed'

interface Item {
  id: string
  kind: 'specialty' | 'doctor'
  label: string
  hint: string
  specialty?: SpecialtyKey
  doctorId?: number
}

interface Props {
  value: string
  onChange: (value: string) => void
  /** every active doctor, used for instant suggestions */
  doctors: Doctor[]
  onPickSpecialty: (key: SpecialtyKey) => void
  onPickDoctor: (id: number) => void
  onSubmit?: () => void
  autoFocus?: boolean
}

/** Search field with instant suggestions (doctors and specialties) and full keyboard support. */
export function DoctorSearchBox({ value, onChange, doctors, onPickSpecialty, onPickDoctor, onSubmit, autoFocus }: Props) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const items = useMemo<Item[]>(() => {
    const term = value.trim().toLowerCase()
    const specialties = (Object.keys(SPECIALTY_LABELS) as SpecialtyKey[])
      .filter((k) => !term || SPECIALTY_LABELS[k].toLowerCase().includes(term))
      .slice(0, term ? 3 : 7)
      .map<Item>((k) => ({ id: `s-${k}`, kind: 'specialty', label: SPECIALTY_LABELS[k], hint: `${doctors.filter((d) => d.specialty === k).length} ექიმი`, specialty: k }))
    if (!term) return specialties
    const docs = doctors
      .filter((d) => d.fullName.toLowerCase().includes(term))
      .slice(0, 5)
      .map<Item>((d) => ({ id: `d-${d.id}`, kind: 'doctor', label: d.fullName, hint: SPECIALTY_LABELS[d.specialty], doctorId: d.id }))
    return [...docs, ...specialties]
  }, [value, doctors])

  useEffect(() => setActive(-1), [value])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const pick = (item: Item) => {
    setOpen(false)
    if (item.kind === 'doctor' && item.doctorId) onPickDoctor(item.doctorId)
    if (item.kind === 'specialty' && item.specialty) onPickSpecialty(item.specialty)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (items.length ? (i + 1) % items.length : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (items.length ? (i <= 0 ? items.length - 1 : i - 1) : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && active >= 0 && items[active]) pick(items[active])
      else {
        setOpen(false)
        onSubmit?.()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && items.length > 0
  const indexed = items.map((item, index) => ({ item, index }))
  const groups = [
    { title: 'ექიმები', list: indexed.filter((x) => x.item.kind === 'doctor') },
    { title: 'სპეციალობები', list: indexed.filter((x) => x.item.kind === 'specialty') },
  ].filter((g) => g.list.length > 0)

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={`${listId}-input`} className="sr-only">
        ექიმის სახელი ან სპეციალობა
      </label>
      <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand" aria-hidden />
      <input
        id={`${listId}-input`}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="ექიმის სახელი ან სპეციალობა"
        className="h-14 w-full rounded-xl border border-line bg-surface pl-12 pr-12 text-base font-medium text-ink placeholder:font-normal placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-[#0d7a83]/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            setOpen(true)
          }}
          aria-label="ძებნის გასუფთავება"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-brand-tint hover:text-ink"
        >
          <X size={18} aria-hidden />
        </button>
      )}

      {showList && (
        <div
          id={listId}
          role="listbox"
          aria-label="შეთავაზებები"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[22rem] overflow-y-auto rounded-xl border border-line bg-surface p-2 text-ink shadow-[0_20px_40px_-12px_rgba(17,40,58,0.35)]"
        >
          {groups.map((g) => (
            <div key={g.title} role="group" aria-label={g.title}>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">{g.title}</p>
              {g.list.map(({ item, index }) => (
                <div
                  key={item.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={active === index}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(item)
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ${active === index ? 'bg-brand-tint' : ''}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-dark" aria-hidden>
                    {item.kind === 'doctor' ? <UserRound size={18} /> : <Stethoscope size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.label}</span>
                    <span className="block truncate text-sm text-muted">{item.hint}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
