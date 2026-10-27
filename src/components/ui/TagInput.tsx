import { useId, useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface Props {
  label: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  hint?: string
  maxItems?: number
  maxLength?: number
  tone?: 'default' | 'danger'
}

/** Adds short text items as chips: type + Enter (or the add button) */
export function TagInput({ label, value, onChange, placeholder, hint, maxItems = 20, maxLength = 80, tone = 'default' }: Props) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const add = () => {
    const text = draft.trim()
    if (!text) return
    if (text.length > maxLength) return setError(`მაქსიმუმ ${maxLength} სიმბოლო`)
    if (value.some((v) => v.toLowerCase() === text.toLowerCase())) return setError('ეს ჩანაწერი უკვე დამატებულია')
    if (value.length >= maxItems) return setError(`მაქსიმუმ ${maxItems} ჩანაწერი`)
    onChange([...value, text])
    setDraft('')
    setError(null)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault() // do not submit the surrounding form
      add()
    }
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-invalid={!!error}
          className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <Button type="button" variant="secondary" onClick={add}>
          დამატება
        </Button>
      </div>
      {error ? (
        <p className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-muted">{hint}</p>
      ) : null}
      {value.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {value.map((item) => (
            <li
              key={item}
              className={`inline-flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-sm ${
                tone === 'danger' ? 'bg-danger-tint text-danger' : 'bg-brand-tint text-accent'
              }`}
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== item))}
                aria-label={`წაშლა: ${item}`}
                className="rounded-full p-1 hover:bg-white/60"
              >
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
