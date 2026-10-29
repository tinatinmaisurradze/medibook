import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Banknote, CircleCheck, CreditCard, Lock, ShieldAlert } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAsync } from '@/hooks/useAsync'
import { appointmentService } from '@/services/appointmentService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { formatDate } from '@/utils/date'
import { cardBrand, digitsOnly, formatCardNumber, formatExpiry, formatPrice, isValidCvc, isValidExpiry, luhn, TEST_CARDS } from '@/utils/payment'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { ApplePaySheet } from '@/components/ApplePaySheet'

const input =
  'h-12 w-full rounded-lg border bg-surface px-3 text-base font-medium text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#0d7a83]/25'

/**
 * DEMO checkout page. It looks like a real one but never contacts a bank:
 * the card is validated, a result is simulated, and only the brand and the last 4 digits are kept.
 */
export default function Checkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const visit = useAsync(() => appointmentService.get(Number(id)), [id])

  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [holder, setHolder] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appleOpen, setAppleOpen] = useState(false)

  if (visit.loading) return <div className="skeleton mx-auto h-96 max-w-4xl" aria-hidden />
  if (visit.error || !visit.data) return <ErrorState message={visit.error ?? 'ვიზიტი ვერ მოიძებნა'} onRetry={visit.reload} />
  const v = visit.data

  const errors = {
    number: luhn(number) ? '' : 'ბარათის ნომერი არასწორია',
    expiry: isValidExpiry(expiry) ? '' : 'მიუთითეთ ვადა MM/YY ფორმატით',
    cvc: isValidCvc(cvc) ? '' : 'CVC უნდა შედგებოდეს 3-4 ციფრისგან',
    holder: holder.trim().length >= 2 ? '' : 'მიუთითეთ სახელი ბარათზე',
  }
  const valid = !errors.number && !errors.expiry && !errors.cvc && !errors.holder
  const show = (k: keyof typeof errors) => touched[k] && errors[k]
  const border = (k: keyof typeof errors) => (show(k) ? 'border-danger' : 'border-line hover:border-brand')

  /* ---- nothing to pay / already paid / cancelled ---- */
  if (v.status === 'cancelled') {
    return <EmptyState title="ვიზიტი გაუქმებულია" text="გაუქმებული ვიზიტის გადახდა შეუძლებელია." action={<Link to="/my-appointments" className="font-medium text-brand-dark underline">ჩემი ვიზიტები</Link>} />
  }
  if (v.paymentStatus === 'paid') {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <CircleCheck size={56} className="mx-auto text-ok" aria-hidden />
        <h1 className="mt-3 text-3xl font-bold">გადახდა წარმატებულია</h1>
        <p className="mt-1 text-muted">სატესტო გადახდა, რეალური თანხა არ ჩამოწერილა</p>
        <dl className="mt-6 divide-y divide-line rounded-lg border border-line text-left text-sm">
          {[
            ['ქვითარი №', v.receiptNo ?? '—'],
            ['თანხა', formatPrice(v.price)],
            ['გადახდის საშუალება', v.cardBrand === 'Apple Pay' ? 'Apple Pay (დემო)' : `${v.cardBrand ?? 'ბარათი'} ••••${v.cardLast4 ?? ''}`],
            ['მომსახურება', v.serviceName ?? 'ვიზიტი'],
            ['ექიმი', v.doctorName],
            ['თარიღი', `${formatDate(v.date)}, ${v.time}`],
            ['კლინიკა', `${v.clinicName}, ${v.room}`],
          ].map(([k, val]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium">{val}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={`/my-appointments/${v.id}`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-6 text-sm font-medium text-white hover:bg-brand-dark">
            ვიზიტის ანკეტა
          </Link>
          <Link to="/my-appointments" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-6 text-sm font-medium hover:border-brand">
            ჩემი ვიზიტები
          </Link>
        </div>
      </div>
    )
  }
  if (v.price <= 0) return <EmptyState title="გადასახდელი თანხა არ არის" action={<Link to="/my-appointments" className="font-medium text-brand-dark underline">ჩემი ვიზიტები</Link>} />

  const pay = async (payload: Parameters<typeof appointmentService.pay>[1]) => {
    setBusy(true)
    setError(null)
    try {
      await appointmentService.pay(v.id, payload)
      setAppleOpen(false)
      notify('გადახდა წარმატებით დასრულდა')
      visit.reload()
    } catch (e) {
      setAppleOpen(false)
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ number: true, expiry: true, cvc: true, holder: true })
    if (!valid) return
    void pay({ method: 'card', cardNumber: digitsOnly(number), expiry, cvc, cardholder: holder.trim() })
  }

  const payLater = async () => {
    try {
      await appointmentService.setPaymentMethod(v.id, 'cashier')
      notify('გადახდა მოხდება რეგისტრატურაში')
      navigate('/my-appointments', { replace: true })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold">გადახდა</h1>
      <p role="note" className="mt-2 flex items-start gap-2 rounded-lg bg-[#fdf3d8] px-4 py-3 text-sm text-[#8a5a00]">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
        <span>სატესტო რეჟიმი: ეს გვერდი რეალურ ბანკს არ უკავშირდება. ნუ შეიყვანთ თქვენს ნამდვილ ბარათს, გამოიყენეთ ქვემოთ მოცემული სატესტო ნომრები.</span>
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <aside aria-label="შეკვეთის შეჯამება" className="h-fit rounded-xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold">თქვენი ვიზიტი</h2>
          <p className="mt-3 font-medium">{v.doctorName}</p>
          <p className="text-sm text-brand-dark">{SPECIALTY_LABELS[v.specialty]}</p>
          <p className="mt-3 text-sm">
            {formatDate(v.date)}, {v.time}
          </p>
          <p className="text-sm text-muted">
            {v.clinicName}, {v.room}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="text-sm text-muted">{v.serviceName ?? 'ვიზიტი'}</span>
            <span className="text-2xl font-bold">{formatPrice(v.price)}</span>
          </div>
        </aside>

        <section aria-label="გადახდის საშუალება" className="rounded-xl border border-line bg-surface p-5 shadow-card">
          <button
            type="button"
            onClick={() => {
              setError(null)
              setAppleOpen(true)
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
             Apple Pay
          </button>

          <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted" aria-hidden>
            <span className="h-px flex-1 bg-line" />
            ან ბარათით
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <label htmlFor="card-holder" className="mb-1.5 block text-sm font-medium">
                სახელი ბარათზე
              </label>
              <input id="card-holder" className={`${input} ${border('holder')}`} value={holder} onChange={(e) => setHolder(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, holder: true }))} autoComplete="off" placeholder="NINO GELASHVILI" />
              {show('holder') && <p role="alert" className="mt-1 text-sm text-danger">{errors.holder}</p>}
            </div>
            <div>
              <label htmlFor="card-number" className="mb-1.5 block text-sm font-medium">
                ბარათის ნომერი
              </label>
              <div className="relative">
                <CreditCard size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                <input id="card-number" inputMode="numeric" autoComplete="off" className={`${input} pl-10 pr-20 ${border('number')}`} value={number} onChange={(e) => setNumber(formatCardNumber(e.target.value))} onBlur={() => setTouched((t) => ({ ...t, number: true }))} placeholder="4242 4242 4242 4242" />
                {digitsOnly(number).length >= 1 && cardBrand(number) !== 'Card' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-brand-dark">{cardBrand(number)}</span>}
              </div>
              {show('number') && <p role="alert" className="mt-1 text-sm text-danger">{errors.number}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="card-expiry" className="mb-1.5 block text-sm font-medium">
                  ვადა
                </label>
                <input id="card-expiry" inputMode="numeric" autoComplete="off" className={`${input} ${border('expiry')}`} value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} onBlur={() => setTouched((t) => ({ ...t, expiry: true }))} placeholder="MM/YY" maxLength={5} />
                {show('expiry') && <p role="alert" className="mt-1 text-sm text-danger">{errors.expiry}</p>}
              </div>
              <div>
                <label htmlFor="card-cvc" className="mb-1.5 block text-sm font-medium">
                  CVC
                </label>
                <input id="card-cvc" inputMode="numeric" autoComplete="off" className={`${input} ${border('cvc')}`} value={cvc} onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, 4))} onBlur={() => setTouched((t) => ({ ...t, cvc: true }))} placeholder="123" />
                {show('cvc') && <p role="alert" className="mt-1 text-sm text-danger">{errors.cvc}</p>}
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" loading={busy} className="w-full">
              <Lock size={16} aria-hidden /> გადახდა {formatPrice(v.price)}
            </Button>
          </form>

          <details className="mt-4 rounded-lg bg-canvas p-3 text-sm">
            <summary className="cursor-pointer font-medium">სატესტო ბარათები</summary>
            <ul className="mt-2 space-y-1.5 text-muted">
              {[
                ['წარმატებული გადახდა', TEST_CARDS.success],
                ['ბანკმა უარყო', TEST_CARDS.declined],
                ['თანხა არასაკმარისია', TEST_CARDS.insufficient],
              ].map(([label, n]) => (
                <li key={n} className="flex items-center justify-between gap-2">
                  <span>
                    {label}: <span className="font-mono text-ink">{formatCardNumber(n)}</span>
                  </span>
                  <button
                    type="button"
                    className="font-medium text-brand-dark underline"
                    onClick={() => {
                      setNumber(formatCardNumber(n))
                      setExpiry('12/30')
                      setCvc('123')
                      if (!holder) setHolder('TEST USER')
                    }}
                  >
                    ჩასმა
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-muted">ვადა: ნებისმიერი მომავალი თარიღი, CVC: ნებისმიერი 3 ციფრი.</p>
          </details>

          <button type="button" onClick={payLater} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-line py-3 text-sm font-medium transition-colors hover:border-brand hover:text-brand-dark">
            <Banknote size={18} aria-hidden /> გადავიხდი რეგისტრატურაში
          </button>
        </section>
      </div>

      <ApplePaySheet open={appleOpen} amount={v.price} busy={busy} onClose={() => setAppleOpen(false)} onConfirm={() => void pay({ method: 'apple_pay' })} />
    </div>
  )
}
