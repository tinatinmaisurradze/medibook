import { getLang, setLang, tr, type Lang } from '@/i18n'

const OPTIONS: { lang: Lang; label: string; name: string }[] = [
  { lang: 'ka', label: 'ქარ', name: 'ქართული' },
  { lang: 'en', label: 'ENG', name: 'English' },
]

/** Georgian / English choice. The page reloads so that every text is built in the chosen language. */
export function LanguageSwitch({ dark = false }: { dark?: boolean }) {
  const current = getLang()
  const choose = (lang: Lang) => {
    if (lang === current) return
    setLang(lang)
    window.location.reload()
  }
  return (
    <div role="group" aria-label={tr('ენა')} className={`inline-flex rounded-lg border p-0.5 text-xs font-semibold ${dark ? 'border-white/30' : 'border-line bg-surface'}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          type="button"
          lang={o.lang}
          title={o.name}
          aria-pressed={current === o.lang}
          onClick={() => choose(o.lang)}
          className={`min-h-8 rounded-md px-2.5 transition-colors ${
            current === o.lang ? (dark ? 'bg-white text-ink' : 'bg-brand text-white') : dark ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-brand-tint'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
