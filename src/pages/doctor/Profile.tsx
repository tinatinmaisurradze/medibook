import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAsync } from '@/hooks/useAsync'
import { profileService } from '@/services/profileService'
import { doctorService } from '@/services/doctorService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { SPECIALTY_LABELS } from '@/data/seed'
import { doctorProfileSchema, type DoctorProfilePayload } from '@/utils/validation'
import type { Doctor } from '@/types'
import { GeneralInfoForm } from '@/components/GeneralInfoForm'
import { PasswordForm } from '@/components/PasswordForm'
import { Button } from '@/components/ui/Button'
import { TextArea, TextField } from '@/components/ui/FormField'
import { TagInput } from '@/components/ui/TagInput'
import { Tabs } from '@/components/ui/Tabs'
import { ErrorState } from '@/components/ui/States'

type Tab = 'personal' | 'professional' | 'security'
const DAYS = ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი']

function ProfessionalForm({ doctor, onSaved }: { doctor: Doctor; onSaved: () => void }) {
  const { notify } = useToast()
  const [languages, setLanguages] = useState(doctor.languages)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Pick<DoctorProfilePayload, 'bio' | 'education'>>({
    resolver: zodResolver(doctorProfileSchema.pick({ bio: true, education: true })),
    mode: 'onTouched',
    defaultValues: { bio: doctor.bio, education: doctor.education ?? '' },
  })

  const onSubmit = async (data: Pick<DoctorProfilePayload, 'bio' | 'education'>) => {
    setServerError(null)
    try {
      await profileService.updateDoctor({ ...data, languages })
      notify('პროფესიული ინფორმაცია განახლდა')
      onSaved()
    } catch (e) {
      setServerError(errorMessage(e))
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-4">
        {serverError && (
          <div role="alert" className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
            {serverError}
          </div>
        )}
        <TextArea label="ჩემს შესახებ (ჩანს პაციენტებისთვის)" rows={5} hint={`${(watch('bio') ?? '').length} / 600`} error={errors.bio?.message} {...register('bio')} />
        <TextField label="განათლება" error={errors.education?.message} {...register('education')} />
        <TagInput label="ენები" value={languages} onChange={setLanguages} maxItems={8} maxLength={30} placeholder="მაგ: ინგლისური" />
        <Button type="submit" loading={isSubmitting}>
          შენახვა
        </Button>
      </form>

      <section aria-labelledby="work-title">
        <h3 id="work-title" className="text-lg font-bold">
          მუშაობის პარამეტრები
        </h3>
        <p className="text-sm text-muted">ამ მონაცემებს კლინიკის ადმინისტრატორი მართავს.</p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">სპეციალობა</dt>
            <dd className="mt-0.5 font-medium">{SPECIALTY_LABELS[doctor.specialty]}</dd>
          </div>
          <div>
            <dt className="text-muted">გამოცდილება</dt>
            <dd className="mt-0.5 font-medium">{doctor.experienceYears} წელი</dd>
          </div>
          <div>
            <dt className="text-muted">კაბინეტი</dt>
            <dd className="mt-0.5 font-medium">{doctor.room}</dd>
          </div>
          <div>
            <dt className="text-muted">მიღების საათები</dt>
            <dd className="mt-0.5 font-medium">
              {doctor.workHours.start} – {doctor.workHours.end}, ვიზიტი {doctor.slotMinutes} წთ
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">სამუშაო დღეები</dt>
            <dd className="mt-0.5 font-medium">{doctor.workDays.map((d) => DAYS[d]).join(', ') || '—'}</dd>
          </div>
        </dl>
        <Link to={`/doctors/${doctor.id}`} className="mt-4 inline-block text-sm font-medium text-accent underline">
          როგორ ჩანს ჩემი გვერდი პაციენტებისთვის
        </Link>
      </section>
    </div>
  )
}

export default function DoctorProfile() {
  const [tab, setTab] = useState<Tab>('personal')
  const profile = useAsync(() => profileService.get(), [])
  const clinics = useAsync(() => doctorService.clinics(), [])
  const doctor = profile.data?.doctor
  const clinic = clinics.data?.find((c) => c.id === doctor?.clinicId)

  return (
    <div>
      <h1 className="text-3xl font-bold">ჩემი პროფილი</h1>
      {clinic && <p className="mt-1 text-muted">{clinic.name}</p>}

      <div className="mt-6">
        <Tabs
          label="პროფილის განყოფილებები"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'personal', label: 'პირადი ინფორმაცია' },
            { id: 'professional', label: 'პროფესიული ინფორმაცია' },
            { id: 'security', label: 'უსაფრთხოება' },
          ]}
        />
      </div>

      <div className="mt-6 rounded-lg border border-line bg-surface p-6 shadow-card">
        {tab === 'personal' && <GeneralInfoForm />}

        {tab === 'professional' && (
          <>
            {profile.loading && <div className="skeleton h-64 w-full" aria-hidden />}
            {profile.error && <ErrorState message={profile.error} onRetry={profile.reload} />}
            {doctor && <ProfessionalForm key={doctor.bio + doctor.languages.join()} doctor={doctor} onSaved={profile.reload} />}
          </>
        )}

        {tab === 'security' && (
          <>
            <h2 className="mb-4 text-xl font-bold">პაროლის შეცვლა</h2>
            <PasswordForm />
          </>
        )}
      </div>
    </div>
  )
}
