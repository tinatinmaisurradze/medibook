import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toISODate } from '@/utils/date'
import { Button } from './ui/Button'

const MONTHS = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი']
const HEADERS = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი']

interface Props {
  /** any date inside the month that should be shown */
  month: Date
  onMonthChange: (d: Date) => void
  /** number of visits per YYYY-MM-DD */
  counts: Record<string, number>
  selected: string
  onSelect: (iso: string) => void
  /** 0 = Sunday ... 6 = Saturday; days off are shaded */
  workDays?: number[]
}

export function MonthCalendar({ month, onMonthChange, counts, selected, onSelect, workDays }: Props) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const first = new Date(year, m, 1)
  const offset = (first.getDay() + 6) % 7 // Monday-first grid
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const today = toISODate(new Date())

  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(year, m, i + 1))),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold" aria-live="polite">
          {MONTHS[m]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onMonthChange(new Date(year, m - 1, 1))} aria-label="წინა თვე">
            <ChevronLeft size={18} aria-hidden />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { onMonthChange(new Date()); onSelect(today) }}>
            დღეს
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onMonthChange(new Date(year, m + 1, 1))} aria-label="შემდეგი თვე">
            <ChevronRight size={18} aria-hidden />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
        {HEADERS.map((h) => (
          <div key={h} className="py-1">
            {h}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`e${i}`} aria-hidden />
          const count = counts[iso] ?? 0
          const isSelected = iso === selected
          const isToday = iso === today
          const dayOff = workDays ? !workDays.includes(new Date(`${iso}T00:00:00`).getDay()) : false
          const day = Number(iso.slice(8))
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              aria-pressed={isSelected}
              aria-label={`${day} ${MONTHS[m]}${count ? `, ${count} ვიზიტი` : ''}${dayOff ? ', დასვენების დღე' : ''}`}
              className={`flex aspect-square min-h-11 flex-col items-center justify-center rounded-md border text-sm transition-colors ${
                isSelected
                  ? 'border-brand bg-brand text-white'
                  : isToday
                    ? 'border-brand text-brand-dark'
                    : dayOff
                      ? 'border-transparent bg-canvas text-muted hover:border-line'
                      : 'border-transparent hover:border-brand hover:bg-brand-tint'
              }`}
            >
              <span className="font-medium">{day}</span>
              {count > 0 && (
                <span className={`mt-0.5 rounded-full px-1.5 text-[11px] leading-4 ${isSelected ? 'bg-white text-brand-dark' : 'bg-brand text-white'}`}>{count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
