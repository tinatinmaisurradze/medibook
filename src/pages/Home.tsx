import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogIn, LayoutDashboard, UserPlus, CalendarClock, History, HeartPulse } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAuth } from '@/context/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { doctorService } from '@/services/doctorService'
import { appointmentService } from '@/services/appointmentService'
import { formatDate, msUntil } from '@/utils/date'
import type { SpecialtyKey } from '@/types'
import { defaultHome } from '@/utils/roles'
import { DoctorCard } from '@/components/DoctorCard'
import { DoctorCardSkeleton, ErrorState } from '@/components/ui/States'
import { DoctorSearchBox } from '@/components/search/DoctorSearchBox'

const firstName = (full: string) => full.trim().split(/\s+/)[0]

const secondaryBtn =
  'inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:bg-brand-tint'

const tile = 'flex flex-col rounded-xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur transition-colors hover:bg-white/15'

/**
 * Landing page: a full-screen dark hero with one search card.
 * The card offers two ways in: search for a doctor, or go to the personal cabinet.
 * The list of doctors starts below the first screen.
 */
export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const data = useAsync(() => Promise.all([doctorService.list({ sort: 'rating', pageSize: 50 }), doctorService.clinics()]), [])
  const doctors = data.data?.[0].data ?? []
  const isPatient = user?.role === 'patient'

  // the patient's own cabinet: next visit and a short history
  const mine = useAsync(() => (isPatient ? appointmentService.mine() : Promise.resolve([])), [isPatient])
  const nextVisit = (mine.data ?? [])
    .filter((a) => a.status === 'confirmed' && msUntil(a.date, a.time) > 0)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0]
  const completed = (mine.data ?? []).filter((a) => a.status === 'completed').length

  // Enter: exactly one doctor with this name -> straight to the doctor's page, otherwise to the results
  const submit = () => {
    const term = q.trim()
    if (!term) return navigate('/doctors')
    const hits = doctors.filter((d) => d.fullName.toLowerCase().includes(term.toLowerCase()))
    navigate(hits.length === 1 ? `/doctors/${hits[0].id}` : `/doctors?q=${encodeURIComponent(term)}`)
  }

  return (
    <div>
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink px-4 pb-24 pt-28 text-white">
        <span aria-hidden className="pointer-events-none absolute -left-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-[#0d7a83]/40 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#0d7a83]/25 blur-3xl" />

        <div className="relative w-full max-w-2xl text-center">
          {isPatient && user ? (
            <>
              <p className="mb-3 text-lg font-medium text-brand-tint">გამარჯობა, {firstName(user.fullName)}</p>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">კეთილი იყოს თქვენი დაბრუნება</h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">გააგრძელეთ იქიდან, სადაც გაჩერდით, ან იპოვეთ ახალი ექიმი.</p>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">იპოვეთ ექიმი და დაჯავშნეთ ვიზიტი</h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">ჩაწერა რამდენიმე წუთში, ზარებისა და რიგების გარეშე. თავისუფალ დროს რეალურ დროში ხედავთ.</p>
            </>
          )}

          <div className="mt-10 rounded-2xl bg-surface p-5 text-left text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] sm:p-6">
            <p className="mb-3 text-sm font-semibold">ვის ეძებთ?</p>
            <DoctorSearchBox
              value={q}
              onChange={setQ}
              doctors={doctors}
              onPickSpecialty={(k) => navigate(`/doctors?specialty=${k}`)}
              onPickDoctor={(id) => navigate(`/doctors/${id}`)}
              onSubmit={submit}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">ხშირად ეძებენ:</span>
              {(['therapy', 'cardiology', 'pediatrics', 'dermatology'] as SpecialtyKey[]).map((k) => (
                <Link key={k} to={`/doctors?specialty=${k}`} className="inline-flex h-8 items-center rounded-full bg-brand-tint px-3 text-sm font-medium text-brand-dark transition-colors hover:bg-brand hover:text-white">
                  {SPECIALTY_LABELS[k]}
                </Link>
              ))}
            </div>

            {!isPatient && (
              <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted" aria-hidden>
                <span className="h-px flex-1 bg-line" />
                ან
                <span className="h-px flex-1 bg-line" />
              </div>
            )}

            {!user && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/login" className={secondaryBtn}>
                  <LogIn size={18} aria-hidden /> შესვლა ჩემს კაბინეტში
                </Link>
                <Link to="/register" className={secondaryBtn}>
                  <UserPlus size={18} aria-hidden /> რეგისტრაცია
                </Link>
              </div>
            )}
            {user && user.role !== 'patient' && (
              <Link to={defaultHome(user.role)} className={`${secondaryBtn} w-full`}>
                <LayoutDashboard size={18} aria-hidden /> სამუშაო სივრცეში გადასვლა
              </Link>
            )}
          </div>

          {isPatient && (
            <div className="mt-5 grid gap-3 text-left sm:grid-cols-3" aria-label="ჩემი კაბინეტი">
              <Link to={nextVisit ? `/my-appointments/${nextVisit.id}` : '/my-appointments'} className={tile}>
                <CalendarClock size={20} className="text-brand-tint" aria-hidden />
                <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-white/60">უახლოესი ვიზიტი</span>
                {nextVisit ? (
                  <>
                    <span className="mt-1 block font-semibold">
                      {formatDate(nextVisit.date)}, {nextVisit.time}
                    </span>
                    <span className="block truncate text-sm text-white/70">{nextVisit.doctorName}</span>
                  </>
                ) : (
                  <span className="mt-1 block text-sm text-white/80">{mine.loading ? 'იტვირთება...' : 'დაგეგმილი ვიზიტი არ გაქვთ'}</span>
                )}
              </Link>
              <Link to="/my-appointments?tab=history" className={tile}>
                <History size={20} className="text-brand-tint" aria-hidden />
                <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-white/60">ვიზიტების ისტორია</span>
                <span className="mt-1 block font-semibold">{mine.loading ? '...' : `${completed} დასრულებული`}</span>
                <span className="block text-sm text-white/70">დიაგნოზები და რეცეპტები</span>
              </Link>
              <Link to="/profile?tab=medical" className={tile}>
                <HeartPulse size={20} className="text-brand-tint" aria-hidden />
                <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-white/60">სამედიცინო ისტორია</span>
                <span className="mt-1 block font-semibold">ჩემი მონაცემები</span>
                <span className="block text-sm text-white/70">ალერგიები, მედიკამენტები, ანალიზები</span>
              </Link>
            </div>
          )}
        </div>

        <a href="#doctors-list" className="absolute inset-x-0 bottom-6 mx-auto flex w-fit flex-col items-center gap-1 text-sm text-white/70 transition-colors hover:text-white">
          ექიმების სია
          <ChevronDown size={22} className="animate-bounce" aria-hidden />
        </a>
      </section>

      <section id="doctors-list" aria-labelledby="doctors-title" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="doctors-title" className="text-3xl font-bold">
              ექიმები
            </h2>
            <p className="mt-1 text-muted">ყველაზე მაღალი რეიტინგის სპეციალისტები</p>
          </div>
          <Link to="/doctors" className="text-sm font-medium text-brand-dark underline">
            ყველა ექიმი და ფილტრები
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.loading && Array.from({ length: 6 }).map((_, i) => <DoctorCardSkeleton key={i} />)}
          {data.error && (
            <div className="sm:col-span-2 lg:col-span-3">
              <ErrorState message={data.error} onRetry={data.reload} />
            </div>
          )}
          {data.data && data.data[0].data.slice(0, 6).map((d) => <DoctorCard key={d.id} doctor={d} clinics={data.data![1]} />)}
        </div>
      </section>
    </div>
  )
}
