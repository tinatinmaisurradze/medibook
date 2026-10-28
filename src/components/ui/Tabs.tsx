interface Tab<T extends string> {
  id: T
  label: string
}

/** Segmented control: equal-width tabs on one row (also on a phone), so nothing wraps or misaligns. */
export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: Tab<T>[]; value: T; onChange: (id: T) => void; label: string }) {
  return (
    <div
      className="grid w-full max-w-xl gap-1 rounded-xl border border-line bg-canvas p-1"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label={label}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`flex min-h-12 items-center justify-center rounded-lg px-1.5 text-center text-[13px] font-medium leading-tight sm:px-2 sm:text-sm transition-colors ${
            value === t.id ? 'bg-brand text-white shadow-sm' : 'text-ink hover:bg-surface'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
