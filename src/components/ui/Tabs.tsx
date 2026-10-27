interface Tab<T extends string> {
  id: T
  label: string
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: Tab<T>[]; value: T; onChange: (id: T) => void; label: string }) {
  return (
    <div className="inline-flex max-w-full flex-wrap rounded-md border border-line bg-surface p-1" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${value === t.id ? 'bg-brand text-white' : 'hover:bg-brand-tint'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
