import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, CalendarDays, Mail, Phone, Printer, Stethoscope, User, CreditCard } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAuth } from '@/context/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { appointmentService } from '@/services/appointmentService'
import { formatPrice } from '@/utils/payment'
import { formatDate } from '@/utils/date'
import { PaymentBadge, StatusBadge } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { VisitEditor } from '@/components/VisitEditor'
import { ReviewItem } from '@/components/ReviewList'
import { ReviewForm } from '@/components/ReviewForm'
import { tr } from '@/i18n'

function Card({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className="text-brand" aria-hidden>
          {icon}
        </span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-line py-2.5 first:border-t-0 sm:grid-cols-[140px_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 break-words font-medium">{children}</dd>
    </div>
  )
}

/** Full visit record. Shared by the patient (/my-appointments/:id) and the doctor (/doctor/visits/:id). */
export default function VisitDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const isDoctor = user?.role === 'doctor'
  const backTo = isDoctor ? '/doctor/schedule' : '/my-appointments'
  const visitPath = (visitId: number) => (isDoctor ? `/doctor/visits/${visitId}` : `/my-appointments/${visitId}`)

  const visit = useAsync(() => appointmentService.get(Number(id)), [id])
  const [editing, setEditing] = useState(false)

  if (visit.loading) {
    return (
      <div className="space-y-4" aria-hidden>
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-56 w-full" />
      </div>
    )
  }

  if (visit.error || !visit.data) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title={tr("ვიზიტი ვერ მოიძებნა")}
          text={visit.error ?? tr("ეს ვიზიტი არ არსებობს ან თქვენ მასზე წვდომა არ გაქვთ.")}
          action={
            <Link to={backTo} className="font-medium text-brand-dark underline">{tr("დაბრუნება სიაზე")}</Link>
          }
        />
        {visit.error && (
          <div className="mt-4">
            <ErrorState message={visit.error} onRetry={visit.reload} />
          </div>
        )}
      </div>
    )
  }

  const v = visit.data
  const hasRecord = !!(v.diagnosis || v.prescription)

  return (
    <div>
      <Link to={backTo} className="no-print inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline">
        <ArrowLeft size={16} aria-hidden />
        {isDoctor ? tr("ჩემს განრიგზე") : tr("ჩემს ვიზიტებზე")}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{tr("ვიზიტის ჩანაწერი")}</h1>
          <p className="mt-1 text-muted">{tr("ვიზიტი №{0} · {1}, {2}", [v.id, formatDate(v.date), v.time])}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={v.status} />
          <Button variant="secondary" size="sm" className="no-print" onClick={() => window.print()}>
            <Printer size={16} aria-hidden />{tr("ბეჭდვა")}</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card title={tr("ვიზიტის დეტალები")} icon={<CalendarDays size={20} />}>
          <dl>
            <Row label={tr("თარიღი")}>{formatDate(v.date)}</Row>
            <Row label={tr("დრო")}>{v.time}</Row>
            <Row label={tr("კლინიკა")}>
              {v.clinicName}
              <span className="block text-sm font-normal text-muted">{v.clinicAddress}</span>
            </Row>
            <Row label={tr("კაბინეტი")}>{v.room}</Row>
            <Row label={tr("ვიზიტის მიზეზი")}>{v.reason || <span className="font-normal text-muted">{tr("არ არის მითითებული")}</span>}</Row>
          </dl>
        </Card>

        <Card title={tr("გადახდა")} icon={<CreditCard size={20} />}>
          <dl>
            <Row label={tr("მომსახურება")}>{v.serviceName ?? tr("ვიზიტი")}</Row>
            <Row label={tr("თანხა")}>{formatPrice(v.price)}</Row>
            <Row label={tr("სტატუსი")}>{v.paymentStatus === 'none' ? <span className="font-normal text-muted">{tr("გადასახდელი არ არის")}</span> : <PaymentBadge status={v.paymentStatus} />}</Row>
            {v.receiptNo && <Row label={tr("ქვითარი №")}>{v.receiptNo}</Row>}
            {v.cardLast4 && <Row label={tr("გადახდის საშუალება")}>{v.cardBrand === 'Apple Pay' ? tr("Apple Pay (დემო)") : `${v.cardBrand ?? tr("ბარათი")} ••••${v.cardLast4}`}</Row>}
          </dl>
          {window.location.pathname.startsWith('/my-appointments') && v.status === 'confirmed' && v.price > 0 && (v.paymentStatus === 'pending' || v.paymentStatus === 'at_clinic') && (
            <Link to={`/checkout/${v.id}`} className="no-print mt-4 inline-flex min-h-10 items-center rounded-md bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark">{tr("გადახდა ონლაინ")}</Link>
          )}
          {window.location.pathname.startsWith('/my-appointments') && v.paymentStatus === 'paid' && (
            <Link to={`/checkout/${v.id}`} className="no-print mt-4 inline-block text-sm font-medium text-brand-dark underline">{tr("ქვითრის ნახვა")}</Link>
          )}
        </Card>

        <Card title={tr("ექიმი")} icon={<Stethoscope size={20} />}>
          <dl>
            <Row label={tr("სახელი")}>{v.doctorName}</Row>
            <Row label={tr("სპეციალობა")}>{SPECIALTY_LABELS[v.specialty]}</Row>
            <Row label={tr("გამოცდილება")}>{tr("{0} წელი", [v.doctorExperienceYears])}</Row>
          </dl>
        </Card>

        <Card title={tr("პაციენტი")} icon={<User size={20} />}>
          <dl>
            <Row label={tr("სახელი და გვარი")}>{v.patientName}</Row>
            <Row label={tr("ელ-ფოსტა")}>
              <span className="inline-flex items-center gap-2">
                <Mail size={14} className="text-muted" aria-hidden />
                {v.patientEmail}
              </span>
            </Row>
            <Row label={tr("ტელეფონი")}>
              {v.patientPhone ? (
                <span className="inline-flex items-center gap-2">
                  <Phone size={14} className="text-muted" aria-hidden />
                  {v.patientPhone}
                </span>
              ) : (
                <span className="font-normal text-muted">{tr("არ არის მითითებული")}</span>
              )}
            </Row>
          </dl>
        </Card>

        <Card title={tr("დიაგნოზი და დანიშნულება")} icon={<Building2 size={20} />}>
          {v.status === 'cancelled' && <p className="rounded-md bg-danger-tint p-3 text-sm text-danger">{tr("ვიზიტი გაუქმებულია, ჩანაწერი არ არსებობს.")}</p>}

          {v.status !== 'cancelled' && editing && isDoctor && (
            <VisitEditor
              appointmentId={v.id}
              initialDiagnosis={v.diagnosis}
              initialPrescription={v.prescription}
              onDone={() => {
                setEditing(false)
                visit.reload()
              }}
            />
          )}

          {v.status !== 'cancelled' && !editing && (
            <>
              {hasRecord ? (
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm text-muted">{tr("დიაგნოზი")}</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words">{v.diagnosis || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">{tr("დანიშნულება")}</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words">{v.prescription || '—'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="rounded-md bg-canvas p-3 text-sm text-muted">{tr("ექიმს ჩანაწერი ჯერ არ დაუმატებია.")}</p>
              )}
              {isDoctor && (
                <Button size="sm" variant="secondary" className="no-print mt-4" onClick={() => setEditing(true)}>
                  {hasRecord ? tr("ჩანაწერის რედაქტირება") : tr("ჩანაწერის დამატება")}
                </Button>
              )}
            </>
          )}
        </Card>
      </div>

      {!isDoctor && v.status === 'completed' && (
        <section className="no-print mt-8" aria-labelledby="review-title">
          <h2 id="review-title" className="text-xl font-bold">{tr("თქვენი შეფასება")}</h2>
          <div className="mt-3">
            {v.review ? (
              <ReviewItem review={v.review} />
            ) : (
              <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
                <p className="mb-3 text-sm text-muted">{tr("როგორი იყო ვიზიტი? შეფასებას სხვა პაციენტები ექიმის არჩევისას ხედავენ, თქვენი სრული სახელი კი არა.")}</p>
                <ReviewForm appointmentId={v.id} onDone={visit.reload} />
              </div>
            )}
          </div>
        </section>
      )}

      {isDoctor && v.history.length > 0 && (
        <section className="no-print mt-8" aria-labelledby="history-title">
          <h2 id="history-title" className="text-xl font-bold">{tr("ამ პაციენტის სხვა ვიზიტები თქვენთან")}</h2>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
            {v.history.map((h) => (
              <li key={h.id}>
                <Link to={visitPath(h.id)} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-brand-tint">
                  <span>
                    {formatDate(h.date)}, {h.time}
                    {h.diagnosis && <span className="ml-2 line-clamp-1 text-sm text-muted">{h.diagnosis}</span>}
                  </span>
                  <StatusBadge status={h.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
