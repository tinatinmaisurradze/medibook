import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { SPECIALTY_LABELS } from '@/data/seed'
import type { SpecialtyKey } from '@/types'
import { Button } from '@/components/ui/Button'
import { DoctorCard } from '@/components/DoctorCard'
import { DoctorCardSkeleton, ErrorState } from '@/components/ui/States'
import { useAsync } from '@/hooks/useAsync'
import { doctorService } from '@/services/doctorService'

export default function Home() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [specialty, setSpecialty] = useState<SpecialtyKey | ''>('')

  const top = useAsync(() => Promise.all([doctorService.list({ sort: 'rating' }), doctorService.clinics()]), [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const sp = new URLSearchParams()
    if (q.trim()) sp.set('q', q.trim())
    if (specialty) sp.set('specialty', specialty)
    navigate(`/doctors?${sp.toString()}`)
  }

  return (
    <div className="space-y-12">
      <section className="rounded-lg bg-ink px-6 py-10 text-white md:px-12 md:py-14">
        <h1 className="max-w-2xl text-3xl font-bold md:text-4xl">იპოვეთ ექიმი და დაჯავშნეთ ვიზიტი ზარის გარეშე</h1>
        <p className="mt-3 max-w-xl text-white/80">აირჩიეთ სპეციალობა, ნახეთ ექიმის თავისუფალი დრო და დაადასტურეთ ვიზიტი რამდენიმე წუთში.</p>

        <form onSubmit={submit} className="mt-8 grid gap-3 rounded-lg bg-surface p-3 text-ink md:grid-cols-[1fr_220px_auto]">
          <label className="sr-only" htmlFor="home-q">
            ექიმის სახელი
          </label>
          <input
            id="home-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ექიმის სახელი"
            className="rounded-md border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <label className="sr-only" htmlFor="home-specialty">
            სპეციალობა
          </label>
          <select
            id="home-specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value as SpecialtyKey | '')}
            className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="">ყველა სპეციალობა</option>
            {Object.entries(SPECIALTY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <Button type="submit">
            <Search size={16} aria-hidden />
            ძებნა
          </Button>
        </form>
      </section>

      <section aria-labelledby="top-doctors">
        <div className="flex items-end justify-between">
          <h2 id="top-doctors" className="text-2xl font-bold">
            ყველაზე მაღალი რეიტინგის ექიმები
          </h2>
          <Link to="/doctors" className="text-sm font-medium text-brand-dark underline">
            ყველა ექიმი
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {top.loading && Array.from({ length: 3 }).map((_, i) => <DoctorCardSkeleton key={i} />)}
          {top.error && (
            <div className="sm:col-span-2 lg:col-span-3">
              <ErrorState message={top.error} onRetry={top.reload} />
            </div>
          )}
          {top.data &&
            top.data[0].data.slice(0, 3).map((d) => <DoctorCard key={d.id} doctor={d} clinic={top.data![1].find((c) => c.id === d.clinicId)} />)}
        </div>
      </section>
    </div>
  )
}
