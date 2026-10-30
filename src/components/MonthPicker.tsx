import { useMemo } from 'react'
import { addDays, monthName, toISODate } from '@/utils/date'
import { DAY_SHORT, WEEK_ORDER } from '@/utils/weekdays'
import { tr } from '@/i18n'

interface Props {
  value: string
  onChange: (iso: string) => void
  /** true when something can be booked on that weekday (0 = Sunday) */
  isOpenOn: (weekday: number) => boolean
  /** how many days from today can be chosen */
  days?: number
}

/**
 * A calendar of the next month (today plus 30 days), weeks start on Monday.
 * Days on which the doctor does not receive patients are dimmed and cannot be chosen.
 */
export function MonthPicker({ value, onChange, isOpenOn, days = 31 }: Props) {
  const { cells, title } = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const dates = Array.from({ length: days }, (_, i) => addDays(start, i))
    const lead = (start.getDay() + 6) % 7
    const all: (Date | null)[] = [...Array<null>(lead).fill(null), ...dates]
    while (all.length % 7 !== 0) all.push(null)
    const first = monthName(toISODate(dates[0]))
    const last = monthName(toISODate(dates[dates.length - 1]))
    return { cells: all, title: first === last ? first : `${first} – ${last}` }
  }, [days])

  const today = toISODate(new Date())
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs text-muted" aria-hidden>
        {WEEK_ORDER.map((d) => (
          <span key={d}>{DAY_SHORT[d]}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1" role="group" aria-label={tr("თარიღის არჩევა")}>
        {cells.map((d, i) => {
          if (!d) return <span key={i} aria-hidden />
          const iso = toISODate(d)
          const open = isOpenOn(d.getDay())
          const active = iso === value
          return (
            <button
              key={iso}
              type="button"
              disabled={!open}
              aria-pressed={active}
              aria-label={`${d.getDate()} ${monthName(iso)}`}
              onClick={() => onChange(iso)}
              className={`relative flex h-11 flex-col items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                active
                  ? 'border-brand bg-brand text-white'
                  : open
                    ? `border-line hover:border-brand hover:bg-brand-tint ${iso === today ? 'ring-1 ring-[#0d7a83]' : ''}`
                    : 'cursor-not-allowed border-transparent bg-canvas text-muted opacity-60'
              }`}
            >
              {d.getDate()}
              {(d.getDate() === 1 || i === cells.findIndex((c) => c)) && <span className="absolute -top-px text-[9px] leading-none opacity-80">{monthName(iso).slice(0, 3)}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
