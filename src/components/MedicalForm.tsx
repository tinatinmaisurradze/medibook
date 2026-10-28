import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import type { MedicalProfile } from '@/types'
import { useToast } from '@/context/ToastContext'
import { profileService } from '@/services/profileService'
import { errorMessage } from '@/services/http'
import { BLOOD_TYPES, medicalFormSchema, type MedicalFormValues } from '@/utils/validation'
import { TextField, TextArea } from './ui/FormField'
import { TagInput } from './ui/TagInput'
import { SelectField } from './ui/SelectField'
import { Button } from './ui/Button'

const toNumber = (v?: string) => (v && v.trim() ? Number(v.replace(',', '.')) : undefined)

export function MedicalForm({ initial, onSaved }: { initial: MedicalProfile | null; onSaved: (m: MedicalProfile) => void }) {
  const { notify } = useToast()
  const [serverError, setServerError] = useState<string | null>(null)
  const [allergies, setAllergies] = useState(initial?.allergies ?? [])
  const [conditions, setConditions] = useState(initial?.chronicConditions ?? [])
  const [medications, setMedications] = useState(initial?.medications ?? [])
  const [surgeries, setSurgeries] = useState(initial?.surgeries ?? [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MedicalFormValues>({
    resolver: zodResolver(medicalFormSchema),
    mode: 'onTouched',
    defaultValues: {
      bloodType: initial?.bloodType ?? '',
      heightCm: initial?.heightCm?.toString() ?? '',
      weightKg: initial?.weightKg?.toString() ?? '',
      familyHistory: initial?.familyHistory ?? '',
      sharedWithDoctors: initial?.sharedWithDoctors ?? true,
    },
  })

  const onSubmit = async (data: MedicalFormValues) => {
    setServerError(null)
    try {
      const saved = await profileService.saveMedical({
        bloodType: data.bloodType,
        heightCm: toNumber(data.heightCm),
        weightKg: toNumber(data.weightKg),
        allergies,
        chronicConditions: conditions,
        medications,
        surgeries,
        familyHistory: data.familyHistory,
        sharedWithDoctors: data.sharedWithDoctors,
      })
      onSaved(saved)
      notify('სამედიცინო ისტორია შენახულია')
    } catch (e) {
      setServerError(errorMessage(e))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-6">
      <div className="flex gap-3 rounded-md bg-brand-tint p-4 text-sm text-brand-dark">
        <ShieldCheck size={20} className="mt-0.5 shrink-0" aria-hidden />
        <p>
          ეს ინფორმაცია პირადია. ის მხოლოდ თქვენ ხედავთ და იმ ექიმებს, რომლებთანაც ვიზიტი გაქვთ, თუ ქვემოთ გაზიარებას ჩართავთ. ადმინისტრაციას მასზე წვდომა არ აქვს.
        </p>
      </div>

      {serverError && (
        <div role="alert" className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
          {serverError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField label="სისხლის ჯგუფი" {...register('bloodType')}>
          <option value="">არ არის მითითებული</option>
          {BLOOD_TYPES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </SelectField>
        <TextField label="სიმაღლე (სმ)" inputMode="decimal" error={errors.heightCm?.message} {...register('heightCm')} />
        <TextField label="წონა (კგ)" inputMode="decimal" error={errors.weightKg?.message} {...register('weightKg')} />
      </div>

      <TagInput label="ალერგიები" tone="danger" value={allergies} onChange={setAllergies} placeholder="მაგ: პენიცილინი" hint="ექიმი ამას ვიზიტზე პირველ რიგში ხედავს" />
      <TagInput label="ქრონიკული დაავადებები" value={conditions} onChange={setConditions} placeholder="მაგ: დიაბეტი" />
      <TagInput label="მიმდინარე მედიკამენტები" value={medications} onChange={setMedications} placeholder="მაგ: ამლოდიპინი 5 მგ" />
      <TagInput label="ოპერაციები და ტრავმები" value={surgeries} onChange={setSurgeries} placeholder="მაგ: აპენდექტომია, 2015" />

      <TextArea
        label="ოჯახური ანამნეზი"
        rows={3}
        placeholder="მაგ: დედის მხრიდან ჰიპერტენზია"
        hint={`${(watch('familyHistory') ?? '').length} / 1000`}
        error={errors.familyHistory?.message}
        {...register('familyHistory')}
      />

      <label className="flex items-start gap-3 rounded-md border border-line bg-surface p-4">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-brand)]" {...register('sharedWithDoctors')} />
        <span className="text-sm">
          <span className="font-medium">ექიმებისთვის ხელმისაწვდომობა</span>
          <span className="mt-0.5 block text-muted">დაუშვით ამ ინფორმაციის ნახვა ექიმებისთვის, რომლებთანაც ვიზიტი გაქვთ. გამორთვის შემთხვევაში ექიმი ვერ ნახავს.</span>
        </span>
      </label>

      <div className="flex items-center gap-4">
        <Button type="submit" loading={isSubmitting}>
          შენახვა
        </Button>
        {initial?.updatedAt && <span className="text-sm text-muted">ბოლო განახლება: {new Date(initial.updatedAt).toLocaleDateString('ka-GE')}</span>}
      </div>
    </form>
  )
}
