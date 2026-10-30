import en from './en'

/**
 * Two languages: Georgian (the language the texts are written in) and English.
 * Every text in the code is wrapped in tr("Georgian text"); in English mode the English version is looked up in en.ts.
 * The language is chosen once per page load: switching it stores the choice and reloads the page.
 */
export type Lang = 'ka' | 'en'

const STORAGE_KEY = 'medibook_lang'

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'ka') return stored
  } catch {
    /* no storage: default language */
  }
  return 'ka'
}

let current: Lang = initialLang()

export const getLang = (): Lang => current

/** Remembers the language. The caller reloads the page so that every text and every list is built again. */
export function setLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* ignore */
  }
  current = lang
}

/** keeps <html lang="..."> right for screen readers and search engines */
export function applyDocumentLang() {
  if (typeof document !== 'undefined') document.documentElement.lang = current
}

/**
 * Translates a text. Placeholders are {0}, {1}... filled from `args`.
 * English texts may contain a simple plural form: {0:visit|visits} chooses by the number in argument 0.
 */
export function tr(text: string, args?: (string | number | undefined)[]): string {
  let out = current === 'en' ? (en[text] ?? text) : text
  if (args) {
    out = out.replace(/\{(\d+):([^|}]*)\|([^}]*)\}/g, (_, i, one, many) => (Number(args[Number(i)]) === 1 ? one : many))
    out = out.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)] ?? ''))
  }
  return out
}

const LATIN: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i', კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's',
  ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'q', შ: 'sh', ჩ: 'ch', ც: 'ts', ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
}

/** Latin spelling of a Georgian word (national romanization), first letter capital */
const romanize = (word: string) => {
  const out = [...word].map((c) => LATIN[c] ?? c).join('')
  return out.charAt(0).toUpperCase() + out.slice(1)
}

/** Short names such as "ნინო გ." (first name and the initial of the surname) are written in Latin letters in English mode */
const shortName = (text: string): string | null => {
  const m = /^([\u10D0-\u10F0]{2,}) ([\u10D0-\u10F0])\.$/.exec(text)
  return m ? `${romanize(m[1])} ${romanize(m[2])}.` : null
}

/** Translates every known text inside data that comes from the API (names, clinics, specialties, prices lists, ...). */
export function translateData<T>(value: T): T {
  if (current !== 'en') return value
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return en[v] ?? shortName(v) ?? v
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walk(x)]))
    return v
  }
  return walk(value) as T
}

/**
 * Translates a message that may contain numbers inside (for example from the server: "... 2 visits ...").
 * First an exact match, then the texts with {0} placeholders are tried as patterns.
 */
export function trMessage(text: string): string {
  if (current !== 'en') return text
  if (en[text] !== undefined) return en[text]
  for (const [key, value] of Object.entries(en)) {
    if (!key.includes('{0}')) continue
    const pattern = new RegExp('^' + key.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\d+)\}/g, '(.+?)') + '$')
    const m = pattern.exec(text)
    if (m) return tr(value, m.slice(1))
  }
  return text
}
