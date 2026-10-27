import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarCheck, Clock, ShieldCheck } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import { useAuth } from '@/context/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { appointmentService } from '@/services/appointmentService'
import { doctorService } from '@/services/doctorService'
import type { SpecialtyKey } from '@/types'
import { formatDate, msUntil } from '@/utils/date'
import { DoctorCard } from '@/components/DoctorCard'
import { DoctorCardSkeleton, ErrorState } from '@/components/ui/States'
import { DoctorSearchBox } from '@/components/search/DoctorSearchBox'

const firstName = (full: string) => full.trim().split(/\s+/)[0]

function daysUntil(date: string, time: string): string {
  const ms = msUntil(date, time)
  const hours = Math.round(ms / 3600000)
  if (hours < 1) return 'ცოტა ხანში'
  if (hours < 24) return `${hours} საათში`
  const days = Math.round(hours / 24)
  return days === 1 ? 'ხვალ' : `${days} დღეში`
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const isPatient = user?.role === 'patient'

  const data = useAsync(() => Promise.all([doctorService.list({ sort: 'soonest', pageSize: 50 }), doctorService.clinics()]), [])
  const mine = useAsync(() => (isPatient ? appointmentService.mine() : Promise.resolve([])), [isPatient])
  const upcoming = (mine.data ?? []).filter((a) => a.status === 'confirmed' && msUntil(a.date, a.time) > 0).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0]

  const goSearch = () => navigate(q.trim() ? `/doctors?q=${encodeURIComponent(q.trim())}` : '/doctors')

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lav/60 via-brand-tint to-surface px-5 py-10 sm:px-10 sm:py-14">
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand/80 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-lav/70 blur-3xl" />
        <div className="relative max-w-3xl">
          {isPatient && user && <p className="mb-3 text-lg font-medium text-accent">გამარჯობა, {firstName(user.fullName)}</p>}
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">ექიმთან ჩაწერა მარტივია</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            ვიცით, რომ ექიმთან სიარული ყოველთვის იოლი არ არის. აირჩიეთ ექიმი და თავისუფალი დრო, დანარჩენს ჩვენ მივხედავთ.
          </p>

          <div className="mt-8 max-w-2xl">
            <DoctorSearchBox
              value={q}
              onChange={setQ}
              doctors={data.data?.[0].data ?? []}
              onPickSpecialty={(k) => navigate(`/doctors?specialty=${k}`)}
              onPickDoctor={(id) => navigate(`/doctors/${id}`)}
              onSubmit={goSearch}
            />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">ხშირად ეძებენ:</span>
              {(['therapy', 'cardiology', 'pediatrics', 'dermatology'] as SpecialtyKey[]).map((k) => (
                <Link key={k} to={`/doctors?specialty=${k}`} className="inline-flex h-9 items-center rounded-full bg-surface/80 px-4 text-sm font-medium transition-colors hover:bg-ink hover:text-white">
                  {SPECIALTY_LABELS[k]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {isPatient && upcoming && (
        <section aria-labelledby="upcoming-title" className="rounded-2xl bg-ink p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 id="upcoming-title" className="text-sm font-medium uppercase tracking-wide text-white/60">
                თქვენი უახლოესი ვიზიტი
              </h2>
              <p className="mt-2 font-display text-3xl font-bold">
                {formatDate(upcoming.date)}, <span className="rounded-md bg-brand px-2 text-ink">{upcoming.time}</span>
              </p>
              <p className="mt-2 text-white/80">
                {upcoming.doctorName} · {SPECIALTY_LABELS[upcoming.specialty]}
              </p>
              <p className="text-white/60">
                {upcoming.clinicName}, {upcoming.room}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60">დარჩა</p>
              <p className="font-display text-2xl font-bold">{daysUntil(upcoming.date, upcoming.time)}</p>
              <Link to={`/my-appointments/${upcoming.id}`} className="mt-3 inline-flex h-11 items-center rounded-lg bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-brand">
                დეტალები
              </Link>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="soon-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="soon-title" className="text-2xl font-bold">
              უახლოესი თავისუფალი დრო
            </h2>
            <p className="text-sm text-muted">ექიმები, რომლებთანაც ყველაზე სწრაფად მოხვდებით</p>
          </div>
          <Link to="/doctors" className="text-sm font-medium text-accent underline">
            ყველა ექიმი
          </Link>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.loading && Array.from({ length: 3 }).map((_, i) => <DoctorCardSkeleton key={i} />)}
          {data.error && (
            <div className="sm:col-span-2 lg:col-span-3">
              <ErrorState message={data.error} onRetry={data.reload} />
            </div>
          )}
          {data.data && data.data[0].data.slice(0, 3).map((d) => <DoctorCard key={d.id} doctor={d} clinic={data.data![1].find((c) => c.id === d.clinicId)} />)}
        </div>
      </section>

      <section aria-label="რატომ MediBook" className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: <Clock size={22} />, title: 'თავისუფალი დრო რეალურ დროში', text: 'ხედავთ მხოლოდ იმ დროს, რომელიც ნამდვილად თავისუფალია.' },
          { icon: <CalendarCheck size={22} />, title: 'მარტივი გაუქმება', text: 'ვიზიტის გაუქმება შეგიძლიათ დაწყებამდე 2 საათით ადრე.' },
          { icon: <ShieldCheck size={22} />, title: 'თქვენი მონაცემები დაცულია', text: 'სამედიცინო ისტორიას მხოლოდ თქვენ და თქვენი ექიმი ხედავს.' },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-line bg-surface p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lav/40 text-accent" aria-hidden>
              {f.icon}
            </span>
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
