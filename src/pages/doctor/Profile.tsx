import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAsync } from '@/hooks/useAsync'
import { profileService } from '@/services/profileService'
import { scheduleService } from '@/services/appointmentService'
import { LocationsEditor } from '@/components/LocationsEditor'
import { ServicesEditor } from '@/components/ServicesEditor'
import { doctorService } from '@/services/doctorService'
import { errorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { SPECIALTY_LABELS } from '@/data/seed'
import { doctorProfileSchema, type DoctorProfilePayload } from '@/utils/validation'
import type { Clinic, Doctor } from '@/types'
import type { LocationsPayload, ServicesPayload } from '@/utils/validation'
import { GeneralInfoForm } from '@/components/GeneralInfoForm'
import { PasswordForm } from '@/components/PasswordForm'
import { Button } from '@/components/ui/Button'
import { TextArea, TextField } from '@/components/ui/FormField'
import { TagInput } from '@/components/ui/TagInput'
import { Tabs } from '@/components/ui/Tabs'
import { ErrorState } from '@/components/ui/States'
import { tr } from '@/i18n'

type Tab = 'personal' | 'professional' | 'schedule' | 'security'

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
      notify(tr("პროფესიული ინფორმაცია განახლდა"))
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
        <TextArea label={tr("ჩემს შესახებ (ჩანს პაციენტებისთვის)")} rows={5} hint={`${(watch('bio') ?? '').length} / 600`} error={errors.bio?.message} {...register('bio')} />
        <TextField label={tr("განათლება")} error={errors.education?.message} {...register('education')} />
        <TagInput label={tr("ენები")} value={languages} onChange={setLanguages} maxItems={8} maxLength={30} placeholder={tr("მაგ: ინგლისური")} />
        <Button type="submit" loading={isSubmitting}>{tr("შენახვა")}</Button>
      </form>

      <section aria-labelledby="work-title">
        <h3 id="work-title" className="text-lg font-bold">{tr("მუშაობის პარამეტრები")}</h3>
        <p className="text-sm text-muted">{tr("კლინიკები, სამუშაო საათები და ფასები იმართება ჩანართში „გრაფიკი და ფასები“.")}</p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{tr("სპეციალობა")}</dt>
            <dd className="mt-0.5 font-medium">{SPECIALTY_LABELS[doctor.specialty]}</dd>
          </div>
          <div>
            <dt className="text-muted">{tr("გამოცდილება")}</dt>
            <dd className="mt-0.5 font-medium">{tr("{0} წელი", [doctor.experienceYears])}</dd>
          </div>
        </dl>
        <Link to={`/doctors/${doctor.id}`} className="mt-4 inline-block text-sm font-medium text-brand-dark underline">{tr("როგორ ჩანს ჩემი გვერდი პაციენტებისთვის")}</Link>
      </section>
    </div>
  )
}

function ScheduleTab({ doctor, clinics, onSaved }: { doctor: Doctor; clinics: Clinic[]; onSaved: () => void }) {
  const { notify } = useToast()
  const [savingL, setSavingL] = useState(false)
  const [savingS, setSavingS] = useState(false)
  const [errL, setErrL] = useState<string | null>(null)
  const [errS, setErrS] = useState<string | null>(null)

  const saveLocations = async (data: LocationsPayload) => {
    setSavingL(true)
    setErrL(null)
    try {
      await scheduleService.saveLocations(data)
      notify(tr("გრაფიკი განახლდა"))
      onSaved()
    } catch (e) {
      setErrL(errorMessage(e))
    } finally {
      setSavingL(false)
    }
  }
  const saveServices = async (data: ServicesPayload) => {
    setSavingS(true)
    setErrS(null)
    try {
      await scheduleService.saveServices(data)
      notify(tr("ფასები განახლდა"))
      onSaved()
    } catch (e) {
      setErrS(errorMessage(e))
    } finally {
      setSavingS(false)
    }
  }
  const clinicIds = Array.from(new Set(doctor.locations.map((l) => l.clinicId)))

  return (
    <div className="space-y-10">
      <section aria-labelledby="loc-title">
        <h2 id="loc-title" className="text-xl font-bold">{tr("ჩემი სამუშაო გრაფიკი")}</h2>
        <p className="mb-4 mt-1 text-sm text-muted">{tr("პაციენტები დროს ამ გრაფიკის მიხედვით ირჩევენ. ერთი ქალაქის რამდენიმე კლინიკაში შეგიძლიათ იმუშაოთ სხვადასხვა დღეებში.")}</p>
        <LocationsEditor key={JSON.stringify(doctor.locations)} clinics={clinics} value={doctor.locations} saving={savingL} error={errL} onSave={saveLocations} />
      </section>
      <section aria-labelledby="svc-title">
        <h2 id="svc-title" className="text-xl font-bold">{tr("ვიზიტის ტიპები და ფასები")}</h2>
        <p className="mb-4 mt-1 text-sm text-muted">{tr("ფასი ყოველ კლინიკაში შეიძლება განსხვავებული იყოს. უკვე დაჯავშნილი ვიზიტები ძველ ფასს ინარჩუნებს.")}</p>
        <ServicesEditor key={JSON.stringify(doctor.services)} clinics={clinics} clinicIds={clinicIds} value={doctor.services} saving={savingS} error={errS} onSave={saveServices} />
      </section>
    </div>
  )
}

export default function DoctorProfile() {
  const [tab, setTab] = useState<Tab>('personal')
  const profile = useAsync(() => profileService.get(), [])
  const clinics = useAsync(() => doctorService.clinics(), [])
  const doctor = profile.data?.doctor
  const clinicNames = doctor ? Array.from(new Set(doctor.locations.map((l) => clinics.data?.find((c) => c.id === l.clinicId)?.name).filter(Boolean))).join(' · ') : ''

  return (
    <div>
      <h1 className="text-3xl font-bold">{tr("ჩემი პროფილი")}</h1>
      {clinicNames && <p className="mt-1 text-muted">{clinicNames}</p>}

      <div className="mt-6">
        <Tabs
          label={tr("პროფილის განყოფილებები")}
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'personal', label: tr("პირადი ინფორმაცია") },
            { id: 'professional', label: tr("პროფესიული ინფორმაცია") },
            { id: 'schedule', label: tr("გრაფიკი და ფასები") },
            { id: 'security', label: tr("უსაფრთხოება") },
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

        {tab === 'schedule' && (
          <>
            {profile.loading && <div className="skeleton h-64 w-full" aria-hidden />}
            {profile.error && <ErrorState message={profile.error} onRetry={profile.reload} />}
            {doctor && clinics.data && <ScheduleTab doctor={doctor} clinics={clinics.data} onSaved={profile.reload} />}
          </>
        )}

        {tab === 'security' && (
          <>
            <h2 className="mb-4 text-xl font-bold">{tr("პაროლის შეცვლა")}</h2>
            <PasswordForm />
          </>
        )}
      </div>
    </div>
  )
}
