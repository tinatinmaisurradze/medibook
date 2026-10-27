import { useAsync } from '@/hooks/useAsync'
import { profileService } from '@/services/profileService'
import { reviewService } from '@/services/doctorPortalService'
import { RatingSummary, RatingTiles } from '@/components/ReviewList'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Stars } from '@/components/ui/Badges'

export default function DoctorReviews() {
  const data = useAsync(async () => {
    const profile = await profileService.get()
    if (!profile.doctor) throw new Error('doctor profile missing')
    return reviewService.forDoctor(profile.doctor.id)
  }, [])

  const last5 = data.data?.reviews.slice(0, 5) ?? []
  const last5Avg = last5.length ? last5.reduce((s, r) => s + r.rating, 0) / last5.length : 0

  return (
    <div>
      <h1 className="text-3xl font-bold">შეფასებები</h1>
      <p className="mt-1 max-w-xl text-muted">პაციენტები ვარსკვლავებით აფასებენ მხოლოდ დასრულებულ ვიზიტს. შეფასება ანონიმურია და ტექსტის გარეშე.</p>

      {data.loading && <div className="mt-6 skeleton h-64 w-full" aria-hidden />}
      {data.error && (
        <div className="mt-6">
          <ErrorState message={data.error} onRetry={data.reload} />
        </div>
      )}

      {data.data && (
        <div className="mt-6 space-y-6">
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
            <RatingSummary summary={data.data} />
          </section>

          {data.data.count === 0 ? (
            <EmptyState title="შეფასებები ჯერ არ არის" text="პაციენტები დასრულებული ვიზიტის შემდეგ შეძლებენ შეფასებას." />
          ) : (
            <>
              <section className="rounded-2xl bg-lav/40 p-5" aria-labelledby="trend-title">
                <h2 id="trend-title" className="text-sm font-bold uppercase tracking-wide text-accent">
                  ბოლო {last5.length} შეფასება
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <span className="font-display text-3xl font-bold">{last5Avg.toFixed(1)}</span>
                  <Stars value={last5Avg} size={20} />
                  <span className="text-sm text-muted">{last5Avg >= data.data.average ? 'საერთო საშუალოზე მაღალია' : 'საერთო საშუალოზე დაბალია'}</span>
                </div>
              </section>

              <section aria-labelledby="recent-title">
                <h2 id="recent-title" className="mb-3 text-xl font-bold">
                  ბოლო შეფასებები
                </h2>
                <RatingTiles reviews={data.data.reviews.slice(0, 12)} />
              </section>
            </>
          )}
        </div>
      )}
    </div>
  )
}
